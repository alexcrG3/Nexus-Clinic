-- Agregar columna consultorio a la tabla doctores
ALTER TABLE public.doctores ADD COLUMN IF NOT EXISTS consultorio TEXT;

COMMENT ON COLUMN public.doctores.consultorio IS 'Número o nombre del consultorio asignado al doctor (ej. Consultorio 1, 102, Sala Dental A)';
