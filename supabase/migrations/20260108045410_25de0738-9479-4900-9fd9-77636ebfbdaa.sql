-- Insertar 4 pacientes de ejemplo con historial completo
-- Primero obtenemos una organización existente para asignar los pacientes

DO $$
DECLARE
  v_org_id uuid;
  v_profesional_id uuid;
  v_cliente1_id uuid := gen_random_uuid();
  v_cliente2_id uuid := gen_random_uuid();
  v_cliente3_id uuid := gen_random_uuid();
  v_cliente4_id uuid := gen_random_uuid();
  v_expediente1_id uuid := gen_random_uuid();
  v_expediente2_id uuid := gen_random_uuid();
  v_expediente3_id uuid := gen_random_uuid();
  v_expediente4_id uuid := gen_random_uuid();
BEGIN
  -- Obtener la primera organización disponible
  SELECT id INTO v_org_id FROM organizaciones LIMIT 1;
  
  -- Obtener un profesional médico disponible
  SELECT id INTO v_profesional_id FROM profiles 
  WHERE role IN ('medico', 'odontologo', 'fisioterapeuta', 'quiropractico') 
  LIMIT 1;

  -- Si no hay organización, crear una
  IF v_org_id IS NULL THEN
    INSERT INTO organizaciones (nombre, tipo) VALUES ('Clínica Demo', 'clinica') RETURNING id INTO v_org_id;
  END IF;

  -- Insertar paciente 1: María García López
  INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, fecha_nacimiento, sexo, grupo_sanguineo, organizacion_id)
  VALUES (v_cliente1_id, 'María', 'García López', '1-0234-0567', '8845-6712', 'maria.garcia@email.com', 'San José, Escazú, Calle 5', '1985-03-15', 'Femenino', 'O+', v_org_id);

  -- Insertar paciente 2: Carlos Rodríguez Méndez
  INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, fecha_nacimiento, sexo, grupo_sanguineo, organizacion_id)
  VALUES (v_cliente2_id, 'Carlos', 'Rodríguez Méndez', '2-0456-0789', '8867-3421', 'carlos.rodriguez@email.com', 'Heredia, San Pablo, Central', '1978-07-22', 'Masculino', 'A+', v_org_id);

  -- Insertar paciente 3: Ana Fernández Solís
  INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, fecha_nacimiento, sexo, grupo_sanguineo, organizacion_id)
  VALUES (v_cliente3_id, 'Ana', 'Fernández Solís', '3-0567-0123', '7098-5634', 'ana.fernandez@email.com', 'Cartago, Paraíso, Barrio El Carmen', '1992-11-08', 'Femenino', 'B+', v_org_id);

  -- Insertar paciente 4: José Hernández Vargas
  INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, fecha_nacimiento, sexo, grupo_sanguineo, organizacion_id)
  VALUES (v_cliente4_id, 'José', 'Hernández Vargas', '4-0789-0456', '8934-2178', 'jose.hernandez@email.com', 'Alajuela, Grecia, Centro', '1965-05-30', 'Masculino', 'AB+', v_org_id);

  -- Crear expedientes para cada paciente
  INSERT INTO expedientes (id, cliente_id, profesional_id, organizacion_id, detalle, fecha)
  VALUES (v_expediente1_id, v_cliente1_id, v_profesional_id, v_org_id, 'Paciente con historial de migrañas crónicas. Seguimiento periódico.', NOW() - INTERVAL '6 months');

  INSERT INTO expedientes (id, cliente_id, profesional_id, organizacion_id, detalle, fecha)
  VALUES (v_expediente2_id, v_cliente2_id, v_profesional_id, v_org_id, 'Paciente diabético tipo 2 en tratamiento. Control mensual.', NOW() - INTERVAL '1 year');

  INSERT INTO expedientes (id, cliente_id, profesional_id, organizacion_id, detalle, fecha)
  VALUES (v_expediente3_id, v_cliente3_id, v_profesional_id, v_org_id, 'Paciente con problemas de columna. Fisioterapia semanal.', NOW() - INTERVAL '3 months');

  INSERT INTO expedientes (id, cliente_id, profesional_id, organizacion_id, detalle, fecha)
  VALUES (v_expediente4_id, v_cliente4_id, v_profesional_id, v_org_id, 'Paciente con hipertensión arterial controlada. Revisión trimestral.', NOW() - INTERVAL '2 years');

  -- Insertar antecedentes médicos
  INSERT INTO antecedentes_medicos (cliente_id, enfermedades_cronicas, medicamentos_actuales, alergias, cirugias_previas, antecedentes_familiares, habitos)
  VALUES (v_cliente1_id, ARRAY['Migraña crónica'], ARRAY['Sumatriptán 50mg'], ARRAY['Penicilina'], ARRAY['Apendicectomía 2010'], 'Madre con migrañas, padre con diabetes', '{"alcohol": false, "tabaquismo": false, "ejercicio": "3 veces por semana"}');

  INSERT INTO antecedentes_medicos (cliente_id, enfermedades_cronicas, medicamentos_actuales, alergias, cirugias_previas, antecedentes_familiares, habitos)
  VALUES (v_cliente2_id, ARRAY['Diabetes tipo 2', 'Hipertensión leve'], ARRAY['Metformina 850mg', 'Losartán 50mg'], ARRAY[]::text[], ARRAY[]::text[], 'Padre y abuelo con diabetes tipo 2', '{"alcohol": true, "tabaquismo": false, "ejercicio": "Caminatas diarias"}');

  INSERT INTO antecedentes_medicos (cliente_id, enfermedades_cronicas, medicamentos_actuales, alergias, cirugias_previas, antecedentes_familiares, habitos)
  VALUES (v_cliente3_id, ARRAY['Escoliosis lumbar'], ARRAY['Ibuprofeno PRN'], ARRAY['Sulfas', 'Mariscos'], ARRAY[]::text[], 'Sin antecedentes relevantes', '{"alcohol": false, "tabaquismo": false, "ejercicio": "Yoga diario"}');

  INSERT INTO antecedentes_medicos (cliente_id, enfermedades_cronicas, medicamentos_actuales, alergias, cirugias_previas, antecedentes_familiares, habitos)
  VALUES (v_cliente4_id, ARRAY['Hipertensión arterial', 'Artritis reumatoide'], ARRAY['Enalapril 10mg', 'Metotrexato 7.5mg semanal'], ARRAY['AINEs'], ARRAY['Cirugía de rodilla 2015', 'Colecistectomía 2018'], 'Madre con hipertensión, hermano con artritis', '{"alcohol": false, "tabaquismo": true, "ejercicio": "Limitado por artritis"}');

  -- Insertar consultas históricas para paciente 1 (María)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, diagnostico_principal, plan_tratamiento, recomendaciones, signos_vitales, estado_consulta)
  VALUES 
  (v_expediente1_id, v_profesional_id, CURRENT_DATE - INTERVAL '5 months', 'Control de migraña', 'Paciente refiere disminución de episodios de migraña en el último mes. Medicación actual efectiva.', 'Migraña crónica controlada', 'Continuar con Sumatriptán 50mg PRN. Próximo control en 2 meses.', 'Evitar factores desencadenantes: estrés, falta de sueño, chocolate.', '{"peso": 62, "talla": 165, "presion_arterial": "120/80", "frecuencia_cardiaca": 72}', 'finalizada'),
  (v_expediente1_id, v_profesional_id, CURRENT_DATE - INTERVAL '3 months', 'Control seguimiento', 'Episodio de migraña severa hace 2 semanas. Requirió reposo por 2 días.', 'Migraña episódica', 'Ajuste de medicación. Iniciar profilaxis con propranolol 40mg.', 'Llevar diario de migrañas. Identificar desencadenantes.', '{"peso": 61, "talla": 165, "presion_arterial": "118/78", "frecuencia_cardiaca": 70}', 'finalizada'),
  (v_expediente1_id, v_profesional_id, CURRENT_DATE - INTERVAL '1 month', 'Control mensual', 'Buena respuesta a profilaxis. Sin episodios de migraña en las últimas 4 semanas.', 'Migraña en remisión', 'Continuar profilaxis. Control en 2 meses.', 'Mantener hábitos de sueño regulares.', '{"peso": 62, "talla": 165, "presion_arterial": "115/75", "frecuencia_cardiaca": 68}', 'finalizada');

  -- Insertar consultas históricas para paciente 2 (Carlos)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, diagnostico_principal, plan_tratamiento, recomendaciones, signos_vitales, medicamentos_recetados, estado_consulta)
  VALUES 
  (v_expediente2_id, v_profesional_id, CURRENT_DATE - INTERVAL '11 months', 'Diagnóstico inicial diabetes', 'Paciente acude por polidipsia y poliuria. Glicemia en ayunas: 180 mg/dL.', 'Diabetes Mellitus tipo 2', 'Iniciar Metformina 850mg cada 12h. Dieta diabética. Control en 1 mes.', 'Dieta baja en carbohidratos. Ejercicio moderado diario.', '{"peso": 92, "talla": 175, "presion_arterial": "140/90", "frecuencia_cardiaca": 82, "glicemia": 180}', '[{"nombre": "Metformina", "dosis": "850mg", "frecuencia": "Cada 12 horas", "duracion": "Permanente"}]', 'finalizada'),
  (v_expediente2_id, v_profesional_id, CURRENT_DATE - INTERVAL '8 months', 'Control diabetes', 'Glicemia en ayunas: 140 mg/dL. Hemoglobina glicosilada: 7.8%. Buena adherencia al tratamiento.', 'Diabetes tipo 2 en control', 'Continuar tratamiento. Agregar Losartán por presión arterial elevada.', 'Reducir consumo de sal. Continuar con ejercicio.', '{"peso": 88, "talla": 175, "presion_arterial": "145/92", "frecuencia_cardiaca": 78, "glicemia": 140}', '[{"nombre": "Metformina", "dosis": "850mg", "frecuencia": "Cada 12 horas", "duracion": "Permanente"}, {"nombre": "Losartán", "dosis": "50mg", "frecuencia": "Una vez al día", "duracion": "Permanente"}]', 'finalizada'),
  (v_expediente2_id, v_profesional_id, CURRENT_DATE - INTERVAL '2 months', 'Control trimestral', 'Glicemia: 110 mg/dL. HbA1c: 6.9%. Presión arterial controlada. Pérdida de 4kg.', 'Diabetes tipo 2 controlada. HTA controlada.', 'Continuar tratamiento actual. Excelente progreso.', 'Mantener estilo de vida saludable. Próximo control en 3 meses.', '{"peso": 84, "talla": 175, "presion_arterial": "125/82", "frecuencia_cardiaca": 74, "glicemia": 110}', '[{"nombre": "Metformina", "dosis": "850mg", "frecuencia": "Cada 12 horas", "duracion": "Permanente"}, {"nombre": "Losartán", "dosis": "50mg", "frecuencia": "Una vez al día", "duracion": "Permanente"}]', 'finalizada');

  -- Insertar consultas históricas para paciente 3 (Ana)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, diagnostico_principal, plan_tratamiento, recomendaciones, signos_vitales, estado_consulta)
  VALUES 
  (v_expediente3_id, v_profesional_id, CURRENT_DATE - INTERVAL '2 months', 'Dolor lumbar crónico', 'Paciente refiere dolor lumbar de 6 meses de evolución. Empeora con sedentarismo prolongado.', 'Escoliosis lumbar leve. Contractura paravertebral bilateral. Dolor a la palpación L4-L5.', 'Escoliosis lumbar con síndrome miofascial', 'Fisioterapia 2 veces por semana. Ejercicios de fortalecimiento core.', 'Evitar estar sentada más de 1 hora continua. Usar soporte lumbar.', '{"peso": 58, "talla": 162, "presion_arterial": "110/70", "frecuencia_cardiaca": 66}', 'finalizada'),
  (v_expediente3_id, v_profesional_id, CURRENT_DATE - INTERVAL '1 month', 'Control fisioterapia', 'Mejoría del 40% en dolor. Mejor movilidad. Continúa ejercicios en casa.', 'Buena evolución. Menor contractura muscular. Mejor postura.', 'Escoliosis lumbar en mejoría', 'Continuar fisioterapia semanal. Aumentar intensidad de ejercicios.', 'Incorporar natación como ejercicio complementario.', '{"peso": 58, "talla": 162, "presion_arterial": "108/68", "frecuencia_cardiaca": 64}', 'finalizada');

  -- Insertar consultas históricas para paciente 4 (José)
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, diagnostico_principal, plan_tratamiento, recomendaciones, signos_vitales, medicamentos_recetados, estado_consulta)
  VALUES 
  (v_expediente4_id, v_profesional_id, CURRENT_DATE - INTERVAL '18 months', 'Control hipertensión', 'Paciente con HTA de 10 años de evolución. Artritis reumatoide diagnosticada hace 5 años.', 'Hipertensión arterial grado 1. Artritis reumatoide activa.', 'Ajuste de antihipertensivo. Referir a reumatología para valoración de tratamiento.', 'Dieta DASH. Ejercicio de bajo impacto.', '{"peso": 78, "talla": 172, "presion_arterial": "150/95", "frecuencia_cardiaca": 80}', '[{"nombre": "Enalapril", "dosis": "10mg", "frecuencia": "Cada 12 horas", "duracion": "Permanente"}]', 'finalizada'),
  (v_expediente4_id, v_profesional_id, CURRENT_DATE - INTERVAL '6 months', 'Control integral', 'Presión arterial estable con tratamiento. Artritis con brotes ocasionales.', 'HTA controlada. Artritis reumatoide en remisión parcial.', 'Continuar tratamiento actual. Monitoreo de función renal por metotrexato.', 'Evitar cambios bruscos de temperatura. Mantener actividad física moderada.', '{"peso": 76, "talla": 172, "presion_arterial": "130/85", "frecuencia_cardiaca": 76}', '[{"nombre": "Enalapril", "dosis": "10mg", "frecuencia": "Cada 12 horas", "duracion": "Permanente"}, {"nombre": "Metotrexato", "dosis": "7.5mg", "frecuencia": "Una vez por semana", "duracion": "Permanente"}]', 'finalizada'),
  (v_expediente4_id, v_profesional_id, CURRENT_DATE - INTERVAL '2 weeks', 'Dolor articular', 'Brote de artritis en manos y rodillas. Mayor rigidez matutina. Sin fiebre.', 'Brote de artritis reumatoide', 'Prednisona 10mg por 5 días. Control en 2 semanas.', 'Reposo relativo. Aplicar frío local en articulaciones inflamadas.', '{"peso": 77, "talla": 172, "presion_arterial": "135/88", "frecuencia_cardiaca": 78}', '[{"nombre": "Prednisona", "dosis": "10mg", "frecuencia": "Una vez al día", "duracion": "5 días"}]', 'finalizada');

  -- Crear algunas citas pasadas y futuras
  INSERT INTO citas (nombre, telefono, "fechaCita", hora_cita, estado, cliente_id, organizacion_id, doctor_id)
  VALUES 
  ('María García López', '8845-6712', TO_CHAR(CURRENT_DATE + INTERVAL '7 days', 'YYYY-MM-DD'), '09:00', 'pendiente', v_cliente1_id, v_org_id, v_profesional_id),
  ('Carlos Rodríguez Méndez', '8867-3421', TO_CHAR(CURRENT_DATE + INTERVAL '14 days', 'YYYY-MM-DD'), '10:30', 'pendiente', v_cliente2_id, v_org_id, v_profesional_id),
  ('Ana Fernández Solís', '7098-5634', TO_CHAR(CURRENT_DATE + INTERVAL '3 days', 'YYYY-MM-DD'), '11:00', 'pendiente', v_cliente3_id, v_org_id, v_profesional_id),
  ('José Hernández Vargas', '8934-2178', TO_CHAR(CURRENT_DATE + INTERVAL '21 days', 'YYYY-MM-DD'), '14:00', 'pendiente', v_cliente4_id, v_org_id, v_profesional_id);

END $$;