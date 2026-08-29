-- Fix overly permissive RLS policies on servicios and doctor_servicios tables

-- 1. Fix servicios table - drop overly permissive policies
DROP POLICY IF EXISTS "servicios policy" ON public.servicios;
DROP POLICY IF EXISTS "Authenticated users can view servicios" ON public.servicios;
DROP POLICY IF EXISTS "Users can view services from their organization" ON public.servicios;
DROP POLICY IF EXISTS "Admin can manage services for their organization" ON public.servicios;

-- Create proper organization-scoped policies for servicios
CREATE POLICY "Users can view services from their organization"
ON public.servicios FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (organizacion_id = get_user_organization() OR has_role('admin_sistema'::app_role))
);

CREATE POLICY "Admins can manage services for their organization"
ON public.servicios FOR ALL
USING (
  (organizacion_id = get_user_organization() AND 
   (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role)))
  OR has_role('admin_sistema'::app_role)
)
WITH CHECK (
  (organizacion_id = get_user_organization() AND 
   (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role)))
  OR has_role('admin_sistema'::app_role)
);

-- 2. Fix doctor_servicios table - drop overly permissive policy
DROP POLICY IF EXISTS "doctorServicios policy" ON public.doctor_servicios;

-- Create proper restrictive policies for doctor_servicios
CREATE POLICY "Authenticated users can view doctor services"
ON public.doctor_servicios FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage doctor services"
ON public.doctor_servicios FOR ALL
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role)
)
WITH CHECK (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role)
);