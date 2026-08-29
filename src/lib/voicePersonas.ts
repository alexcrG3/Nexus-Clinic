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
 * Identificación precisa de género para voces de síntesis de voz en navegadores (Chrome, Edge, Windows)
 */
export function isFemaleVoice(name: string): boolean {
  const lower = name.toLowerCase();

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
    lower.includes("male") ||
    lower.includes("hombre")
  ) {
    return false;
  }

  // Voces femeninas conocidas
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
    lower.includes("female") ||
    lower.includes("mujer")
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
    ],
    pitch: 1.05,
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
    ],
    pitch: 1.15,
    rate: 0.9,
  },
  {
    id: "female-sofia",
    name: "Sofía",
    gender: "female",
    title: "Licda. Sofía",
    role: "Femenina Juvenil y Clara",
    badge: "👩 Femenina 3",
    description: "Tono brillante y de alta inteligibilidad en salas con ruido.",
    preferredVoices: ["Paulina", "Dalia", "Google español de Estados Unidos", "Sabina", "Paloma"],
    pitch: 1.25,
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
    preferredVoices: ["Google español", "Raul", "Jorge", "Pablo", "Alvaro"],
    pitch: 0.92,
    rate: 0.86,
  },
  {
    id: "male-carlos",
    name: "Carlos",
    gender: "male",
    title: "Dr. Carlos",
    role: "Masculino Profesional Cercano",
    badge: "👨 Masculina 2",
    description: "Locutor médico equilibrado, natural y respetuoso.",
    preferredVoices: ["Raul", "Jorge", "Google español", "Pablo"],
    pitch: 1.0,
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
    preferredVoices: ["Jorge", "Google español", "Raul", "Pablo"],
    pitch: 1.08,
    rate: 0.92,
  },
];
