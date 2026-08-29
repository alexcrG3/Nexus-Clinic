
-- 1) Backfill organizacion_id en profiles para profesionales asignados
UPDATE public.profiles p
SET organizacion_id = e.organizacion_id
FROM public.expedientes e
WHERE e.profesional_id = p.id
  AND p.organizacion_id IS NULL
  AND e.organizacion_id IS NOT NULL;

-- 2) Expedientes: ver SOLO si es admin/recepcionista de su org o si es el profesional asignado
DROP POLICY IF EXISTS "treating_physician_can_view_expedientes" ON public.expedientes;
CREATE POLICY "treating_physician_can_view_expedientes"
ON public.expedientes
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    has_role('admin_sistema'::app_role) OR
    (
      (organizacion_id = get_user_organization()) AND
      (has_role('admin_clinica'::app_role) OR has_role('recepcionista'::app_role))
    ) OR
    (
      (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) AND
      EXISTS (
        SELECT 1
        FROM public.profiles prof
        WHERE prof.user_id = auth.uid()
          AND prof.id = expedientes.profesional_id
          AND prof.organizacion_id = expedientes.organizacion_id
      )
    )
  )
);

-- 3) Expedientes: actualizar SOLO admins o el profesional asignado
DROP POLICY IF EXISTS "treating_physician_can_update_expedientes" ON public.expedientes;
CREATE POLICY "treating_physician_can_update_expedientes"
ON public.expedientes
FOR UPDATE
USING (
  has_role('admin_sistema'::app_role) OR
  (has_role('admin_clinica'::app_role) AND organizacion_id = get_user_organization()) OR
  EXISTS (
    SELECT 1
    FROM public.profiles prof
    WHERE prof.user_id = auth.uid()
      AND prof.id = expedientes.profesional_id
  )
)
WITH CHECK (
  has_role('admin_sistema'::app_role) OR
  (has_role('admin_clinica'::app_role) AND organizacion_id = get_user_organization()) OR
  EXISTS (
    SELECT 1
    FROM public.profiles prof
    WHERE prof.user_id = auth.uid()
      AND prof.id = expedientes.profesional_id
  )
);

-- 4) Antecedentes: permitir ver al profesional asignado
DROP POLICY IF EXISTS "Only treating physicians can view medical history" ON public.antecedentes_medicos;
CREATE POLICY "Only treating physicians can view medical history"
ON public.antecedentes_medicos
FOR SELECT
USING (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  (
    (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) AND
    EXISTS (
      SELECT 1
      FROM public.expedientes e
      JOIN public.profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = antecedentes_medicos.cliente_id
        AND e.profesional_id = prof.id
    )
  )
);

-- 5) Datos de ejemplo para Lucía

-- 5.1 Documentos en el expediente
UPDATE public.expedientes
SET documentos = jsonb_build_array(
  jsonb_build_object('nombre','Radiografía panorámica','tipo','imagen'),
  jsonb_build_object('nombre','Consentimiento informado','tipo','pdf')
)
WHERE id = '910d072f-79a4-4a97-ac5a-a0de9adbbe55'
  AND (documentos IS NULL OR documentos = '[]'::jsonb);

-- 5.2 Antecedentes (upsert por cliente)
INSERT INTO public.antecedentes_medicos (
  cliente_id,
  enfermedades_cronicas,
  medicamentos_actuales,
  alergias,
  cirugias_previas,
  antecedentes_familiares,
  habitos
)
VALUES (
  'f5bc7a54-8370-4863-ba55-0099cea13772',
  ARRAY['Hipertensión (controlada)'],
  ARRAY['Ibuprofeno (ocasional)'],
  ARRAY['Penicilina'],
  ARRAY[]::text[],
  'Padre con hipertensión arterial',
  '{"tabaquismo": false, "alcohol": true, "ejercicio": "Caminata 3 veces/semana"}'::jsonb
)
ON CONFLICT (cliente_id)
DO UPDATE SET
  enfermedades_cronicas = EXCLUDED.enfermedades_cronicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  alergias = EXCLUDED.alergias,
  antecedentes_familiares = EXCLUDED.antecedentes_familiares,
  habitos = EXCLUDED.habitos;

-- 5.3 Consulta de ejemplo (solo si no existe alguna para ese expediente)
INSERT INTO public.consultas (
  expediente_id,
  fecha,
  motivo_consulta,
  diagnostico_principal,
  plan_tratamiento,
  procedimiento_realizado,
  recomendaciones,
  notas,
  profesional_id
)
SELECT
  '910d072f-79a4-4a97-ac5a-a0de9adbbe55',
  CURRENT_DATE,
  'Dolor en molar superior derecho',
  'Caries dental profunda',
  'Restauración con resina y control en 2 semanas',
  'Evaluación clínica y radiográfica; limpieza y control de sensibilidad',
  'Higiene oral reforzada; evitar alimentos muy fríos/calientes por 48h',
  'Paciente tolera el procedimiento. Se programa control.',
  '43f6b7b9-7592-4148-8dd6-6340256fd229'
WHERE NOT EXISTS (
  SELECT 1 FROM public.consultas WHERE expediente_id = '910d072f-79a4-4a97-ac5a-a0de9adbbe55'
);
