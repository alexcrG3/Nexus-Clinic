-- Asignar la cita sin organizacion_id a Nova Dental
UPDATE public.citas 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3' 
WHERE organizacion_id IS NULL;