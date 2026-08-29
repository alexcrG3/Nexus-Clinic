-- Drop the unused 'usuarios' table that contains sensitive password data
-- This table is not used by the application (uses auth.users, profiles, user_roles instead)
-- Verified: no foreign key dependencies exist for this table

-- First drop the RLS policies
DROP POLICY IF EXISTS "system_admin_can_create_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "system_admin_can_delete_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "system_admin_can_update_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "system_admin_can_view_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "users_can_update_own_record" ON public.usuarios;
DROP POLICY IF EXISTS "users_can_view_own_record" ON public.usuarios;

-- Then drop the table
DROP TABLE IF EXISTS public.usuarios CASCADE;