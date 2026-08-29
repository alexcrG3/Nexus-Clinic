-- Corregir nombre de columna: apellidos (no apellido)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, apellidos, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'nombre', 
    NEW.raw_user_meta_data->>'apellido', 
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;