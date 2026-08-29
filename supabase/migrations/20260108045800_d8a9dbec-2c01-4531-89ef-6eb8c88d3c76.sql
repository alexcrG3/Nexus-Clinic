-- Crear tabla de odontogramas
CREATE TABLE public.odontogramas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expediente_id uuid NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  datos_dientes jsonb NOT NULL DEFAULT '{}'::jsonb,
  notas text,
  profesional_id uuid REFERENCES profiles(user_id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de tratamientos dentales (para seguimiento)
CREATE TABLE public.tratamientos_dentales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  odontograma_id uuid NOT NULL REFERENCES odontogramas(id) ON DELETE CASCADE,
  diente_numero integer NOT NULL,
  superficie text, -- oclusal, mesial, distal, vestibular, lingual/palatina
  tratamiento text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente, en_progreso, completado
  color text, -- color para visualización
  notas text,
  fecha_tratamiento date NOT NULL DEFAULT CURRENT_DATE,
  profesional_id uuid REFERENCES profiles(user_id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.odontogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tratamientos_dentales ENABLE ROW LEVEL SECURITY;

-- RLS policies for odontogramas
CREATE POLICY "odontogramas_select_by_org" ON public.odontogramas
FOR SELECT USING (
  has_role('admin_sistema'::app_role) OR 
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role) OR
  (has_role('medico'::app_role) AND EXISTS (
    SELECT 1 FROM expedientes e WHERE e.id = odontogramas.expediente_id AND e.organizacion_id = get_user_organization()
  ))
);

CREATE POLICY "odontogramas_insert_by_odontologo" ON public.odontogramas
FOR INSERT WITH CHECK (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role)
);

CREATE POLICY "odontogramas_update_by_odontologo" ON public.odontogramas
FOR UPDATE USING (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role) OR
  profesional_id = auth.uid()
);

-- RLS policies for tratamientos_dentales
CREATE POLICY "tratamientos_dentales_select" ON public.tratamientos_dentales
FOR SELECT USING (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role) OR
  EXISTS (
    SELECT 1 FROM odontogramas o 
    JOIN expedientes e ON e.id = o.expediente_id 
    WHERE o.id = tratamientos_dentales.odontograma_id 
    AND e.organizacion_id = get_user_organization()
  )
);

CREATE POLICY "tratamientos_dentales_insert" ON public.tratamientos_dentales
FOR INSERT WITH CHECK (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role)
);

CREATE POLICY "tratamientos_dentales_update" ON public.tratamientos_dentales
FOR UPDATE USING (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role) OR
  has_role('odontologo'::app_role) OR
  profesional_id = auth.uid()
);

CREATE POLICY "tratamientos_dentales_delete" ON public.tratamientos_dentales
FOR DELETE USING (
  has_role('admin_sistema'::app_role) OR
  has_role('admin_clinica'::app_role)
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_odontogramas_updated_at
BEFORE UPDATE ON public.odontogramas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tratamientos_dentales_updated_at
BEFORE UPDATE ON public.tratamientos_dentales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();