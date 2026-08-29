-- Fix security vulnerability: clientes table is publicly readable
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view patients from their organization" ON public.clientes;

-- Create a proper policy that restricts access to authenticated users in the same organization
CREATE POLICY "Users can view patients from their organization" 
ON public.clientes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND organizacion_id = get_user_organization()
);

-- Fix security vulnerability: expedientes table is publicly readable
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "treating_physician_can_view_expedientes" ON public.expedientes;

-- Create a proper policy that restricts access to authenticated medical staff in the same organization
CREATE POLICY "treating_physician_can_view_expedientes" 
ON public.expedientes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role('admin_sistema'::app_role) 
    OR (organizacion_id = get_user_organization() AND (
      has_role('admin_clinica'::app_role) 
      OR has_role('medico'::app_role) 
      OR has_role('odontologo'::app_role) 
      OR has_role('fisioterapeuta'::app_role) 
      OR has_role('quiropractico'::app_role)
      OR has_role('recepcionista'::app_role)
    ))
    OR profesional_id = auth.uid()
  )
);

-- Also fix the citas table which has the same issue
DROP POLICY IF EXISTS "Users can view appointments from their organization" ON public.citas;

CREATE POLICY "Users can view appointments from their organization" 
ON public.citas 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND organizacion_id = get_user_organization()
);