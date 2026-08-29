
-- Modificar audit_log para permitir user_id NULL (para seed de datos)
ALTER TABLE audit_log ALTER COLUMN user_id DROP NOT NULL;
