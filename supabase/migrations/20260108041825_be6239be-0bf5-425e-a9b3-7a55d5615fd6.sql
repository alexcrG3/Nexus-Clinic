-- 1. Agregar política permisiva para que usuarios lean sus propios roles
-- Primero verificamos si ya existe una política permisiva
DO $$
BEGIN
  -- Drop existing restrictive policy if exists and create permissive one
  DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
END $$;

-- Crear política PERMISIVA para leer propios roles (esto evita el ciclo de has_role)
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Crear función para auto-asignar admin_sistema al primer usuario
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Contar cuántos admin_sistema existen
  SELECT COUNT(*) INTO admin_count 
  FROM user_roles 
  WHERE role = 'admin_sistema';
  
  -- Si no hay ningún admin_sistema, asignar este rol al nuevo usuario
  IF admin_count = 0 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin_sistema');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear trigger para ejecutar después de crear un profile
DROP TRIGGER IF EXISTS on_profile_created_assign_admin ON public.profiles;
CREATE TRIGGER on_profile_created_assign_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();