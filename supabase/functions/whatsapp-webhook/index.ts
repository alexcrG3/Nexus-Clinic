import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Variables de entorno necesarias en Supabase Secrets:
// - OPENAI_API_KEY
// - WHATSAPP_ACCESS_TOKEN (Token permanente de Meta Cloud API)
// - WHATSAPP_PHONE_NUMBER_ID (ID del número de teléfono en Meta Developers)
// - WHATSAPP_VERIFY_TOKEN (Token secreto que configuras en el Webhook de Meta)

serve(async (req) => {
  const url = new URL(req.url);

  // Manejo de CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Verificación inicial del Webhook por Meta (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "nova_dental_secret_token";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // 2. Recepción de mensajes entrantes de pacientes (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Verificar si es un mensaje de WhatsApp Cloud API
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (!message) {
        // Puede ser un evento de entrega/leído (status update), respondemos 200 OK
        return new Response(JSON.stringify({ status: "ignored_non_message" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const fromPhone = message.from; // Número del paciente ej: "5215512345678"
      const senderName = value?.contacts?.[0]?.profile?.name || "Paciente WhatsApp";
      let userText = "";

      if (message.type === "text") {
        userText = message.text.body;
      } else if (message.type === "audio") {
        userText = "[Nota de voz recibida - transcribiendo]";
      } else {
        userText = "Hola";
      }

      console.log(`Mensaje recibido de ${senderName} (${fromPhone}): ${userText}`);

      // Inicializar cliente Supabase con Service Role
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const openAiKey = Deno.env.get("OPENAI_API_KEY");

      // Si no hay OpenAI key configurada en Supabase, enviar mensaje de bienvenida estándar
      if (!openAiKey) {
        await sendWhatsAppMessage(fromPhone, "¡Hola! Gracias por comunicarte con Nova Dental. En breve un asesor te atenderá.");
        return new Response(JSON.stringify({ status: "no_openai_key" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Procesar con OpenAI + Tools
      const replyText = await processMessageWithOpenAI(userText, fromPhone, senderName, openAiKey, supabase);

      // Enviar respuesta al paciente por WhatsApp
      await sendWhatsAppMessage(fromPhone, replyText);

      return new Response(JSON.stringify({ status: "success", reply: replyText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (err: any) {
      console.error("Error procesando webhook de WhatsApp:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

// Función para enviar mensaje de WhatsApp usando Meta Cloud API
async function sendWhatsAppMessage(toPhone: string, text: string) {
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  if (!phoneNumberId || !accessToken) {
    console.warn("Faltan WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN en las variables de entorno.");
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errorDetail = await res.text();
    console.error("Error al enviar mensaje por WhatsApp API:", errorDetail);
  }
}

// Procesamiento del Agente con Function Calling
async function processMessageWithOpenAI(
  userText: string,
  fromPhone: string,
  senderName: string,
  apiKey: string,
  supabase: any
): Promise<string> {
  const systemPrompt = `Eres el Asistente Virtual de Nova Dental atendiendo a un paciente por WhatsApp.
Horario: Lun-Vie 7am-6pm, Sáb 9am-5pm. Domingos cerrado.
Nombre del paciente: ${senderName}
Teléfono del paciente: ${fromPhone}
Ubicación: https://maps.app.goo.gl/UU3ypbdmix1R85KWA
Usa las herramientas para agendar citas, consultar disponibilidad o registrar en lista de espera.
Sé breve, cálido, profesional y usa emojis.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText },
  ];

  const tools = [
    {
      type: "function",
      function: {
        name: "listar_servicios",
        description: "Lista los servicios dentales disponibles con sus precios.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "agendar_cita",
        description: "Agenda la cita en el sistema",
        parameters: {
          type: "object",
          properties: {
            Nombre: { type: "string" },
            Telefono: { type: "string" },
            Fecha: { type: "string", description: "Formato ISO YYYY-MM-DDTHH:MM:SS" },
            nombre_servicio: { type: "string" },
          },
          required: ["Nombre", "Telefono", "Fecha", "nombre_servicio"],
        },
      },
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      tools,
      temperature: 0.3,
    }),
  });

  const data = await res.json();
  const choice = data.choices?.[0]?.message;

  if (choice?.tool_calls && choice.tool_calls.length > 0) {
    // Si llama a agendar_cita
    for (const tc of choice.tool_calls) {
      if (tc.function.name === "agendar_cita") {
        const args = JSON.parse(tc.function.arguments || "{}");
        await supabase.from("citas").insert({
          nombre: args.Nombre || senderName,
          telefono: args.Telefono || fromPhone,
          fechaCita: args.Fecha,
          estado: "confirmada",
        });
      }
    }

    return `✅ ¡Cita confirmada con éxito!\n\n📅 Fecha: ${new Date().toLocaleDateString()}\n📍 Nova Dental: https://maps.app.goo.gl/UU3ypbdmix1R85KWA\n\n¡Te esperamos!`;
  }

  return choice?.content || "Hola, gracias por comunicarte con Nova Dental. ¿En qué podemos ayudarte?";
}
