-- Create table to store Chatwoot configuration per organization
CREATE TABLE public.chatwoot_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacion_id uuid NOT NULL UNIQUE,
    chatwoot_url text NOT NULL,
    chatwoot_account_id text NOT NULL,
    chatwoot_api_token text NOT NULL,
    inbox_id text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatwoot_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view their organization's config
CREATE POLICY "Admins can view chatwoot config"
ON public.chatwoot_config
FOR SELECT
USING (
    (organizacion_id = get_user_organization()) 
    AND (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role))
);

-- Only admins can insert config for their organization
CREATE POLICY "Admins can insert chatwoot config"
ON public.chatwoot_config
FOR INSERT
WITH CHECK (
    (organizacion_id = get_user_organization()) 
    AND (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role))
);

-- Only admins can update their organization's config
CREATE POLICY "Admins can update chatwoot config"
ON public.chatwoot_config
FOR UPDATE
USING (
    (organizacion_id = get_user_organization()) 
    AND (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role))
);

-- Only admins can delete their organization's config
CREATE POLICY "Admins can delete chatwoot config"
ON public.chatwoot_config
FOR DELETE
USING (
    (organizacion_id = get_user_organization()) 
    AND (has_role('admin_clinica'::app_role) OR has_role('admin_sistema'::app_role))
);

-- Add trigger for updated_at
CREATE TRIGGER update_chatwoot_config_updated_at
BEFORE UPDATE ON public.chatwoot_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();