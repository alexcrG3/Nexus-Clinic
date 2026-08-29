-- Fix RLS Policy Always True issues

-- 1. Fix audit_log: Block direct inserts, create SECURITY DEFINER function for logging
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;

-- Create a restrictive policy that blocks direct inserts (audit logs should only come from trusted functions)
CREATE POLICY "Block direct audit log inserts"
ON audit_log FOR INSERT
WITH CHECK (false);

-- Create a SECURITY DEFINER function to handle audit logging securely
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_user_id uuid,
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validate that user_id is the current authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot insert audit log for a different user';
  END IF;

  INSERT INTO audit_log (user_id, action, table_name, record_id, details, ip_address)
  VALUES (p_user_id, p_action, p_table_name, p_record_id, p_details, p_ip_address)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_audit_log TO authenticated;

-- 2. Fix organizaciones: Restrict creation to admin roles only
DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON organizaciones;

-- Only admin_sistema can create new organizations
CREATE POLICY "Only system admins can create organizations"
ON organizaciones FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin_sistema'
  )
);