-- Eliminar la organización "Quiropractica GM" que ya no se utiliza
-- Primero verificamos que no haya datos relacionados (ya migramos todo a Nova Dental)

DELETE FROM public.organizaciones 
WHERE id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950' 
  AND nombre = 'Quiropractica GM';