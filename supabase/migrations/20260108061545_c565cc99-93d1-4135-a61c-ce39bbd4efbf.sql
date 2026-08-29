
-- Corregir la política RLS de expedientes
-- El profesional_id referencia profiles.id, no auth.uid()
-- Los doctores solo deben ver expedientes donde:
-- 1. Son admin_sistema o admin_clinica de su org
-- 2. Son el profesional asignado (profesional_id = su profile.id)
-- 3. Tienen citas con el cliente

DROP POLICY IF EXISTS "treating_physician_can_view_expedientes" ON public.expedientes;

CREATE POLICY "treating_physician_can_view_expedientes" 
ON public.expedientes 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    -- Admin sistema ve todo
    has_role('admin_sistema'::app_role) OR 
    -- Admin clinica y recepcionista ven todos de su organización
    (
      (organizacion_id = get_user_organization()) AND 
      (has_role('admin_clinica'::app_role) OR has_role('recepcionista'::app_role))
    ) OR
    -- Profesionales médicos solo ven expedientes donde están asignados
    (
      (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR 
       has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) AND
      (EXISTS (
        SELECT 1 FROM profiles prof 
        WHERE prof.user_id = auth.uid() 
        AND prof.id = expedientes.profesional_id
      ))
    ) OR
    -- O tienen citas con el cliente a través de doctores
    (EXISTS (
      SELECT 1 FROM citas c
      JOIN doctores d ON d.id = c.doctor_id
      WHERE c.cliente_id = expedientes.cliente_id 
      AND d.user_id = auth.uid()
    ))
  )
);
