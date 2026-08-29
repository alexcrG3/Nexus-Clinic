-- 1. Fix antecedentes_medicos: Only treating physician assigned to the patient's expediente
DROP POLICY IF EXISTS "Only treating physicians can view medical history" ON public.antecedentes_medicos;

CREATE POLICY "Only assigned physician can view medical history" 
ON public.antecedentes_medicos 
FOR SELECT 
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role) OR 
  (
    (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) 
    AND EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = antecedentes_medicos.cliente_id 
      AND e.profesional_id = prof.id
    )
  )
);

-- 2. Fix consultas: Only treating physician who created the consultation or is assigned to expediente
DROP POLICY IF EXISTS "treating_physician_can_view_consultas" ON public.consultas;

CREATE POLICY "treating_physician_can_view_consultas" 
ON public.consultas 
FOR SELECT 
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role) OR
  profesional_id = auth.uid() OR
  (
    (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) 
    AND EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.id = consultas.expediente_id 
      AND e.profesional_id = prof.id
      AND e.organizacion_id = get_user_organization()
    )
  )
);

-- 3. Fix clientes: Only staff directly involved with patient (assigned doctor or receptionist for their org)
DROP POLICY IF EXISTS "Staff can view patients in organization or assigned" ON public.clientes;

CREATE POLICY "Staff can view assigned patients only" 
ON public.clientes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    has_role('admin_sistema'::app_role) OR 
    (
      organizacion_id = get_user_organization() AND 
      (has_role('admin_clinica'::app_role) OR has_role('recepcionista'::app_role))
    ) OR
    EXISTS (
      SELECT 1 FROM citas c
      JOIN doctores d ON d.id = c.doctor_id
      WHERE c.cliente_id = clientes.id AND d.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = clientes.id AND e.profesional_id = prof.id
    )
  )
);

-- 4. Fix odontogramas: Only dentists assigned to the patient
DROP POLICY IF EXISTS "odontogramas_select_by_org" ON public.odontogramas;

CREATE POLICY "odontogramas_select_by_assigned" 
ON public.odontogramas 
FOR SELECT 
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role) OR 
  profesional_id = auth.uid() OR
  (
    has_role('odontologo'::app_role) AND EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.id = odontogramas.expediente_id 
      AND e.profesional_id = prof.id
    )
  )
);

-- 5. Fix tratamientos_dentales: Only dentists assigned to the patient
DROP POLICY IF EXISTS "tratamientos_dentales_select" ON public.tratamientos_dentales;

CREATE POLICY "tratamientos_dentales_select_by_assigned" 
ON public.tratamientos_dentales 
FOR SELECT 
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role) OR 
  profesional_id = auth.uid() OR
  (
    has_role('odontologo'::app_role) AND EXISTS (
      SELECT 1 FROM odontogramas o
      JOIN expedientes e ON e.id = o.expediente_id
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE o.id = tratamientos_dentales.odontograma_id 
      AND e.profesional_id = prof.id
    )
  )
);