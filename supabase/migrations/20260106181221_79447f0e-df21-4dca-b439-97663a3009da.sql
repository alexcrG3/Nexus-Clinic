-- Crear trigger para manejar nuevos usuarios automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar perfil para el nuevo usuario
  INSERT INTO public.profiles (user_id, email, activo, nombre, apellidos, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    true,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'recepcionista'::app_role
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insertar rol en user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'recepcionista'::app_role
    )
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();