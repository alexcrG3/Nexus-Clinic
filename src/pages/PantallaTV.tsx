import { useEffect, useRef, useState } from "react";
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Radio,
  ArrowRight,
  Clock,
  HeartPulse,
  Sparkles,
  Users,
  CheckCircle2,
  Bell,
  Stethoscope,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TurnoPaciente, 
  getTurnosFromStorage, 
  saveTurnosToStorage, 
  broadcastChannel 
} from "@/lib/queueStore";
import { speakPatientCallAsync, playChime } from "@/lib/soundService";
import { useClinicConfig } from "@/hooks/useClinicConfig";

export const PantallaTV = () => {
  const { data: clinicConfig } = useClinicConfig();
  const [turnos, setTurnos] = useState<TurnoPaciente[]>([]);
  const [activeSpeakingPatient, setActiveSpeakingPatient] = useState<TurnoPaciente | null>(null);
  const [historialLlamados, setHistorialLlamados] = useState<TurnoPaciente[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const isIframePreview = typeof window !== "undefined" && (window.self !== window.top || window.location.search.includes("preview=true"));
  const [soundEnabled, setSoundEnabled] = useState(!isIframePreview);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [marqueeText, setMarqueeText] = useState(
    "Bienvenidos a nuestra clínica • Por favor permanezca atento a la pantalla para el llamado de su turno • Mantenga a mano su identificación oficial."
  );

  const pendingQueueRef = useRef<TurnoPaciente[]>([]);
  const isSpeakingRef = useRef<boolean>(false);

  // Reloj en tiempo real
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-CR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("es-CR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carga inicial de turnos
  useEffect(() => {
    const data = getTurnosFromStorage();
    setTurnos(data.turnos);
    const enAtencion = data.turnos.find((t) => t.estado === "llamado") || null;
    const atendidosOLlamados = data.turnos.filter(
      (t) => t.estado === "llamado" || t.estado === "atendido"
    );
    setActiveSpeakingPatient(enAtencion);
    setHistorialLlamados(atendidosOLlamados);
  }, []);

  // Procesador secuencial de audio para la sala de espera
  const processAudioQueue = async () => {
    if (isSpeakingRef.current || pendingQueueRef.current.length === 0) return;

    isSpeakingRef.current = true;
    const nextPatient = pendingQueueRef.current.shift()!;

    setActiveSpeakingPatient(nextPatient);
    setHistorialLlamados((prev) => [nextPatient, ...prev.filter((p) => p.id !== nextPatient.id)].slice(0, 10));
    setIsBlinking(true);

    if (soundEnabledRef.current) {
      try {
        await speakPatientCallAsync(
          nextPatient.nombre,
          nextPatient.doctorNombre,
          nextPatient.consultorio
        );
      } catch (err) {
        console.warn("Error en audio TV:", err);
      }
    }

    setTimeout(() => {
      setIsBlinking(false);
      isSpeakingRef.current = false;
      if (pendingQueueRef.current.length > 0) {
        processAudioQueue();
      }
    }, 2500);
  };

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Escuchar llamados y finalizaciones en tiempo real desde el BroadcastChannel
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "LLAMAR_PACIENTE") {
        const paciente = event.data.payload as TurnoPaciente;
        pendingQueueRef.current.push(paciente);
        processAudioQueue();
      } else if (event.data?.type === "FINALIZAR_CONSULTA") {
        const { consultorio } = event.data.payload || {};
        setActiveSpeakingPatient((prev) => (prev?.consultorio === consultorio ? null : prev));
        const data = getTurnosFromStorage();
        setTurnos(data.turnos);
        const atendidos = data.turnos.filter((t) => t.estado === "atendido" || t.estado === "llamado");
        setHistorialLlamados(atendidos);
      } else if (event.data?.type === "UPDATE_MARQUEE") {
        setMarqueeText(event.data.payload);
      }
    };

    broadcastChannel.addEventListener("message", handleMessage);
    return () => broadcastChannel.removeEventListener("message", handleMessage);
  }, []);

  // Pantalla completa toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const clinicName = clinicConfig?.nombre_clinica || "CLÍNICA DE LA SALUD";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none font-sans">
      
      {/* 1. BARRA SUPERIOR DE ENCABEZADO HOSPITALARIO */}
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-sky-500/20 bg-gradient-to-r from-sky-950 via-slate-900 to-teal-950 px-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 shadow-lg shadow-sky-500/25 ring-2 ring-white/20">
            <HeartPulse className="size-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white uppercase drop-shadow-md sm:text-3xl">
              {clinicName}
            </h1>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300/80">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>SALA DE ESPERA Y CONSULTORIOS MÉDICOS</span>
            </div>
          </div>
        </div>

        {/* Reloj y Controles */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 font-mono text-2xl font-black tracking-widest text-emerald-400 drop-shadow-sm">
              <Clock className="size-5 text-emerald-400" />
              <span>{currentTime || "00:00:00"}</span>
            </div>
            <p className="text-xs font-medium text-slate-400 capitalize">{currentDate}</p>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Silenciar" : "Activar Sonido"}
              className={`flex size-10 items-center justify-center rounded-xl border transition-all ${
                soundEnabled
                  ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80"
                  : "border-rose-500/40 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80"
              }`}
            >
              {soundEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              title="Pantalla Completa"
              className="flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            >
              {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. ÁREA PRINCIPAL: DIVIDIDA EN TURNOS (1/4) Y CANAL INFORMATIVO (3/4) */}
      <main className="flex min-h-0 flex-1 gap-6 p-6 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: PANTALLA DE TURNOS (~48.5% - Proporción máxima legible sin llegar al 50/50) */}
        <section className="flex w-[48.5%] shrink-0 flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl transition-all overflow-hidden justify-between gap-5">
          
          <div className="space-y-4">
            {/* Encabezado de la columna de turnos */}
            <div className="flex items-center justify-between px-2 text-sm font-black tracking-widest text-sky-400 uppercase border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-sky-400" />
                TURNO / PACIENTE
              </span>
              <span className="text-right">CONSULTORIO / MÉDICO</span>
            </div>

            {/* TURNO ACTUAL DESTACADO */}
            {activeSpeakingPatient ? (
              <div
                className={`relative overflow-hidden rounded-3xl border-4 p-6 transition-all duration-300 ${
                  isBlinking
                    ? "border-emerald-300 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 shadow-[0_0_70px_rgba(16,185,129,0.95)] scale-[1.01]"
                    : "border-emerald-500/60 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-2xl"
                }`}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="rounded-full bg-black/40 px-4 py-1 text-xs font-black tracking-wider text-emerald-200 uppercase flex items-center gap-2 shadow-sm">
                    <span className="size-2.5 rounded-full bg-emerald-300 animate-ping" />
                    ⭐ LLAMADO ACTUAL
                  </span>
                  <span className="rounded-xl bg-black/40 px-3.5 py-1 text-sm font-black text-emerald-200 border border-emerald-400/40">
                    {activeSpeakingPatient.consultorio ? `Consultorio ${activeSpeakingPatient.consultorio}` : "Consultorio"}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-2xl bg-black/50 px-6 py-3 font-mono text-4xl lg:text-5xl font-black text-white shadow-inner tracking-wider">
                      {activeSpeakingPatient.ticketNumero || "A-01"}
                    </span>
                    <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white shadow-md">
                      <ArrowRight className="size-8 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <h2 className="truncate text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                      {activeSpeakingPatient.nombre}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-emerald-100/90 truncate mt-1">
                      👨‍⚕️ {activeSpeakingPatient.doctorNombre || "Médico Especialista"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Banner de reposo cuando no hay llamado activo */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-sky-500/30 bg-slate-950/80 p-8 text-center gap-3 shadow-inner">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <HeartPulse className="size-9 animate-pulse text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-wider text-white uppercase">
                    SALA DE ESPERA · ATENCIÓN ACTIVA
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                    Por favor permanezca atento para el próximo llamado de turno
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-1.5 text-xs text-slate-200 font-bold mt-1 shadow-sm">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Consultorios Médicos Disponibles
                </div>
              </div>
            )}
          </div>

          {/* HISTORIAL DE ÚLTIMAS LLAMADAS */}
          <div className="flex flex-1 flex-col min-h-0">
            <div className="mb-3 flex items-center justify-between px-1 border-b border-slate-800/80 pb-2">
              <h3 className="text-xs sm:text-sm font-black tracking-widest text-slate-400 uppercase">
                HISTORIAL RECIENTE
              </h3>
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-0.5 rounded-full">
                {historialLlamados.filter((p) => !activeSpeakingPatient || p.id !== activeSpeakingPatient.id).length} atendidos
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {(() => {
                const listaHistorial = historialLlamados.filter(
                  (p) => !activeSpeakingPatient || p.id !== activeSpeakingPatient.id
                );

                return listaHistorial.length > 0 ? (
                  listaHistorial.slice(0, 6).map((p, idx) => (
                    <div
                      key={p.id + idx}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-3 text-xs shadow-sm hover:border-slate-700 transition-all gap-4"
                    >
                      <span className="font-mono text-sm sm:text-base font-black text-sky-400 shrink-0 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl shadow-inner">
                        {p.ticketNumero || `A-0${idx + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-base sm:text-lg font-bold text-white block">
                          {p.nombre}
                        </span>
                        <span className="text-xs text-slate-400 truncate block mt-0.5 font-medium">
                          {p.doctorNombre}
                        </span>
                      </div>
                      <span className="text-emerald-400 shrink-0 text-xs sm:text-sm font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-xl">
                        {p.estado === "atendido" ? "✓ Atendido" : `Cons. ${p.consultorio}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-sm text-slate-500 font-medium">
                    Aún no hay llamados en el historial
                  </div>
                );
              })()}
            </div>
          </div>

        </section>

        {/* COLUMNA DERECHA: CANAL INFORMATIVO EN VIVO & AVISOS (3/4 - 70% a 75% WIDESCREEN) */}
        <section className="flex flex-1 flex-col gap-4 overflow-hidden">
          
          {/* Contenedor de Video Informativo en Grande */}
          <div className="flex flex-1 flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="mb-2.5 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
                <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
                  CANAL INFORMATIVO EN VIVO
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">1080P HD · WIDESCREEN</span>
            </div>

            <div className="relative flex-1 w-full overflow-hidden rounded-2xl bg-black min-h-[300px]">
              <iframe
                src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=1&loop=1&playlist=LXb3EKWsInQ&controls=1&playsinline=1"
                title="Canal Médico en Vivo"
                className="size-full absolute inset-0 border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* Tarjeta Informativa para Pacientes */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 p-4 shadow-2xl">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-black text-sky-400 uppercase tracking-wider">
              <Info className="size-4 text-sky-400" />
              <span>INFORMACIÓN IMPORTANTE PARA PACIENTES</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 leading-relaxed font-medium">
              <li className="flex items-start gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-emerald-400 font-bold">✓</span> Permanezca en sala hasta escuchar su llamado.
              </li>
              <li className="flex items-start gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-emerald-400 font-bold">✓</span> Tenga a mano su documento de identidad.
              </li>
              <li className="flex items-start gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <span className="text-emerald-400 font-bold">✓</span> Si requiere asistencia especial, solicítela en recepción.
              </li>
            </ul>
          </div>

        </section>

      </main>

      {/* 3. MARQUESINA INFERIOR CINTILLO EN VIVO */}
      <footer className="flex h-12 shrink-0 items-center overflow-hidden border-t border-sky-500/20 bg-slate-950 px-6">
        <div className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-teal-600 px-3 py-1 rounded-xl text-xs font-black text-white uppercase tracking-wider shrink-0 mr-4 shadow-md">
          <Bell className="size-3.5" />
          <span>AVISO</span>
        </div>
        <div className="marquee-track flex-1 overflow-hidden">
          <span className="marquee-content text-sm font-semibold text-slate-200">
            {marqueeText}
          </span>
        </div>
      </footer>

    </div>
  );
};

export default PantallaTV;
