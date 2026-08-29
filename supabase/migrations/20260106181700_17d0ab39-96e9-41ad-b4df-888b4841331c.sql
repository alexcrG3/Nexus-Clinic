-- Asignar organización Nova Dental a los usuarios admin que no tienen organización
UPDATE public.profiles 
SET organizacion_id = '60facc89-5b03-4b33-8870-4a3e128521f3'
WHERE user_id IN (
  '9cd036a9-0e84-4b1d-a6f6-8d512c46f306',  -- 2admin@medicr.com
  'b062a9e1-c804-4281-adbf-2523ec4d59f0'   -- admin2@medicr.com
)
AND organizacion_id IS NULL;