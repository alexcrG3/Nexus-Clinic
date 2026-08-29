-- Eliminar rol de odontólogo de Camilo Brenes (dejar solo recepcionista)
DELETE FROM user_roles WHERE id = '7411e628-b2d9-46d2-b45d-8d839720e775';

-- Eliminar rol de recepcionista de Juan Perez (dejar solo médico)
DELETE FROM user_roles WHERE id = '8aec9131-37dd-4c09-b6f8-1cfb272cc46f';