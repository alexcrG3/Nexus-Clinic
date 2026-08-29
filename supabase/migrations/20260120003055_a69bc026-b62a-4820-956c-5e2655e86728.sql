-- Crear función que genera expediente automáticamente al crear un cliente
CREATE OR REPLACE FUNCTION public.create_expediente_for_new_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar expediente para el nuevo cliente
  INSERT INTO public.expedientes (cliente_id, organizacion_id, detalle)
  VALUES (
    NEW.id,
    NEW.organizacion_id,
    'Expediente creado automáticamente al registrar paciente'
  );
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta después de insertar un cliente
DROP TRIGGER IF EXISTS trigger_create_expediente_on_cliente ON public.clientes;

CREATE TRIGGER trigger_create_expediente_on_cliente
AFTER INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.create_expediente_for_new_cliente();

-- Crear expedientes faltantes para clientes existentes que no tienen
INSERT INTO public.expedientes (cliente_id, organizacion_id, detalle)
SELECT 
  c.id,
  c.organizacion_id,
  'Expediente creado automáticamente (corrección)'
FROM public.clientes c
LEFT JOIN public.expedientes e ON e.cliente_id = c.id
WHERE e.id IS NULL;