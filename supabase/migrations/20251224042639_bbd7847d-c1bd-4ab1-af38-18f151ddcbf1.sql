-- Fix warn-level security issues

-- 1. Fix avatars storage bucket - make private with authenticated access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Update read policy to require authentication
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- 2. Fix pendientes_humanos table - replace overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to view all pendientes_humanos" ON public.pendientes_humanos;
DROP POLICY IF EXISTS "Allow authenticated users to insert pendientes_humanos" ON public.pendientes_humanos;
DROP POLICY IF EXISTS "Allow authenticated users to update pendientes_humanos" ON public.pendientes_humanos;

-- Users can view tasks assigned to them or if they're admins
CREATE POLICY "Users can view assigned or admin tasks"
ON public.pendientes_humanos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    asignado_a = auth.uid() OR
    has_role('admin_sistema'::app_role) OR
    has_role('admin_clinica'::app_role)
  )
);

-- Authenticated users can create tasks
CREATE POLICY "Users can create tasks"
ON public.pendientes_humanos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update only their assigned tasks, admins can update all
CREATE POLICY "Users can update assigned tasks"
ON public.pendientes_humanos FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    asignado_a = auth.uid() OR
    has_role('admin_sistema'::app_role) OR
    has_role('admin_clinica'::app_role)
  )
);