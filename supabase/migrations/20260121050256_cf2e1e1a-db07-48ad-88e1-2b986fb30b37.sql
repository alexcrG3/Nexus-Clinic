-- Fix 1: Make expediente-documentos bucket private to protect patient medical records
UPDATE storage.buckets 
SET public = false 
WHERE id = 'expediente-documentos';

-- Fix 2: Restrict crear_cita_desde_n8n RPC to service_role only
-- First, revoke EXECUTE from public
REVOKE EXECUTE ON FUNCTION public.crear_cita_desde_n8n(text, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.crear_cita_desde_n8n(text, text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.crear_cita_desde_n8n(text, text, text, text, text, text, text, text) FROM authenticated;

-- Grant EXECUTE only to service_role (used by backend/n8n)
GRANT EXECUTE ON FUNCTION public.crear_cita_desde_n8n(text, text, text, text, text, text, text, text) TO service_role;