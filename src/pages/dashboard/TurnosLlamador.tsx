import { useState, useEffect } from "react";
import {
  Tv,
  ExternalLink,
  Plus,
  RotateCcw,
  Megaphone,
  CheckCircle2,
  LayoutTemplate,
  Sparkles,
  Stethoscope,
  ListOrdered,
  Settings,
  BarChart3,
  Smartphone,
  Building2,
  Check,
  HeartPulse,
  Info,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TurnoPaciente,
  getTurnosFromStorage,
  saveTurnosToStorage,
  emitLlamadoEvent,
  emitFinalizarEvent,
  broadcastChannel,
  type ClinicMediaSettings,
  DEFAULT_MEDIA_SETTINGS,
} from "@/lib/queueStore";
import { speakPatientCallAsync, playChime, type ChimeToneType, CHIME_TONE_OPTIONS } from "@/lib/soundService";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClinicConfig } from "@/hooks/useClinicConfig";
import { MetricsModal } from "@/components/dashboard/MetricsModal";
import { MediaSettingsModal } from "@/components/dashboard/MediaSettingsModal";

export const TurnosLlamador = () => {
  const { data: clinicConfig } = useClinicConfig();

  // Estados
  const [turnos, setTurnos] = useState<TurnoPaciente[]>([]);
  const [ultimoLlamado, setUltimoLlamado] = useState<TurnoPaciente | null>(null);
  const [historialLlamados, setHistorialLlamados] = useState<TurnoPaciente[]>([]);
  const [activeTab, setActiveTab] = useState<"offices" | "general">("offices");
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>("all");
  const [showSplitView, setShowSplitView] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mediaSettings, setMediaSettings] = useState<ClinicMediaSettings>(DEFAULT_MEDIA_SETTINGS);

  // Modales
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Formulario nuevo paciente
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoDoctor, setNuevoDoctor] = useState("");
  const [nuevoConsultorio, setNuevoConsultorio] = useState("1");

  // Marquesina
  const [marqueeText, setMarqueeText] = useState(
    "Bienvenidos a nuestra clínica • Por favor permanezca atento a la pantalla para el llamado de su turno • Mantenga a mano su identificación oficial."
  );
  const [editingTicker, setEditingTicker] = useState(marqueeText);
  const [tickerSuccess, setTickerSuccess] = useState(false);
  const [selectedChime, setSelectedChime] = useState<ChimeToneType>("dingdong");

  // Reloj TV
  const [tvTime, setTvTime] = useState("");
  const [tvDate, setTvDate] = useState("");

  // Consultorios
  const offices = [
    { id: "1", name: "Consultorio 1", specialty: "Medicina General", doctor: "Dr. Roberto Chaverri" },
    { id: "2", name: "Consultorio 2", specialty: "Pediatría", doctor: "Dra. Sofía Huertas" },
    { id: "3", name: "Consultorio 3", specialty: "Ginecología", doctor: "Dra. Carmen Figueroa" },
    { id: "4", name: "Consultorio 4", specialty: "Odontología", doctor: "Dr. Andrés Salazar" },
  ];

  // Doctores de Supabase
  const { data: doctoresDb } = useQuery({
    queryKey: ["doctores-llamador-data"],
    queryFn: async () => {
      const { data } = await supabase.from("doctores").select("id, nombre, especialidad").eq("activo", true);
      return data || [];
    },
  });

  // Reloj
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTvTime(
        now.toLocaleTimeString("es-CR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setTvDate(
        now.toLocaleDateString("es-CR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar turnos iniciales y sincronizar historial
  useEffect(() => {
    const data = getTurnosFromStorage();
    setTurnos(data.turnos);
    
    // Obtener los pacientes que han sido llamados o ya fueron atendidos
    const atendidosOLlamados = data.turnos.filter(
      (t) => t.estado === "llamado" || t.estado === "atendido"
    );
    // El último en atención activo
    const enAtencion = data.turnos.find((t) => t.estado === "llamado") || null;
    
    setUltimoLlamado(enAtencion);
    setHistorialLlamados(atendidosOLlamados);
  }, []);

  const updateTurnos = (newList: TurnoPaciente[], lastCall?: TurnoPaciente | null) => {
    setTurnos(newList);
    if (lastCall !== undefined) {
      setUltimoLlamado(lastCall);
      if (lastCall) {
        setHistorialLlamados((prev) => [lastCall, ...prev.filter((p) => p.id !== lastCall.id)].slice(0, 10));
      }
    }
    saveTurnosToStorage({
      turnos: newList,
      ultimoLlamado: lastCall !== undefined ? lastCall : ultimoLlamado,
    });
  };

  const handleOpenTvWindow = () => {
    window.open("/tv", "ClinicFlowTvWindow", "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no");
  };

  // LLAMAR PACIENTE
  const handleCallInOffice = async (officeId: string) => {
    const office = offices.find((o) => o.id === officeId);
    const officeWaiting = turnos.filter(
      (p) => p.estado === "en_espera" && (p.consultorio === officeId || p.doctorNombre === office?.doctor)
    );
    const target = officeWaiting[0] || turnos.find((p) => p.estado === "en_espera");

    if (!target) {
      toast.info(`No hay pacientes en espera para ${office?.name}`);
      return;
    }

    const pacienteActualizado: TurnoPaciente = {
      ...target,
      estado: "llamado",
      consultorio: officeId,
      timestampLlamada: Date.now(),
    };

    const nuevaLista = turnos.map((t) => (t.id === target.id ? pacienteActualizado : t));
    updateTurnos(nuevaLista, pacienteActualizado);

    // Animación visual del TV
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 2500);

    // Emitir a la ventana externa del TV
    emitLlamadoEvent(pacienteActualizado);

    // Audio único
    if (soundEnabled) {
      try {
        await speakPatientCallAsync(
          pacienteActualizado.nombre,
          pacienteActualizado.doctorNombre,
          pacienteActualizado.consultorio ? `Consultorio ${pacienteActualizado.consultorio}` : undefined,
          pacienteActualizado.ticketNumero
        );
      } catch (e) {
        console.warn(e);
      }
    }

    toast.success(`📢 Llamando a: ${pacienteActualizado.nombre} a ${office?.name}`);
  };

  // RE-LLAMAR
  const handleReCallOffice = async (officeId: string) => {
    const enAtencion = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    if (!enAtencion) return;

    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 2500);

    emitLlamadoEvent(enAtencion);

    if (soundEnabled) {
      try {
        await speakPatientCallAsync(
          enAtencion.nombre,
          enAtencion.doctorNombre,
          enAtencion.consultorio ? `Consultorio ${enAtencion.consultorio}` : undefined,
          enAtencion.ticketNumero
        );
      } catch (e) {
        console.warn(e);
      }
    }

    toast.success(`📢 Re-llamando a: ${enAtencion.nombre} a Consultorio ${officeId}`);
  };

  // FINALIZAR
  const handleFinishConsultation = (officeId: string) => {
    const finalizado = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    const nuevaLista = turnos.map((t) =>
      t.estado === "llamado" && t.consultorio === officeId ? { ...t, estado: "atendido" as const } : t
    );

    // Buscar si queda otro consultorio con paciente en llamado
    const otroLlamado = nuevaLista.find((t) => t.estado === "llamado") || null;

    setTurnos(nuevaLista);
    setUltimoLlamado(otroLlamado);

    // Agregar al historial de atendidos
    if (finalizado) {
      const pacienteAtendido = { ...finalizado, estado: "atendido" as const };
      setHistorialLlamados((prev) => [pacienteAtendido, ...prev.filter((p) => p.id !== finalizado.id)].slice(0, 10));
    }

    saveTurnosToStorage({
      turnos: nuevaLista,
      ultimoLlamado: otroLlamado,
    });

    emitFinalizarEvent(officeId);
    toast.success("Consulta médica finalizada con éxito.");
  };

  // PUBLICAR MARQUESINA
  const handleSaveTicker = () => {
    setMarqueeText(editingTicker);
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "UPDATE_MARQUEE", payload: editingTicker });
    }
    setTickerSuccess(true);
    setTimeout(() => setTickerSuccess(false), 2500);
    toast.success("Marquesina actualizada en la TV.");
  };

  // REGISTRAR PACIENTE
  const handleAddPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const count = turnos.length + 1;
    const ticket = `A-${count.toString().padStart(2, "0")}`;

    const nuevo: TurnoPaciente = {
      id: Date.now().toString(),
      nombre: nuevoNombre.trim(),
      doctorNombre: nuevoDoctor || (doctoresDb && doctoresDb[0]?.nombre) || "Dr. Roberto Chaverri",
      consultorio: nuevoConsultorio,
      horaCita: new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" }),
      estado: "en_espera",
      ticketNumero: ticket,
    };

    updateTurnos([...turnos, nuevo]);
    toast.success(`Paciente ${nuevo.nombre} agregado con Ticket ${ticket}`);

    setNuevoNombre("");
    setShowAddForm(false);
  };

  const filteredOffices =
    selectedOfficeFilter === "all" ? offices : offices.filter((o) => o.id === selectedOfficeFilter);

  const clinicName = clinicConfig?.nombre_clinica || "NOVA DENTAL";
  return (
    <div className="min-h-screen w-full bg-slate-950 text-left font-sans text-slate-100 flex flex-col p-3 sm:p-4 space-y-3.5">
      
      {/* 1. BARRA SUPERIOR DE ACCIONES (ESPACIADA CORRECTAMENTE, NUNCA CORTADA) */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        
        {/* Lado Izquierdo: Título y Estado */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 shadow-md shadow-sky-500/20 shrink-0">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                {clinicName}
              </h1>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                ● En Línea
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Panel Administrativo y de Consultorios Médicos
            </p>
          </div>
        </div>

        {/* Lado Derecho: Todos los Botones de Control */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMetricsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <BarChart3 className="size-3.5 text-indigo-400" />
            <span>Métricas del Día</span>
          </button>

          <a
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Smartphone className="size-3.5 text-emerald-400" />
            <span>Panel Médico</span>
            <ExternalLink className="size-3 opacity-70" />
          </a>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Settings className="size-3.5 text-sky-400" />
            <span>Configuración</span>
          </button>

          {/* BOTÓN INDISPENSABLE: OCULTAR/VER TV AQUÍ */}
          <button
            onClick={() => setShowSplitView(!showSplitView)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
              showSplitView
                ? "border-sky-500 bg-sky-500/20 text-sky-300"
                : "border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <LayoutTemplate className="size-3.5" />
            <span>{showSplitView ? "Ocultar TV Aquí" : "Ver TV Aquí"}</span>
          </button>

          <button
            onClick={handleOpenTvWindow}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-3.5 py-1.5 text-xs font-black tracking-wide text-white shadow-md hover:from-sky-500 hover:to-teal-500 active:scale-95 transition-all"
          >
            <Tv className="size-3.5" />
            <span>ABRIR MONITOR TV</span>
            <ExternalLink className="size-3 opacity-80" />
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider"
          >
            <Plus className="size-3.5" />
            <span>+ REGISTRAR PACIENTE</span>
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE MODO DE GESTIÓN (TABS) */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-4 py-2 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("offices")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
              activeTab === "offices"
                ? "bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Stethoscope className="size-3.5" />
            <span>POR CONSULTORIOS Y MÉDICOS (FLUJO REAL)</span>
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
              activeTab === "general"
                ? "bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ListOrdered className="size-3.5" />
            <span>FILA GENERAL UNIFICADA</span>
          </button>
        </div>

        {/* Filtro de consultorios */}
        {activeTab === "offices" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Filtrar consultorio:</span>
            <select
              value={selectedOfficeFilter}
              onChange={(e) => setSelectedOfficeFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Ver Todos los Consultorios (Recepción)</option>
              {offices.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} · {off.doctor}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. CONTENIDO PRINCIPAL: SPLIT-SCREEN REAL (CERO IFRAME SPINNER, CARGA INSTANTÁNEA) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch min-h-0">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE CONSULTORIOS (6 cols si está split, 12 si está oculto) */}
        <div className={`${showSplitView ? "xl:col-span-6" : "xl:col-span-12"} space-y-4 flex flex-col`}>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                <Building2 className="size-4 text-sky-400" />
                <span>CONSULTORIOS MÉDICOS ACTIVOS</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Cada médico gestiona su propio consultorio: atiende, finaliza y llama al siguiente paciente de su fila.
              </p>
            </div>
          </div>

          {/* Cuadrícula de Consultorios (2x2 con TV activo, 1x4 compacto cuando TV está oculto) */}
          {activeTab === "offices" ? (
            <div
              className={`grid gap-4 ${
                showSplitView
                  ? "grid-cols-1 md:grid-cols-2 flex-1"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {filteredOffices.map((office) => {
                const officeWaiting = turnos.filter(
                  (p) => p.estado === "en_espera" && (p.consultorio === office.id || p.doctorNombre === office.doctor)
                );
                const nextInOffice = officeWaiting[0];
                const inConsultation = turnos.find(
                  (p) => p.estado === "llamado" && p.consultorio === office.id
                );

                return (
                  <div
                    key={office.id}
                    className={`flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
                      showSplitView ? "h-full" : ""
                    } ${
                      inConsultation
                        ? "border-emerald-500/50 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20"
                        : "border-slate-800 bg-slate-900/70"
                    }`}
                  >
                    {/* Cabecera del Consultorio */}
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs">
                          {office.name.replace("Consultorio ", "C")}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs text-white">
                            {office.name} · {office.specialty}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">{office.doctor}</p>
                        </div>
                      </div>

                      <div>
                        {inConsultation ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 uppercase animate-pulse">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            En Atención
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                            <span className="size-1.5 rounded-full bg-slate-500" />
                            Libre
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cuerpo del Consultorio */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {inConsultation ? (
                        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                              🩺 PACIENTE ADENTRO:
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-300">
                              Ticket: {inConsultation.ticketNumero || "A-01"}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white truncate">
                            {inConsultation.nombre}
                          </h4>

                          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                            <button
                              onClick={() => handleReCallOffice(office.id)}
                              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-emerald-300 transition-all"
                            >
                              <RotateCcw className="size-3" />
                              <span>Re-llamar en TV</span>
                            </button>
                            <button
                              onClick={() => handleFinishConsultation(office.id)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all shadow-md"
                            >
                              <Check className="size-3" />
                              <span>Finalizar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3 text-center">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 mb-1.5">
                            <Stethoscope className="size-5 text-slate-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-300">Consultorio disponible</span>
                          <span className="text-[10px] text-slate-400">Presiona el botón para hacer ingresar al siguiente paciente</span>
                        </div>
                      )}

                      {/* Botón Gigante de Llamado Verde */}
                      <button
                        disabled={!nextInOffice && !inConsultation}
                        onClick={() => handleCallInOffice(office.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 py-3 px-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Megaphone className="size-3.5 text-slate-950" />
                        <span className="truncate">
                          {nextInOffice
                            ? `LLAMAR A ${nextInOffice.nombre.toUpperCase()} (${nextInOffice.ticketNumero || "A-01"})`
                            : "LLAMAR SIGUIENTE"}
                        </span>
                      </button>

                      {/* Fila en espera de este médico */}
                      <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
                        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-1">
                          <Bell className="size-3 text-slate-500" />
                          EN ESPERA DE ESTE MÉDICO ({officeWaiting.length})
                        </span>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {officeWaiting.map((p, idx) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-2.5 py-2 text-xs"
                            >
                              {/* Posición */}
                              <span className="text-[10px] font-black text-slate-500 shrink-0 w-4 text-center">
                                {idx + 1}
                              </span>

                              {/* Ticket */}
                              <span className="font-mono font-black text-sky-400 text-[10px] shrink-0 bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                                {p.ticketNumero || `A-0${idx + 1}`}
                              </span>

                              {/* Nombre */}
                              <span className="font-bold text-slate-200 truncate flex-1 text-[11px]">
                                {p.nombre}
                              </span>

                              {/* Badge de Prioridad */}
                              {p.prioridad === "preferencial" && (
                                <span className="shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 uppercase">
                                  Pref
                                </span>
                              )}
                              {p.prioridad === "urgencia" && (
                                <span className="shrink-0 rounded-full bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-black text-orange-300 uppercase animate-pulse">
                                  Urgencia
                                </span>
                              )}

                              {/* Llamar */}
                              <button
                                onClick={() => handleCallInOffice(office.id)}
                                className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white transition-all shadow-sm"
                              >
                                Llamar
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => {
                                  const newList = turnos.filter((t) => t.id !== p.id);
                                  updateTurnos(newList);
                                  toast.success(`Paciente ${p.nombre} removido de la fila`);
                                }}
                                className="shrink-0 flex items-center justify-center size-6 rounded-lg bg-slate-800 hover:bg-rose-600/30 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              </button>
                            </div>
                          ))}
                          {officeWaiting.length === 0 && (
                            <span className="text-[10px] text-slate-500 italic block py-0.5">
                              No hay pacientes en espera para este médico
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* FILA GENERAL UNIFICADA */
            <div className="space-y-2.5">
              <h2 className="text-base font-black text-white uppercase">Fila General de Pacientes</h2>
              <div className="space-y-2">
                {turnos
                  .filter((t) => t.estado === "en_espera")
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-sky-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {p.ticketNumero || `A-0${idx + 1}`}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{p.nombre}</h4>
                          <p className="text-[10px] text-slate-400">{p.doctorNombre} • Consultorio {p.consultorio}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCallInOffice(p.consultorio || "1")}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-black text-slate-950 flex items-center gap-1"
                      >
                        <Megaphone className="size-3" /> Llamar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 4. MARQUESINA DE TV EN VIVO */}
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider text-sky-400 uppercase">
                <Megaphone className="size-3.5 text-amber-400" />
                <span>Mensaje de la Marquesina (Cintillo TV en Vivo)</span>
              </div>
              {tickerSuccess && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <CheckCircle2 className="size-3" /> ¡Actualizado en la TV!
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={editingTicker}
                onChange={(e) => setEditingTicker(e.target.value)}
                placeholder="Escribe un anuncio para mostrar a los pacientes en la pantalla de la sala..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none shadow-inner"
              />
              <button
                onClick={handleSaveTicker}
                className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-black tracking-wider text-white shadow-md active:scale-95 transition-all shrink-0"
              >
                PUBLICAR EN TV
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA DEL MONITOR DE TV */}
        {showSplitView && (
          <div className="xl:col-span-6 flex flex-col bg-[#0a0e1a] rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden h-full">

            {/* Header del Bloque */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <Tv className="size-4 text-emerald-400" />
                <span>Vista Previa del Monitor de TV (/tv)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado en Tiempo Real
              </span>
            </div>

            {/* ── CONTENIDO TV ── */}
            <div className="flex-1 flex flex-col bg-[#0a0e1a] p-5 gap-4">

              {/* Cabecera TV: Logo + Nombre grande + Reloj + Botones */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 shadow-lg shadow-sky-500/30">
                    <HeartPulse className="size-7 text-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-widest text-white uppercase leading-tight">{clinicName}</h2>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-sky-300/80 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>SALA DE ESPERA Y CONSULTORIOS MÉDICOS</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 font-mono text-lg font-black tracking-wider text-emerald-400">
                      <Clock className="size-4 text-emerald-400" />
                      <span>{tvTime || "09:00 p. m."}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 capitalize">{tvDate}</p>
                  </div>
                  {/* Botones Volumen y Pantalla Completa */}
                  <div className="flex items-center gap-1.5">
                    <button className="flex size-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
                      <Volume2 className="size-4" />
                    </button>
                    <button
                      onClick={handleOpenTvWindow}
                      className="flex size-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-sky-600/20 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 transition-all"
                      title="Abrir en pantalla completa"
                    >
                      <LayoutTemplate className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Zona central: Turnos (izq) + Video (der) */}
              <div className="grid grid-cols-12 gap-4 flex-1">

                {/* ── COLUMNA TURNOS (5 cols - Más ancha y legible) ── */}
                <div className="col-span-5 flex flex-col gap-3">

                  {/* Encabezado de columnas */}
                  <div className="grid grid-cols-[60px_1fr_auto] items-center text-[9px] font-black tracking-widest text-sky-400 uppercase border-b border-slate-800 pb-1.5 px-1">
                    <span>TURNO</span>
                    <span>PACIENTE</span>
                    <span className="text-right">CONSULTORIO</span>
                  </div>

                  {/* Turno Activo */}
                  {ultimoLlamado ? (
                    <div
                      className={`relative overflow-hidden rounded-2xl border-2 p-3.5 transition-all duration-300 ${
                        isBlinking
                          ? "border-emerald-300 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 shadow-[0_0_40px_rgba(16,185,129,0.7)] scale-[1.01]"
                          : "border-emerald-500/60 bg-gradient-to-r from-emerald-700 to-teal-800 shadow-xl"
                      }`}
                    >
                      <div className="text-[9px] font-black tracking-wider text-emerald-200 uppercase mb-2 flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-300 animate-ping" />
                        ⭐ LLAMADO ACTUAL
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-block rounded-xl bg-black/50 px-3 py-1.5 font-mono text-xl font-black text-white shadow-inner">
                            {ultimoLlamado.ticketNumero || "A-01"}
                          </span>
                          <span className="rounded-lg bg-black/40 px-2.5 py-1 text-xs font-black text-emerald-200 border border-emerald-400/30">
                            {ultimoLlamado.consultorio ? `Consultorio ${ultimoLlamado.consultorio}` : "Consultorio"}
                          </span>
                        </div>
                        <p className="font-extrabold text-sm text-white truncate drop-shadow-sm">{ultimoLlamado.nombre}</p>
                        <p className="text-[11px] text-emerald-100 font-medium truncate flex items-center gap-1">
                          <span>👨‍⚕️</span> {ultimoLlamado.doctorNombre}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-sky-500/30 bg-slate-900/60 p-4 flex flex-col items-center justify-center text-center gap-2">
                      <HeartPulse className="size-7 text-sky-400/60 animate-pulse" />
                      <span className="text-xs font-black text-white uppercase tracking-wide">SALA DE ESPERA</span>
                      <span className="text-[10px] text-slate-400">ATENCIÓN MÉDICA EN CURSO</span>
                      <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 font-bold">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Consultorios Activos
                      </div>
                    </div>
                  )}

                  {/* Historial Reciente */}
                  <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        HISTORIAL RECIENTE
                      </span>
                      <span className="text-[8px] font-bold text-slate-500">
                        {historialLlamados.filter((p) => !ultimoLlamado || p.id !== ultimoLlamado.id).length} en historial
                      </span>
                    </div>

                    {(() => {
                      const listaHistorial = historialLlamados.filter(
                        (p) => !ultimoLlamado || p.id !== ultimoLlamado.id
                      );

                      return listaHistorial.length > 0 ? (
                        <div className="space-y-1.5 overflow-y-auto max-h-52 pr-1">
                          {listaHistorial.slice(0, 8).map((p, idx) => (
                            <div
                              key={p.id + idx}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs hover:border-slate-700 transition-all"
                            >
                              <span className="font-mono font-black text-sky-400 shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                                {p.ticketNumero || `A-0${idx + 1}`}
                              </span>
                              <div className="flex-1 mx-2 min-w-0">
                                <span className="truncate font-bold text-white block text-[11px] leading-tight">
                                  {p.nombre}
                                </span>
                                <span className="text-[9px] text-slate-400 truncate block leading-tight">
                                  {p.doctorNombre}
                                </span>
                              </div>
                              <span className="text-emerald-400 shrink-0 text-[9px] font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                {p.estado === "atendido" ? "Atendido" : `Cons. ${p.consultorio}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-[10px] text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                          Aún no hay pacientes en el historial
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── COLUMNA VIDEO (7 cols - Tamaño balanceado) ── */}
                <div className="col-span-7 flex flex-col gap-3">

                  {/* Canal Informativo en Vivo */}
                  <div className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-sky-400 uppercase bg-slate-950/40">
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-sky-300">CANAL INFORMATIVO EN VIVO</span>
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">1080P HD</span>
                    </div>
                    <div className="relative flex-1 w-full bg-black min-h-[260px]">
                      <iframe
                        src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=1&loop=1&playlist=LXb3EKWsInQ&controls=1&playsinline=1"
                        title="Canal Médico en Vivo"
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>

                  {/* Información Importante */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[10px]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Info className="size-3 text-sky-400" />
                      <span className="font-black text-sky-400 uppercase tracking-wider text-[9px]">INFORMACIÓN IMPORTANTE PARA PACIENTES</span>
                    </div>
                    <ul className="space-y-1 text-slate-300 leading-tight text-[10px]">
                      <li className="flex items-start gap-1.5"><Check className="size-3 text-emerald-400 shrink-0 mt-0.5" /> Por favor permanezca en la sala hasta escuchar el llamado de su turno.</li>
                      <li className="flex items-start gap-1.5"><Check className="size-3 text-emerald-400 shrink-0 mt-0.5" /> Tenga listo su documento de identidad oficial al ingresar a consulta.</li>
                      <li className="flex items-start gap-1.5"><Check className="size-3 text-emerald-400 shrink-0 mt-0.5" /> Si requiere asistencia especial o silla de ruedas, solicítela en recepción.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── AVISOS: Marquesina full-width con animación continua ── */}
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-2.5 overflow-hidden">
                <span className="flex items-center gap-1.5 bg-emerald-600 text-white font-black px-2.5 py-1 rounded-xl shrink-0 text-[10px] uppercase shadow-sm">
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                  AVISOS:
                </span>
                <div className="marquee-track flex-1 overflow-hidden">
                  <span className="marquee-content font-medium text-[11px] text-slate-200">
                    {marqueeText}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL DE REGISTRAR PACIENTE */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Registrar Paciente en Sala</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPaciente} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Nombre Completo *</Label>
              <Input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Jessica Jiménez Mora"
                required
                className="rounded-xl bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Doctor Asignado</Label>
              <Select value={nuevoDoctor} onValueChange={setNuevoDoctor}>
                <SelectTrigger className="rounded-xl bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Seleccionar doctor" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.doctor}>
                      {o.doctor} ({o.specialty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Consultorio</Label>
              <Select value={nuevoConsultorio} onValueChange={setNuevoConsultorio}>
                <SelectTrigger className="rounded-xl bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} ({o.specialty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl border-slate-700 text-slate-300">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black">
                + Registrar Paciente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL COMPLETO DE MÉTRICAS */}
      {showMetricsModal && (
        <MetricsModal
          offices={offices}
          turnos={turnos}
          clinicName={clinicName}
          onClose={() => setShowMetricsModal(false)}
        />
      )}

      {/* MODAL COMPLETO DE CONFIGURACIÓN DEL MONITOR TV, PUBLICIDAD Y VOCES IA */}
      {showSettingsModal && (
        <MediaSettingsModal
          currentSettings={mediaSettings}
          onSave={(newSettings) => {
            const updated = { ...mediaSettings, ...newSettings };
            setMediaSettings(updated);
            if (newSettings.chimeTone) setSelectedChime(newSettings.chimeTone);
            if (broadcastChannel) {
              broadcastChannel.postMessage({ type: "UPDATE_MEDIA_SETTINGS", payload: updated });
            }
            toast.success("Configuración guardada exitosamente.");
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

    </div>
  );
};

export default TurnosLlamador;
