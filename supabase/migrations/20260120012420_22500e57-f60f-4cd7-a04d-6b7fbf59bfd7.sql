
-- Corregir la cita de Alex: asignar cliente_id, doctor_id, hora_cita, servicio_id
UPDATE citas
SET 
  cliente_id = '4d1c4956-7a98-4512-834b-84456a02bd5e',
  doctor_id = '8ba0bbb9-d420-477c-b29e-a16ba621bb20',
  hora_cita = '10:00:00',
  servicio_id = (SELECT id FROM servicios WHERE LOWER(nombre) LIKE '%endodoncia%' LIMIT 1)
WHERE id = '0115ac44-0dbb-42dc-aa24-b294691ccfaa';

-- Actualizar el expediente de Alex para asignar el profesional (Dr. Juan Pérez)
UPDATE expedientes
SET profesional_id = (
  SELECT p.id FROM profiles p 
  WHERE p.user_id = '43f6b7b9-7592-4148-8dd6-6340256fd229'
)
WHERE cliente_id = '4d1c4956-7a98-4512-834b-84456a02bd5e'
  AND profesional_id IS NULL;
