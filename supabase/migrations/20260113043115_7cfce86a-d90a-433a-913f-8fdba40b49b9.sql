-- 1. Desvincular al doctor "Lic. Miguel Fernández" del usuario incorrecto (ana@medicr.com)
UPDATE doctores 
SET user_id = NULL 
WHERE id = 'bdaf201c-ed3a-40d5-9b7e-bfca4bd47882';

-- 2. Vincular al doctor "Lic. Miguel Fernández" con el usuario correcto (miguel@medicr.com)
UPDATE doctores 
SET user_id = '07f6b8de-57b4-4c3d-8759-8cf332211ffe'
WHERE id = 'bdaf201c-ed3a-40d5-9b7e-bfca4bd47882';

-- 3. Actualizar el expediente de Ana Fernández para que apunte al perfil correcto de Miguel
UPDATE expedientes 
SET profesional_id = '34f352a3-cf9d-4487-9459-9ea44a5d806d'
WHERE id = '12f7ff8a-e726-4271-bdb1-5bbf22609ba6';