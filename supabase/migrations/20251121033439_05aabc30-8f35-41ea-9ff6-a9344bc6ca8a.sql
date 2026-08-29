-- Drop existing policy
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;

-- Create new policy that allows:
-- 1. Admins to manage all roles
-- 2. First user to self-assign admin if no admins exist
CREATE POLICY "Admin can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    -- Check if user has admin role
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin_sistema', 'admin_clinica')
    ))
    OR
    -- Allow if no admin exists in the system
    (NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role IN ('admin_sistema', 'admin_clinica')
    ))
  )
  WITH CHECK (
    -- Check if user has admin role
    (EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin_sistema', 'admin_clinica')
    ))
    OR
    -- Allow if no admin exists in the system
    (NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role IN ('admin_sistema', 'admin_clinica')
    ))
  );