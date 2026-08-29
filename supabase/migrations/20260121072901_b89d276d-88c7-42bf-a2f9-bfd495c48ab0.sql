-- Fix n8n-created appointments not showing for the professional by ensuring doctor_id/user_id are correctly derived.

BEGIN;

-- 1) Improve autocomplete trigger logic: if user_id is provided, derive doctor_id from it.
--    Otherwise, prefer an active doctor that has a linked user_id (so the professional can actually see the appointment).
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

  -- 3. Resolver doctor
  IF NEW.doctor_id IS NULL THEN
    -- 3a) Si viene user_id (por ejemplo desde n8n), respetarlo y derivar doctor_id
    IF NEW.user_id IS NOT NULL THEN
      SELECT id, user_id INTO v_doctor_id, v_doctor_user_id
      FROM doctores
      WHERE user_id = NEW.user_id
        AND activo = true
      LIMIT 1;

      IF v_doctor_id IS NOT NULL THEN
        NEW.doctor_id := v_doctor_id;
        v_doctor_user_id := NEW.user_id;
      END IF;
    END IF;

    -- 3b) Si aún no hay doctor, usar fallback: preferir doctor activo con user_id no nulo
    IF NEW.doctor_id IS NULL THEN
      SELECT id, user_id INTO v_doctor_id, v_doctor_user_id
      FROM doctores
      WHERE activo = true
      ORDER BY (user_id IS NULL) ASC, created_at
      LIMIT 1;

      NEW.doctor_id := v_doctor_id;
      IF NEW.user_id IS NULL THEN
        NEW.user_id := v_doctor_user_id;
      END IF;
    END IF;
  ELSE
    -- Si ya tiene doctor_id, asegurar user_id
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
      INSERT INTO expedientes (cliente_id, organizacion_id, profesional_id, detalle)
      VALUES (
        NEW.cliente_id,
        v_organizacion_id,
        v_profesional_id,
        'Expediente creado automáticamente desde chatbot'
      );
    ELSE
      UPDATE expedientes
      SET profesional_id = COALESCE(profesional_id, v_profesional_id)
      WHERE id = v_expediente_id AND profesional_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Backfill: if user_id is set but doctor_id missing, derive it.
UPDATE public.citas c
SET doctor_id = d.id
FROM public.doctores d
WHERE c.doctor_id IS NULL
  AND c.user_id IS NOT NULL
  AND d.user_id = c.user_id
  AND d.activo = true;

-- 3) Backfill: if appointments are assigned to an unlinked doctor (doctor.user_id IS NULL) or have no doctor,
--    assign them to the only active doctor that has a linked user account (if there is exactly one).
DO $$
DECLARE
  v_count integer;
  v_default_doctor_id uuid;
  v_default_doctor_user_id uuid;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.doctores
  WHERE activo = true AND user_id IS NOT NULL;

  IF v_count = 1 THEN
    SELECT id, user_id INTO v_default_doctor_id, v_default_doctor_user_id
    FROM public.doctores
    WHERE activo = true AND user_id IS NOT NULL
    ORDER BY created_at
    LIMIT 1;

    UPDATE public.citas c
    SET doctor_id = v_default_doctor_id,
        user_id = v_default_doctor_user_id
    WHERE c.user_id IS NULL
      AND (
        c.doctor_id IS NULL OR
        EXISTS (
          SELECT 1 FROM public.doctores d_bad
          WHERE d_bad.id = c.doctor_id AND d_bad.user_id IS NULL
        )
      )
      AND COALESCE(NULLIF(c."fechaCita", ''), '1900-01-01') >= to_char(current_date, 'YYYY-MM-DD');
  END IF;
END $$;

COMMIT;