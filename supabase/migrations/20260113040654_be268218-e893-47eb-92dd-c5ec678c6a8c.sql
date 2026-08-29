-- Allow system admin to update any patient record
DROP POLICY IF EXISTS "Users can update patients from their organization" ON public.clientes;

CREATE POLICY "Admins or org staff can update patients"
ON public.clientes
FOR UPDATE
USING (
  has_role('admin_sistema'::app_role)
  OR organizacion_id = get_user_organization()
)
WITH CHECK (
  has_role('admin_sistema'::app_role)
  OR organizacion_id = get_user_organization()
);