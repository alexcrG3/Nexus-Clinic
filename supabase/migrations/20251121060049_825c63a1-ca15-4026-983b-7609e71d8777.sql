-- Actualizar el rol del usuario mario@fer.com a medico
UPDATE profiles
SET role = 'medico'
WHERE email = 'mario@fer.com';

-- Actualizar también en user_roles
UPDATE user_roles
SET role = 'medico'
WHERE user_id = 'cf555b18-e40b-44d5-977a-a69607d3a323';

-- Insertar antecedentes médicos para los clientes
INSERT INTO antecedentes_medicos (cliente_id, alergias, enfermedades_cronicas, medicamentos_actuales, cirugias_previas, antecedentes_familiares, habitos) VALUES

-- María González (Quiropráctica)
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 
 ARRAY['Polen']::text[], 
 ARRAY['Migraña crónica']::text[], 
 ARRAY['Ibuprofeno 400mg']::text[], 
 ARRAY[]::text[], 
 'Madre con artritis reumatoide',
 '{"tabaquismo": false, "alcohol": false, "ejercicio": "Yoga 2 veces por semana"}'::jsonb),

-- Carlos Pérez (Fisioterapia)
('b2c3d4e5-f678-9012-3456-7890abcdef12',
 ARRAY['Penicilina']::text[],
 ARRAY['Diabetes tipo 2 controlada']::text[],
 ARRAY['Metformina 850mg', 'Atorvastatina 20mg']::text[],
 ARRAY['Apendicectomía (2015)']::text[],
 'Padre diabético, madre hipertensa',
 '{"tabaquismo": false, "alcohol": true, "ejercicio": "Caminata diaria 30 min"}'::jsonb),

-- Ana Martínez (Odontología)
('c3d4e5f6-7890-1234-5678-90abcdef1234',
 ARRAY[]::text[],
 ARRAY[]::text[],
 ARRAY[]::text[],
 ARRAY['Cesárea (2018)']::text[],
 'Sin antecedentes relevantes',
 '{"tabaquismo": false, "alcohol": false, "ejercicio": "Gimnasio 3 veces por semana"}'::jsonb),

-- José Rodríguez (Quiropráctica)
('d4e5f678-9012-3456-7890-abcdef123456',
 ARRAY['Latex']::text[],
 ARRAY['Hipertensión arterial']::text[],
 ARRAY['Losartán 50mg', 'Hidroclorotiazida 12.5mg']::text[],
 ARRAY['Meniscectomía rodilla derecha (2019)']::text[],
 'Padre con enfermedad cardiovascular',
 '{"tabaquismo": true, "alcohol": true, "ejercicio": "Ocasional"}'::jsonb)

ON CONFLICT (cliente_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  enfermedades_cronicas = EXCLUDED.enfermedades_cronicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  cirugias_previas = EXCLUDED.cirugias_previas,
  antecedentes_familiares = EXCLUDED.antecedentes_familiares,
  habitos = EXCLUDED.habitos;