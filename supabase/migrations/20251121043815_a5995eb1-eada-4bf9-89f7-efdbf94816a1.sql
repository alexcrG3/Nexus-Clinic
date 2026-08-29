-- Actualizar el perfil del usuario con la organización
UPDATE profiles 
SET organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950',
    nombre = 'Alex',
    apellidos = 'Gómez',
    role = 'admin_clinica'
WHERE id = '614ead6d-e3af-408d-91fc-3bd7c60c410e';

-- Insertar 4 pacientes
INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, organizacion_id, user_id) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'María', 'González Rodríguez', '1-0234-0567', '8888-1234', 'maria.gonzalez@email.com', 'San José, Centro, Avenida Central', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('b2c3d4e5-f678-9012-3456-7890abcdef12', 'Carlos', 'Pérez Solano', '2-0345-0678', '8777-5678', 'carlos.perez@email.com', 'Heredia, San Francisco, Residencial Los Arcos', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('c3d4e5f6-7890-1234-5678-90abcdef1234', 'Ana', 'Martínez Campos', '1-0456-0789', '8666-9012', 'ana.martinez@email.com', 'Alajuela, Centro, Calle 2', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('d4e5f678-9012-3456-7890-abcdef123456', 'José', 'Rodríguez Mora', '2-0567-0890', '8555-3456', 'jose.rodriguez@email.com', 'Cartago, Oriental, Barrio La Lima', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329');

-- Insertar expedientes para cada paciente
INSERT INTO expedientes (id, cliente_id, profesional_id, detalle, organizacion_id, fecha, documentos) VALUES
('e1f2a3b4-c5d6-7890-1234-567890abcdef', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'Paciente con dolor cervical crónico. Historial de trabajo de oficina prolongado.', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '2024-01-15', '[]'),
('f2a3b4c5-d6e7-8901-2345-67890abcdef1', 'b2c3d4e5-f678-9012-3456-7890abcdef12', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'Paciente con lumbalgia. Practica deportes de alto impacto.', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '2024-02-10', '[]'),
('a3b4c5d6-e7f8-9012-3456-7890abcdef12', 'c3d4e5f6-7890-1234-5678-90abcdef1234', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'Paciente con escoliosis leve. Requiere seguimiento periódico.', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '2024-01-20', '[]'),
('b4c5d6e7-f890-1234-5678-90abcdef1234', 'd4e5f678-9012-3456-7890-abcdef123456', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'Paciente con cervicalgia post-traumática. Accidente vehicular hace 6 meses.', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '2024-03-05', '[]');

-- Insertar consultas para cada expediente
INSERT INTO consultas (expediente_id, profesional_id, fecha, detalle, notas, documentos) VALUES
-- Consultas para María González
('e1f2a3b4-c5d6-7890-1234-567890abcdef', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-01-15', 'Primera consulta: Evaluación inicial. Dolor cervical 7/10. Rango de movimiento limitado.', 'Plan: Ajustes quiroprácticos 2x semana. Ejercicios de estiramiento.', '[{"nombre": "Radiografía Cervical", "tipo": "imagen", "url": "https://example.com/docs/radiografia1.jpg"}]'),
('e1f2a3b4-c5d6-7890-1234-567890abcdef', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-01-22', 'Segunda consulta: Mejoría del 30%. Dolor 5/10. Continuar tratamiento.', 'Respuesta positiva al ajuste cervical. Reforzar ejercicios en casa.', '[]'),
('e1f2a3b4-c5d6-7890-1234-567890abcdef', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-02-05', 'Consulta de seguimiento: Dolor reducido a 3/10. Mejor movilidad cervical.', 'Reducir frecuencia a 1x semana. Paciente muy colaborador.', '[]'),

-- Consultas para Carlos Pérez
('f2a3b4c5-d6e7-8901-2345-67890abcdef1', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-02-10', 'Evaluación inicial: Lumbalgia aguda. Dolor 8/10 al flexionar.', 'Inicio tratamiento intensivo. Reposo relativo. Crioterapia.', '[{"nombre": "Resonancia Lumbar", "tipo": "imagen", "url": "https://example.com/docs/resonancia1.jpg"}]'),
('f2a3b4c5-d6e7-8901-2345-67890abcdef1', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-02-17', 'Segunda sesión: Mejoría significativa. Dolor 4/10.', 'Continuar con ajustes lumbares. Agregar ejercicios de fortalecimiento.', '[]'),

-- Consultas para Ana Martínez
('a3b4c5d6-e7f8-9012-3456-7890abcdef12', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-01-20', 'Primera consulta: Escoliosis leve detectada. Asintomática actualmente.', 'Plan preventivo. Ejercicios posturales. Control trimestral.', '[{"nombre": "Radiografía Columna Completa", "tipo": "imagen", "url": "https://example.com/docs/escoliosis1.jpg"}]'),
('a3b4c5d6-e7f8-9012-3456-7890abcdef12', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-04-20', 'Control trimestral: Sin progresión. Continuar ejercicios.', 'Excelente adherencia al tratamiento. Mantener rutina.', '[]'),

-- Consultas para José Rodríguez
('b4c5d6e7-f890-1234-5678-90abcdef1234', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-03-05', 'Evaluación post-trauma: Limitación severa movimiento cervical. Dolor 9/10.', 'Tratamiento gradual. Movilización suave. Terapia multimodal.', '[{"nombre": "TAC Cervical", "tipo": "imagen", "url": "https://example.com/docs/tac1.jpg"}, {"nombre": "Informe Médico Legal", "tipo": "documento", "url": "https://example.com/docs/informe1.pdf"}]'),
('b4c5d6e7-f890-1234-5678-90abcdef1234', '974076e9-a56d-4df0-99da-3f0da85c9329', '2024-03-12', 'Segunda consulta: Ligera mejoría. Dolor 7/10. Mayor rango de movimiento.', 'Progreso lento pero constante. Continuar tratamiento conservador.', '[]');

-- Insertar citas próximas (usando comillas dobles para el nombre de la columna)
INSERT INTO citas (nombre, telefono, "fechaCita", estado, medico_id, organizacion_id, user_id) VALUES
('María González', '8888-1234', '2024-11-25', 'confirmada', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('Carlos Pérez', '8777-5678', '2024-11-25', 'pendiente', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('Ana Martínez', '8666-9012', '2024-11-26', 'confirmada', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329'),
('José Rodríguez', '8555-3456', '2024-11-27', 'pendiente', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', '974076e9-a56d-4df0-99da-3f0da85c9329');