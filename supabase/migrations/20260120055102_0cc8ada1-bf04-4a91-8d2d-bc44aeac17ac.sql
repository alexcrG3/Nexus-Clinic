
-- Insertar odontogramas para Carlos Mendoza y Alex G
INSERT INTO odontogramas (expediente_id, cliente_id, datos_dientes, fecha)
VALUES 
  ('3be142cd-94f3-4fbb-af16-3b4d657f35d2', '2a5b8957-0bd2-4f64-8967-7135b946ce62', 
   '{"18":{"status":"ausente"},"17":{"status":"sano"},"16":{"status":"caries","notas":"Caries mesial profunda"},"15":{"status":"sano"},"14":{"status":"obturado"},"13":{"status":"sano"},"12":{"status":"sano"},"11":{"status":"fractura"},"21":{"status":"sano"},"22":{"status":"sano"},"23":{"status":"sano"},"24":{"status":"sano"},"25":{"status":"sano"},"26":{"status":"sano"},"27":{"status":"sano"},"28":{"status":"ausente"},"38":{"status":"ausente"},"37":{"status":"sano"},"36":{"status":"sano"},"35":{"status":"sano"},"34":{"status":"sano"},"33":{"status":"sano"},"32":{"status":"sano"},"31":{"status":"sano"},"41":{"status":"sano"},"42":{"status":"sano"},"43":{"status":"sano"},"44":{"status":"sano"},"45":{"status":"sano"},"46":{"status":"obturado"},"47":{"status":"sano"},"48":{"status":"ausente"}}', 
   NOW()),
  ('859a11d3-470c-4b96-9a1e-f98fe8744fe8', '4d1c4956-7a98-4512-834b-84456a02bd5e', 
   '{"18":{"status":"sano"},"17":{"status":"sano"},"16":{"status":"sano"},"15":{"status":"sano"},"14":{"status":"sano"},"13":{"status":"sano"},"12":{"status":"caries"},"11":{"status":"sano"},"21":{"status":"sano"},"22":{"status":"caries"},"23":{"status":"sano"},"24":{"status":"sano"},"25":{"status":"sano"},"26":{"status":"sano"},"27":{"status":"sano"},"28":{"status":"sano"},"38":{"status":"sano"},"37":{"status":"sano"},"36":{"status":"sano"},"35":{"status":"sano"},"34":{"status":"sano"},"33":{"status":"sano"},"32":{"status":"sano"},"31":{"status":"sano"},"41":{"status":"sano"},"42":{"status":"sano"},"43":{"status":"sano"},"44":{"status":"sano"},"45":{"status":"sano"},"46":{"status":"sano"},"47":{"status":"sano"},"48":{"status":"sano"}}', 
   NOW());

-- Consultas para Carlos Mendoza Silva
INSERT INTO consultas (expediente_id, fecha, motivo_consulta, anamnesis, signos_vitales, examen_fisico, diagnostico_principal, codigo_cie10, plan_tratamiento, medicamentos_recetados, recomendaciones, estado_consulta, profesional_id)
VALUES 
  ('3be142cd-94f3-4fbb-af16-3b4d657f35d2', NOW() - INTERVAL '20 days',
   'Fractura de diente anterior',
   'Paciente sufrió traumatismo en incisivo central superior izquierdo hace 2 días jugando fútbol.',
   '{"presion_arterial":"122/80","frecuencia_cardiaca":"76","temperatura":"36.6","peso":"82","talla":"178"}',
   'Fractura coronaria no complicada pieza 11, sin exposición pulpar. Movilidad grado 0.',
   'Fractura coronaria no complicada pieza 11',
   'S02.51',
   'Reconstrucción con resina compuesta estratificada.',
   '[{"nombre":"Naproxeno","dosis":"550mg","frecuencia":"Cada 12 horas por 3 días"}]',
   'Dieta blanda por 1 semana. No morder con dientes anteriores.',
   'finalizada',
   '43f6b7b9-7592-4148-8dd6-6340256fd229'),
  ('3be142cd-94f3-4fbb-af16-3b4d657f35d2', NOW() - INTERVAL '5 days',
   'Control post-traumatismo',
   'Control de reconstrucción dental. Sin molestias.',
   '{"presion_arterial":"118/76","frecuencia_cardiaca":"70","temperatura":"36.5","peso":"82","talla":"178"}',
   'Reconstrucción pieza 11 intacta. Caries profunda en pieza 16 detectada.',
   'Caries dental profunda pieza 16',
   'K02.1',
   'Radiografía periapical pieza 16. Valorar endodoncia.',
   '[]',
   'Mantener higiene oral.',
   'finalizada',
   '43f6b7b9-7592-4148-8dd6-6340256fd229');

-- Consultas para Alex G
INSERT INTO consultas (expediente_id, fecha, motivo_consulta, anamnesis, signos_vitales, examen_fisico, diagnostico_principal, codigo_cie10, plan_tratamiento, medicamentos_recetados, recomendaciones, estado_consulta, profesional_id)
VALUES 
  ('859a11d3-470c-4b96-9a1e-f98fe8744fe8', NOW() - INTERVAL '10 days',
   'Revisión dental de rutina',
   'Chequeo dental de rutina. Sangrado ocasional al cepillarse.',
   '{"presion_arterial":"115/72","frecuencia_cardiaca":"65","temperatura":"36.4","peso":"70","talla":"172"}',
   'Caries incipiente en piezas 12 y 22. Gingivitis leve.',
   'Caries dental incipiente múltiple',
   'K02.0',
   'Obturaciones preventivas piezas 12 y 22. Profilaxis dental.',
   '[]',
   'Mejorar técnica de cepillado. Usar hilo dental.',
   'finalizada',
   '43f6b7b9-7592-4148-8dd6-6340256fd229'),
  ('859a11d3-470c-4b96-9a1e-f98fe8744fe8', NOW() - INTERVAL '3 days',
   'Tratamiento de caries',
   'Tratamiento de caries detectadas en visita anterior.',
   '{"presion_arterial":"118/74","frecuencia_cardiaca":"68","temperatura":"36.5","peso":"70","talla":"172"}',
   'Caries clase III en piezas 12 y 22 confirmadas.',
   'Caries dental clase III piezas 12 y 22',
   'K02.1',
   'Obturaciones con resina compuesta.',
   '[]',
   'Dieta blanda por 2 horas. Control en 6 meses.',
   'finalizada',
   '43f6b7b9-7592-4148-8dd6-6340256fd229');

-- Antecedentes médicos
INSERT INTO antecedentes_medicos (cliente_id, alergias, enfermedades_cronicas, medicamentos_actuales, cirugias_previas, antecedentes_familiares)
VALUES 
  ('2a5b8957-0bd2-4f64-8967-7135b946ce62', ARRAY['Penicilina'], ARRAY['Ninguna'], ARRAY['Ninguno'], ARRAY['Ninguna'], '{"diabetes": false, "hipertension": false, "cancer": false, "enfermedades_cardiacas": true}'),
  ('4d1c4956-7a98-4512-834b-84456a02bd5e', ARRAY['Látex'], ARRAY['Asma leve'], ARRAY['Salbutamol inhalador PRN'], ARRAY['Ninguna'], '{"diabetes": true, "hipertension": false, "cancer": false, "enfermedades_cardiacas": false}')
ON CONFLICT (cliente_id) DO UPDATE SET
  alergias = EXCLUDED.alergias,
  enfermedades_cronicas = EXCLUDED.enfermedades_cronicas,
  medicamentos_actuales = EXCLUDED.medicamentos_actuales,
  cirugias_previas = EXCLUDED.cirugias_previas,
  antecedentes_familiares = EXCLUDED.antecedentes_familiares;
