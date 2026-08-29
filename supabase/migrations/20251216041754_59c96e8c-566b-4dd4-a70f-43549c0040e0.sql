-- =====================================================
-- FIX 1: CLIENTES - Restrict access to treating staff
-- =====================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view patients from their organization" ON public.clientes;

-- Create more restrictive SELECT policy
-- Admins can see all patients in their org
-- Medical staff can only see patients they have expedientes/citas with
-- Receptionists can see patients in their org (needed for scheduling)
CREATE POLICY "Staff can view patients they are authorized to see"
ON public.clientes
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND organizacion_id = get_user_organization()
  AND (
    -- Admins can see all
    has_role('admin_sistema'::app_role) 
    OR has_role('admin_clinica'::app_role)
    -- Receptionists can see all in org (for scheduling)
    OR has_role('recepcionista'::app_role)
    -- Medical staff can only see patients they treat
    OR (
      (has_role('medico'::app_role) OR has_role('odontologo'::app_role) 
       OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role))
      AND (
        -- Has an expediente with this patient
        EXISTS (
          SELECT 1 FROM public.expedientes e 
          WHERE e.cliente_id = clientes.id 
          AND e.profesional_id = auth.uid()
        )
        -- Or has an appointment with this patient
        OR EXISTS (
          SELECT 1 FROM public.citas c 
          WHERE c.cliente_id = clientes.id 
          AND c.doctor_id::text = auth.uid()::text
        )
      )
    )
  )
);

-- =====================================================
-- FIX 2: ANTECEDENTES_MEDICOS - Only treating physicians
-- =====================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "medical_staff_can_view_antecedentes" ON public.antecedentes_medicos;

-- Create restrictive SELECT policy - only treating physicians
CREATE POLICY "Only treating physicians can view medical history"
ON public.antecedentes_medicos
FOR SELECT
USING (
  -- Admins can see all
  has_role('admin_sistema'::app_role) 
  OR has_role('admin_clinica'::app_role)
  -- Medical staff can only see histories of patients they treat
  OR (
    (has_role('medico'::app_role) OR has_role('odontologo'::app_role) 
     OR has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.expedientes e 
      WHERE e.cliente_id = antecedentes_medicos.cliente_id 
      AND e.profesional_id = auth.uid()
    )
  )
);

-- =====================================================
-- FIX 3: DOCTORES - Require authentication
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "doctores policy" ON public.doctores;

-- Create proper authentication-based policy
-- Only authenticated users can view doctor info
CREATE POLICY "Authenticated users can view doctors"
ON public.doctores
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage doctors
CREATE POLICY "Admins can manage doctors"
ON public.doctores
FOR ALL
USING (
  has_role('admin_sistema'::app_role) 
  OR has_role('admin_clinica'::app_role)
)
WITH CHECK (
  has_role('admin_sistema'::app_role) 
  OR has_role('admin_clinica'::app_role)
);