-- Create function to log access to sensitive patient data
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  p_table_name text,
  p_record_id text,
  p_action text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, details)
  VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    jsonb_build_object(
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
END;
$$;

-- Function to get patient medical history with audit logging
CREATE OR REPLACE FUNCTION public.get_patient_antecedentes(p_cliente_id uuid)
RETURNS SETOF antecedentes_medicos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the access
  PERFORM log_sensitive_data_access('antecedentes_medicos', p_cliente_id::text, 'view_medical_history');
  
  -- Return the data (respecting RLS through the calling user's context)
  RETURN QUERY
  SELECT * FROM antecedentes_medicos
  WHERE cliente_id = p_cliente_id
  AND (
    has_role('admin_sistema'::app_role) OR 
    has_role('admin_clinica'::app_role) OR 
    EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = p_cliente_id AND e.profesional_id = prof.id
    )
  );
END;
$$;

-- Function to get patient consultations with audit logging  
CREATE OR REPLACE FUNCTION public.get_patient_consultas(p_expediente_id uuid)
RETURNS SETOF consultas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the access
  PERFORM log_sensitive_data_access('consultas', p_expediente_id::text, 'view_consultations');
  
  RETURN QUERY
  SELECT * FROM consultas
  WHERE expediente_id = p_expediente_id
  AND (
    has_role('admin_sistema'::app_role) OR 
    has_role('admin_clinica'::app_role) OR
    profesional_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.id = p_expediente_id AND e.profesional_id = prof.id
    )
  )
  ORDER BY fecha DESC;
END;
$$;

-- Function to get patient contact info with audit logging
CREATE OR REPLACE FUNCTION public.get_patient_contact_info(p_cliente_id uuid)
RETURNS TABLE(
  id uuid,
  nombre text,
  apellidos text,
  telefono text,
  email text,
  direccion text,
  cedula text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the access
  PERFORM log_sensitive_data_access('clientes', p_cliente_id::text, 'view_contact_info');
  
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.apellidos,
    c.telefono,
    c.email,
    c.direccion,
    c.cedula
  FROM clientes c
  WHERE c.id = p_cliente_id
  AND (
    has_role('admin_sistema'::app_role) OR 
    (c.organizacion_id = get_user_organization() AND 
     (has_role('admin_clinica'::app_role) OR has_role('recepcionista'::app_role)))
    OR EXISTS (
      SELECT 1 FROM citas ct
      JOIN doctores d ON d.id = ct.doctor_id
      WHERE ct.cliente_id = c.id AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM expedientes e
      JOIN profiles prof ON prof.user_id = auth.uid()
      WHERE e.cliente_id = c.id AND e.profesional_id = prof.id
    )
  );
END;
$$;

-- Add triggers to log INSERT/UPDATE/DELETE on sensitive tables
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id::text,
      jsonb_build_object('old_data', to_jsonb(OLD), 'timestamp', now())
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id::text,
      jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW), 'timestamp', now())
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      'insert',
      TG_TABLE_NAME,
      NEW.id::text,
      jsonb_build_object('new_data', to_jsonb(NEW), 'timestamp', now())
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_antecedentes_medicos ON antecedentes_medicos;
CREATE TRIGGER audit_antecedentes_medicos
  AFTER INSERT OR UPDATE OR DELETE ON antecedentes_medicos
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_consultas ON consultas;
CREATE TRIGGER audit_consultas
  AFTER INSERT OR UPDATE OR DELETE ON consultas
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_odontogramas ON odontogramas;
CREATE TRIGGER audit_odontogramas
  AFTER INSERT OR UPDATE OR DELETE ON odontogramas
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_tratamientos_dentales ON tratamientos_dentales;
CREATE TRIGGER audit_tratamientos_dentales
  AFTER INSERT OR UPDATE OR DELETE ON tratamientos_dentales
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();