-- Script para crear expedientes de ejemplo con datos completos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Actualizar datos completos de los pacientes existentes
UPDATE clientes SET 
  fecha_nacimiento = '1985-03-15',
  sexo = 'Masculino',
  grupo_sanguineo = 'O+',
  organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'
WHERE id = 'd4e5f678-9012-3456-7890-abcdef123456';

UPDATE clientes SET 
  fecha_nacimiento = '1990-07-22',
  sexo = 'Femenino',
  grupo_sanguineo = 'A+',
  organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'
WHERE id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

UPDATE clientes SET 
  fecha_nacimiento = '1978-11-08',
  sexo = 'Masculino',
  grupo_sanguineo = 'B+',
  organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'
WHERE id = 'b2c3d4e5-f678-9012-3456-7890abcdef12';

UPDATE clientes SET 
  fecha_nacimiento = '1995-05-30',
  sexo = 'Femenino',
  grupo_sanguineo = 'AB+',
  organizacion_id = 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'
WHERE id = 'c3d4e5f6-7890-1234-5678-90abcdef1234';

-- 2. Crear antecedentes médicos para cada paciente
INSERT INTO antecedentes_medicos (cliente_id, alergias, enfermedades_cronicas, medicamentos_actuales, cirugias_previas, antecedentes_familiares, habitos)
VALUES 
  ('d4e5f678-9012-3456-7890-abcdef123456', 
   ARRAY['Penicilina', 'Polen'], 
   ARRAY['Hipertensión'], 
   ARRAY['Losartán 50mg', 'Aspirina 100mg'],
   ARRAY['Apendicectomía (2010)'],
   'Padre con diabetes tipo 2, madre hipertensa',
   '{"tabaquismo": false, "alcohol": "social", "ejercicio": "3 veces por semana"}'::jsonb),
   
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef',
   ARRAY['Ibuprofeno'],
   ARRAY[]::text[],
   ARRAY[]::text[],
   ARRAY[]::text[],
   'Madre con hipotiroidismo',
   '{"tabaquismo": false, "alcohol": false, "ejercicio": "5 veces por semana"}'::jsonb),
   
  ('b2c3d4e5-f678-9012-3456-7890abcdef12',
   ARRAY['Mariscos', 'Látex'],
   ARRAY['Diabetes tipo 2', 'Artritis'],
   ARRAY['Metformina 850mg', 'Diclofenaco 50mg'],
   ARRAY['Bypass gástrico (2015)', 'Cirugía de rodilla (2018)'],
   'Padre y abuelo con diabetes',
   '{"tabaquismo": false, "alcohol": false, "ejercicio": "2 veces por semana"}'::jsonb),
   
  ('c3d4e5f6-7890-1234-5678-90abcdef1234',
   ARRAY[]::text[],
   ARRAY[]::text[],
   ARRAY[]::text[],
   ARRAY[]::text[],
   'Sin antecedentes relevantes',
   '{"tabaquismo": false, "alcohol": "ocasional", "ejercicio": "diario"}'::jsonb)
ON CONFLICT (cliente_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  enfermedades_cronicas = EXCLUDED.enfermedades_cronicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  cirugias_previas = EXCLUDED.cirugias_previas,
  antecedentes_familiares = EXCLUDED.antecedentes_familiares,
  habitos = EXCLUDED.habitos;

-- 3. Crear expedientes para cada paciente
INSERT INTO expedientes (cliente_id, profesional_id, organizacion_id, detalle, fecha)
VALUES 
  ('d4e5f678-9012-3456-7890-abcdef123456', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950', 
   'Paciente con historial de hipertensión controlada', '2023-01-15'),
   
  ('a1b2c3d4-e5f6-7890-1234-567890abcdef', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950',
   'Paciente sana, control preventivo', '2023-02-20'),
   
  ('b2c3d4e5-f678-9012-3456-7890abcdef12', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950',
   'Paciente con diabetes tipo 2 y artritis en seguimiento', '2023-03-10'),
   
  ('c3d4e5f6-7890-1234-5678-90abcdef1234', '614ead6d-e3af-408d-91fc-3bd7c60c410e', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950',
   'Primera consulta, paciente joven sin patologías', '2023-04-05')
ON CONFLICT DO NOTHING;

-- 4. Obtener IDs de expedientes para insertar consultas
DO $$
DECLARE
  exp_jose UUID;
  exp_maria UUID;
  exp_carlos UUID;
  exp_ana UUID;
BEGIN
  SELECT id INTO exp_jose FROM expedientes WHERE cliente_id = 'd4e5f678-9012-3456-7890-abcdef123456' LIMIT 1;
  SELECT id INTO exp_maria FROM expedientes WHERE cliente_id = 'a1b2c3d4-e5f6-7890-1234-567890abcdef' LIMIT 1;
  SELECT id INTO exp_carlos FROM expedientes WHERE cliente_id = 'b2c3d4e5-f678-9012-3456-7890abcdef12' LIMIT 1;
  SELECT id INTO exp_ana FROM expedientes WHERE cliente_id = 'c3d4e5f6-7890-1234-5678-90abcdef1234' LIMIT 1;

  -- Consultas para José (Hipertensión)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, signos_vitales, diagnostico_principal, codigo_cie10, plan_tratamiento, procedimiento_realizado, medicamentos_recetados, recomendaciones, proxima_cita, motivo_proxima_cita, estado_consulta)
  VALUES 
    (exp_jose, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-01-15', 
     'Control de hipertensión arterial', 
     'Paciente masculino de 39 años con diagnóstico de HTA hace 5 años. Refiere adherencia al tratamiento. Niega cefalea o mareos. Buen estado general.',
     'Paciente consciente, orientado, bien hidratado. Auscultación cardiopulmonar normal. Abdomen blando, no doloroso.',
     '{"presion_arterial": "130/85", "frecuencia_cardiaca": "72", "temperatura": "36.5", "peso": "78", "talla": "175", "saturacion_oxigeno": "98"}'::jsonb,
     'Hipertensión arterial esencial controlada',
     'I10',
     'Continuar con esquema actual de Losartán 50mg/día y Aspirina 100mg/día. Mantener dieta hiposódica y ejercicio regular.',
     'Toma de signos vitales, examen físico completo',
     '[{"medicamento": "Losartán", "dosis": "50mg", "frecuencia": "1 vez al día", "duracion": "30 días"}, {"medicamento": "Aspirina", "dosis": "100mg", "frecuencia": "1 vez al día", "duracion": "30 días"}]'::jsonb,
     'Continuar dieta baja en sal, caminar 30 minutos diarios, tomar medicamentos a la misma hora',
     '2024-04-15',
     'Control trimestral de presión arterial',
     'finalizada'),
     
    (exp_jose, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-07-20',
     'Dolor lumbar agudo',
     'Paciente refiere dolor en región lumbar baja desde hace 3 días, después de cargar peso. Dolor tipo puntada que aumenta con movimiento.',
     'Limitación para flexión de tronco. Dolor a la palpación de región paravertebral L4-L5. Sin irradiación a miembros inferiores.',
     '{"presion_arterial": "125/80", "frecuencia_cardiaca": "70", "temperatura": "36.3", "peso": "76", "saturacion_oxigeno": "99"}'::jsonb,
     'Lumbalgia mecánica aguda',
     'M54.5',
     'Reposo relativo, calor local, fisioterapia 6 sesiones',
     'Examen físico de columna, evaluación neurológica',
     '[{"medicamento": "Diclofenaco", "dosis": "50mg", "frecuencia": "cada 8 horas", "duracion": "5 días"}, {"medicamento": "Tiocolchicósido", "dosis": "4mg", "frecuencia": "cada 12 horas", "duracion": "5 días"}]'::jsonb,
     'Evitar cargar peso, aplicar calor local 20 min 3 veces al día, ejercicios de estiramiento suave',
     '2024-08-05',
     'Evaluación de respuesta a tratamiento',
     'finalizada');

  -- Consultas para María (Paciente sana)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, signos_vitales, diagnostico_principal, plan_tratamiento, procedimiento_realizado, recomendaciones, proxima_cita, motivo_proxima_cita, estado_consulta)
  VALUES 
    (exp_maria, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-03-10',
     'Chequeo anual preventivo',
     'Paciente femenina de 34 años, sin antecedentes patológicos. Acude para control preventivo anual. Niega síntomas. Practica ejercicio regularmente.',
     'Excelente estado general. Signos vitales normales. Exploración física completa sin hallazgos patológicos.',
     '{"presion_arterial": "110/70", "frecuencia_cardiaca": "65", "temperatura": "36.4", "peso": "58", "talla": "162", "imc": "22.1"}'::jsonb,
     'Paciente sana - Control preventivo',
     'Mantener hábitos saludables actuales. Solicitar laboratorios de rutina.',
     'Examen físico completo, evaluación nutricional',
     'Continuar con estilo de vida saludable, mantener ejercicio regular',
     '2025-03-10',
     'Control preventivo anual',
     'finalizada'),
     
    (exp_maria, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-09-15',
     'Cefalea tensional',
     'Paciente refiere cefalea frontal bilateral de 2 días de evolución, relacionada con estrés laboral. Sin náuseas ni vómitos.',
     'Paciente alerta, sin déficit neurológico. Tensión muscular en región cervical y trapecio.',
     '{"presion_arterial": "115/75", "frecuencia_cardiaca": "68", "temperatura": "36.6", "peso": "59"}'::jsonb,
     'Cefalea tensional',
     'Manejo del estrés, técnicas de relajación',
     'Evaluación neurológica, palpación cervical',
     '[{"medicamento": "Paracetamol", "dosis": "500mg", "frecuencia": "cada 8 horas si hay dolor", "duracion": "3 días"}]'::jsonb,
     'Técnicas de relajación, masajes cervicales, pausas activas en el trabajo, hidratación adecuada',
     NULL,
     NULL,
     'finalizada');

  -- Consultas para Carlos (Diabetes y Artritis)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, signos_vitales, diagnostico_principal, codigo_cie10, plan_tratamiento, procedimiento_realizado, medicamentos_recetados, recomendaciones, proxima_cita, motivo_proxima_cita, estado_consulta)
  VALUES 
    (exp_carlos, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-02-05',
     'Control de diabetes tipo 2',
     'Paciente masculino de 46 años con DM2 hace 10 años. Refiere buen apego al tratamiento. Últimos controles de glicemia entre 110-130 mg/dl.',
     'Paciente en buen estado general. Pulsos pedios presentes. Sin lesiones en pies. Sensibilidad conservada.',
     '{"presion_arterial": "135/88", "frecuencia_cardiaca": "76", "temperatura": "36.5", "peso": "92", "talla": "172", "imc": "31.1", "glicemia_capilar": "118"}'::jsonb,
     'Diabetes mellitus tipo 2 controlada',
     'E11',
     'Continuar Metformina 850mg c/12h. Reforzar dieta y ejercicio para pérdida de peso.',
     'Examen físico completo, evaluación de pie diabético, glicemia capilar',
     '[{"medicamento": "Metformina", "dosis": "850mg", "frecuencia": "cada 12 horas", "duracion": "90 días"}]'::jsonb,
     'Dieta de 1800 kcal, ejercicio 5 veces por semana, control de glicemia en casa 2 veces por semana',
     '2024-05-05',
     'Control trimestral de diabetes',
     'finalizada'),
     
    (exp_carlos, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-06-20',
     'Dolor en rodilla derecha',
     'Paciente con artritis conocida. Refiere aumento de dolor en rodilla derecha desde hace 1 semana, sin trauma. Rigidez matutina de 30 minutos.',
     'Rodilla derecha con leve edema, dolor a la palpación, limitación para flexión completa. Crepitación presente.',
     '{"presion_arterial": "132/86", "frecuencia_cardiaca": "74", "temperatura": "36.4", "peso": "90"}'::jsonb,
     'Gonartritis derecha agudizada',
     'M17.1',
     'Manejo analgésico, fisioterapia, considerar infiltración si no mejora',
     'Examen articular, evaluación de rangos de movimiento',
     '[{"medicamento": "Diclofenaco", "dosis": "50mg", "frecuencia": "cada 12 horas con alimentos", "duracion": "10 días"}, {"medicamento": "Omeprazol", "dosis": "20mg", "frecuencia": "1 vez al día en ayunas", "duracion": "10 días"}]'::jsonb,
     'Aplicar frío local 15 min 3 veces al día, evitar subir escaleras, usar bastón si es necesario, fisioterapia',
     '2024-07-20',
     'Evaluar respuesta al tratamiento, considerar infiltración',
     'finalizada');

  -- Consultas para Ana (Paciente joven)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, signos_vitales, diagnostico_principal, plan_tratamiento, procedimiento_realizado, recomendaciones, proxima_cita, motivo_proxima_cita, estado_consulta)
  VALUES 
    (exp_ana, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-05-12',
     'Primera consulta - Evaluación general',
     'Paciente femenina de 29 años, sana, sin antecedentes de importancia. Acude por primera vez para establecer seguimiento médico.',
     'Paciente en excelente estado de salud. Exploración física completa normal.',
     '{"presion_arterial": "108/68", "frecuencia_cardiaca": "62", "temperatura": "36.5", "peso": "55", "talla": "165", "imc": "20.2"}'::jsonb,
     'Paciente sana',
     'Mantener hábitos saludables. Solicitar laboratorios de base.',
     'Historia clínica completa, examen físico general',
     'Continuar con alimentación balanceada y ejercicio regular. Protección solar diaria.',
     '2025-05-12',
     'Control anual preventivo',
     'finalizada'),
     
    (exp_ana, '614ead6d-e3af-408d-91fc-3bd7c60c410e', '2024-10-08',
     'Infección respiratoria alta',
     'Paciente refiere congestión nasal, odinofagia y tos seca desde hace 3 días. Afebril. Sin disnea.',
     'Faringe hiperémica sin exudado. Fosas nasales con secreción clara. Auscultación pulmonar normal.',
     '{"presion_arterial": "110/70", "frecuencia_cardiaca": "70", "temperatura": "37.2", "peso": "56"}'::jsonb,
     'Rinofaringitis aguda viral',
     'J00',
     'Tratamiento sintomático, medidas generales',
     'Examen físico de vías respiratorias superiores',
     '[{"medicamento": "Paracetamol", "dosis": "500mg", "frecuencia": "cada 6-8 horas si fiebre o dolor", "duracion": "5 días"}, {"medicamento": "Loratadina", "dosis": "10mg", "frecuencia": "1 vez al día", "duracion": "5 días"}]'::jsonb,
     'Abundantes líquidos, reposo relativo, evitar cambios bruscos de temperatura, lavados nasales con solución salina',
     NULL,
     NULL,
     'finalizada');
END $$;
