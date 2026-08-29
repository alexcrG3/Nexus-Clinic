-- Actualizar todos los perfiles a la organización Nova Dental
UPDATE public.profiles 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';

-- Actualizar todos los pacientes a la organización Nova Dental
UPDATE public.clientes 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';

-- Actualizar todos los expedientes a la organización Nova Dental
UPDATE public.expedientes 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';

-- Actualizar todas las citas a la organización Nova Dental
UPDATE public.citas 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';

-- Actualizar todos los pagos a la organización Nova Dental
UPDATE public.pagos 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';

-- Actualizar todos los servicios a la organización Nova Dental
UPDATE public.servicios 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE organizacion_id IS NULL OR organizacion_id != '60facc89-5b03-4b33-8870-4a3e128521f3';