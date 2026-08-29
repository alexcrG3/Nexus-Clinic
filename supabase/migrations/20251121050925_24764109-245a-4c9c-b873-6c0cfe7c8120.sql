-- Agregar campos faltantes a la tabla clientes para información demográfica
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS sexo TEXT,
  ADD COLUMN IF NOT EXISTS grupo_sanguineo TEXT;

-- Agregar hora a la tabla citas y campos adicionales
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS hora_cita TIME,
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Crear índice para ordenar citas por fecha y hora (usando el nombre correcto de columna)
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas("fechaCita", hora_cita);

-- Expandir la tabla consultas para incluir todos los campos del registro médico completo
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
  ADD COLUMN IF NOT EXISTS anamnesis TEXT,
  ADD COLUMN IF NOT EXISTS enfermedades_cronicas TEXT[],
  ADD COLUMN IF NOT EXISTS medicamentos_actuales TEXT[],
  ADD COLUMN IF NOT EXISTS alergias TEXT[],
  ADD COLUMN IF NOT EXISTS cirugias_previas TEXT[],
  ADD COLUMN IF NOT EXISTS habitos JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS signos_vitales JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS examen_fisico TEXT,
  ADD COLUMN IF NOT EXISTS diagnostico_principal TEXT,
  ADD COLUMN IF NOT EXISTS diagnosticos_secundarios TEXT[],
  ADD COLUMN IF NOT EXISTS codigo_cie10 TEXT,
  ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT,
  ADD COLUMN IF NOT EXISTS procedimiento_realizado TEXT,
  ADD COLUMN IF NOT EXISTS medicamentos_recetados JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS materiales_usados TEXT[],
  ADD COLUMN IF NOT EXISTS recomendaciones TEXT,
  ADD COLUMN IF NOT EXISTS proxima_cita DATE,
  ADD COLUMN IF NOT EXISTS motivo_proxima_cita TEXT,
  ADD COLUMN IF NOT EXISTS estado_consulta TEXT DEFAULT 'finalizada' CHECK (estado_consulta IN ('finalizada', 'pendiente_revision', 'en_seguimiento')),
  ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- Crear tabla de antecedentes médicos generales (se reutiliza entre consultas)
CREATE TABLE IF NOT EXISTS antecedentes_medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  enfermedades_cronicas TEXT[],
  medicamentos_actuales TEXT[],
  alergias TEXT[],
  cirugias_previas TEXT[],
  antecedentes_familiares TEXT,
  habitos JSONB DEFAULT '{"tabaquismo": false, "alcohol": false, "ejercicio": ""}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cliente_id)
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE antecedentes_medicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para antecedentes_medicos
CREATE POLICY "medical_staff_can_view_antecedentes"
  ON antecedentes_medicos
  FOR SELECT
  USING (
    has_role('admin_sistema') 
    OR has_role('admin_clinica') 
    OR has_role('medico') 
    OR has_role('odontologo') 
    OR has_role('fisioterapeuta') 
    OR has_role('quiropractico')
  );

CREATE POLICY "medical_staff_can_create_antecedentes"
  ON antecedentes_medicos
  FOR INSERT
  WITH CHECK (
    has_role('admin_sistema') 
    OR has_role('admin_clinica') 
    OR has_role('medico') 
    OR has_role('odontologo') 
    OR has_role('fisioterapeuta') 
    OR has_role('quiropractico')
  );

CREATE POLICY "medical_staff_can_update_antecedentes"
  ON antecedentes_medicos
  FOR UPDATE
  USING (
    has_role('admin_sistema') 
    OR has_role('admin_clinica') 
    OR has_role('medico') 
    OR has_role('odontologo') 
    OR has_role('fisioterapeuta') 
    OR has_role('quiropractico')
  );

-- Trigger para actualizar updated_at en antecedentes_medicos
CREATE TRIGGER update_antecedentes_medicos_updated_at
  BEFORE UPDATE ON antecedentes_medicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();