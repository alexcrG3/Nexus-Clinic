import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Key, 
  RotateCcw,
  MapPin,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClinicAgentEngine } from "@/services/aiAgent/agentEngine";
import { ChatMessage } from "@/services/aiAgent/types";

export const ClinicAiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const engineRef = useRef<ClinicAgentEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicializar motor
    const engine = new ClinicAgentEngine();
    engineRef.current = engine;
    
    const key = engine.getApiKey();
    if (key) {
      setHasApiKey(true);
      setApiKeyInput(key);
    }

    // Mensaje inicial de bienvenida
    const initialWelcome: ChatMessage = {
      id: "init-welcome",
      role: "assistant",
      content: `¡Hola! 👋 Te damos la bienvenida a **Nova Dental**.\n\nSoy tu Asistente Virtual con IA. Puedo consultar horarios en tiempo real, mostrarte nuestros servicios y agendar, modificar o cancelar tu cita médica al instante.\n\n¿Cómo te puedo ayudar hoy?`,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialWelcome]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading || !engineRef.current) return;

    setInputMessage("");
    setLoading(true);

    // Mensaje del usuario en la UI
    const tempUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await engineRef.current.sendMessage(text);
      setMessages((prev) => [...prev.filter(m => m.id !== response.id), response]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ Ocurrió un error al procesar tu solicitud: ${err.message || "Error de conexión"}. Por favor intenta de nuevo.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (engineRef.current) {
      engineRef.current.setApiKey(apiKeyInput.trim());
      setHasApiKey(!!apiKeyInput.trim());
      setShowSettings(false);
    }
  };

  const handleResetChat = () => {
    if (engineRef.current) {
      engineRef.current.resetConversation();
      const initialWelcome: ChatMessage = {
        id: `init-welcome-${Date.now()}`,
        role: "assistant",
        content: `¡Hola! 👋 ¿En qué más te puedo ayudar hoy en **Nova Dental**?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([initialWelcome]);
    }
  };

  const quickPills = [
    { label: "🦷 Agendar Cita", query: "Quiero agendar una cita dental" },
    { label: "⏰ Horarios y Servicios", query: "¿Cuáles son sus horarios de atención y servicios disponibles?" },
    { label: "📍 Ubicación", query: "¿Dónde está ubicada la clínica?" },
    { label: "❌ Cancelar Cita", query: "Deseo cancelar mi cita" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <Card className="w-[380px] sm:w-[420px] h-[580px] shadow-2xl border-primary/20 flex flex-col rounded-2xl overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <CardHeader className="bg-primary text-primary-foreground p-4 pb-3 flex flex-row items-center justify-between space-y-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-primary rounded-full" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  Nova Dental AI
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white text-[10px] px-1.5 py-0">
                    24/7
                  </Badge>
                </CardTitle>
                <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Asistente de Citas y Reservas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" title="Configurar OpenAI API Key">
                    <Key className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" /> Configuración del Agente IA
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Ingresa tu clave de OpenAI API (<code className="bg-muted px-1 py-0.5 rounded">sk-...</code>) para activar el modelo <strong>GPT-4o / GPT-4o-mini</strong> con Function Calling en vivo:
                    </p>
                    <Input
                      type="password"
                      placeholder="sk-proj-..."
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSaveApiKey}>
                        Guardar Clave
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleResetChat}
                title="Reiniciar chat"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Estado de API Key Banner */}
          {!hasApiKey && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
              <span>⚡ Modo Autónomo Demo activo</span>
              <button
                onClick={() => setShowSettings(true)}
                className="underline font-semibold hover:text-amber-900"
              >
                Configurar OpenAI
              </button>
            </div>
          )}

          {/* Cuerpo de Mensajes */}
          <CardContent className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-muted/20 text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-background border border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.content}

                    {/* Tarjeta de Confirmación de Cita si se generó */}
                    {msg.metadata?.appointmentCreated && (
                      <div className="mt-2.5 pt-2 border-t border-primary/20 bg-primary/5 rounded-lg p-2.5 text-xs text-foreground space-y-1">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Cita Registrada en Base de Datos
                        </div>
                        <div>👤 <strong>Paciente:</strong> {msg.metadata.appointmentCreated.nombre}</div>
                        <div>👨‍⚕️ <strong>Doctor:</strong> {msg.metadata.appointmentCreated.doctor}</div>
                        <div>🦷 <strong>Servicio:</strong> {msg.metadata.appointmentCreated.servicio}</div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-muted-foreground text-xs p-2">
                <Bot className="w-4 h-4 animate-bounce text-primary" />
                <span className="animate-pulse">Nova Dental está consultando disponibilidad...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Píldoras Rápidas */}
          <div className="px-3 py-1.5 bg-background border-t border-border/50 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(pill.query)}
                className="text-[11px] whitespace-nowrap bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full border border-border transition-colors font-medium"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Formulario de Input */}
          <div className="p-3 bg-background border-t border-border flex items-center space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Escribe tu mensaje o consulta..."
              className="flex-1 text-xs focus-visible:ring-primary h-9"
              disabled={loading}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 shadow-sm"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Botón Flotante Launcher Prominente */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="h-14 px-5 rounded-full shadow-2xl bg-primary hover:bg-primary/95 text-white font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 border-2 border-white/20"
        title="Hablar con el Asistente Virtual Nova Dental"
      >
        {isOpen ? (
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-white" />
            <span className="text-xs">Cerrar Asistente</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <span className="text-xs font-extrabold block">Asistente IA Nova</span>
              <span className="text-[10px] text-white/80 font-medium">Agendar Cita en Vivo</span>
            </div>
            <span className="sm:hidden text-xs font-bold">Asistente IA</span>
          </div>
        )}
      </Button>
    </div>
  );
};
