import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  MapPin, 
  Bell, 
  ArrowLeft, 
  Sparkles, 
  Bot, 
  CalendarCheck, 
  CalendarDays, 
  Smartphone, 
  LogOut, 
  ShieldCheck, 
  LogIn, 
  RotateCcw, 
  Send 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClinicConfig } from "@/hooks/useClinicConfig";
import { useAuth } from "@/contexts/AuthContext";
import { ClinicAgentEngine } from "@/services/aiAgent/agentEngine";
import { ChatMessage } from "@/services/aiAgent/types";

export const PortalPaciente = () => {
  const { data: config } = useClinicConfig();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const clinicName = config?.nombre_clinica || "Nova Dental";

  const [patientPhone, setPatientPhone] = useState(
    user?.user_metadata?.telefono || localStorage.getItem("nexus_patient_phone") || ""
  );
  const [patientName, setPatientName] = useState(
    user?.user_metadata?.nombre
      ? `${user.user_metadata.nombre} ${user.user_metadata.apellidos || ""}`.trim()
      : localStorage.getItem("nexus_patient_name") || ""
  );
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Estado del Chat con Agente IA en el Portal
  const [portalChatMessages, setPortalChatMessages] = useState<ChatMessage[]>([]);
  const [portalChatInput, setPortalChatInput] = useState("");
  const [portalChatLoading, setPortalChatLoading] = useState(false);
  const portalEngineRef = useRef<ClinicAgentEngine | null>(null);
  const portalMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = new ClinicAgentEngine({
      patientName: patientName,
      patientPhone: patientPhone,
    });
    portalEngineRef.current = engine;

    setPortalChatMessages([
      {
        id: "portal-welcome",
        role: "assistant",
        content: `¡Hola ${patientName || "Alex"}! 👋 Soy tu **Asistente Virtual de Nova Dental**.\n\nYo conozco la agenda oficial y disponibilidad en tiempo real de todos nuestros doctores.\n\n¿Para qué tratamiento o día deseas agendar tu cita?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [patientName, patientPhone]);

  useEffect(() => {
    portalMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [portalChatMessages, portalChatLoading]);

  const handleSendPortalChat = async (textToSend?: string) => {
    const text = textToSend || portalChatInput;
    if (!text.trim() || portalChatLoading || !portalEngineRef.current) return;

    setPortalChatInput("");
    setPortalChatLoading(true);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setPortalChatMessages((prev) => [...prev, userMsg]);

    try {
      const response = await portalEngineRef.current.sendMessage(text);
      setPortalChatMessages((prev) => [...prev.filter((m) => m.id !== response.id), response]);

      // Si la cita fue creada, refrescar citas del paciente
      if (response.metadata?.appointmentCreated) {
        if (user?.id) {
          fetchUserAppointments(user.id, user.email, patientPhone);
        } else if (patientPhone) {
          fetchAppointmentsByPhone(patientPhone);
        }
      }
    } catch (err: any) {
      setPortalChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Inconveniente al procesar: ${err.message || "Error"}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setPortalChatLoading(false);
    }
  };

  const portalQuickPills = [
    { label: "🦷 Agendar Cita", query: "Quiero agendar una cita con el primer doctor disponible" },
    { label: "📅 Horarios Disponibles", query: "¿Qué horarios tienen disponibles esta semana?" },
    { label: "💰 Precios de Tratamientos", query: "¿Cuáles son los precios de los tratamientos dentales?" },
    { label: "❌ Modificar o Cancelar", query: "Deseo cancelar o cambiar mi cita previa" },
  ];
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Cargar catálogo de servicios y doctores
  useEffect(() => {
    async function loadCatalog() {
      const { data: servs } = await supabase.from("servicios").select("*").eq("activo", true);
      if (servs) setServices(servs);

      const { data: docs } = await supabase.from("doctores").select("*").eq("activo", true);
      if (docs) setDoctors(docs);
    }
    loadCatalog();
  }, []);

  // Cargar citas cuando el usuario está logueado o hay teléfono
  useEffect(() => {
    if (user?.id) {
      fetchUserAppointments(user.id, user.email, patientPhone);
    } else if (patientPhone) {
      fetchAppointmentsByPhone(patientPhone);
    }
  }, [user, patientPhone]);

  const fetchUserAppointments = async (userId: string, email?: string, phone?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("citas")
        .select(`
          id,
          nombre,
          telefono,
          fechaCita,
          hora_cita,
          estado,
          duracion,
          precio,
          servicio_id,
          doctor_id
        `);

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, "");
        query = query.ilike("telefono", `%${cleanPhone}%`);
      } else {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.order("fechaCita", { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      console.error("Error cargando citas del usuario:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsByPhone = async (phone: string) => {
    setLoading(true);
    try {
      const clean = phone.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("citas")
        .select(`
          id,
          nombre,
          telefono,
          fechaCita,
          hora_cita,
          estado,
          duracion,
          precio,
          servicio_id,
          doctor_id
        `)
        .ilike("telefono", `%${clean}%`)
        .order("fechaCita", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      toast.error("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !selectedService || !selectedDate || !selectedTime) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    setBookingLoading(true);
    try {
      const serviceObj = services.find((s) => s.id === selectedService);
      const doctorObj = doctors.find((d) => d.id === selectedDoctor);
      const isoDateTime = `${selectedDate}T${selectedTime}:00`;

      const { data, error } = await supabase
        .from("citas")
        .insert({
          nombre: patientName,
          telefono: patientPhone,
          user_id: user?.id || null,
          servicio_id: selectedService,
          doctor_id: selectedDoctor || (doctors[0]?.id ?? null),
          fechaCita: isoDateTime,
          hora_cita: selectedTime,
          duracion: serviceObj?.duracion || 45,
          precio: serviceObj?.precio || 350,
          estado: "confirmada",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("¡Cita agendada con éxito!");
      setBookingSuccess({
        id: data.id,
        service: serviceObj?.nombre || "Consulta Dental",
        doctor: doctorObj?.nombre || "Doctor Asignado",
        date: selectedDate,
        time: selectedTime,
      });

      if (user?.id) {
        fetchUserAppointments(user.id, user.email, patientPhone);
      } else {
        fetchAppointmentsByPhone(patientPhone);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al agendar.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (citaId: string) => {
    if (!confirm("¿Deseas cancelar esta cita médica?")) return;
    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: "cancelada" })
        .eq("id", citaId);

      if (error) throw error;
      toast.success("Cita cancelada correctamente.");
      if (user?.id) {
        fetchUserAppointments(user.id, user.email, patientPhone);
      } else {
        fetchAppointmentsByPhone(patientPhone);
      }
    } catch (err: any) {
      toast.error("Error al cancelar la cita.");
    }
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("nexus_patient_phone");
    localStorage.removeItem("nexus_patient_name");
    navigate("/");
  };

  const availableHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "14:00", "15:00", "16:00", "17:00"
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      
      {/* Header del Portal */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-none text-slate-900 dark:text-white">
                  Portal del Paciente
                </h1>
                <span className="text-xs text-muted-foreground font-medium">
                  {clinicName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden sm:flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> {patientName || user.email}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button size="sm" className="text-xs font-bold bg-primary text-white rounded-xl shadow-sm flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión / Cuenta
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        
        {/* Banner si no está logueado */}
        {!user && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Protege tu privacidad:</strong> Inicia sesión con tu cuenta para acceder a tu historial médico protegido con cifrado de seguridad.
              </span>
            </div>
            <Link to="/auth">
              <Button size="sm" variant="outline" className="text-xs font-bold border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10">
                Iniciar Sesión Seguro
              </Button>
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {/* Tarjeta de Saludo */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Expediente y Citas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Hola, {patientName || "Estimado Paciente"} 👋
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Revisa tus próximas citas, consulta tratamientos y programa nuevas consultas en segundos.
              </p>
            </div>

            <Button
              onClick={() => {
                const chatBtn = document.querySelector('button[title*="Asistente Virtual"]') as HTMLButtonElement;
                if (chatBtn) chatBtn.click();
              }}
              variant="outline"
              className="text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/5 flex items-center gap-2 h-10 px-4"
            >
              <Bot className="w-4 h-4" /> Hablar con Asistente IA
            </Button>
          </div>

          {/* Pestañas */}
          <Tabs defaultValue="citas" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
              <TabsTrigger value="citas" className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" /> Mis Citas
              </TabsTrigger>
              <TabsTrigger value="agendar" className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Agendar Cita
              </TabsTrigger>
              <TabsTrigger value="notificaciones" className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Recordatorios
              </TabsTrigger>
            </TabsList>

            {/* Pestaña: Mis Citas */}
            <TabsContent value="citas" className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Cargando citas...
                </div>
              ) : appointments.length === 0 ? (
                <Card className="text-center py-12 border-dashed rounded-3xl">
                  <CardContent className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-muted-foreground">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      No tienes citas registradas
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Agenda tu primera consulta dental o habla con nuestro Asistente de IA para elegir tu horario.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((apt) => {
                    const service = services.find((s) => s.id === apt.servicio_id);
                    const doctor = doctors.find((d) => d.id === apt.doctor_id);
                    const isCancelled = apt.estado === "cancelada";

                    return (
                      <Card 
                        key={apt.id}
                        className={`rounded-2xl overflow-hidden border transition-all ${
                          isCancelled ? "opacity-60 bg-slate-50 dark:bg-slate-900/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                        }`}
                      >
                        <div className={`h-1.5 w-full ${isCancelled ? "bg-red-400" : "bg-emerald-500"}`} />
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                          <div>
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] font-bold ${
                                isCancelled 
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" 
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              }`}
                            >
                              {apt.estado?.toUpperCase() || "CONFIRMADA"}
                            </Badge>
                            <CardTitle className="text-base font-bold mt-1.5 text-slate-900 dark:text-white">
                              {service?.nombre || "Consulta Dental"}
                            </CardTitle>
                          </div>
                          <span className="text-xs font-bold text-primary">
                            ${apt.precio || service?.precio || 350} MXN
                          </span>
                        </CardHeader>

                        <CardContent className="p-4 pt-2 space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                              <span className="font-semibold text-foreground">
                                {apt.fechaCita ? new Date(apt.fechaCita).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }) : "Por definir"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="font-semibold text-foreground">
                                {apt.hora_cita || (apt.fechaCita?.includes("T") ? apt.fechaCita.split("T")[1].slice(0, 5) : "10:00 AM")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <Stethoscope className="w-3.5 h-3.5 text-primary" />
                              <span>Doctor: <strong className="text-foreground">{doctor?.nombre || "Dra. Ana Lara"}</strong></span>
                            </div>
                          </div>

                          {!isCancelled && (
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs flex-1 h-8 rounded-xl"
                                onClick={() => window.open("https://maps.app.goo.gl/UU3ypbdmix1R85KWA", "_blank")}
                              >
                                <MapPin className="w-3 h-3 mr-1 text-primary" /> Cómo llegar
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="text-xs h-8 px-3 rounded-xl"
                                onClick={() => handleCancelAppointment(apt.id)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Pestaña: Agendar Cita con Asistente IA */}
            <TabsContent value="agendar">
              <Card className="max-w-2xl mx-auto rounded-3xl border-2 border-primary/20 shadow-xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col h-[560px]">
                <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        Asistente IA de Reservas
                        <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 font-bold">
                          En Vivo
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-primary-foreground/80">
                        Disponibilidad oficial de doctores y horarios en tiempo real
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
                    onClick={() => {
                      setPortalChatMessages([
                        {
                          id: `welcome-${Date.now()}`,
                          role: "assistant",
                          content: `¡Hola ${patientName || "Alex"}! 👋 ¿Para qué tratamiento o día deseas agendar tu cita? Conozco los horarios y doctores disponibles.`,
                          timestamp: new Date().toISOString(),
                        },
                      ]);
                    }}
                    title="Reiniciar chat"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </CardHeader>

                {/* Mensajes del Chat */}
                <CardContent className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/50 text-xs sm:text-sm">
                  {portalChatMessages.map((msg) => {
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

                          {msg.metadata?.appointmentCreated && (
                            <div className="mt-3 pt-2.5 border-t border-primary/20 bg-primary/5 rounded-xl p-3 text-xs text-foreground space-y-1">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Cita Confirmada en el Sistema
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

                  {portalChatLoading && (
                    <div className="flex items-center space-x-2 text-muted-foreground text-xs p-2 text-left">
                      <Bot className="w-4 h-4 animate-bounce text-primary" />
                      <span className="animate-pulse">Consultando disponibilidad de doctores...</span>
                    </div>
                  )}
                  <div ref={portalMessagesEndRef} />
                </CardContent>

                {/* Píldoras Rápidas */}
                <div className="px-3.5 py-2 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
                  {portalQuickPills.map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendPortalChat(pill.query)}
                      className="text-[11px] whitespace-nowrap bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-all font-semibold"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Input de Chat */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center space-x-2">
                  <Input
                    value={portalChatInput}
                    onChange={(e) => setPortalChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendPortalChat()}
                    placeholder="Escribe tu consulta o pide un horario..."
                    className="flex-1 text-xs focus-visible:ring-primary h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                    disabled={portalChatLoading}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md"
                    onClick={() => handleSendPortalChat()}
                    disabled={!portalChatInput.trim() || portalChatLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Pestaña: Notificaciones */}
            <TabsContent value="notificaciones">
              <Card className="max-w-xl mx-auto rounded-3xl border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" /> Recordatorios y Avisos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs text-left">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Recordatorios por WhatsApp</h4>
                      <p className="text-muted-foreground mt-0.5">
                        Recibirás un mensaje automático 24h antes de tu consulta para confirmar o reagendar.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Alertas de Lista de Espera</h4>
                      <p className="text-muted-foreground mt-0.5">
                        Si te anotaste en la lista de espera, nuestro sistema te notificará en cuanto se libere un espacio.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </div>
  );
};

export default PortalPaciente;
