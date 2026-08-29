-- Add user_id column to doctores table to link with user accounts
ALTER TABLE public.doctores 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctores_user_id ON public.doctores(user_id);

-- Update RLS policy on expedientes to allow doctors to see expedientes 
-- where they have appointments with the patient
DROP POLICY IF EXISTS "treating_physician_can_view_expedientes" ON public.expedientes;

CREATE POLICY "treating_physician_can_view_expedientes" 
ON public.expedientes 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    -- Admin sistema can see all
    has_role('admin_sistema'::app_role) OR
    -- Staff in same organization can see
    (
      (organizacion_id = get_user_organization()) AND (
        has_role('admin_clinica'::app_role) OR 
        has_role('medico'::app_role) OR 
        has_role('odontologo'::app_role) OR 
        has_role('fisioterapeuta'::app_role) OR 
        has_role('quiropractico'::app_role) OR 
        has_role('recepcionista'::app_role)
      )
    ) OR
    -- Assigned professional
    (profesional_id = auth.uid()) OR
    -- Doctor with appointments for this patient (via doctores.user_id)
    EXISTS (
      SELECT 1 FROM citas c
      JOIN doctores d ON d.id = c.doctor_id
      WHERE c.cliente_id = expedientes.cliente_id
      AND d.user_id = auth.uid()
    )
  )
);

-- Update RLS policy on clientes to allow doctors to see their assigned patients
DROP POLICY IF EXISTS "Admins can view all patients in organization" ON public.clientes;

CREATE POLICY "Staff can view patients in organization or assigned" 
ON public.clientes 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    -- Admin sistema can see all
    has_role('admin_sistema'::app_role) OR
    -- Staff in same organization can see
    (
      (organizacion_id = get_user_organization()) AND (
        has_role('admin_clinica'::app_role) OR 
        has_role('medico'::app_role) OR 
        has_role('odontologo'::app_role) OR 
        has_role('fisioterapeuta'::app_role) OR 
        has_role('quiropractico'::app_role) OR 
        has_role('recepcionista'::app_role)
      )
    ) OR
    -- Doctor with appointments for this patient
    EXISTS (
      SELECT 1 FROM citas c
      JOIN doctores d ON d.id = c.doctor_id
      WHERE c.cliente_id = clientes.id
      AND d.user_id = auth.uid()
    )
  )
);

-- Update RLS policy on citas to allow doctors to see their own appointments
DROP POLICY IF EXISTS "Users can view appointments from their organization" ON public.citas;

CREATE POLICY "Users can view appointments from their organization or assigned" 
ON public.citas 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    -- Same organization
    (organizacion_id = get_user_organization()) OR
    -- Doctor assigned to this appointment
    EXISTS (
      SELECT 1 FROM doctores d
      WHERE d.id = citas.doctor_id
      AND d.user_id = auth.uid()
    )
  )
);