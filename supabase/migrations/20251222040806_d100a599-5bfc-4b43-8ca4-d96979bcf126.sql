-- =====================================================
-- FIX 1: Encrypt Chatwoot API tokens at rest
-- =====================================================

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted token column
ALTER TABLE public.chatwoot_config 
ADD COLUMN IF NOT EXISTS chatwoot_api_token_encrypted bytea;

-- Function to encrypt a token (used during save)
CREATE OR REPLACE FUNCTION public.encrypt_chatwoot_token(token text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from Supabase secrets
  encryption_key := current_setting('app.settings.chatwoot_encryption_key', true);
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$;

-- Function to get decrypted config for edge functions (uses service role)
CREATE OR REPLACE FUNCTION public.get_chatwoot_config_for_org(org_id uuid)
RETURNS TABLE(
  id uuid,
  chatwoot_url text,
  chatwoot_account_id text,
  chatwoot_api_token text,
  inbox_id text,
  activo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key
  encryption_key := current_setting('app.settings.chatwoot_encryption_key', true);
  
  RETURN QUERY
  SELECT 
    c.id,
    c.chatwoot_url,
    c.chatwoot_account_id,
    CASE 
      WHEN c.chatwoot_api_token_encrypted IS NOT NULL AND encryption_key IS NOT NULL AND encryption_key != '' THEN
        pgp_sym_decrypt(c.chatwoot_api_token_encrypted, encryption_key)
      ELSE
        c.chatwoot_api_token  -- Fallback for migration period
    END as chatwoot_api_token,
    c.inbox_id,
    c.activo
  FROM chatwoot_config c
  WHERE c.organizacion_id = org_id AND c.activo = true;
END;
$$;

-- =====================================================
-- FIX 2: Restrict patient data access for receptionists
-- =====================================================

-- Create audit log table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text,
  record_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (has_role('admin_sistema'::app_role) OR has_role('admin_clinica'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_log FOR INSERT
WITH CHECK (true);

-- Create search function for patients (with audit logging)
CREATE OR REPLACE FUNCTION public.search_patients(
  search_term text,
  max_results integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  nombre text,
  apellidos text,
  telefono text,
  cedula text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org uuid;
  sanitized_term text;
BEGIN
  -- Get user's organization
  user_org := get_user_organization();
  
  IF user_org IS NULL THEN
    RAISE EXCEPTION 'User not associated with an organization';
  END IF;
  
  -- Sanitize search term (basic SQL injection prevention)
  sanitized_term := regexp_replace(search_term, '[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-]', '', 'g');
  
  -- Log the search
  INSERT INTO audit_log (user_id, action, table_name, details)
  VALUES (
    auth.uid(),
    'patient_search',
    'clientes',
    jsonb_build_object(
      'search_term', sanitized_term,
      'timestamp', now()
    )
  );
  
  -- Return search results
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.apellidos,
    c.telefono,
    c.cedula,
    c.email
  FROM clientes c
  WHERE 
    c.organizacion_id = user_org AND
    (
      c.nombre ILIKE '%' || sanitized_term || '%' OR 
      c.apellidos ILIKE '%' || sanitized_term || '%' OR
      c.cedula ILIKE '%' || sanitized_term || '%' OR
      c.telefono ILIKE '%' || sanitized_term || '%'
    )
  LIMIT LEAST(max_results, 100);  -- Cap at 100 results
END;
$$;

-- Drop the old overly permissive policy for clientes
DROP POLICY IF EXISTS "Staff can view patients they are authorized to see" ON public.clientes;

-- Create new restrictive policy for clientes
-- Receptionists CANNOT browse all patients - they must use search_patients() function
CREATE POLICY "Staff can view patients they are authorized to see"
ON public.clientes FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  (organizacion_id = get_user_organization()) AND 
  (
    -- System and clinic admins have full access
    has_role('admin_sistema'::app_role) OR 
    has_role('admin_clinica'::app_role) OR 
    -- Medical professionals only see their own patients
    (
      (has_role('medico'::app_role) OR has_role('odontologo'::app_role) OR 
       has_role('fisioterapeuta'::app_role) OR has_role('quiropractico'::app_role)) AND 
      (
        EXISTS (SELECT 1 FROM expedientes WHERE cliente_id = clientes.id AND profesional_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM citas WHERE cliente_id = clientes.id AND doctor_id::text = auth.uid()::text)
      )
    ) OR
    -- Receptionists can only see patients with recent or upcoming appointments
    (
      has_role('recepcionista'::app_role) AND 
      EXISTS (
        SELECT 1 FROM citas 
        WHERE cliente_id = clientes.id 
        AND organizacion_id = get_user_organization()
        AND (
          "fechaCita"::date >= CURRENT_DATE - INTERVAL '90 days' AND 
          "fechaCita"::date <= CURRENT_DATE + INTERVAL '30 days'
        )
      )
    )
  )
);