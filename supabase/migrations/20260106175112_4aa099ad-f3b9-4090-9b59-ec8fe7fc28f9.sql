-- Mover todos los pacientes de Quiropractica GM a Nova Dental
UPDATE public.clientes 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3' 
WHERE organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950';