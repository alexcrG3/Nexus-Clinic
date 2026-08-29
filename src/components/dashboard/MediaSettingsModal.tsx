import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Tv,
  Volume2,
  CheckCircle2,
  Plus,
  Trash2,
  Youtube,
  Play,
  Image as ImageIcon,
  Film,
  Eye,
  EyeOff,
  Upload,
  FolderVideo,
  Sparkles,
  ArrowRight,
  FileVideo,
} from "lucide-react";
import {
  type ClinicMediaSettings,
  type MediaContentType,
  type AdBanner,
  type VideoPreset,
  type CommercialVideoItem,
  type ChimeToneType,
  type ClinicThemeColor,
  DEFAULT_AD_BANNERS,
  DEFAULT_VIDEO_PRESETS,
  DEFAULT_VIDEO_PLAYLIST,
} from "@/lib/queueStore";
import {
  getAvailableVoices,
  playDingDong,
  playChime,
  CHIME_TONE_OPTIONS,
  speakPatientCall,
  type VoiceMode,
} from "@/lib/soundService";
import { CLINIC_VOICE_PERSONAS, type VoicePersona, isFemaleVoice } from "@/lib/voicePersonas";
import { saveLocalVideo, getLocalVideoBlob } from "@/lib/mediaStorage";

interface MediaSettingsModalProps {
  currentSettings: ClinicMediaSettings;
  voiceMode?: VoiceMode;
  onSave: (settings: Partial<ClinicMediaSettings>) => void;
  onClose: () => void;
}

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
}

export function MediaSettingsModal({
  currentSettings,
  voiceMode = "full",
  onSave,
  onClose,
}: MediaSettingsModalProps) {
  const [clinicName, setClinicName] = useState(currentSettings.clinicName);
  const [mediaEnabled, setMediaEnabled] = useState(currentSettings.mediaEnabled ?? true);
  const [mediaType, setMediaType] = useState<MediaContentType>(
    currentSettings.mediaType || "youtube",
  );
  const [youtubeUrl, setYoutubeUrl] = useState(currentSettings.youtubeUrl);
  const [videoPresets, setVideoPresets] = useState<VideoPreset[]>(
    currentSettings.videoPresets && currentSettings.videoPresets.length > 0
      ? currentSettings.videoPresets
      : DEFAULT_VIDEO_PRESETS,
  );
  const [showAddPresetForm, setShowAddPresetForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetUrl, setNewPresetUrl] = useState("");
  const [videoPlaylist, setVideoPlaylist] = useState<CommercialVideoItem[]>(
    currentSettings.videoPlaylist && currentSettings.videoPlaylist.length > 0
      ? currentSettings.videoPlaylist
      : DEFAULT_VIDEO_PLAYLIST,
  );
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoSponsor, setNewVideoSponsor] = useState("");
  const [newVideoDuration, setNewVideoDuration] = useState(25);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>("");

  const [clinicLogo, setClinicLogo] = useState(currentSettings.clinicLogo || "");
  const [themeColor, setThemeColor] = useState<ClinicThemeColor>(currentSettings.themeColor || "blue");
  const [chimeTone, setChimeTone] = useState<ChimeToneType>(currentSettings.chimeTone || "dingdong");

  const [directVideoUrl, setDirectVideoUrl] = useState(currentSettings.directVideoUrl || "");
  const [adBanners, setAdBanners] = useState<AdBanner[]>(
    currentSettings.adBanners && currentSettings.adBanners.length > 0
      ? currentSettings.adBanners
      : DEFAULT_AD_BANNERS,
  );
  const [slideDurationSeconds, setSlideDurationSeconds] = useState(
    currentSettings.slideDurationSeconds || 12,
  );

  // Estados para subida de video local y afiches
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerImageFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleLogoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setClinicLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentPreviewVideo = videoPlaylist[activePreviewIndex % (videoPlaylist.length || 1)];

  useEffect(() => {
    let active = true;
    if (currentPreviewVideo?.url?.startsWith("indexeddb://")) {
      const key = currentPreviewVideo.url.replace("indexeddb://", "");
      getLocalVideoBlob(key).then((blob) => {
        if (blob && active) {
          setPreviewBlobUrl(URL.createObjectURL(blob));
        }
      });
    } else {
      setPreviewBlobUrl("");
    }
    return () => {
      active = false;
    };
  }, [currentPreviewVideo?.url]);

  const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingVideo(true);
    try {
      const newItems: CommercialVideoItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const videoKey = `video_${Date.now()}_${i}`;
        await saveLocalVideo(file, videoKey);
        newItems.push({
          id: `video-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          url: `indexeddb://${videoKey}`,
          type: "file",
          durationSeconds: 30,
          sponsorName: "Local PC",
        });
      }
      setVideoPlaylist((prev) => [...prev, ...newItems]);
      setActivePreviewIndex(videoPlaylist.length);
    } catch (err) {
      console.error("Error saving video:", err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerImageUrl, setNewBannerImageUrl] = useState("");
  const [newBannerSponsor, setNewBannerSponsor] = useState("");

  const handleBannerImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewBannerImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const [infoBoxTitle, setInfoBoxTitle] = useState(currentSettings.infoBoxTitle);
  const [infoBoxItems, setInfoBoxItems] = useState<string[]>(currentSettings.infoBoxItems || []);
  const [newItemText, setNewItemText] = useState("");

  const [selectedVoiceURI, setSelectedVoiceURI] = useState(currentSettings.selectedVoiceURI || "");
  const [voiceRate, setVoiceRate] = useState(currentSettings.voiceRate || 0.86);
  const [voicePitch, setVoicePitch] = useState(currentSettings.voicePitch || 1.0);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const available = getAvailableVoices();
      setVoices(available);
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestSelectedVoice = (
    overrideVoiceURI = selectedVoiceURI,
    overrideRate = voiceRate,
    overridePitch = voicePitch,
  ) => {
    playDingDong();
    setTimeout(() => {
      speakPatientCall(
        "Jessica Jiménez",
        "Dra. Carmen Figueroa",
        "Consultorio 3",
        "A-01",
        voiceMode,
        overrideVoiceURI,
        overrideRate,
        overridePitch,
      );
    }, 850);
  };

  const getGenderedEsVoices = () => {
    const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
    const femaleEsVoices = esVoices.filter((v) => isFemaleVoice(v.name));
    const maleEsVoices = esVoices.filter((v) => !isFemaleVoice(v.name));
    return { esVoices, femaleEsVoices, maleEsVoices };
  };

  const FEMALE_PERSONA_IDS = ["female-valeria", "female-mariana", "female-sofia"];
  const MALE_PERSONA_IDS = ["male-alejandro", "male-carlos", "male-gabriel"];

  const getPersonaVoice = (persona: VoicePersona): SpeechSynthesisVoice | undefined => {
    const { esVoices, femaleEsVoices, maleEsVoices } = getGenderedEsVoices();

    if (persona.gender === "female") {
      if (femaleEsVoices.length === 0) return esVoices[0];
      for (const pref of persona.preferredVoices) {
        const found = femaleEsVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
        if (found) return found;
      }
      const idx = FEMALE_PERSONA_IDS.indexOf(persona.id);
      return femaleEsVoices[idx % femaleEsVoices.length];
    } else {
      if (maleEsVoices.length === 0) return esVoices[0];
      for (const pref of persona.preferredVoices) {
        const found = maleEsVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
        if (found) return found;
      }
      const idx = MALE_PERSONA_IDS.indexOf(persona.id);
      return maleEsVoices[idx % maleEsVoices.length];
    }
  };

  const handleSelectPersona = (persona: VoicePersona) => {
    setActivePersonaId(persona.id);
    setVoicePitch(persona.pitch);
    setVoiceRate(persona.rate);

    const voice = getPersonaVoice(persona);
    const matchedURI = voice ? voice.voiceURI : "";

    if (matchedURI) setSelectedVoiceURI(matchedURI);
    handleTestSelectedVoice(matchedURI, persona.rate, persona.pitch);
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim() || !newPresetUrl.trim()) return;
    const newPreset: VideoPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      url: newPresetUrl.trim(),
    };
    const updated = [...videoPresets, newPreset];
    setVideoPresets(updated);
    setYoutubeUrl(newPresetUrl.trim());
    setNewPresetName("");
    setNewPresetUrl("");
    setShowAddPresetForm(false);
  };

  const handleRemovePreset = (id: string) => {
    setVideoPresets(videoPresets.filter((p) => p.id !== id));
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setInfoBoxItems([...infoBoxItems, newItemText.trim()]);
    setNewItemText("");
  };

  const handleRemoveItem = (index: number) => {
    setInfoBoxItems(infoBoxItems.filter((_, i) => i !== index));
  };

  const handleAddBanner = () => {
    if (!newBannerTitle.trim() || !newBannerImageUrl.trim()) return;
    const newBanner: AdBanner = {
      id: `banner-${Date.now()}`,
      title: newBannerTitle.trim(),
      subtitle: newBannerSubtitle.trim() || undefined,
      imageUrl: newBannerImageUrl.trim(),
      sponsorName: newBannerSponsor.trim() || undefined,
    };
    setAdBanners([...adBanners, newBanner]);
    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setNewBannerImageUrl("");
    setNewBannerSponsor("");
  };

  const handleRemoveBanner = (id: string) => {
    setAdBanners(adBanners.filter((b) => b.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      clinicName: clinicName.trim() || "NOVA DENTAL",
      clinicLogo,
      themeColor,
      chimeTone,
      mediaEnabled,
      mediaType,
      youtubeUrl: youtubeUrl.trim(),
      directVideoUrl: directVideoUrl.trim(),
      videoPresets,
      videoPlaylist,
      adBanners,
      slideDurationSeconds,
      infoBoxTitle: infoBoxTitle.trim() || "INFORMACIÓN PARA PACIENTES",
      infoBoxItems,
      selectedVoiceURI,
      voiceRate,
      voicePitch,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-sky-500/30 bg-slate-900 shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 shadow-md">
              <Settings className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wide">
                Configuración del Monitor de TV, Publicidad y Voces
              </h2>
              <p className="text-xs text-slate-400">
                Administra comerciales de farmacéuticas, videos, locutores y avisos en vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECCIÓN 0: IDENTIDAD, LOGOTIPO Y MARCA BLANCA */}
          <div className="rounded-3xl border border-indigo-500/30 bg-slate-950/70 p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="size-4" />
                  <span>Identidad de la Clínica, Logotipo y Tema Visual</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personaliza el nombre, logo oficial y los colores corporativos para el monitor y la recepción
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Nombre de la clínica */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre Oficial de la Clínica o Centro Médico:
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="ej. NOVA DENTAL"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Subida de Logotipo */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Logotipo de la Clínica:
                </label>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileSelected}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  {clinicLogo ? (
                    <div className="relative size-10 rounded-xl border border-indigo-500/50 bg-white p-1 shrink-0">
                      <img
                        src={clinicLogo}
                        alt="Logo"
                        className="size-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setClinicLogo("")}
                        title="Quitar logotipo"
                        className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900 text-slate-500 text-xs shrink-0">
                      Sin Logo
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Upload className="size-3.5" />
                    {clinicLogo ? "Cambiar Logotipo" : "Subir Logotipo desde PC"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: CONTROL DE PUBLICIDAD Y MULTIMEDIA EN LA TV */}
          <div className="rounded-3xl border border-sky-500/40 bg-slate-950/70 p-5 space-y-5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-sky-400 uppercase tracking-wider">
                  <Film className="size-4" />
                  <span>Publicidad y Contenido Multimedia en TV</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Muestra comerciales de farmacéuticas, videos de YouTube o carrusel de afiches
                </p>
              </div>

              {/* Interruptor Activar / Desactivar */}
              <button
                type="button"
                onClick={() => setMediaEnabled(!mediaEnabled)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                  mediaEnabled
                    ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300 shadow-lg shadow-emerald-950/50"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {mediaEnabled ? (
                  <>
                    <Eye className="size-4 text-emerald-400" />
                    <span>PUBLICIDAD: ACTIVADA</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="size-4 text-slate-400" />
                    <span>PUBLICIDAD: DESACTIVADA</span>
                  </>
                )}
              </button>
            </div>

            {mediaEnabled && (
              <div className="space-y-4 pt-1">
                {/* Selector de Modo Multimedia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMediaType("youtube")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
                      mediaType === "youtube"
                        ? "border-rose-500 bg-rose-950/30 ring-2 ring-rose-500/40 shadow-lg"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <Youtube className="size-5 text-rose-500 mb-1" />
                    <span className="text-xs font-black text-white">Videos de YouTube</span>
                    <span className="text-[10px] text-slate-400">Canales o videos en vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaType("video_mp4")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
                      mediaType === "video_mp4"
                        ? "border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/40 shadow-lg"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <Film className="size-5 text-sky-400 mb-1" />
                    <span className="text-xs font-black text-white">Comerciales Locales (MP4)</span>
                    <span className="text-[10px] text-slate-400">Desde tu computadora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaType("banner_slideshow")}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all ${
                      mediaType === "banner_slideshow"
                        ? "border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/40 shadow-lg"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <ImageIcon className="size-5 text-emerald-400 mb-1" />
                    <span className="text-xs font-black text-white">Afiches de Laboratorios</span>
                    <span className="text-[10px] text-slate-400">Carrusel rotativo</span>
                  </button>
                </div>

                {/* 1. MODO YOUTUBE */}
                {mediaType === "youtube" && (
                  <div className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-5 space-y-4 shadow-lg">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Enlace de YouTube Activo:
                      </label>
                      <input
                        type="text"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="ej. https://www.youtube.com/watch?v=..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Presets Guardados */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Youtube className="size-4 text-rose-500" />
                          Botones Rápidos Guardados ({videoPresets.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddPresetForm(!showAddPresetForm)}
                          className="flex items-center gap-1 rounded-xl bg-rose-600/20 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-600/40 transition-all"
                        >
                          <Plus className="size-3.5" />
                          {showAddPresetForm ? "Cancelar" : "➕ Crear Nuevo Botón"}
                        </button>
                      </div>

                      {showAddPresetForm && (
                        <div className="rounded-2xl border border-rose-500/40 bg-slate-950 p-3.5 space-y-2 animate-in fade-in">
                          <span className="text-[11px] font-bold text-rose-400 block">
                            Guardar Nuevo Botón de Video Personalizado:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Nombre (ej. 💊 Spot Farmacia)"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="URL de YouTube (https://www.youtube.com/...)"
                              value={newPresetUrl}
                              onChange={(e) => setNewPresetUrl(e.target.value)}
                              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-rose-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleAddPreset}
                              className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 active:scale-95 transition-all shadow"
                            >
                              + Guardar Botón
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {videoPresets.map((preset) => (
                          <div
                            key={preset.id}
                            className={`group flex items-center rounded-xl border transition-all ${
                              youtubeUrl === preset.url
                                ? "border-rose-500 bg-rose-950/40 text-rose-200 ring-2 ring-rose-500/30"
                                : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:text-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setYoutubeUrl(preset.url)}
                              className="px-3 py-1.5 text-xs font-bold"
                            >
                              {preset.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePreset(preset.id);
                              }}
                              title="Eliminar"
                              className="px-1.5 py-1.5 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MODO VIDEO MP4 LOCAL */}
                {mediaType === "video_mp4" && (
                  <div className="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5 space-y-4 shadow-lg">
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      multiple
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoFileSelected}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-white block">Lista de Videos Locales</span>
                        <p className="text-[11px] text-slate-400">Sube videos desde tu computador para rotarlos en la TV</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={isUploadingVideo}
                        className="flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-all shadow"
                      >
                        <Upload className="size-4" />
                        {isUploadingVideo ? "Subiendo..." : "Subir Video Local (.mp4)"}
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                      {videoPlaylist.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Film className="size-4 text-sky-400 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{item.title}</span>
                              <span className="text-[10px] text-slate-400">Duración: {item.durationSeconds || 30}s · {item.sponsorName || "Local"}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideoPlaylist(videoPlaylist.filter((v) => v.id !== item.id))}
                            className="p-1 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MODO AFICHES / CARRUSEL */}
                {mediaType === "banner_slideshow" && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Afiches de Laboratorios y Farmacias</span>
                      <span className="text-[11px] text-slate-400">Duración por afiche: {slideDurationSeconds} seg</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {adBanners.map((banner) => (
                        <div
                          key={banner.id}
                          className="relative rounded-2xl border border-slate-800 bg-slate-950 p-2 overflow-hidden shadow"
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-28 w-full object-cover rounded-xl mb-2"
                          />
                          <h5 className="font-bold text-xs text-white truncate">{banner.title}</h5>
                          <p className="text-[10px] text-slate-400 truncate">{banner.sponsorName || "Laboratorio"}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(banner.id)}
                            className="absolute top-3 right-3 rounded-lg bg-black/60 p-1 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: VOCES VIRTUALES IA Y CAMPANADA */}
          <div className="rounded-3xl border border-emerald-500/40 bg-slate-950/70 p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-emerald-400 uppercase tracking-wider">
                  <Volume2 className="size-4" />
                  <span>Locutores Virtuales IA y Campanada de Llamado</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Elige la personalidad del locutor médico y el tipo de campanada
                </p>
              </div>
            </div>

            {/* Tipo de Campanada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tipo de Campanada (Chime de Atención):
                </label>
                <select
                  value={chimeTone}
                  onChange={(e) => setChimeTone(e.target.value as ChimeToneType)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {CHIME_TONE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => playChime(chimeTone)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 text-xs font-bold text-slate-200 transition-all"
                >
                  <Volume2 className="size-4 text-emerald-400" />
                  Probar Campanada Seleccionada
                </button>
              </div>
            </div>

            {/* 6 Locutores Virtuales IA */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Catálogo de Locutores Médicos IA:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {CLINIC_VOICE_PERSONAS.map((persona) => {
                  const isSelected = activePersonaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona)}
                      className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-lg"
                          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{persona.title}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                          {persona.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-sky-400 font-semibold mb-1">{persona.role}</span>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{persona.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 px-6 py-2 text-xs font-black text-slate-950 hover:brightness-110 active:scale-95 shadow-md uppercase tracking-wider"
          >
            <CheckCircle2 className="size-4" />
            Guardar Toda la Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
