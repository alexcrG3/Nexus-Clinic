-- Fix lista_espera table RLS - currently has overly permissive policy
-- Drop the permissive policy that allows public access
DROP POLICY IF EXISTS "listaEspera policy" ON public.lista_espera;

-- Create restrictive policies for authenticated staff only
CREATE POLICY "Staff can view waiting list"
ON public.lista_espera FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (has_role('admin_sistema'::app_role) OR 
   has_role('admin_clinica'::app_role) OR 
   has_role('recepcionista'::app_role))
);

CREATE POLICY "Staff can insert waiting list"
ON public.lista_espera FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (has_role('admin_sistema'::app_role) OR 
   has_role('admin_clinica'::app_role) OR 
   has_role('recepcionista'::app_role))
);

CREATE POLICY "Staff can update waiting list"
ON public.lista_espera FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (has_role('admin_sistema'::app_role) OR 
   has_role('admin_clinica'::app_role) OR 
   has_role('recepcionista'::app_role))
);

CREATE POLICY "Staff can delete waiting list"
ON public.lista_espera FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  (has_role('admin_sistema'::app_role) OR 
   has_role('admin_clinica'::app_role))
);