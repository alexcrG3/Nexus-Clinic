-- Reasignar citas futuras de doctores sin user_id al único doctor activo con cuenta de usuario
DO $$
DECLARE
  v_default_doctor_id uuid;
  v_default_doctor_user_id uuid;
BEGIN
  -- Obtener el único doctor activo con user_id
  SELECT id, user_id INTO v_default_doctor_id, v_default_doctor_user_id
  FROM public.doctores
  WHERE activo = true AND user_id IS NOT NULL
  ORDER BY created_at
  LIMIT 1;

  IF v_default_doctor_id IS NOT NULL THEN
    -- Reasignar citas futuras que tengan doctor sin user_id
    UPDATE public.citas c
    SET doctor_id = v_default_doctor_id,
        user_id = v_default_doctor_user_id
    WHERE EXISTS (
      SELECT 1 FROM public.doctores d
      WHERE d.id = c.doctor_id AND d.user_id IS NULL
    )
    AND COALESCE(NULLIF(c."fechaCita", ''), '1900-01-01') >= to_char(current_date, 'YYYY-MM-DD');
  END IF;
END $$;