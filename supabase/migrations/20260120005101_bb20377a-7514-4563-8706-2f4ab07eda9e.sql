-- Función para crear cita desde n8n (recibe nombres, resuelve IDs)
CREATE OR REPLACE FUNCTION public.crear_cita_desde_n8n(
  p_fecha text,           -- Fecha ISO: 2025-07-10T15:30:00
  p_nombre text,          -- Nombre del paciente
  p_telefono text,        -- Teléfono del paciente
  p_nombre_servicio text, -- Nombre del servicio
  p_nombre_doctor text    -- Nombre del doctor
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id uuid;
  v_doctor_id uuid;
  v_servicio_id uuid;
  v_fecha_cita text;
  v_hora_cita time;
  v_duracion integer;
  v_precio numeric;
  v_organizacion_id uuid := '60facc89-5b03-4b33-8870-4a3e128521f3'; -- Clinica Nova Dental
  v_cita_id uuid;
BEGIN
  -- 1. Buscar cliente por teléfono
  SELECT id INTO v_cliente_id
  FROM clientes
  WHERE telefono = p_telefono
  LIMIT 1;
  
  IF v_cliente_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cliente no encontrado con teléfono: ' || p_telefono
    );
  END IF;
  
  -- 2. Buscar doctor por nombre (búsqueda flexible)
  SELECT id INTO v_doctor_id
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
  
  -- 4. Parsear fecha y hora del formato ISO
  v_fecha_cita := SPLIT_PART(p_fecha, 'T', 1);
  v_hora_cita := SPLIT_PART(p_fecha, 'T', 2)::time;
  
  -- 5. Verificar que no exista cita en el mismo horario para el doctor
  IF EXISTS (
    SELECT 1 FROM citas
    WHERE doctor_id = v_doctor_id
    AND "fechaCita" = v_fecha_cita
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
    p_nombre,
    p_telefono,
    'pendiente',
    v_organizacion_id
  )
  RETURNING id INTO v_cita_id;
  
  -- 7. Retornar éxito con datos de la cita
  RETURN jsonb_build_object(
    'success', true,
    'cita_id', v_cita_id,
    'cliente_id', v_cliente_id,
    'doctor_id', v_doctor_id,
    'servicio_id', v_servicio_id,
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