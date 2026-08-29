-- 1. Fix handle_new_user() function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format (basic check)
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Check for existing profile (prevent duplicates)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW; -- Already exists, skip
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (user_id, email, activo, nombre, apellidos)
  VALUES (
    NEW.id, 
    NEW.email, 
    true,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellidos'
  );
  
  -- Get role from metadata or default to recepcionista
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'recepcionista'::app_role
    )
  );
  
  RETURN NEW;
END;
$$;

-- 2. Add database constraints to clientes table for input validation
DO $$ 
BEGIN
  -- Length constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_nombre_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_nombre_length CHECK (length(nombre) <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_apellidos_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_apellidos_length CHECK (length(apellidos) <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_cedula_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_cedula_length CHECK (length(cedula) <= 50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_telefono_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_telefono_length CHECK (length(telefono) <= 20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_email_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_email_length CHECK (length(email) <= 255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_direccion_length') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_direccion_length CHECK (length(direccion) <= 500);
  END IF;
  
  -- Email format validation
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_email_format') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_email_format 
      CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL OR email = '');
  END IF;
  
  -- Phone format validation
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_telefono_format') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_telefono_format
      CHECK (telefono ~ '^[0-9+\-\s()]+$' OR telefono IS NULL OR telefono = '');
  END IF;
END $$;

-- 3. Add constraints to consultas table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_motivo_length') THEN
    ALTER TABLE consultas ADD CONSTRAINT consultas_motivo_length CHECK (length(motivo_consulta) <= 2000);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_diagnostico_length') THEN
    ALTER TABLE consultas ADD CONSTRAINT consultas_diagnostico_length CHECK (length(diagnostico_principal) <= 1000);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_plan_length') THEN
    ALTER TABLE consultas ADD CONSTRAINT consultas_plan_length CHECK (length(plan_tratamiento) <= 5000);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultas_notas_length') THEN
    ALTER TABLE consultas ADD CONSTRAINT consultas_notas_length CHECK (length(notas) <= 5000);
  END IF;
END $$;

-- 4. Add constraints to citas table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citas_nombre_length') THEN
    ALTER TABLE citas ADD CONSTRAINT citas_nombre_length CHECK (length(nombre) <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citas_telefono_length') THEN
    ALTER TABLE citas ADD CONSTRAINT citas_telefono_length CHECK (length(telefono) <= 20);
  END IF;
END $$;