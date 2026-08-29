-- Actualizar el perfil existente a médico
UPDATE profiles 
SET role = 'medico',
    nombre = 'Dr. Juan',
    apellidos = 'Pérez Médico',
    licencia_profesional = 'MED-12345'
WHERE user_id = '974076e9-a56d-4df0-99da-3f0da85c9329';

-- Asignar el rol de médico en la tabla user_roles
INSERT INTO user_roles (user_id, role)
VALUES ('974076e9-a56d-4df0-99da-3f0da85c9329', 'medico')
ON CONFLICT (user_id, role) DO NOTHING;