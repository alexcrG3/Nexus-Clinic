-- Actualizar las fechas de las citas para que sean de hoy
UPDATE citas 
SET "fechaCita" = CURRENT_DATE::text
WHERE "fechaCita" IN ('2024-11-25', '2024-11-26', '2024-11-27');