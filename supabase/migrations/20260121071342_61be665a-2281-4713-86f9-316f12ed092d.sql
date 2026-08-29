-- 1) Backfill: asignar doctor_id a citas cuando solo existe user_id
UPDATE public.citas c
SET doctor_id = d.id
FROM public.doctores d
WHERE c.doctor_id IS NULL
  AND c.user_id IS NOT NULL
  AND c.user_id = d.user_id
  AND d.activo = true;

-- 2) Backfill: asignar doctor_id a citas cuando el expediente del paciente ya tiene profesional_id
UPDATE public.citas c
SET doctor_id = d.id,
    user_id = COALESCE(c.user_id, d.user_id)
FROM public.expedientes e
JOIN public.profiles p ON p.id = e.profesional_id
JOIN public.doctores d ON d.user_id = p.user_id AND d.activo = true
WHERE c.doctor_id IS NULL
  AND c.cliente_id IS NOT NULL
  AND e.cliente_id = c.cliente_id;

-- 3) Fix puntual: David Solís -> Dr. Juan Pérez
UPDATE public.citas
SET doctor_id = '8ba0bbb9-d420-477c-b29e-a16ba621bb20',
    user_id = '43f6b7b9-7592-4148-8dd6-6340256fd229'
WHERE id = 'c477a49d-32b0-47e9-b1ad-7ab3d4dd9202';

UPDATE public.expedientes
SET profesional_id = 'da521506-7b73-461e-a98a-69d228c7f693'
WHERE id = '9c7b572f-7f36-4e00-87cd-9c59ca072bad'
  AND profesional_id IS NULL;
