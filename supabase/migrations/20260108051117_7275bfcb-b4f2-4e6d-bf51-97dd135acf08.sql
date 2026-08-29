-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Staff can view patients they are authorized to see" ON public.clientes;

-- Crear política simplificada para admins (ven todos los pacientes de su organización)
CREATE POLICY "Admins can view all patients in organization"
ON public.clientes
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Admin sistema ve todo
    has_role('admin_sistema'::app_role)
    OR 
    -- Admin clínica y staff médico ven pacientes de su organización
    (organizacion_id = get_user_organization() AND (
      has_role('admin_clinica'::app_role) OR
      has_role('medico'::app_role) OR
      has_role('odontologo'::app_role) OR
      has_role('fisioterapeuta'::app_role) OR
      has_role('quiropractico'::app_role) OR
      has_role('recepcionista'::app_role)
    ))
  )
);