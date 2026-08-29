-- Agregar más doctores a la tabla doctores
INSERT INTO public.doctores (nombre, especialidad, email, telefono, dias_trabajo, activo)
VALUES 
  ('Dr. Roberto Sánchez', 'Odontología Estética', 'roberto.sanchez@clinica.com', '8888-2001', ARRAY['lunes','martes','miercoles','jueves','viernes'], true),
  ('Dra. Patricia López', 'Ortodoncia', 'patricia.lopez@clinica.com', '8888-2002', ARRAY['lunes','miercoles','viernes'], true),
  ('Lic. Miguel Fernández', 'Fisioterapia', 'miguel.fernandez@clinica.com', '8888-2003', ARRAY['lunes','martes','miercoles','jueves'], true),
  ('Dra. Carmen Torres', 'Medicina General', 'carmen.torres@clinica.com', '8888-2004', ARRAY['lunes','martes','miercoles','jueves','viernes'], true);

-- Distribuir las citas existentes entre todos los doctores disponibles
WITH doctores_lista AS (
  SELECT id, nombre, 
    ROW_NUMBER() OVER (ORDER BY nombre) as rn,
    COUNT(*) OVER() as total_docs
  FROM doctores 
  WHERE activo = true
),
citas_numeradas AS (
  SELECT id, 
    ROW_NUMBER() OVER (ORDER BY "fechaCita", hora_cita) as rn
  FROM citas
)
UPDATE citas c
SET doctor_id = d.id
FROM citas_numeradas cn
JOIN doctores_lista d ON ((cn.rn - 1) % d.total_docs + 1) = d.rn
WHERE c.id = cn.id;