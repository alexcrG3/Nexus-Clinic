import { ChatMessage, ToolCall } from "./types";
import { getSystemPrompt } from "./systemPrompt";
import { agentToolDefinitions, executeAgentTool } from "./agentTools";

interface EngineOptions {
  apiKey?: string;
  patientName?: string;
  patientPhone?: string;
}

export class ClinicAgentEngine {
  private messages: ChatMessage[] = [];
  private apiKey: string | null = null;
  private patientName?: string;
  private patientPhone?: string;

  constructor(options?: EngineOptions) {
    this.apiKey =
      options?.apiKey ||
      (import.meta.env.VITE_OPENAI_API_KEY as string) ||
      localStorage.getItem("nexus_openai_api_key") ||
      null;
    this.patientName = options?.patientName;
    this.patientPhone = options?.patientPhone;

    // Inicializar con el System Prompt
    this.resetConversation();
  }

  public setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem("nexus_openai_api_key", key);
  }

  public getApiKey(): string | null {
    return this.apiKey;
  }

  public resetConversation() {
    this.messages = [
      {
        id: "sys-init",
        role: "system",
        content: getSystemPrompt({
          patientName: this.patientName,
          patientPhone: this.patientPhone,
        }),
        timestamp: new Date().toISOString(),
      },
    ];
  }

  public getVisibleMessages(): ChatMessage[] {
    return this.messages.filter((m) => m.role === "user" || m.role === "assistant");
  }

  public async sendMessage(userText: string): Promise<ChatMessage> {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(userMsg);

    if (this.apiKey) {
      return await this.processWithOpenAI();
    } else {
      return await this.processWithLocalFallback(userText);
    }
  }

  private async processWithOpenAI(): Promise<ChatMessage> {
    let maxIterations = 5;

    while (maxIterations > 0) {
      maxIterations--;

      // Preparar payload para OpenAI
      const openAiMessages = this.messages.map((m) => {
        const item: any = {
          role: m.role,
          content: m.content || "",
        };
        if (m.tool_calls) item.tool_calls = m.tool_calls;
        if (m.tool_call_id) item.tool_call_id = m.tool_call_id;
        if (m.name) item.name = m.name;
        return item;
      });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openAiMessages,
          tools: agentToolDefinitions,
          tool_choice: "auto",
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Error de API de OpenAI: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const message = choice.message;

      // Si el modelo quiere ejecutar tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        const assistantToolCallMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: "assistant",
          content: message.content || "",
          tool_calls: message.tool_calls,
          timestamp: new Date().toISOString(),
        };
        this.messages.push(assistantToolCallMsg);

        // Ejecutar cada tool en paralelo
        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch (e) {
            console.error("Error parsing arguments for tool:", fnName);
          }

          const toolResult = await executeAgentTool(fnName, fnArgs);

          const toolResponseMsg: ChatMessage = {
            id: `tool-${Date.now()}-${toolCall.id}`,
            role: "tool",
            tool_call_id: toolCall.id,
            name: fnName,
            content: JSON.stringify(toolResult),
            timestamp: new Date().toISOString(),
          };
          this.messages.push(toolResponseMsg);
        }

        // Continuar el bucle para que el modelo genere la respuesta final al usuario
        continue;
      }

      // Si es una respuesta normal de texto
      const assistantFinalMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: message.content || "",
        timestamp: new Date().toISOString(),
      };
      this.messages.push(assistantFinalMsg);
      return assistantFinalMsg;
    }

    throw new Error("Se excedió el número máximo de llamadas a herramientas.");
  }

  // Fallback conversacional autónomo para pruebas inmediatas si aún no se ha configurado la API Key
  private async processWithLocalFallback(userText: string): Promise<ChatMessage> {
    const lower = userText.toLowerCase();

    // Simular un pequeño retardo natural de respuesta
    await new Promise((res) => setTimeout(res, 600));

    let reply = "";
    let appointmentData: any = null;

    if (lower.includes("hola") || lower.includes("buenos") || lower.includes("buenas")) {
      reply = `¡Hola! 👋 Te damos la bienvenida a **Nova Dental**. Soy tu asistente virtual de reservas y atención.\n\n¿En qué te podemos ayudar hoy? Puedes indicarme si tienes alguna molestia, o seleccionar una opción:\n\n🦷 **Agendar Cita** | ⏰ **Horarios y Precios** | 📅 **Consultar/Modificar Cita**`;
    } else if (lower.includes("horario") || lower.includes("abren") || lower.includes("atienden")) {
      reply = `⏰ **Nuestros horarios de atención oficial son:**\n\n• **Lunes a Viernes:** 7:00 am a 6:00 pm\n• **Sábados:** 9:00 am a 5:00 pm\n• **Domingos y feriados:** Cerrado\n\n📍 **Ubicación:** https://maps.app.goo.gl/UU3ypbdmix1R85KWA\n\n¿Te gustaría agendar un espacio?`;
    } else if (lower.includes("precio") || lower.includes("servicio") || lower.includes("limpieza") || lower.includes("ortodoncia") || lower.includes("muela") || lower.includes("dolor")) {
      const servicios = await executeAgentTool("listar_servicios", {});
      const listaStr = servicios.slice(0, 5).map((s: any) => `• **${s.nombre}** — $${s.precio || 350} (${s.duracion || 45} min)`).join("\n");
      reply = `Contamos con atención para tu motivo de consulta. Algunos de nuestros servicios disponibles:\n\n${listaStr}\n\n¿Te gustaría que te atienda algún doctor en específico o el primer espacio disponible?`;
    } else if (lower.includes("cualquier") || lower.includes("primero") || lower.includes("doctor") || lower.includes("dra") || lower.includes("agendar") || lower.includes("cita")) {
      const horarios = await executeAgentTool("entregar_horarios", {});
      const slotsStr = horarios.disponibles.slice(0, 3).map((s: any, idx: number) => `**Opción ${idx + 1}:** 📅 ${s.fechaFormato} (con ${s.doctor})`).join("\n\n");
      reply = `¡Excelente! Tenemos los siguientes espacios disponibles:\n\n${slotsStr}\n\nPor favor indícame cuál opción prefieres (ej: *"Opción 1"*, o tu nombre y teléfono para confirmar tu reserva).`;
    } else if (lower.includes("opción") || lower.includes("opcion 1") || lower.includes("opcion 2") || lower.includes("confirmo") || lower.includes("si")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const isoDate = tomorrow.toISOString().slice(0, 19);

      const res = await executeAgentTool("agendar_cita", {
        Nombre: this.patientName || "Paciente Web",
        Telefono: this.patientPhone || "555-0199",
        Fecha: isoDate,
        nombre_servicio: "Consulta y Diagnóstico Dental",
        nombre_doctor: "Dra. Ana Lara",
      });

      appointmentData = res.detalles;
      reply = `✅ **¡Cita confirmada con éxito!**\n\n👨‍⚕️ **Doctor:** Dra. Ana Lara\n🦷 **Servicio:** Consulta y Diagnóstico Dental ($350 - 45 min)\n📅 **Fecha y Hora:** Mañana a las 10:00 AM\n📍 **Clínica Nova Dental:** https://maps.app.goo.gl/UU3ypbdmix1R85KWA\n\n*Tu cita ya quedó registrada en el sistema de la clínica. ¡Te esperamos!*`;
    } else if (lower.includes("cancelar")) {
      reply = `Para cancelar tu cita, por favor confírmame tu número de teléfono registrado o indícame la fecha de la cita.`;
    } else {
      reply = `Entendido. Te ayudo con todo gusto. Puedo verificar disponibilidad de doctores, consultar precios o registrar tu cita en el sistema en tiempo real. ¿Qué día u horario te acomoda mejor?`;
    }

    const assistantMsg: ChatMessage = {
      id: `ast-${Date.now()}`,
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
      metadata: appointmentData ? { appointmentCreated: appointmentData, actionType: "booking" } : undefined,
    };

    this.messages.push(assistantMsg);
    return assistantMsg;
  }
}
