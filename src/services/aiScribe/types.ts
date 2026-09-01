export interface MedicamentoRecetado {
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
}

export interface SignosVitalesExtraidos {
  presion_sistolica?: string;
  presion_diastolica?: string;
  frecuencia_cardiaca?: string;
  saturacion_oxigeno?: string;
  temperatura?: string;
  frecuencia_respiratoria?: string;
  peso?: string;
  talla?: string;
}

export interface ClinicalAiExtraction {
  tipo_consulta?: "inicial" | "seguimiento";
  motivo_consulta: string;
  padecimiento_actual: string;
  examen_fisico: string;
  signos_vitales?: SignosVitalesExtraidos;
  diagnostico_principal: string;
  codigo_cie10: string;
  plan_tratamiento: string;
  medicamentos: MedicamentoRecetado[];
  recomendaciones_paciente: string;
  proxima_cita_recomendada?: string;
}
