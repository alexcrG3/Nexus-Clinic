-- Update trigger function to create profile and role in user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, activo, nombre, apellidos)
  VALUES (
    NEW.id, 
    NEW.email, 
    true,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellidos'
  );
  
  -- Get role from metadata or default to recepcionista
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'recepcionista'::app_role
  );
  
  -- Insert role in user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;