-- Update clientes without organizacion_id to use the main organization
UPDATE clientes 
SET organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950' 
WHERE organizacion_id IS NULL;

-- Update citas without organizacion_id
UPDATE citas 
SET organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950' 
WHERE organizacion_id IS NULL;

-- Update profiles without organizacion_id
UPDATE profiles 
SET organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950' 
WHERE organizacion_id IS NULL;

-- Update expedientes without organizacion_id
UPDATE expedientes 
SET organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950' 
WHERE organizacion_id IS NULL;