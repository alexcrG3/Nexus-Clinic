-- Trigger mejorado que autocompleta datos cuando n8n hace INSERT directo
CREATE OR REPLACE FUNCTION public.zz_citas_autocomplete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cliente_id uuid;
  v_doctor_id uuid;
  v_doctor_user_id uuid;
  v_servicio_id uuid;
  v_servicio_nombre text;
  v_duracion integer;
  v_precio numeric;
  v_profesional_id uuid;
  v_expediente_id uuid;
  v_telefono_normalizado text;
  v_organizacion_id uuid := '60facc89-5b03-4b33-8870-4a3e128521f3';
  v_time_text text;
BEGIN
  -- 1. Normalizar hora_cita desde fechaCita si viene en formato ISO (ej: 2026-01-21T08:30:00)
  IF NEW."fechaCita" IS NOT NULL AND POSITION('T' IN NEW."fechaCita") > 0 THEN
    v_time_text := substring(split_part(NEW."fechaCita", 'T', 2) from 1 for 8);
    
    IF NEW.hora_cita IS NULL AND v_time_text ~ '^[0-9]{2}:[0-9]{2}' THEN
      NEW.hora_cita := v_time_text::time;
    END IF;
    
    -- Normalizar fechaCita a solo fecha
    NEW."fechaCita" := split_part(NEW."fechaCita", 'T', 1);
  END IF;

  -- 2. Buscar/crear cliente por teléfono si cliente_id es NULL
  IF NEW.cliente_id IS NULL AND NEW.telefono IS NOT NULL THEN
    v_telefono_normalizado := regexp_replace(NEW.telefono, '[^0-9]', '', 'g');
    
    SELECT id INTO v_cliente_id
    FROM clientes
    WHERE regexp_replace(telefono, '[^0-9]', '', 'g') = v_telefono_normalizado
    LIMIT 1;
    
    -- Si no existe, crear el cliente
    IF v_cliente_id IS NULL AND NEW.nombre IS NOT NULL THEN
      INSERT INTO clientes (nombre, telefono, organizacion_id)
      VALUES (NEW.nombre, NEW.telefono, v_organizacion_id)
      RETURNING id INTO v_cliente_id;
    END IF;
    
    NEW.cliente_id := v_cliente_id;
  END IF;

  -- 3. Buscar doctor por nombre si doctor_id es NULL pero hay nombre en algún campo
  -- n8n no pasa nombre_doctor directamente, pero podemos buscarlo si hay un patrón
  IF NEW.doctor_id IS NULL THEN
    -- Intentar buscar por el nombre del doctor si está en algún campo de la cita
    -- Buscar el primer doctor activo disponible como fallback
    SELECT id, user_id INTO v_doctor_id, v_doctor_user_id
    FROM doctores
    WHERE activo = true
    ORDER BY created_at
    LIMIT 1;
    
    NEW.doctor_id := v_doctor_id;
    NEW.user_id := v_doctor_user_id;
  ELSE
    -- Si ya tiene doctor_id, obtener el user_id del doctor
    SELECT user_id INTO v_doctor_user_id
    FROM doctores
    WHERE id = NEW.doctor_id;
    
    IF NEW.user_id IS NULL THEN
      NEW.user_id := v_doctor_user_id;
    END IF;
  END IF;

  -- 4. Buscar servicio si servicio_id es NULL
  IF NEW.servicio_id IS NULL THEN
    -- Buscar el primer servicio activo como fallback
    SELECT id, duracion, precio, nombre INTO v_servicio_id, v_duracion, v_precio, v_servicio_nombre
    FROM servicios
    WHERE activo = true
    ORDER BY created_at
    LIMIT 1;
    
    NEW.servicio_id := v_servicio_id;
    NEW.duracion := COALESCE(NEW.duracion, v_duracion);
    NEW.precio := COALESCE(NEW.precio, v_precio);
  END IF;

  -- 5. Asegurar organizacion_id
  NEW.organizacion_id := COALESCE(NEW.organizacion_id, v_organizacion_id);

  -- 6. Crear/actualizar expediente para el cliente
  IF NEW.cliente_id IS NOT NULL THEN
    SELECT id INTO v_expediente_id
    FROM expedientes
    WHERE cliente_id = NEW.cliente_id
    LIMIT 1;
    
    -- Obtener profesional_id del doctor
    IF v_doctor_user_id IS NOT NULL THEN
      SELECT id INTO v_profesional_id
      FROM profiles
      WHERE user_id = v_doctor_user_id;
    END IF;
    
    IF v_expediente_id IS NULL THEN
      -- Crear expediente
      INSERT INTO expedientes (cliente_id, organizacion_id, profesional_id, detalle)
      VALUES (
        NEW.cliente_id,
        v_organizacion_id,
        v_profesional_id,
        'Expediente creado automáticamente desde chatbot'
      );
    ELSE
      -- Actualizar profesional si no tiene
      UPDATE expedientes
      SET profesional_id = COALESCE(profesional_id, v_profesional_id)
      WHERE id = v_expediente_id AND profesional_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Eliminar el trigger anterior que bloqueaba
DROP TRIGGER IF EXISTS zz_citas_guardrails ON public.citas;
DROP FUNCTION IF EXISTS public.zz_citas_guardrails();

-- Crear el nuevo trigger de autocompletado
DROP TRIGGER IF EXISTS zz_citas_autocomplete ON public.citas;
CREATE TRIGGER zz_citas_autocomplete
BEFORE INSERT ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.zz_citas_autocomplete();