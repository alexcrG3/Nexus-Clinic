-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role)
);

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin_sistema'::app_role, 'admin_clinica'::app_role)
  )
);