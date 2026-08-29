// Store y Gestor de Turnos en Tiempo Real con BroadcastChannel (Nexus Clinic)

export interface TurnoPaciente {
  id: string;
  citaId?: string;
  nombre: string;
  doctorNombre?: string;
  especialidad?: string;
  consultorio?: string;
  horaCita?: string;
  estado: "en_espera" | "llamado" | "atendido" | "cancelado";
  timestampLlamada?: number;
  ticketNumero?: string;
  prioridad?: "preferencial" | "urgencia" | null;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

export function getYouTubeEmbedUrl(url?: string): string {
  const videoId = url ? extractYouTubeId(url) : null;
  if (!videoId) return "";
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&playsinline=1&enablejsapi=1`;
}

export type MediaContentType = "youtube" | "video_mp4" | "banner_slideshow";
export type ChimeToneType = "dingdong" | "double_bell" | "synth_chord" | "urgent_pulse";
export type ClinicThemeColor = "blue" | "emerald" | "purple" | "slate";

export type AdBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  sponsorName?: string;
};

export type VideoPreset = {
  id: string;
  name: string;
  url: string;
};

export type CommercialVideoItem = {
  id: string;
  title: string;
  url: string;
  type: "file" | "youtube";
  durationSeconds?: number;
  sponsorName?: string;
};

export type ClinicMediaSettings = {
  clinicName: string;
  clinicLogo?: string;
  themeColor?: ClinicThemeColor;
  chimeTone?: ChimeToneType;
  mediaEnabled: boolean;
  mediaType: MediaContentType;
  youtubeUrl: string;
  directVideoUrl: string;
  videoPresets?: VideoPreset[];
  videoPlaylist?: CommercialVideoItem[];
  adBanners: AdBanner[];
  slideDurationSeconds: number;
  infoBoxTitle: string;
  infoBoxItems: string[];
  selectedVoiceURI: string;
  voiceRate: number;
  voicePitch: number;
  activePersonaId?: string;
};

export const DEFAULT_AD_BANNERS: AdBanner[] = [
  {
    id: "banner-1",
    title: "Jornada de Vacunación e Inmunización",
    subtitle: "Protege a tu familia con esquemas completos de vacunación.",
    imageUrl:
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80",
    sponsorName: "Laboratorios Farmacéuticos",
  },
  {
    id: "banner-2",
    title: "Chequeo Médico y Exámenes de Laboratorio",
    subtitle: "Resultados en línea y pruebas de sangre con entrega en 24 horas.",
    imageUrl:
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop&q=80",
    sponsorName: "Red Médica y Diagnóstico",
  },
  {
    id: "banner-3",
    title: "Salud Cardiovascular y Control Preventivo",
    subtitle: "Monitoreo regular de presión arterial y consultas con especialistas.",
    imageUrl:
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=1200&auto=format&fit=crop&q=80",
    sponsorName: "Alianza de Especialistas",
  },
];

export const DEFAULT_VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "preset-1",
    name: "🇨🇷 Playas y Naturaleza de Costa Rica 4K",
    url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
  },
  {
    id: "preset-2",
    name: "🌿 Naturaleza y Fauna Tropical 4K",
    url: "https://www.youtube.com/watch?v=wTcA4b3U7-o",
  },
  {
    id: "preset-3",
    name: "🌊 Arrecife y Océano Relajante 4K",
    url: "https://www.youtube.com/watch?v=EngW7tLk6R8",
  },
  {
    id: "preset-4",
    name: "☕ Café y Música Instrumental",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  },
];

export const DEFAULT_VIDEO_PLAYLIST: CommercialVideoItem[] = [
  {
    id: "video-1",
    title: "Anuncio Bisolvon Antitusivo (Sanofi)",
    url: "https://www.youtube.com/watch?v=WB5UuVtH_EQ",
    type: "youtube",
    durationSeconds: 22,
    sponsorName: "Sanofi",
  },
  {
    id: "video-2",
    title: "Naturaleza y Playas de Costa Rica 4K",
    url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
    type: "youtube",
    durationSeconds: 60,
    sponsorName: "Clínica de la Salud",
  },
];

export const DEFAULT_MEDIA_SETTINGS: ClinicMediaSettings = {
  clinicName: "CLÍNICA DE LA SALUD",
  clinicLogo: "",
  themeColor: "blue",
  chimeTone: "dingdong",
  mediaEnabled: true,
  mediaType: "youtube",
  youtubeUrl: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
  directVideoUrl:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  videoPresets: DEFAULT_VIDEO_PRESETS,
  videoPlaylist: DEFAULT_VIDEO_PLAYLIST,
  adBanners: DEFAULT_AD_BANNERS,
  slideDurationSeconds: 12,
  infoBoxTitle: "INFORMACIÓN IMPORTANTE PARA PACIENTES",
  infoBoxItems: [
    "Por favor permanezca en la sala hasta escuchar el llamado de su turno.",
    "Tenga listo su documento de identidad oficial al ingresar a consulta.",
    "Si requiere asistencia especial o silla de ruedas, solicítela en recepción.",
  ],
  selectedVoiceURI: "",
  voiceRate: 0.86,
  voicePitch: 1.0,
  activePersonaId: "female-valeria",
};

const STORAGE_KEY = "nexus_turnos_queue";
const MEDIA_SETTINGS_STORAGE_KEY = "nexus_clinic_media_settings";
const CHANNEL_NAME = "nexus_clinic_tv_channel";

export function getMediaSettingsFromStorage(): ClinicMediaSettings {
  if (typeof window === "undefined") return DEFAULT_MEDIA_SETTINGS;
  try {
    const raw = localStorage.getItem(MEDIA_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_MEDIA_SETTINGS;
    return { ...DEFAULT_MEDIA_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_MEDIA_SETTINGS;
  }
}

export function saveMediaSettingsToStorage(settings: ClinicMediaSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEDIA_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Error guardando configuración de medios:", e);
  }
}

export const broadcastChannel = typeof window !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

export const DEMO_TURNOS: TurnoPaciente[] = [
  { id: "1", nombre: "Jessica Jiménez Mora", doctorNombre: "Dr. Roberto Chaverri", especialidad: "Medicina General", consultorio: "1", horaCita: "08:30", estado: "en_espera", ticketNumero: "A-01", prioridad: null },
  { id: "2", nombre: "Mauricio Valle Arguedas", doctorNombre: "Dr. Roberto Chaverri", especialidad: "Medicina General", consultorio: "1", horaCita: "08:45", estado: "en_espera", ticketNumero: "A-04", prioridad: null },
  { id: "3", nombre: "Johnny Pérez Morales", doctorNombre: "Dra. Sofía Huertas", especialidad: "Pediatría", consultorio: "2", horaCita: "09:00", estado: "en_espera", ticketNumero: "P-02", prioridad: "preferencial" },
  { id: "4", nombre: "Gabriel Céspedes Ruiz", doctorNombre: "Dra. Sofía Huertas", especialidad: "Pediatría", consultorio: "2", horaCita: "09:15", estado: "en_espera", ticketNumero: "P-05", prioridad: "preferencial" },
  { id: "5", nombre: "Mayra Figueroa Castillo", doctorNombre: "Dra. Carmen Figueroa", especialidad: "Ginecología", consultorio: "3", horaCita: "09:30", estado: "en_espera", ticketNumero: "U-03", prioridad: "urgencia" },
  { id: "6", nombre: "Karla Vargas Solís", doctorNombre: "Dra. Carmen Figueroa", especialidad: "Ginecología", consultorio: "3", horaCita: "09:45", estado: "en_espera", ticketNumero: "A-06", prioridad: null },
  { id: "7", nombre: "Esteban Mora Chaves", doctorNombre: "Dr. Andrés Salazar", especialidad: "Odontología", consultorio: "4", horaCita: "10:00", estado: "en_espera", ticketNumero: "A-07", prioridad: null },
];

export function getTurnosFromStorage(): { turnos: TurnoPaciente[]; ultimoLlamado: TurnoPaciente | null } {
  if (typeof window === "undefined") return { turnos: [], ultimoLlamado: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ turnos: DEMO_TURNOS, ultimoLlamado: null }));
      return { turnos: DEMO_TURNOS, ultimoLlamado: null };
    }
    return JSON.parse(raw);
  } catch (e) {
    return { turnos: [], ultimoLlamado: null };
  }
}

export function saveTurnosToStorage(data: { turnos: TurnoPaciente[]; ultimoLlamado: TurnoPaciente | null }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Error guardando turnos", e);
  }
}

import { supabase } from "@/integrations/supabase/client";

export const tvRealtimeChannel = supabase.channel("nexus-tv-remote");
tvRealtimeChannel.subscribe();

export function sendTvSignal(type: string, payload: any) {
  const messageData = { type, payload, timestamp: Date.now() };

  // 1. Canal local del navegador (mismo equipo)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(messageData);
    } catch (e) {
      console.warn("Error en broadcastChannel local:", e);
    }
  }

  // 2. Canal Supabase Realtime por Internet (Celular, Tablet, Smart TV remota)
  try {
    tvRealtimeChannel.send({
      type: "broadcast",
      event: "TV_SIGNAL",
      payload: messageData,
    });
  } catch (e) {
    console.warn("Error enviando señal realtime al TV:", e);
  }
}

export function clearTurnosQueue(): { turnos: TurnoPaciente[]; ultimoLlamado: TurnoPaciente | null } {
  const emptyState = { turnos: [], ultimoLlamado: null };
  saveTurnosToStorage(emptyState);
  sendTvSignal("CLEAR_QUEUE", {});
  return emptyState;
}

export function resetToDemoTurnos(): { turnos: TurnoPaciente[]; ultimoLlamado: TurnoPaciente | null } {
  const demoState = { turnos: DEMO_TURNOS, ultimoLlamado: null };
  saveTurnosToStorage(demoState);
  sendTvSignal("RESET_QUEUE", demoState);
  return demoState;
}

export function emitLlamadoEvent(paciente: TurnoPaciente) {
  sendTvSignal("LLAMAR_PACIENTE", paciente);
}

export function emitFinalizarEvent(officeId: string) {
  sendTvSignal("FINALIZAR_CONSULTA", { consultorio: officeId });
}

export function emitCancelarLlamadoEvent(officeId: string) {
  sendTvSignal("CANCELAR_LLAMADO", { consultorio: officeId });
}

export function emitUpdateMarquee(text: string) {
  sendTvSignal("UPDATE_MARQUEE", text);
}

export function emitUpdateMediaSettings(settings: Partial<ClinicMediaSettings>) {
  sendTvSignal("UPDATE_MEDIA_SETTINGS", settings);
}
