export interface VoicePersona {
  id: string;
  name: string;
  gender: "female" | "male";
  title: string;
  role: string;
  badge: string;
  description: string;
  preferredVoices: string[];
  pitch: number;
  rate: number;
}

/**
 * Identificación precisa y exhaustiva de género para voces en navegadores (Chrome, Edge, Windows, Mac, Android)
 */
export function isFemaleVoice(name: string): boolean {
  const lower = name.toLowerCase();

  // Excepciones conocidas de Google
  if (lower.includes("estados unidos") && lower.includes("google")) {
    return true; // Google es-US es FEMENINA
  }
  if (lower === "google español" || lower.includes("google español (es-es)")) {
    return false; // Google es-ES es MASCULINA
  }

  // Voces masculinas conocidas
  if (
    lower.includes("raul") ||
    lower.includes("raúl") ||
    lower.includes("jorge") ||
    lower.includes("pablo") ||
    lower.includes("david") ||
    lower.includes("alvaro") ||
    lower.includes("álvaro") ||
    lower.includes("enrique") ||
    lower.includes("carlos") ||
    lower.includes("mateo") ||
    lower.includes("alejandro") ||
    lower.includes("gabriel") ||
    lower.includes("miguel") ||
    lower.includes("fernando") ||
    lower.includes("diego") ||
    lower.includes("javier") ||
    lower.includes("gonzalo") ||
    lower.includes("rodrigo") ||
    lower.includes("sebastian") ||
    lower.includes("sebastián") ||
    lower.includes("manuel") ||
    lower.includes("male") ||
    lower.includes("hombre") ||
    lower.includes("guy")
  ) {
    return false;
  }

  // Voces femeninas conocidas de Microsoft, Google, Apple y Android
  return (
    lower.includes("sabina") ||
    lower.includes("paulina") ||
    lower.includes("sofia") ||
    lower.includes("sofía") ||
    lower.includes("dalia") ||
    lower.includes("paloma") ||
    lower.includes("jimena") ||
    lower.includes("camila") ||
    lower.includes("helena") ||
    lower.includes("elena") ||
    lower.includes("laura") ||
    lower.includes("monica") ||
    lower.includes("mónica") ||
    lower.includes("hilda") ||
    lower.includes("mia") ||
    lower.includes("mía") ||
    lower.includes("zira") ||
    lower.includes("paola") ||
    lower.includes("wendy") ||
    lower.includes("andrea") ||
    lower.includes("karina") ||
    lower.includes("valeria") ||
    lower.includes("valerie") ||
    lower.includes("victoria") ||
    lower.includes("clara") ||
    lower.includes("beatriz") ||
    lower.includes("isabel") ||
    lower.includes("alicia") ||
    lower.includes("silvia") ||
    lower.includes("teresa") ||
    lower.includes("olga") ||
    lower.includes("noemi") ||
    lower.includes("noemí") ||
    lower.includes("guadalupe") ||
    lower.includes("esperanza") ||
    lower.includes("carmen") ||
    lower.includes("maria") ||
    lower.includes("maría") ||
    lower.includes("rosa") ||
    lower.includes("ana") ||
    lower.includes("lucia") ||
    lower.includes("lucía") ||
    lower.includes("marta") ||
    lower.includes("irene") ||
    lower.includes("francisca") ||
    lower.includes("salome") ||
    lower.includes("salomé") ||
    lower.includes("luciana") ||
    lower.includes("luisa") ||
    lower.includes("catalina") ||
    lower.includes("daniela") ||
    lower.includes("gabriela") ||
    lower.includes("female") ||
    lower.includes("mujer") ||
    lower.includes("girl") ||
    lower.includes("cortana")
  );
}

export const CLINIC_VOICE_PERSONAS: VoicePersona[] = [
  // 3 VOCES FEMENINAS
  {
    id: "female-valeria",
    name: "Valeria",
    gender: "female",
    title: "Dra. Valeria",
    role: "Femenina Cálida (Costa Rica / Latina)",
    badge: "👩 Femenina 1",
    description: "Tono empático, suave y tranquilizador para salas de espera.",
    preferredVoices: [
      "Google español de Estados Unidos",
      "Sabina",
      "Dalia",
      "Paulina",
      "Sofia",
      "Helena",
      "Laura",
      "Paola",
      "Wendy",
      "Camila",
      "Jimena",
    ],
    pitch: 1.25,
    rate: 0.88,
  },
  {
    id: "female-mariana",
    name: "Mariana",
    gender: "female",
    title: "Dra. Mariana",
    role: "Femenina Médica Formal",
    badge: "👩 Femenina 2",
    description: "Voz médica corporativa, clara y de excelente dicción.",
    preferredVoices: [
      "Sabina",
      "Dalia",
      "Google español de Estados Unidos",
      "Helena",
      "Laura",
      "Paulina",
      "Paloma",
      "Elena",
    ],
    pitch: 1.35,
    rate: 0.90,
  },
  {
    id: "female-sofia",
    name: "Sofía",
    gender: "female",
    title: "Licda. Sofía",
    role: "Femenina Juvenil y Clara",
    badge: "👩 Femenina 3",
    description: "Tono brillante y de alta inteligibilidad en salas con ruido.",
    preferredVoices: [
      "Paulina",
      "Dalia",
      "Google español de Estados Unidos",
      "Sabina",
      "Paloma",
      "Camila",
      "Sofia",
    ],
    pitch: 1.50,
    rate: 0.94,
  },

  // 3 VOCES MASCULINAS
  {
    id: "male-alejandro",
    name: "Alejandro",
    gender: "male",
    title: "Dr. Alejandro",
    role: "Masculino Barítono Grave",
    badge: "👨 Masculina 1",
    description: "Tono profundo, formal y con presencia hospitalaria clásica.",
    preferredVoices: ["Google español", "Raul", "Jorge", "Pablo", "Alvaro", "David", "Carlos"],
    pitch: 0.65,
    rate: 0.82,
  },
  {
    id: "male-carlos",
    name: "Carlos",
    gender: "male",
    title: "Dr. Carlos",
    role: "Masculino Profesional Cercano",
    badge: "👨 Masculina 2",
    description: "Locutor médico equilibrado, natural y respetuoso.",
    preferredVoices: ["Raul", "Jorge", "Google español", "Pablo", "David", "Alvaro"],
    pitch: 0.80,
    rate: 0.88,
  },
  {
    id: "male-gabriel",
    name: "Gabriel",
    gender: "male",
    title: "Lic. Gabriel",
    role: "Masculino Enérgico y Claro",
    badge: "👨 Masculina 3",
    description: "Tono dinámico y directo para llamados de sala.",
    preferredVoices: ["Jorge", "Google español", "Raul", "Pablo", "David"],
    pitch: 0.95,
    rate: 0.94,
  },
];

export function resolveVoiceForPersona(
  personaId: string,
  availableVoices: SpeechSynthesisVoice[]
): { voice?: SpeechSynthesisVoice; rate: number; pitch: number; persona: VoicePersona } {
  const persona = CLINIC_VOICE_PERSONAS.find((p) => p.id === personaId) || CLINIC_VOICE_PERSONAS[0];
  const isFemale = persona.gender === "female";

  const esVoices = availableVoices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const femaleVoices = esVoices.filter((v) => isFemaleVoice(v.name));
  const maleVoices = esVoices.filter((v) => !isFemaleVoice(v.name));

  let chosenVoice: SpeechSynthesisVoice | undefined;

  if (isFemale) {
    // 1. Buscar en voces femeninas en español por nombres preferidos
    for (const pref of persona.preferredVoices) {
      const found = femaleVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
      if (found) {
        chosenVoice = found;
        break;
      }
    }

    // 2. Si no encontró una preferida, usar cualquier voz femenina en español disponible
    if (!chosenVoice && femaleVoices.length > 0) {
      const idx = ["female-valeria", "female-mariana", "female-sofia"].indexOf(persona.id);
      chosenVoice = femaleVoices[idx >= 0 ? idx % femaleVoices.length : 0];
    }

    // 3. Si no hay voces femeninas en español pero hay en otros idiomas con soporte
    if (!chosenVoice) {
      const otherFemales = availableVoices.filter((v) => isFemaleVoice(v.name));
      if (otherFemales.length > 0) {
        chosenVoice = otherFemales[0];
      }
    }

    // 4. Si el sistema únicamente tiene voces masculinas instaladas, usar la voz española
    // pero ELEVAR el pitch dinámicamente a 1.45 para feminizar la frecuencia sonora
    if (!chosenVoice && esVoices.length > 0) {
      chosenVoice = esVoices[0];
    }
  } else {
    // Para personas masculinas
    for (const pref of persona.preferredVoices) {
      const found = maleVoices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
      if (found) {
        chosenVoice = found;
        break;
      }
    }
    if (!chosenVoice && maleVoices.length > 0) {
      const idx = ["male-alejandro", "male-carlos", "male-gabriel"].indexOf(persona.id);
      chosenVoice = maleVoices[idx >= 0 ? idx % maleVoices.length : 0];
    }
    if (!chosenVoice && esVoices.length > 0) {
      chosenVoice = esVoices[0];
    }
  }

  if (!chosenVoice && availableVoices.length > 0) {
    chosenVoice = availableVoices[0];
  }

  // Pitch dinámico: Si la persona es femenina pero la voz del sistema es masculina (o desconocida),
  // asegurar que el tono sea agudo (mínimo 1.45) para garantizar voz femenina
  let finalPitch = persona.pitch;
  if (isFemale) {
    if (!chosenVoice || !isFemaleVoice(chosenVoice.name)) {
      finalPitch = Math.max(persona.pitch, 1.45);
    }
  } else {
    if (chosenVoice && isFemaleVoice(chosenVoice.name)) {
      finalPitch = Math.min(persona.pitch, 0.70);
    }
  }

  return {
    voice: chosenVoice,
    rate: persona.rate,
    pitch: finalPitch,
    persona,
  };
}
