-- Crear función para asignar organización por defecto
CREATE OR REPLACE FUNCTION public.set_default_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_org_id uuid := '60facc89-5b03-4b33-8870-4a3e128521f3'; -- Clinica Nova Dental
BEGIN
  -- Si organizacion_id es NULL, asignar la organización por defecto
  IF NEW.organizacion_id IS NULL THEN
    NEW.organizacion_id := default_org_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para profiles
DROP TRIGGER IF EXISTS set_default_org_profiles ON public.profiles;
CREATE TRIGGER set_default_org_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Trigger para clientes
DROP TRIGGER IF EXISTS set_default_org_clientes ON public.clientes;
CREATE TRIGGER set_default_org_clientes
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Trigger para expedientes
DROP TRIGGER IF EXISTS set_default_org_expedientes ON public.expedientes;
CREATE TRIGGER set_default_org_expedientes
  BEFORE INSERT OR UPDATE ON public.expedientes
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Trigger para citas
DROP TRIGGER IF EXISTS set_default_org_citas ON public.citas;
CREATE TRIGGER set_default_org_citas
  BEFORE INSERT OR UPDATE ON public.citas
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Trigger para pagos
DROP TRIGGER IF EXISTS set_default_org_pagos ON public.pagos;
CREATE TRIGGER set_default_org_pagos
  BEFORE INSERT OR UPDATE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Trigger para servicios
DROP TRIGGER IF EXISTS set_default_org_servicios ON public.servicios;
CREATE TRIGGER set_default_org_servicios
  BEFORE INSERT OR UPDATE ON public.servicios
  FOR EACH ROW
  EXECUTE FUNCTION set_default_organization();

-- Establecer valores por defecto en las columnas
ALTER TABLE public.profiles ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';
ALTER TABLE public.clientes ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';
ALTER TABLE public.expedientes ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';
ALTER TABLE public.citas ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';
ALTER TABLE public.pagos ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';
ALTER TABLE public.servicios ALTER COLUMN organizacion_id SET DEFAULT '60facc89-5b03-4b33-8870-4a3e128521f3';