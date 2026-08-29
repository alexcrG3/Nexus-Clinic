-- Crear paciente de odontología completo con expediente y odontograma
DO $$
DECLARE
  v_org_id uuid;
  v_profesional_id uuid;
  v_cliente_id uuid := gen_random_uuid();
  v_expediente_id uuid := gen_random_uuid();
  v_odontograma_id uuid := gen_random_uuid();
BEGIN
  -- Obtener organización
  SELECT id INTO v_org_id FROM organizaciones LIMIT 1;
  
  -- Obtener un profesional (preferiblemente odontólogo)
  SELECT user_id INTO v_profesional_id FROM profiles 
  WHERE role = 'odontologo' AND activo = true
  LIMIT 1;
  
  -- Si no hay odontólogo, usar cualquier profesional médico
  IF v_profesional_id IS NULL THEN
    SELECT user_id INTO v_profesional_id FROM profiles 
    WHERE role IN ('medico', 'odontologo', 'fisioterapeuta', 'quiropractico') 
    LIMIT 1;
  END IF;

  -- Crear paciente de odontología
  INSERT INTO clientes (id, nombre, apellidos, cedula, telefono, email, direccion, fecha_nacimiento, sexo, grupo_sanguineo, organizacion_id)
  VALUES (
    v_cliente_id, 
    'Lucía', 
    'Martínez Ramírez', 
    '1-1234-5678', 
    '8756-4321', 
    'lucia.martinez@email.com', 
    'San José, Santa Ana, Ciudad Colón, 200m Norte de la Iglesia', 
    '1990-06-20', 
    'Femenino', 
    'A+', 
    v_org_id
  );

  -- Crear expediente de odontología
  INSERT INTO expedientes (id, cliente_id, profesional_id, organizacion_id, detalle, fecha)
  VALUES (
    v_expediente_id, 
    v_cliente_id, 
    v_profesional_id, 
    v_org_id, 
    'Paciente de odontología. Consulta inicial por dolor en molar superior derecho. Historial de caries múltiples. Plan de tratamiento integral para rehabilitación bucal.', 
    NOW() - INTERVAL '8 months'
  );

  -- Crear antecedentes médicos
  INSERT INTO antecedentes_medicos (cliente_id, enfermedades_cronicas, medicamentos_actuales, alergias, cirugias_previas, antecedentes_familiares, habitos)
  VALUES (
    v_cliente_id, 
    ARRAY['Ninguna'], 
    ARRAY['Anticonceptivos orales'], 
    ARRAY['Látex'], 
    ARRAY['Extracción de terceros molares 2018'], 
    'Madre con enfermedad periodontal. Padre con diabetes tipo 2.', 
    '{"alcohol": false, "tabaquismo": false, "ejercicio": "Gimnasio 4 veces por semana", "bruxismo": true}'
  );

  -- Crear odontograma con datos completos
  INSERT INTO odontogramas (id, expediente_id, cliente_id, fecha, profesional_id, notas, datos_dientes)
  VALUES (
    v_odontograma_id,
    v_expediente_id,
    v_cliente_id,
    CURRENT_DATE,
    v_profesional_id,
    'Paciente presenta múltiples restauraciones previas. Bruxismo nocturno con desgaste en incisivos. Se recomienda férula de descarga.',
    '{
      "16": {"condicion": "corona", "superficies": {"oclusal": "corona"}, "notas": "Corona de porcelana colocada hace 3 años. Buen estado."},
      "17": {"superficies": {"oclusal": "obturacion", "mesial": "obturacion"}, "notas": "Obturación amalgama antigua, considerar reemplazo."},
      "18": {"condicion": "ausente", "notas": "Extraído en 2018"},
      "15": {"superficies": {"oclusal": "caries"}, "notas": "Caries incipiente. Tratamiento conservador."},
      "14": {"superficies": {"oclusal": "sellante"}, "notas": "Sellante de fosetas en buen estado."},
      "26": {"superficies": {"oclusal": "obturacion", "distal": "obturacion"}, "notas": "Obturación resina compuesta 2023."},
      "27": {"condicion": "endodoncia", "superficies": {"oclusal": "endodoncia"}, "notas": "Endodoncia realizada en 2022. Corona temporal."},
      "28": {"condicion": "ausente", "notas": "Extraído en 2018"},
      "36": {"superficies": {"oclusal": "obturacion", "vestibular": "obturacion"}, "notas": "Obturación resina 2021."},
      "37": {"superficies": {"oclusal": "caries", "distal": "caries"}, "notas": "Caries activa. Requiere tratamiento urgente."},
      "46": {"superficies": {"oclusal": "obturacion"}, "notas": "Obturación pequeña, buen estado."},
      "47": {"superficies": {"oclusal": "obturacion", "mesial": "obturacion"}, "notas": "Obturación clase II, revisar margenes."},
      "48": {"condicion": "ausente", "notas": "Extraído en 2018"},
      "38": {"condicion": "ausente", "notas": "Extraído en 2018"},
      "11": {"superficies": {"vestibular": "fractura"}, "notas": "Microfractura por bruxismo."},
      "21": {"superficies": {"vestibular": "fractura"}, "notas": "Microfractura por bruxismo."}
    }'::jsonb
  );

  -- Crear tratamientos dentales (plan de tratamiento y seguimiento)
  INSERT INTO tratamientos_dentales (odontograma_id, diente_numero, superficie, tratamiento, estado, color, notas, fecha_tratamiento, profesional_id)
  VALUES 
  -- Tratamientos completados
  (v_odontograma_id, 16, 'completa', 'Corona de porcelana', 'completado', '#eab308', 'Corona cementada definitivamente. Oclusión verificada.', CURRENT_DATE - INTERVAL '3 years', v_profesional_id),
  (v_odontograma_id, 27, 'completa', 'Endodoncia', 'completado', '#8b5cf6', 'Tratamiento de conductos exitoso. 3 conductos. Sin complicaciones.', CURRENT_DATE - INTERVAL '2 years', v_profesional_id),
  (v_odontograma_id, 26, 'oclusal', 'Obturación con resina', 'completado', '#3b82f6', 'Restauración clase I. Resina nanohíbrida.', CURRENT_DATE - INTERVAL '1 year', v_profesional_id),
  (v_odontograma_id, 36, 'vestibular', 'Obturación con resina', 'completado', '#3b82f6', 'Restauración cervical clase V.', CURRENT_DATE - INTERVAL '8 months', v_profesional_id),
  
  -- Tratamientos en progreso
  (v_odontograma_id, 27, 'completa', 'Corona de zirconio', 'en_progreso', '#eab308', 'Corona definitiva posterior a endodoncia. Impresión tomada.', CURRENT_DATE - INTERVAL '1 week', v_profesional_id),
  
  -- Tratamientos pendientes
  (v_odontograma_id, 15, 'oclusal', 'Obturación con resina', 'pendiente', '#3b82f6', 'Caries incipiente. Preparación mínimamente invasiva.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 37, 'oclusal', 'Obturación con resina', 'pendiente', '#3b82f6', 'Caries activa clase I. Prioridad alta.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 37, 'distal', 'Obturación con resina', 'pendiente', '#3b82f6', 'Caries interproximal. Incluir en tratamiento oclusal.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 17, 'oclusal', 'Reemplazo de obturación', 'pendiente', '#3b82f6', 'Amalgama antigua con filtración marginal.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 11, 'vestibular', 'Carilla dental', 'pendiente', '#06b6d4', 'Carilla para corregir fractura por bruxismo.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 21, 'vestibular', 'Carilla dental', 'pendiente', '#06b6d4', 'Carilla para corregir fractura por bruxismo.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 0, 'completa', 'Férula de descarga nocturna', 'pendiente', '#10b981', 'Indicada para bruxismo. Férula Michigan.', CURRENT_DATE, v_profesional_id),
  (v_odontograma_id, 0, 'completa', 'Limpieza dental', 'pendiente', '#22c55e', 'Profilaxis semestral programada.', CURRENT_DATE + INTERVAL '3 months', v_profesional_id);

  -- Crear historial de consultas odontológicas
  INSERT INTO consultas (expediente_id, profesional_id, fecha, motivo_consulta, anamnesis, examen_fisico, diagnostico_principal, plan_tratamiento, recomendaciones, signos_vitales, procedimiento_realizado, estado_consulta)
  VALUES 
  -- Consulta inicial
  (v_expediente_id, v_profesional_id, CURRENT_DATE - INTERVAL '8 months', 
   'Dolor en molar superior derecho', 
   'Paciente refiere dolor pulsátil en zona de molar 27, que se exacerba con frío y calor. El dolor comenzó hace 2 semanas y ha ido en aumento. No cede completamente con analgésicos.', 
   'Inspección: Caries profunda en 27 con cambio de coloración. Percusión positiva. Test de vitalidad negativo. Radiografía periapical muestra lesión en ápice.',
   'Pulpitis irreversible en pieza 27 con periodontitis apical aguda',
   'Tratamiento de conductos de urgencia. Restauración posterior con corona.', 
   'Analgésicos según necesidad. Evitar masticar del lado afectado. Consulta de urgencia si hay inflamación.',
   '{"presion_arterial": "118/76", "frecuencia_cardiaca": 72}',
   'Apertura cameral y drenaje. Medicación intraconducto con hidróxido de calcio.',
   'finalizada'),
  
  -- Endodoncia completada
  (v_expediente_id, v_profesional_id, CURRENT_DATE - INTERVAL '7 months', 
   'Continuación tratamiento de conductos pieza 27', 
   'Paciente asintomática. Sin dolor ni inflamación posterior a la apertura.', 
   'Zona periapical sin inflamación. Conductos permeables.',
   'Pulpitis irreversible en tratamiento - pieza 27',
   'Completar obturación de conductos. Programar corona.', 
   'Evitar alimentos duros hasta colocación de corona definitiva.',
   '{"presion_arterial": "115/74", "frecuencia_cardiaca": 68}',
   'Preparación biomecánica de 3 conductos (MV, DV, P). Obturación con gutapercha y cemento sellador. Restauración temporal.',
   'finalizada'),
  
  -- Control post-endodoncia
  (v_expediente_id, v_profesional_id, CURRENT_DATE - INTERVAL '5 months', 
   'Control post-endodoncia y valoración general', 
   'Sin molestias en pieza tratada. Solicita evaluación general de su dentadura.', 
   'Pieza 27 asintomática. Rx control muestra sellado apical adecuado. Evaluación general: múltiples obturaciones antiguas, caries en 15 y 37, desgaste en incisivos.',
   'Post-operatorio endodoncia satisfactorio. Caries múltiples. Bruxismo',
   'Elaborar plan de tratamiento integral. Considerar férula de descarga.', 
   'Usar pasta dental con flúor. Técnica de cepillado con cepillo suave.',
   '{"presion_arterial": "120/78", "frecuencia_cardiaca": 70}',
   'Toma de radiografías, fotografías clínicas, impresiones para estudio.',
   'finalizada'),
  
  -- Tratamiento de caries
  (v_expediente_id, v_profesional_id, CURRENT_DATE - INTERVAL '3 months', 
   'Tratamiento restaurador pieza 36', 
   'Cita programada para restauración. Paciente sin molestias.', 
   'Pieza 36 con lesión cervical clase V. Tejido cariado en zona gingival vestibular.',
   'Caries cervical pieza 36',
   'Continuar con plan de tratamiento. Próxima cita: valoración para carillas.', 
   'Técnica de cepillado suave en zona cervical. Enjuague con flúor.',
   '{"presion_arterial": "116/72", "frecuencia_cardiaca": 66}',
   'Anestesia local. Remoción de caries. Restauración con resina compuesta nanohíbrida A2. Pulido.',
   'finalizada'),
  
  -- Consulta reciente
  (v_expediente_id, v_profesional_id, CURRENT_DATE - INTERVAL '1 week', 
   'Preparación corona pieza 27 y valoración carillas', 
   'Paciente lista para corona definitiva. Interesada en mejorar estética de incisivos.', 
   'Pieza 27 con restauración temporal íntegra. Incisivos con microfracturas visibles.',
   'Pieza 27 preparada para corona. Fractura de esmalte en 11 y 21 por bruxismo.',
   'Cementación de corona en próxima cita. Valorar carillas mínimamente invasivas.', 
   'Usar férula de descarga nocturna. Evitar alimentos muy duros.',
   '{"presion_arterial": "118/75", "frecuencia_cardiaca": 70}',
   'Preparación de muñón pieza 27. Toma de impresión digital. Provisional cementado. Diseño digital de carillas.',
   'finalizada');

  -- Crear cita próxima
  INSERT INTO citas (nombre, telefono, "fechaCita", hora_cita, estado, cliente_id, organizacion_id, doctor_id)
  VALUES (
    'Lucía Martínez Ramírez', 
    '8756-4321', 
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), 
    '10:00', 
    'pendiente', 
    v_cliente_id, 
    v_org_id, 
    v_profesional_id
  );

END $$;