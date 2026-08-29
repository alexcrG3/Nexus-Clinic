
-- Eliminar la función existente (con 5 parámetros)
DROP FUNCTION IF EXISTS public.crear_cita_desde_n8n(text, text, text, text, text);

-- Crear la nueva función mejorada con parámetros opcionales adicionales
CREATE OR REPLACE FUNCTION public.crear_cita_desde_n8n(
  p_fecha text, 
  p_nombre text, 
  p_telefono text, 
  p_nombre_servicio text, 
  p_nombre_doctor text,
  p_cedula text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_apellidos text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Limpiar nombre
  v_nombre_limpio := trim(p_nombre);
  
  -- 1. Buscar cliente por teléfono normalizado
  SELECT id INTO v_cliente_id
  FROM clientes
  WHERE regexp_replace(telefono, '[^0-9]', '', 'g') = v_telefono_normalizado
  LIMIT 1;
  
  -- Si no existe cliente, crearlo
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
  
  -- 2. Buscar doctor por nombre (búsqueda flexible)
  SELECT id, user_id INTO v_doctor_id, v_doctor_user_id
  FROM doctores
  WHERE 
    LOWER(nombre) LIKE LOWER('%' || p_nombre_doctor || '%')
    AND activo = true
  LIMIT 1;
  
  IF v_doctor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Doctor no encontrado: ' || p_nombre_doctor
    );
  END IF;
  
  -- 3. Buscar servicio por nombre (búsqueda flexible)
  SELECT id, duracion, precio INTO v_servicio_id, v_duracion, v_precio
  FROM servicios
  WHERE 
    LOWER(nombre) LIKE LOWER('%' || p_nombre_servicio || '%')
    AND activo = true
  LIMIT 1;
  
  IF v_servicio_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Servicio no encontrado: ' || p_nombre_servicio
    );
  END IF;
  
  -- 4. Parsear fecha y hora del formato ISO (2026-01-21T10:00:00)
  v_fecha_cita := SPLIT_PART(p_fecha, 'T', 1);
  
  -- Extraer hora, manejando diferentes formatos
  IF POSITION('T' IN p_fecha) > 0 THEN
    -- Quitar timezone si existe
    v_hora_cita := SUBSTRING(SPLIT_PART(p_fecha, 'T', 2) FROM 1 FOR 8)::time;
  ELSE
    v_hora_cita := '09:00:00'::time;
  END IF;
  
  -- 5. Verificar que no exista cita en el mismo horario para el doctor
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
  
  -- 6. Insertar la cita
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
    organizacion_id
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
    v_organizacion_id
  )
  RETURNING id INTO v_cita_id;
  
  -- 7. Obtener profile.id del doctor para asignar como profesional
  SELECT p.id INTO v_profesional_id
  FROM profiles p
  WHERE p.user_id = v_doctor_user_id;
  
  -- 8. Crear o actualizar expediente
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
  
  -- 9. Retornar éxito con datos completos
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
    'precio', v_precio
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

COMMENT ON FUNCTION crear_cita_desde_n8n IS 'Crea cita desde n8n/chatbot. Normaliza teléfonos, crea cliente si no existe, asigna doctor y crea expediente automáticamente.';
