-- Restringir visibilidad para personal médico: solo pacientes/citas asignadas

BEGIN;

-- ====== CITAS (appointments) ======
-- Antes: cualquier usuario autenticado podía ver TODAS las citas de su organización.
-- Ahora: admin_sistema ve todo; admin_clinica/recepcionista ven su organización; médicos solo sus citas asignadas.
DROP POLICY IF EXISTS "Users can view appointments from their organization or assigned" ON public.citas;

CREATE POLICY "Users can view appointments from their organization or assigned"
ON public.citas
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin_sistema'::public.app_role)
    OR (
      (has_role('admin_clinica'::public.app_role) OR has_role('recepcionista'::public.app_role))
      AND organizacion_id = get_user_organization()
    )
    OR EXISTS (
      SELECT 1
      FROM public.doctores d
      WHERE d.id = public.citas.doctor_id
        AND d.user_id = auth.uid()
    )
  )
);

-- ====== CLIENTES (patients) ======
-- Antes: médicos podían ver TODOS los pacientes de su organización.
-- Ahora: admin_sistema ve todo; admin_clinica/recepcionista ven su organización; médicos solo pacientes con cita asignada o expediente asignado.
DROP POLICY IF EXISTS "Staff can view patients in organization or assigned" ON public.clientes;

CREATE POLICY "Staff can view patients in organization or assigned"
ON public.clientes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin_sistema'::public.app_role)
    OR (
      organizacion_id = get_user_organization()
      AND (has_role('admin_clinica'::public.app_role) OR has_role('recepcionista'::public.app_role))
    )
    OR EXISTS (
      SELECT 1
      FROM public.citas c
      JOIN public.doctores d ON d.id = c.doctor_id
      WHERE c.cliente_id = public.clientes.id
        AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.expedientes e
      JOIN public.profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = public.clientes.id
        AND e.profesional_id = prof.id
    )
  )
);

COMMIT;
