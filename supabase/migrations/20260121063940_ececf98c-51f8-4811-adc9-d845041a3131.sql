
-- Asignar las citas de hoy al Dr. Juan Pérez
UPDATE citas 
SET doctor_id = '8ba0bbb9-d420-477c-b29e-a16ba621bb20',
    hora_cita = CASE 
      WHEN hora_cita IS NULL AND nombre = 'Camilo Campos' AND id = 'f94506e6-dd6d-4688-9202-601d264a4193' THEN '09:00:00'
      WHEN hora_cita IS NULL AND nombre = 'Alex' THEN '10:00:00'
      WHEN hora_cita IS NULL AND nombre = 'Camilo Campos' AND id = '71e9a77a-53ae-449a-af20-ed9eef28f080' THEN '11:00:00'
      ELSE hora_cita
    END
WHERE "fechaCita" LIKE '2026-01-21%' 
  AND doctor_id IS NULL;
