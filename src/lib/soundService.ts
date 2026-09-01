let cachedAudioCtx: AudioContext | null = null;

export type VoiceMode = "full" | "office_only" | "doctor_only";
export type ChimeToneType = "dingdong" | "double_bell" | "synth_chord" | "urgent_pulse";

export const CHIME_TONE_OPTIONS: { id: ChimeToneType; name: string; description: string }[] = [
  { id: "dingdong", name: "🔔 Ding Dong Clásico", description: "Tono estándar hospitalario (2 notas)" },
  { id: "double_bell", name: "🎶 Doble Campana Armónica", description: "Campanadas celestiales cristalinas (3 notas)" },
  { id: "synth_chord", name: "✨ Acorde Suave Sintetizador", description: "Tríada mayor cálida y relajante para sala médica" },
  { id: "urgent_pulse", name: "🚨 Pulso de Atención / Urgencia", description: "Doble tono agudo para prioridad médica" },
];

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!cachedAudioCtx || cachedAudioCtx.state === "closed") {
      cachedAudioCtx = new AudioCtxClass();
    }
    if (cachedAudioCtx.state === "suspended") {
      cachedAudioCtx.resume().catch(() => {});
    }
    return cachedAudioCtx;
  } catch (e) {
    console.warn("AudioContext not accessible", e);
    return null;
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function playDingDong() {
  playChime("dingdong");
}

export function playChime(tone: ChimeToneType = "dingdong") {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (tone === "double_bell") {
      const notes = [
        { f: 880.0, t: 0, d: 0.55 },
        { f: 1174.66, t: 0.22, d: 0.75 },
        { f: 1318.51, t: 0.44, d: 0.85 },
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + t);

        const start = ctx.currentTime + t;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + d);

        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + d + 0.05);
      });
      return;
    }

    if (tone === "synth_chord") {
      const triad = [
        { f: 523.25, t: 0, d: 0.9 },
        { f: 659.25, t: 0.08, d: 0.9 },
        { f: 783.99, t: 0.16, d: 1.1 },
      ];
      triad.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, ctx.currentTime + t);

        const start = ctx.currentTime + t;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.28, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + d);

        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + d + 0.05);
      });
      return;
    }

    if (tone === "urgent_pulse") {
      const beeps = [
        { f: 880, t: 0, d: 0.15 },
        { f: 880, t: 0.18, d: 0.15 },
        { f: 1046.5, t: 0.38, d: 0.35 },
      ];
      beeps.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(f, ctx.currentTime + t);

        const start = ctx.currentTime + t;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + d);

        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + d + 0.05);
      });
      return;
    }

    // Default Ding Dong
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.38, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.75);

    const t2 = now + 0.32;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(440.0, t2);
    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.exponentialRampToValueAtTime(0.42, t2 + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 1.1);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 1.15);
  } catch (e) {
    console.warn("Error playing chime:", e);
  }
}

export function formatDoctorNameSpanish(rawDoctor: string): string {
  if (!rawDoctor) return "";
  let cleaned = rawDoctor.trim();
  cleaned = cleaned.replace(/\b(Dra|Dra\.)\s+/gi, "la doctora ");
  cleaned = cleaned.replace(/\b(Dr|Dr\.)\s+/gi, "el doctor ");
  return cleaned.trim();
}

export function formatOfficeNameSpanish(rawOffice: string): string {
  if (!rawOffice) return "";
  const office = rawOffice.replace(/\s*\([^)]*\)/g, "").trim();
  if (/^(consultorio|laboratorio|módulo|quirofano)/i.test(office)) {
    return `al ${office}`;
  }
  return `a ${office}`;
}

export function formatTicketCodeSpanish(ticketCode?: string): string {
  if (!ticketCode) return "";
  const parts = ticketCode.split("-");
  if (parts.length === 2) {
    const letter = parts[0];
    const num = parts[1];
    return `Turno ${letter}, ${num}. `;
  }
  return `Turno ${ticketCode}. `;
}

export function buildCallSpeechPhrase(
  patientName: string,
  doctorName?: string,
  officeName?: string,
  ticketCode?: string,
  mode: VoiceMode = "full"
): string {
  const ticketPhrase = formatTicketCodeSpanish(ticketCode);
  const spokenDoctor = formatDoctorNameSpanish(doctorName || "");
  const spokenOffice = formatOfficeNameSpanish(officeName || "");

  if (mode === "office_only" && spokenOffice) {
    return `${ticketPhrase}Paciente ${patientName}, por favor pasar ${spokenOffice}.`;
  }
  if (mode === "doctor_only" && spokenDoctor) {
    return `${ticketPhrase}Paciente ${patientName}, por favor pasar con ${spokenDoctor}.`;
  }
  if (spokenOffice && spokenDoctor) {
    return `${ticketPhrase}Paciente ${patientName}, por favor pasar ${spokenOffice} con ${spokenDoctor}.`;
  } else if (spokenDoctor) {
    return `${ticketPhrase}Paciente ${patientName}, por favor pasar con ${spokenDoctor}.`;
  } else if (spokenOffice) {
    return `${ticketPhrase}Paciente ${patientName}, por favor pasar ${spokenOffice}.`;
  }
  return `${ticketPhrase}Paciente ${patientName}, por favor pasar a consulta médica.`;
}

import { resolveVoiceForPersona, isFemaleVoice, CLINIC_VOICE_PERSONAS } from "./voicePersonas";
import { getMediaSettingsFromStorage } from "./queueStore";

export function getLoadedVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices && currentVoices.length > 0) {
      resolve(currentVoices);
      return;
    }

    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        const v = window.speechSynthesis.getVoices();
        resolve(v || []);
      }
    };

    window.speechSynthesis.onvoiceschanged = finish;
    setTimeout(finish, 350);
  });
}

export function speakPatientCall(
  patientName: string,
  doctorName?: string,
  officeName?: string,
  ticketCode?: string,
  mode: VoiceMode = "full",
  selectedVoiceURI?: string,
  rate = 0.88,
  pitch = 1.25,
  activePersonaId = "female-valeria"
) {
  speakPatientCallAsync(patientName, doctorName, officeName, ticketCode, mode, selectedVoiceURI, rate, pitch, activePersonaId);
}

export async function speakPatientCallAsync(
  patientName: string,
  doctorName?: string,
  officeName?: string,
  ticketCode?: string,
  mode: VoiceMode = "full",
  selectedVoiceURI?: string,
  rate?: number,
  pitch?: number,
  activePersonaId?: string
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // 1. ESPERAR A QUE LAS VOCES ESTÉN TOTALMENTE DISPONIBLES TRAS RECARGAR LA PÁGINA
    const voices = await getLoadedVoicesAsync();

    // 2. RECUPERAR VALORES PERSISTIDOS DE STORAGE PARA NUNCA REVERTIR A VOZ POR DEFECTO
    const saved = getMediaSettingsFromStorage();
    const effectivePersonaId = activePersonaId || saved.activePersonaId || "female-valeria";
    const effectiveVoiceURI = selectedVoiceURI || saved.selectedVoiceURI;
    let finalRate = rate ?? saved.voiceRate ?? 0.88;
    let finalPitch = pitch ?? saved.voicePitch ?? 1.25;

    let chosenVoice: SpeechSynthesisVoice | undefined;

    // 3. RESOLVER VOZ SEGÚN LA PERSONA SELECCIONADA
    if (effectivePersonaId && voices.length > 0) {
      const resolved = resolveVoiceForPersona(effectivePersonaId, voices);
      if (resolved.voice) {
        chosenVoice = resolved.voice;
        finalRate = resolved.rate;
        finalPitch = resolved.pitch;
      }
    } else if (effectiveVoiceURI && voices.length > 0) {
      chosenVoice = voices.find((v) => v.voiceURI === effectiveVoiceURI || v.name === effectiveVoiceURI);
    }

    // 4. GARANTÍA DE GÉNERO FEMENINO: Si la persona elegida es femenina, asegurar timbre femenino
    const persona = CLINIC_VOICE_PERSONAS.find((p) => p.id === effectivePersonaId) || CLINIC_VOICE_PERSONAS[0];
    if (persona.gender === "female") {
      if (!chosenVoice || !isFemaleVoice(chosenVoice.name)) {
        const fallback = resolveVoiceForPersona("female-valeria", voices);
        if (fallback.voice) chosenVoice = fallback.voice;
        finalPitch = Math.max(finalPitch, 1.45);
      }
    }

    const textToSpeak = buildCallSpeechPhrase(patientName, doctorName, officeName, ticketCode, mode);

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = chosenVoice?.lang || "es-ES";
      utterance.rate = finalRate;
      utterance.pitch = finalPitch;
      utterance.volume = 1.0;

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      let isDone = false;
      const finish = () => {
        if (!isDone) {
          isDone = true;
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      setTimeout(finish, 6500);

      window.speechSynthesis.speak(utterance);
    });
  } catch (err) {
    console.warn("Error en speakPatientCallAsync:", err);
  }
}

let speechQueueChain: Promise<void> = Promise.resolve();

export function queueSpeechCall(
  chimeTone: ChimeToneType | undefined,
  patientName: string,
  doctorName?: string,
  officeName?: string,
  ticketCode?: string,
  mode: VoiceMode = "full",
  selectedVoiceURI?: string,
  rate = 0.86,
  pitch = 1.0,
  activePersonaId?: string
): Promise<void> {
  const nextCall = async () => {
    try {
      if (chimeTone) {
        playChime(chimeTone);
        await new Promise((r) => setTimeout(r, 650));
      }
      await speakPatientCallAsync(
        patientName,
        doctorName,
        officeName,
        ticketCode,
        mode,
        selectedVoiceURI,
        rate,
        pitch,
        activePersonaId
      );
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      console.warn("Error en queueSpeechCall", e);
    }
  };

  speechQueueChain = speechQueueChain.then(nextCall, nextCall);
  return speechQueueChain;
}
