-- Create table to store medications catalog for autocomplete
CREATE TABLE public.medicamentos_catalogo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  dosis_comun TEXT,
  frecuencia_comun TEXT,
  duracion_comun TEXT,
  indicaciones_comunes TEXT,
  organizacion_id UUID REFERENCES public.organizaciones(id),
  uso_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nombre, organizacion_id)
);

-- Enable RLS
ALTER TABLE public.medicamentos_catalogo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view medications from their organization"
ON public.medicamentos_catalogo
FOR SELECT
USING (
  organizacion_id IS NULL OR 
  organizacion_id IN (
    SELECT organizacion_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert medications"
ON public.medicamentos_catalogo
FOR INSERT
WITH CHECK (
  organizacion_id IS NULL OR 
  organizacion_id IN (
    SELECT organizacion_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update medications from their organization"
ON public.medicamentos_catalogo
FOR UPDATE
USING (
  organizacion_id IS NULL OR 
  organizacion_id IN (
    SELECT organizacion_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Create index for fast text search
CREATE INDEX idx_medicamentos_nombre ON public.medicamentos_catalogo USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_medicamentos_org ON public.medicamentos_catalogo(organizacion_id);

-- Create trigger for updated_at
CREATE TRIGGER update_medicamentos_catalogo_updated_at
BEFORE UPDATE ON public.medicamentos_catalogo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();