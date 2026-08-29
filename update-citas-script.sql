-- Script para vincular las citas existentes con los clientes correctos
-- Ejecutar en Supabase SQL Editor

-- Vincular Carlos Pérez
UPDATE citas 
SET cliente_id = 'b2c3d4e5-f678-9012-3456-7890abcdef12'
WHERE nombre = 'Carlos Pérez' AND cliente_id IS NULL;

-- Vincular Ana Martínez  
UPDATE citas 
SET cliente_id = 'c3d4e5f6-7890-1234-5678-90abcdef1234'
WHERE nombre = 'Ana Martínez' AND cliente_id IS NULL;

-- Vincular José Rodríguez
UPDATE citas 
SET cliente_id = 'd4e5f678-9012-3456-7890-abcdef123456'
WHERE nombre = 'José Rodríguez' AND cliente_id IS NULL;

-- Vincular María González
UPDATE citas 
SET cliente_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
WHERE nombre = 'María González' AND cliente_id IS NULL;

-- Actualizar hora_cita para las citas
UPDATE citas 
SET hora_cita = '09:00:00'
WHERE nombre = 'José Rodríguez' AND hora_cita IS NULL;

UPDATE citas 
SET hora_cita = '10:00:00'
WHERE nombre = 'María González' AND hora_cita IS NULL;

UPDATE citas 
SET hora_cita = '11:00:00'
WHERE nombre = 'Carlos Pérez' AND hora_cita IS NULL;

UPDATE citas 
SET hora_cita = '14:00:00'
WHERE nombre = 'Ana Martínez' AND hora_cita IS NULL;

-- Verificar los cambios
SELECT c.id, c.nombre, c.telefono, c."fechaCita", c.hora_cita, c.cliente_id, c.estado, 
       cl.nombre || ' ' || cl.apellidos as cliente_completo
FROM citas c
LEFT JOIN clientes cl ON cl.id = c.cliente_id
WHERE c."fechaCita" = '2025-11-21'
ORDER BY c.hora_cita;
