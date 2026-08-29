-- 1) Mejorar RPC para que también asigne user_id (user del doctor) y mantenga fecha/hora consistentes
CREATE OR REPLACE FUNCTION public.crear_cita_desde_n8n(
  p_fecha text,
  p_nombre text,
  p_telefono text,
  p_nombre_servicio text,
  p_nombre_doctor text,
  p_cedula text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text,
  p_apellidos text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cliente_id uuid;
  v_doctor_id uuid;
  v_doctor_user_id uuid;
  v_servicio_id uuid;
  v_fecha_cita text;
  v_hora_cita time;
  v_duracion integer;
  v_precio numeric;
  v_organizacion_id uuid := '60facc89-5b03-4b33-8870-4a3e128521f3';
  v_cita_id uuid;
  v_expediente_id uuid;
  v_profesional_id uuid;
  v_telefono_normalizado text;
  v_nombre_limpio text;
BEGIN
  -- Normalizar teléfono: quitar +, espacios, guiones
  v_telefono_normalizado := regexp_replace(p_telefono, '[^0-9]', '', 'g');
  v_nombre_limpio := trim(p_nombre);

  -- 1. Buscar cliente por teléfono normalizado
  SELECT id INTO v_cliente_id
  FROM clientes
  WHERE regexp_replace(telefono, '[^0-9]', '', 'g') = v_telefono_normalizado
  LIMIT 1;

  -- 2. Si no existe cliente, crearlo
  IF v_cliente_id IS NULL THEN
    INSERT INTO clientes (nombre, apellidos, telefono, email, cedula, organizacion_id)
    VALUES (
      v_nombre_limpio,
      COALESCE(p_apellidos, ''),
      p_telefono,
      p_email,
      p_cedula,
      v_organizacion_id
    )
    RETURNING id INTO v_cliente_id;
  END IF;

  -- 3. Buscar doctor por nombre (búsqueda flexible)
  SELECT id, user_id INTO v_doctor_id, v_doctor_user_id
  FROM doctores
  WHERE LOWER(nombre) LIKE LOWER('%' || p_nombre_doctor || '%')
    AND activo = true
  LIMIT 1;

  IF v_doctor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Doctor no encontrado: ' || p_nombre_doctor
    );
  END IF;

  -- 4. Buscar servicio por nombre (búsqueda flexible)
  SELECT id, duracion, precio INTO v_servicio_id, v_duracion, v_precio
  FROM servicios
  WHERE LOWER(nombre) LIKE LOWER('%' || p_nombre_servicio || '%')
    AND activo = true
  LIMIT 1;

  IF v_servicio_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Servicio no encontrado: ' || p_nombre_servicio
    );
  END IF;

  -- 5. Parsear fecha y hora del formato ISO (2026-01-21T10:00:00)
  v_fecha_cita := SPLIT_PART(p_fecha, 'T', 1);

  IF POSITION('T' IN p_fecha) > 0 THEN
    v_hora_cita := SUBSTRING(SPLIT_PART(p_fecha, 'T', 2) FROM 1 FOR 8)::time;
  ELSE
    v_hora_cita := '09:00:00'::time;
  END IF;

  -- 6. Verificar conflicto
  IF EXISTS (
    SELECT 1 FROM citas
    WHERE doctor_id = v_doctor_id
      AND "fechaCita"::date = v_fecha_cita::date
      AND hora_cita = v_hora_cita
      AND estado NOT IN ('cancelada', 'no_asistio')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya existe una cita para este doctor en ese horario'
    );
  END IF;

  -- 7. Insertar la cita (incluye user_id para trazabilidad)
  INSERT INTO citas (
    cliente_id,
    doctor_id,
    servicio_id,
    "fechaCita",
    hora_cita,
    duracion,
    precio,
    nombre,
    telefono,
    estado,
    organizacion_id,
    user_id
  ) VALUES (
    v_cliente_id,
    v_doctor_id,
    v_servicio_id,
    v_fecha_cita,
    v_hora_cita,
    v_duracion,
    v_precio,
    v_nombre_limpio,
    p_telefono,
    'pendiente',
    v_organizacion_id,
    v_doctor_user_id
  )
  RETURNING id INTO v_cita_id;

  -- 8. Obtener profile.id del doctor para asignar como profesional
  SELECT p.id INTO v_profesional_id
  FROM profiles p
  WHERE p.user_id = v_doctor_user_id;

  -- 9. Crear o actualizar expediente
  SELECT id INTO v_expediente_id
  FROM expedientes
  WHERE cliente_id = v_cliente_id
  LIMIT 1;

  IF v_expediente_id IS NULL THEN
    INSERT INTO expedientes (cliente_id, organizacion_id, profesional_id, detalle)
    VALUES (
      v_cliente_id,
      v_organizacion_id,
      v_profesional_id,
      'Expediente creado automáticamente desde chatbot'
    )
    RETURNING id INTO v_expediente_id;
  ELSE
    UPDATE expedientes
    SET profesional_id = COALESCE(profesional_id, v_profesional_id)
    WHERE id = v_expediente_id AND profesional_id IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'cita_id', v_cita_id,
    'cliente_id', v_cliente_id,
    'doctor_id', v_doctor_id,
    'servicio_id', v_servicio_id,
    'expediente_id', v_expediente_id,
    'fecha', v_fecha_cita,
    'hora', v_hora_cita::text,
    'duracion', v_duracion,
    'precio', v_precio,
    'user_id', v_doctor_user_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;


-- 2) Corregir los registros incompletos creados por el agente para Camilo Campos
DO $$
DECLARE
  v_org uuid := '60facc89-5b03-4b33-8870-4a3e128521f3';
  v_tel text := '+50683202728';
  v_tel_norm text := regexp_replace(v_tel, '[^0-9]', '', 'g');
  v_cliente_id uuid;
  v_doctor_id uuid := '0cf34ad9-eab5-4714-be47-00b3635c12b3'; -- Dra. Ana Lara
  v_doctor_user_id uuid := 'cb838f96-2d39-4458-83ac-8ad8d21eb42d';
  v_servicio_id uuid := '9ee9da6d-9965-4553-bc70-5df91dc99a34'; -- Odontología general
  v_duracion integer := 30;
  v_precio numeric := 30000;
  v_profesional_id uuid;
BEGIN
  -- Crear/obtener cliente
  SELECT id INTO v_cliente_id
  FROM clientes
  WHERE regexp_replace(telefono, '[^0-9]', '', 'g') = v_tel_norm
  LIMIT 1;

  IF v_cliente_id IS NULL THEN
    INSERT INTO clientes (nombre, apellidos, telefono, email, cedula, organizacion_id)
    VALUES ('Camilo', 'Campos', v_tel, 'proyectodomiff@gmail.com', '10234654', v_org)
    RETURNING id INTO v_cliente_id;
  END IF;

  -- Obtener profile.id del doctor
  SELECT id INTO v_profesional_id
  FROM profiles
  WHERE user_id = v_doctor_user_id
  LIMIT 1;

  -- Asegurar expediente y asignar profesional si falta
  UPDATE expedientes
  SET
    organizacion_id = COALESCE(organizacion_id, v_org),
    profesional_id = COALESCE(profesional_id, v_profesional_id)
  WHERE cliente_id = v_cliente_id;

  -- Completar citas creadas incompletas para ese teléfono
  UPDATE citas
  SET
    organizacion_id = COALESCE(organizacion_id, v_org),
    cliente_id = COALESCE(cliente_id, v_cliente_id),
    doctor_id = COALESCE(doctor_id, v_doctor_id),
    servicio_id = COALESCE(servicio_id, v_servicio_id),
    duracion = COALESCE(duracion, v_duracion),
    precio = COALESCE(precio, v_precio),
    user_id = COALESCE(user_id, v_doctor_user_id),
    hora_cita = COALESCE(
      hora_cita,
      CASE
        WHEN "fechaCita" LIKE '%T%' THEN substring(split_part("fechaCita", 'T', 2) from 1 for 8)::time
        ELSE NULL
      END
    ),
    "fechaCita" = CASE
      WHEN "fechaCita" LIKE '%T%' THEN split_part("fechaCita", 'T', 1)
      ELSE "fechaCita"
    END
  WHERE regexp_replace(telefono, '[^0-9]', '', 'g') = v_tel_norm
    AND (cliente_id IS NULL OR doctor_id IS NULL OR servicio_id IS NULL OR hora_cita IS NULL);
END $$;


-- 3) Guardrails: normalizar fecha/hora y bloquear INSERTs incompletos desde service role (auth.uid() IS NULL)
CREATE OR REPLACE FUNCTION public.zz_citas_guardrails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_time_text text;
BEGIN
  -- Normalizar cuando llega ISO en fechaCita (ej: 2026-01-21T08:30:00)
  IF NEW."fechaCita" IS NOT NULL AND POSITION('T' IN NEW."fechaCita") > 0 THEN
    v_time_text := substring(split_part(NEW."fechaCita", 'T', 2) from 1 for 8);

    IF NEW.hora_cita IS NULL AND v_time_text ~ '^[0-9]{2}:[0-9]{2}' THEN
      NEW.hora_cita := v_time_text::time;
    END IF;

    NEW."fechaCita" := split_part(NEW."fechaCita", 'T', 1);
  END IF;

  -- Bloquear inserts/updates incompletos desde integraciones que no tienen auth.uid()
  IF auth.uid() IS NULL THEN
    IF NEW.cliente_id IS NULL OR NEW.doctor_id IS NULL OR NEW.servicio_id IS NULL OR NEW.hora_cita IS NULL THEN
      RAISE EXCEPTION 'Inserción inválida en citas: usa RPC crear_cita_desde_n8n (o incluye cliente_id, doctor_id, servicio_id y hora_cita).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_citas_guardrails ON public.citas;
CREATE TRIGGER zz_citas_guardrails
BEFORE INSERT OR UPDATE ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.zz_citas_guardrails();
