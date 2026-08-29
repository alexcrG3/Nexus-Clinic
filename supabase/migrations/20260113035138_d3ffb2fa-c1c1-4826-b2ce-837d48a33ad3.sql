-- Update audit_log policy to only allow admin_sistema to view
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;

CREATE POLICY "Only system admin can view audit logs" 
ON public.audit_log 
FOR SELECT 
USING (has_role('admin_sistema'::app_role));