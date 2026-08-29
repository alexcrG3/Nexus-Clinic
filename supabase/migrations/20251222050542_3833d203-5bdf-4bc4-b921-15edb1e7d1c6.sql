-- Create function to encrypt chatwoot token on save
CREATE OR REPLACE FUNCTION public.encrypt_chatwoot_token_on_save()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  -- Only process if chatwoot_api_token has a value
  IF NEW.chatwoot_api_token IS NOT NULL AND NEW.chatwoot_api_token != '' THEN
    -- Get encryption key from Supabase secrets
    encryption_key := current_setting('app.settings.chatwoot_encryption_key', true);
    
    IF encryption_key IS NOT NULL AND encryption_key != '' THEN
      -- Encrypt the token and store in encrypted column
      NEW.chatwoot_api_token_encrypted := pgp_sym_encrypt(NEW.chatwoot_api_token, encryption_key);
      -- Clear the plaintext token for security
      NEW.chatwoot_api_token := '***ENCRYPTED***';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-encrypt tokens on insert or update
DROP TRIGGER IF EXISTS encrypt_chatwoot_token_trigger ON public.chatwoot_config;
CREATE TRIGGER encrypt_chatwoot_token_trigger
  BEFORE INSERT OR UPDATE ON public.chatwoot_config
  FOR EACH ROW
  WHEN (NEW.chatwoot_api_token IS NOT NULL AND NEW.chatwoot_api_token != '***ENCRYPTED***')
  EXECUTE FUNCTION public.encrypt_chatwoot_token_on_save();