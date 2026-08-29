
-- Sincronizar profiles.role con user_roles.role para todos los usuarios
UPDATE public.profiles p
SET role = ur.role
FROM public.user_roles ur
WHERE ur.user_id = p.user_id
  AND p.role != ur.role;

-- Crear trigger para mantener sincronizados en el futuro
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = NEW.role
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.user_roles;
CREATE TRIGGER sync_profile_role_trigger
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();
