import { useState, useEffect, useMemo } from "react";
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
  Bell,
  Trash2,
  AlertTriangle,
  X,
  ArrowLeft,
  RefreshCw,
  Minimize,
  Radio,
  Eye,
  Calendar,
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
  DialogDescription,
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
  clearTurnosQueue,
  resetToDemoTurnos,
  emitLlamadoEvent,
  emitFinalizarEvent,
  emitCancelarLlamadoEvent,
  broadcastChannel,
  type ClinicMediaSettings,
  type AdBanner,
  DEFAULT_MEDIA_SETTINGS,
  getMediaSettingsFromStorage,
  saveMediaSettingsToStorage,
  getYouTubeEmbedUrl,
  extractYouTubeId,
} from "@/lib/queueStore";
import { getLocalVideoBlob } from "@/lib/mediaStorage";
import { speakPatientCallAsync, playChime, queueSpeechCall, type ChimeToneType, CHIME_TONE_OPTIONS } from "@/lib/soundService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClinicConfig } from "@/hooks/useClinicConfig";
import { MetricsModal } from "@/components/dashboard/MetricsModal";
import { MediaSettingsModal } from "@/components/dashboard/MediaSettingsModal";

// Componente de carrusel de afiches (preview en dashboard)
const BannerSlideshow = ({ banners, durationSeconds }: { banners: AdBanner[]; durationSeconds: number }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % banners.length);
    }, durationSeconds * 1000);
    return () => clearInterval(timer);
  }, [banners.length, durationSeconds]);
  const banner = banners[idx % banners.length];
  if (!banner) return null;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
      <img
        key={banner.id}
        src={banner.imageUrl}
        alt={banner.title}
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
        <p className="text-white font-black text-sm truncate">{banner.title}</p>
        {banner.sponsorName && <p className="text-slate-300 text-xs truncate">{banner.sponsorName}</p>}
        <div className="flex gap-1 mt-1.5">
          {banners.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1 bg-white/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Universal de Visualización Multimedia (Soporta Rotación Continua de YouTube Presets, Comerciales MP4 y Blobs locales)
const ClinicMediaDisplay = ({ mediaSettings }: { mediaSettings: ClinicMediaSettings }) => {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [playlistIdx, setPlaylistIdx] = useState<number>(0);

  const isYouTubeMode = mediaSettings.mediaType === "youtube";
  const isMp4Mode = mediaSettings.mediaType === "video_mp4";

  // Lista activa de items a rotar
  const currentPlaylist = isYouTubeMode
    ? (mediaSettings.videoPresets && mediaSettings.videoPresets.length > 0 ? mediaSettings.videoPresets : [])
    : isMp4Mode
    ? (mediaSettings.videoPlaylist && mediaSettings.videoPlaylist.length > 0 ? mediaSettings.videoPlaylist : [])
    : [];

  const isPlaylistActive = currentPlaylist.length > 1;

  // Sincronizar índice inicial si se seleccionó un video o preset específico
  useEffect(() => {
    if (currentPlaylist.length > 0) {
      const targetUrl = isYouTubeMode ? mediaSettings.youtubeUrl : mediaSettings.directVideoUrl;
      if (targetUrl) {
        const idx = currentPlaylist.findIndex((v) => v.url === targetUrl);
        if (idx !== -1) setPlaylistIdx(idx);
      }
    }
  }, [mediaSettings.youtubeUrl, mediaSettings.directVideoUrl, isYouTubeMode, currentPlaylist.length]);

  const currentItem = currentPlaylist.length > 0
    ? currentPlaylist[playlistIdx % currentPlaylist.length]
    : null;

  const activeUrl = currentItem
    ? currentItem.url
    : isYouTubeMode
    ? mediaSettings.youtubeUrl || ""
    : mediaSettings.directVideoUrl || "";

  const handleNextVideo = () => {
    if (currentPlaylist.length > 1) {
      setPlaylistIdx((prev) => (prev + 1) % currentPlaylist.length);
    }
  };

  // Rotación automática por temporizador para playlist (MP4 o YouTube)
  useEffect(() => {
    if (!isPlaylistActive) return;
    const itemDuration = (currentItem as any)?.durationSeconds;
    // Si tiene duración configurada la usamos (ej. 5s, 10s, 15s, 30s), de lo contrario 20s para MP4 o 45s para YouTube
    const duration = (itemDuration && itemDuration > 0 ? itemDuration : isYouTubeMode ? 45 : 20) * 1000;
    const timer = setTimeout(() => {
      handleNextVideo();
    }, duration);
    return () => clearTimeout(timer);
  }, [isPlaylistActive, playlistIdx, currentPlaylist.length, (currentItem as any)?.durationSeconds, isYouTubeMode]);

  // Escuchar evento de finalización del reproductor de YouTube (para rotar al siguiente video de YouTube)
  useEffect(() => {
    const handleYTMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data === "string") {
          const data = JSON.parse(e.data);
          // YT.PlayerState.ENDED is 0
          if (data.event === "onStateChange" && data.info === 0) {
            handleNextVideo();
          }
        }
      } catch {
        // ignorar mensajes no json
      }
    };
    window.addEventListener("message", handleYTMessage);
    return () => window.removeEventListener("message", handleYTMessage);
  }, [currentPlaylist.length]);

  // Cargar blob si es IndexedDB
  useEffect(() => {
    let active = true;
    if (activeUrl.startsWith("indexeddb://")) {
      const key = activeUrl.replace("indexeddb://", "");
      getLocalVideoBlob(key).then((blob) => {
        if (blob && active) {
          setBlobUrl(URL.createObjectURL(blob));
        }
      });
    } else {
      setBlobUrl("");
    }
    return () => {
      active = false;
    };
  }, [activeUrl]);

  if (mediaSettings.mediaType === "banner_slideshow" && mediaSettings.adBanners && mediaSettings.adBanners.length > 0) {
    return <BannerSlideshow banners={mediaSettings.adBanners} durationSeconds={mediaSettings.slideDurationSeconds || 12} />;
  }

  const ytId = extractYouTubeId(activeUrl);
  const currentTitle = (currentItem as any)?.name || (currentItem as any)?.title || "Video";

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {ytId ? (
        <iframe
          key={`${ytId}-${playlistIdx}`}
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=0&controls=1&playsinline=1&enablejsapi=1`}
          title={currentTitle}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : activeUrl.startsWith("indexeddb://") && blobUrl ? (
        <video
          key={`${blobUrl}-${playlistIdx}`}
          src={blobUrl}
          autoPlay
          muted
          playsInline
          controls
          onEnded={handleNextVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : activeUrl && (activeUrl.startsWith("http://") || activeUrl.startsWith("https://") || activeUrl.startsWith("blob:")) ? (
        <video
          key={`${activeUrl}-${playlistIdx}`}
          src={activeUrl}
          autoPlay
          muted
          playsInline
          controls
          onEnded={handleNextVideo}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
          <span className="text-3xl">📺</span>
          <span className="text-xs font-bold text-slate-500 text-center">
            Sin video configurado.<br />
            Ve a Configuración y agrega un enlace o video.
          </span>
        </div>
      )}

      {/* Indicador de lista de reproducción continua */}
      {isPlaylistActive && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-rose-500/30 text-[10px] text-white shadow-lg pointer-events-none">
          <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-rose-300">
            {isYouTubeMode ? "YouTube" : "Comercial"} {(playlistIdx % currentPlaylist.length) + 1}/{currentPlaylist.length}:
          </span>
          <span className="text-slate-200 font-medium truncate max-w-[140px]">
            {currentTitle}
          </span>
        </div>
      )}
    </div>
  );
};

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
  const [mediaSettings, setMediaSettings] = useState<ClinicMediaSettings>(getMediaSettingsFromStorage);

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

  const queryClient = useQueryClient();

  // Doctores de Supabase
  const { data: doctoresDb } = useQuery({
    queryKey: ["doctores-llamador-data"],
    queryFn: async () => {
      const { data } = await supabase.from("doctores").select("id, nombre, especialidad").eq("activo", true);
      return data || [];
    },
  });

  // Consultorios dinámicos basados en los doctores reales registrados
  const defaultOffices = [
    { id: "1", name: "Consultorio 1", specialty: "Medicina General", doctor: "Dr. Roberto Chaverri" },
    { id: "2", name: "Consultorio 2", specialty: "Pediatría", doctor: "Dra. Sofía Huertas" },
    { id: "3", name: "Consultorio 3", specialty: "Ginecología", doctor: "Dra. Carmen Figueroa" },
    { id: "4", name: "Consultorio 4", specialty: "Odontología", doctor: "Dr. Andrés Salazar" },
  ];

  const offices = useMemo(() => {
    if (doctoresDb && doctoresDb.length > 0) {
      return doctoresDb.map((doc, idx) => ({
        id: String(idx + 1),
        name: `Consultorio ${idx + 1}`,
        specialty: doc.especialidad || "Especialidad Médica",
        doctor: doc.nombre,
        doctorId: doc.id,
      }));
    }
    return defaultOffices;
  }, [doctoresDb]);

  // Citas agendadas de hoy desde Supabase
  const { data: citasDb } = useQuery({
    queryKey: ["citas-llamador-db"],
    queryFn: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      const { data, error } = await supabase
        .from("citas")
        .select("*")
        .gte("fechaCita", todayStr)
        .lte("fechaCita", `${todayStr}T23:59:59`)
        .order("hora_cita", { ascending: true, nullsFirst: false });

      if (error) {
        const { data: fallback } = await supabase.from("citas").select("*");
        return fallback?.filter((c) => c.fechaCita?.startsWith(todayStr) && c.estado !== "cancelada") || [];
      }
      return data?.filter((c) => c.estado !== "cancelada") || [];
    },
    refetchInterval: 6000,
  });

  // Realtime subscription para citas y llamados remotos
  useEffect(() => {
    const citasChannel = supabase
      .channel("citas-realtime-llamador")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, () => {
        queryClient.invalidateQueries({ queryKey: ["citas-llamador-db"] });
        queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      })
      .subscribe();

    const remoteSignalChannel = supabase
      .channel("nexus-tv-remote-dashboard")
      .on("broadcast", { event: "TV_SIGNAL" }, ({ payload }) => {
        if (!payload || !payload.type) return;
        if (payload.type === "LLAMAR_PACIENTE") {
          const paciente = payload.payload as TurnoPaciente;
          setUltimoLlamado(paciente);
          setTurnos((prev) =>
            prev.map((t) => (t.id === paciente.id ? { ...t, estado: "llamado", consultorio: paciente.consultorio } : t))
          );
        } else if (payload.type === "FINALIZAR_CONSULTA" || payload.type === "CANCELAR_LLAMADO") {
          const { consultorio } = payload.payload || {};
          setUltimoLlamado((prev) => (prev?.consultorio === consultorio ? null : prev));
          setTurnos((prev) =>
            prev.map((t) => (t.consultorio === consultorio && t.estado === "llamado" ? { ...t, estado: "atendido" } : t))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(citasChannel);
      supabase.removeChannel(remoteSignalChannel);
    };
  }, [queryClient]);

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

  // Cargar y sincronizar citas de Supabase con la cola del llamador
  useEffect(() => {
    const savedData = getTurnosFromStorage();
    const savedTurnos = savedData.turnos || [];

    if (!citasDb || citasDb.length === 0) {
      if (turnos.length === 0 && savedTurnos.length > 0) {
        setTurnos(savedTurnos);
        const atendidosOLlamados = savedTurnos.filter(
          (t) => t.estado === "llamado" || t.estado === "atendido"
        );
        const enAtencion = savedTurnos.find((t) => t.estado === "llamado") || null;
        setUltimoLlamado(enAtencion || savedData.ultimoLlamado || null);
        setHistorialLlamados(atendidosOLlamados);
      }
      return;
    }

    const turnosMap = new Map<string, TurnoPaciente>();

    // 1. Cargar las citas de hoy de la base de datos
    citasDb.forEach((cita, index) => {
      const existing = savedTurnos.find((t) => t.id === cita.id || t.citaId === cita.id);
      
      const doc = doctoresDb?.find((d) => d.id === cita.doctor_id);
      const docIdx = doctoresDb ? doctoresDb.findIndex((d) => d.id === cita.doctor_id) : -1;
      const consId = docIdx >= 0 ? String(docIdx + 1) : (existing?.consultorio || "1");

      const turnoItem: TurnoPaciente = {
        id: cita.id,
        citaId: cita.id,
        nombre: cita.nombre || "Paciente",
        doctorNombre: doc?.nombre || existing?.doctorNombre || (offices[0]?.doctor || "Médico Especialista"),
        especialidad: doc?.especialidad || existing?.especialidad || "Medicina General",
        consultorio: consId,
        horaCita: cita.hora_cita ? cita.hora_cita.substring(0, 5) : (existing?.horaCita || "08:00"),
        estado: existing?.estado || (cita.estado === "atendida" ? "atendido" : cita.estado === "llamado" ? "llamado" : "en_espera"),
        timestampLlamada: existing?.timestampLlamada,
        ticketNumero: existing?.ticketNumero || `A-${(index + 1).toString().padStart(2, "0")}`,
        prioridad: existing?.prioridad || null,
      };

      turnosMap.set(cita.id, turnoItem);
    });

    // 2. Mantener turnos creados manualmente en el llamador
    savedTurnos.forEach((t) => {
      if (!t.citaId && !turnosMap.has(t.id)) {
        turnosMap.set(t.id, t);
      }
    });

    const mergedList = Array.from(turnosMap.values());
    setTurnos(mergedList);
    saveTurnosToStorage({
      turnos: mergedList,
      ultimoLlamado: savedData.ultimoLlamado,
    });

    const atendidosOLlamados = mergedList.filter(
      (t) => t.estado === "llamado" || t.estado === "atendido"
    );
    const enAtencion = mergedList.find((t) => t.estado === "llamado") || null;
    setUltimoLlamado(enAtencion || savedData.ultimoLlamado || null);
    setHistorialLlamados(atendidosOLlamados);
  }, [citasDb, doctoresDb, offices]);

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

  // LLAMAR SIGUIENTE PACIENTE EN UN CONSULTORIO ESPECÍFICO
  const handleCallInOffice = async (officeId: string) => {
    const office = offices.find((o) => o.id === officeId);

    // 1. Pacientes en espera asignados a este consultorio / doctor
    const officeWaiting = turnos.filter(
      (p) => p.estado === "en_espera" && (p.consultorio === officeId || p.doctorNombre === office?.doctor)
    );

    if (officeWaiting.length === 0) {
      toast.info(`No hay más pacientes en espera para ${office?.name} (${office?.doctor})`);
      return;
    }

    const target = officeWaiting[0];

    // 2. Si ya había un paciente adentro en este consultorio, finalizarlo automáticamente
    const pacienteAdentro = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    let nuevaLista = turnos;
    if (pacienteAdentro && pacienteAdentro.id !== target.id) {
      nuevaLista = nuevaLista.map((t) =>
        t.id === pacienteAdentro.id
          ? { ...t, estado: "atendido" as const, timestampAtendido: Date.now() }
          : t
      );
    }

    // 3. Pasar el nuevo paciente al estado "llamado"
    const pacienteActualizado: TurnoPaciente = {
      ...target,
      estado: "llamado",
      consultorio: officeId,
      doctorNombre: target.doctorNombre || office?.doctor,
      timestampLlamada: Date.now(),
    };

    nuevaLista = nuevaLista.map((t) => (t.id === target.id ? pacienteActualizado : t));
    updateTurnos(nuevaLista, pacienteActualizado);

    // Animación visual del TV
    setIsBlinking(true);

    // Emitir a la pantalla externa del TV
    emitLlamadoEvent(pacienteActualizado);

    // Reproducción ordenada por cola de audio
    if (soundEnabled) {
      queueSpeechCall(
        mediaSettings.chimeTone,
        pacienteActualizado.nombre,
        pacienteActualizado.doctorNombre,
        pacienteActualizado.consultorio ? `Consultorio ${pacienteActualizado.consultorio}` : undefined,
        pacienteActualizado.ticketNumero,
        "full",
        mediaSettings.selectedVoiceURI,
        mediaSettings.voiceRate,
        mediaSettings.voicePitch,
        mediaSettings.activePersonaId
      ).finally(() => {
        setIsBlinking(false);
      });
    } else {
      setTimeout(() => setIsBlinking(false), 4500);
    }

    toast.success(`📢 Llamando a: ${pacienteActualizado.nombre} a ${office?.name}`);
  };

  // LLAMAR PACIENTE ESPECÍFICO (DESDE FILA GENERAL)
  const handleCallSpecificPatient = async (patientId: string) => {
    const target = turnos.find((t) => t.id === patientId);
    if (!target) return;

    const officeId = target.consultorio || "1";
    const office = offices.find((o) => o.id === officeId);

    const pacienteAdentro = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    let nuevaLista = turnos;
    if (pacienteAdentro && pacienteAdentro.id !== target.id) {
      nuevaLista = nuevaLista.map((t) =>
        t.id === pacienteAdentro.id
          ? { ...t, estado: "atendido" as const, timestampAtendido: Date.now() }
          : t
      );
    }

    const pacienteActualizado: TurnoPaciente = {
      ...target,
      estado: "llamado",
      consultorio: officeId,
      doctorNombre: target.doctorNombre || office?.doctor,
      timestampLlamada: Date.now(),
    };

    nuevaLista = nuevaLista.map((t) => (t.id === target.id ? pacienteActualizado : t));
    updateTurnos(nuevaLista, pacienteActualizado);

    setIsBlinking(true);
    emitLlamadoEvent(pacienteActualizado);

    if (soundEnabled) {
      queueSpeechCall(
        mediaSettings.chimeTone,
        pacienteActualizado.nombre,
        pacienteActualizado.doctorNombre,
        pacienteActualizado.consultorio ? `Consultorio ${pacienteActualizado.consultorio}` : undefined,
        pacienteActualizado.ticketNumero,
        "full",
        mediaSettings.selectedVoiceURI,
        mediaSettings.voiceRate,
        mediaSettings.voicePitch,
        mediaSettings.activePersonaId
      ).finally(() => {
        setIsBlinking(false);
      });
    } else {
      setTimeout(() => setIsBlinking(false), 4500);
    }

    toast.success(`📢 Llamando a: ${pacienteActualizado.nombre} a ${office?.name || `Consultorio ${officeId}`}`);
  };

  // RE-LLAMAR
  const handleReCallOffice = async (officeId: string) => {
    const enAtencion = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    if (!enAtencion) return;

    setIsBlinking(true);
    emitLlamadoEvent(enAtencion);

    if (soundEnabled) {
      queueSpeechCall(
        mediaSettings.chimeTone,
        enAtencion.nombre,
        enAtencion.doctorNombre,
        enAtencion.consultorio ? `Consultorio ${enAtencion.consultorio}` : undefined,
        enAtencion.ticketNumero,
        "full",
        mediaSettings.selectedVoiceURI,
        mediaSettings.voiceRate,
        mediaSettings.voicePitch,
        mediaSettings.activePersonaId
      ).finally(() => {
        setIsBlinking(false);
      });
    } else {
      setTimeout(() => setIsBlinking(false), 4500);
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

  // CANCELAR / LIBERAR LLAMADO DE CONSULTORIO
  const handleCancelCall = (officeId: string) => {
    const cancelado = turnos.find((t) => t.estado === "llamado" && t.consultorio === officeId);
    if (!cancelado) return;

    // Regresar el paciente a la fila en espera
    const nuevaLista = turnos.map((t) =>
      t.id === cancelado.id ? { ...t, estado: "en_espera" as const, timestampLlamada: undefined } : t
    );

    const otroLlamado = nuevaLista.find((t) => t.estado === "llamado") || null;

    setTurnos(nuevaLista);
    setUltimoLlamado(otroLlamado);

    saveTurnosToStorage({
      turnos: nuevaLista,
      ultimoLlamado: otroLlamado,
    });

    emitCancelarLlamadoEvent(officeId);
    toast.info(`Llamado de ${cancelado.nombre} cancelado. Consultorio ${officeId} liberado.`);
  };

  // REINICIAR O VACIAR COLA COMPLETA
  const handleResetQueue = (mode: "clear" | "demo") => {
    if (mode === "clear") {
      const empty = clearTurnosQueue();
      setTurnos(empty.turnos);
      setUltimoLlamado(empty.ultimoLlamado);
      setHistorialLlamados([]);
      toast.success("Cola de llamados vaciada por completo (0 pacientes).");
    } else {
      const demo = resetToDemoTurnos();
      setTurnos(demo.turnos);
      setUltimoLlamado(demo.ultimoLlamado);
      setHistorialLlamados([]);
      toast.success("Turnos de prueba recargados exitosamente.");
    }
  };

  // LIMPIAR HISTORIAL DE PACIENTES ATENDIDOS
  const handleClearHistorial = () => {
    setHistorialLlamados([]);
    toast.success("Historial de pacientes atendidos limpiado.");
  };

  // ELIMINAR PACIENTE ESPECÍFICO DE LA FILA
  const handleDeleteTurno = (turnoId: string, nombrePaciente: string) => {
    const nuevaLista = turnos.filter((t) => t.id !== turnoId);
    const lastCall = ultimoLlamado?.id === turnoId ? null : ultimoLlamado;
    updateTurnos(nuevaLista, lastCall);
    toast.success(`Paciente ${nombrePaciente} eliminado de la cola.`);
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
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="size-3.5 text-slate-400" />
            <span className="hidden sm:inline">Panel</span>
          </a>

          <button
            onClick={() => setShowMetricsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <BarChart3 className="size-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Métricas del Día</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
          >
            <Settings className="size-3.5 text-sky-400" />
            <span>Configuración</span>
          </button>

          {/* BOTÓN INDISPENSABLE: OCULTAR/VER TV AQUÍ */}
          <button
            onClick={() => setShowSplitView(!showSplitView)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
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
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-3 sm:px-3.5 py-1.5 text-xs font-black tracking-wide text-white shadow-md hover:from-sky-500 hover:to-teal-500 active:scale-95 transition-all"
          >
            <Tv className="size-3.5" />
            <span className="hidden xs:inline">ABRIR MONITOR TV</span>
            <ExternalLink className="size-3 opacity-80" />
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 sm:px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider"
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Stethoscope className="size-3.5 text-sky-400" />
              <span>Médico / Consultorio:</span>
            </span>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOfficeFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedOfficeFilter === "all"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todos (Recepción)
              </button>
              {offices.map((off) => (
                <button
                  key={off.id}
                  type="button"
                  onClick={() => setSelectedOfficeFilter(off.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedOfficeFilter === off.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {off.name} ({off.doctor.split(" ")[0]} {off.doctor.split(" ")[1] || ""})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. CONTENIDO PRINCIPAL: SPLIT-SCREEN REAL (OPTIMIZADO PARA TABLET HORIZONTAL Y DESKTOP) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch min-h-0">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE CONSULTORIOS (6 cols si está split, 12 si está oculto) */}
        <div className={`${showSplitView ? "lg:col-span-6" : "lg:col-span-12"} space-y-4 flex flex-col`}>
          
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

                          <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-emerald-500/20 flex-wrap">
                            <button
                              onClick={() => handleReCallOffice(office.id)}
                              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-slate-200 hover:text-emerald-300 transition-all"
                            >
                              <RotateCcw className="size-3" />
                              <span>Re-llamar</span>
                            </button>
                            <button
                              onClick={() => handleCancelCall(office.id)}
                              className="flex items-center gap-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/50 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-rose-300 transition-all"
                              title="Cancelar llamado y liberar consultorio"
                            >
                              <X className="size-3" />
                              <span>Liberar</span>
                            </button>
                            <button
                              onClick={() => handleFinishConsultation(office.id)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white transition-all shadow-md ml-auto"
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
                        disabled={!nextInOffice}
                        onClick={() => handleCallInOffice(office.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 py-3 px-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-950/60 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Megaphone className="size-3.5 text-slate-950" />
                        <span className="truncate">
                          {nextInOffice
                            ? `LLAMAR A ${nextInOffice.nombre.toUpperCase()} (${nextInOffice.ticketNumero || "A-01"})`
                            : "SIN PACIENTES EN ESPERA"}
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
                                onClick={() => handleCallSpecificPatient(p.id)}
                                className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white transition-all shadow-sm"
                              >
                                Llamar
                              </button>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleDeleteTurno(p.id, p.nombre)}
                                className="shrink-0 flex items-center justify-center size-6 rounded-lg bg-slate-800 hover:bg-rose-600/30 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all"
                                title="Eliminar de la fila"
                              >
                                <Trash2 className="size-3" />
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

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCallSpecificPatient(p.id)}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-black text-slate-950 flex items-center gap-1"
                        >
                          <Megaphone className="size-3" /> Llamar
                        </button>
                        <button
                          onClick={() => handleDeleteTurno(p.id, p.nombre)}
                          className="size-8 rounded-xl bg-slate-800 hover:bg-rose-600/30 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all"
                          title="Eliminar de la fila"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
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

        {/* COLUMNA DERECHA: VISTA PREVIA DEL MONITOR DE TV (6 COLS EN PANTALLAS GRANDES Y TABLET HORIZONTAL) */}
        {showSplitView && (
          <div className="lg:col-span-6 flex flex-col bg-[#0a0e1a] rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden h-full">

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
                      className={`relative overflow-hidden rounded-2xl border-2 p-3.5 transition-all duration-500 ${
                        isBlinking
                          ? "animate-slow-call-blink border-emerald-300 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 ring-2 ring-emerald-300/60"
                          : "border-emerald-700/50 bg-emerald-950/40 shadow-lg"
                      }`}
                    >
                      <div className="text-[9px] font-black tracking-wider text-emerald-200 uppercase mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isBlinking ? (
                            <span className="size-2 rounded-full bg-emerald-300 animate-ping" />
                          ) : (
                            <span className="size-2 rounded-full bg-emerald-400" />
                          )}
                          <span>⭐ LLAMADO ACTUAL</span>
                        </div>
                        {isBlinking && (
                          <span className="text-[8px] font-extrabold bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/50 uppercase tracking-widest animate-pulse">
                            📢 LLAMANDO EN VIVO
                          </span>
                        )}
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
                      <ClinicMediaDisplay mediaSettings={mediaSettings} />
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

      {/* MODAL COMPLETO DE CONFIGURACIÓN DEL MONITOR TV, PUBLICIDAD, VOCES Y REINICIO DE TURNOS */}
      {showSettingsModal && (
        <MediaSettingsModal
          currentSettings={mediaSettings}
          onResetQueue={handleResetQueue}
          onClearHistorial={handleClearHistorial}
          onSave={(newSettings) => {
            const updated: typeof mediaSettings = {
              ...mediaSettings,
              ...newSettings,
            };
            saveMediaSettingsToStorage(updated);
            setMediaSettings(updated);
            if (newSettings.chimeTone) setSelectedChime(newSettings.chimeTone);
            if (broadcastChannel) {
              broadcastChannel.postMessage({ type: "UPDATE_MEDIA_SETTINGS", payload: updated });
            }
            toast.success("✅ Configuración guardada y aplicada.");
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

    </div>
  );
};

export default TurnosLlamador;
