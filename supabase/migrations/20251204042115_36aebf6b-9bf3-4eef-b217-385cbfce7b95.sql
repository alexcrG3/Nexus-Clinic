-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Create a corrected policy using the has_role function (security definer)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role)
);