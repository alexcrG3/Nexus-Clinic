-- Eliminar las políticas existentes que causan recursión
DROP POLICY IF EXISTS "Admin can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Crear políticas sin recursión usando auth.uid() directamente
-- Los usuarios pueden ver solo sus propios roles
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Solo permitir inserción si no hay admins o si el usuario actual es admin
CREATE POLICY "Allow role creation during signup or by admin"
  ON user_roles
  FOR INSERT
  WITH CHECK (
    -- Permitir durante signup (cuando no hay roles todavía)
    NOT EXISTS (SELECT 1 FROM user_roles WHERE role IN ('admin_sistema', 'admin_clinica'))
    OR
    -- O si el usuario actual ya es admin
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_sistema', 'admin_clinica')
    )
  );

-- Solo admins pueden actualizar roles
CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_sistema', 'admin_clinica')
    )
  );

-- Solo admins pueden eliminar roles
CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_sistema', 'admin_clinica')
    )
  );