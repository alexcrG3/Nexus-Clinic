import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  RotateCcw, 
  Stethoscope, 
  ShieldCheck, 
  User, 
  Phone,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClinicAgentEngine } from "@/services/aiAgent/agentEngine";
import { ChatMessage } from "@/services/aiAgent/types";

export const LandingBookingForm: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const engineRef = useRef<ClinicAgentEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = new ClinicAgentEngine();
    engineRef.current = engine;

    const initialWelcome: ChatMessage = {
      id: "booking-section-welcome",
      role: "assistant",
      content: `¡Hola! 👋 Soy tu **Asistente Virtual de Nova Dental**.\n\nYo conozco la agenda oficial y disponibilidad en tiempo real de todos nuestros doctores.\n\n¿Para qué día o tratamiento te gustaría agendar tu cita? Puedes escribir tu consulta o seleccionar una de las opciones rápidas abajo.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialWelcome]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading || !engineRef.current) return;

    setInputMessage("");
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await engineRef.current.sendMessage(text);
      setMessages((prev) => [...prev.filter((m) => m.id !== response.id), response]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Ocurrió un inconveniente: ${err.message || "Error de conexión"}. Por favor intenta de nuevo.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetConversation();
      setMessages([
        {
          id: `welcome-reset-${Date.now()}`,
          role: "assistant",
          content: `¡Listo! Conversación reiniciada. ¿Qué cita o tratamiento deseas consultar?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const quickPills = [
    { label: "🦷 Agendar Cita", query: "Hola, deseo agendar una cita dental con el primer doctor disponible" },
    { label: "📅 Horarios Disponibles", query: "¿Qué horarios tienen disponibles para esta semana?" },
    { label: "💰 Precios de Tratamientos", query: "¿Cuáles son los precios de limpieza y ortodoncia?" },
    { label: "❌ Cancelar o Modificar", query: "Quiero modificar o cancelar una cita previa" },
  ];

  return (
    <section id="booking-section" className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Información del Agente de IA */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Agente Inteligente 24/7
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Agenda tu Cita <br />
              <span className="italic font-serif font-normal text-primary underline decoration-primary/30">
                con Asistente IA
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Olvídate de los formularios rígidos. Nuestro agente de IA <strong>consulta la disponibilidad real en la base de datos</strong>, te muestra los mejores horarios libres de los doctores y registra tu cita al instante.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">Consulta de Horarios en Vivo</strong>
                  <span className="text-xs text-muted-foreground">Verifica qué días y horas están libres con cada doctor.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">Gestión de Lista de Espera</strong>
                  <span className="text-xs text-muted-foreground">Si el horario que buscas está lleno, te anota y te avisa cuando se libere.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white block">Recordatorios por WhatsApp</strong>
                  <span className="text-xs text-muted-foreground">Recibirás confirmación y recordatorio automático en tu teléfono.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Interfaz de Chat del Agente Integrada en la Landing */}
          <div className="lg:col-span-7">
            <Card className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-primary/20 overflow-hidden flex flex-col h-[560px]">
              
              {/* Header del Agente */}
              <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0 shadow-md">
                <div className="flex items-center space-x-3 text-left">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Nova Dental AI
                      <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 font-bold">
                        En Línea
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-primary-foreground/80">
                      Agente Oficial de Reservas y Disponibilidad
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
                  onClick={handleReset}
                  title="Reiniciar chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </CardHeader>

              {/* Mensajes del Chat */}
              <CardContent className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/50 text-xs sm:text-sm">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} text-left`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground rounded-bl-none"
                        }`}
                      >
                        {msg.content}

                        {/* Tarjeta de Confirmación si se generó cita */}
                        {msg.metadata?.appointmentCreated && (
                          <div className="mt-3 pt-2.5 border-t border-primary/20 bg-primary/5 rounded-xl p-3 text-xs text-foreground space-y-1">
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Cita Registrada en Base de Datos
                            </div>
                            <div>👤 <strong>Paciente:</strong> {msg.metadata.appointmentCreated.nombre}</div>
                            <div>👨‍⚕️ <strong>Doctor:</strong> {msg.metadata.appointmentCreated.doctor}</div>
                            <div>🦷 <strong>Servicio:</strong> {msg.metadata.appointmentCreated.servicio}</div>
                            <div>📅 <strong>Fecha:</strong> {msg.metadata.appointmentCreated.fecha}</div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center space-x-2 text-muted-foreground text-xs p-2 text-left">
                    <Bot className="w-4 h-4 animate-bounce text-primary" />
                    <span className="animate-pulse">Consultando disponibilidad y agenda médica...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Píldoras de Consulta Rápida */}
              <div className="px-3.5 py-2 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
                {quickPills.map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(pill.query)}
                    className="text-[11px] whitespace-nowrap bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-all font-semibold"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Formulario de Input */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ej: Quiero una cita para el martes en la mañana..."
                  className="flex-1 text-xs focus-visible:ring-primary h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  disabled={loading}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim() || loading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

            </Card>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingBookingForm;
