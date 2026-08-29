-- Crear clientes para Dr. Juan Pérez
INSERT INTO public.clientes (nombre, apellidos, telefono, email, organizacion_id)
VALUES 
  ('Carlos', 'Mendoza Silva', '70112233', 'carlos.mendoza@email.com', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'),
  ('María', 'Fernández López', '71223344', 'maria.fernandez@email.com', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950');

-- Crear citas para Dr. Juan Pérez (Medicina General) - id: 8ba0bbb9-d420-477c-b29e-a16ba621bb20
INSERT INTO public.citas (nombre, telefono, "fechaCita", hora_cita, estado, doctor_id, organizacion_id)
VALUES 
  ('Carlos Mendoza Silva', '70112233', '2026-01-15', '09:00', 'pendiente', '8ba0bbb9-d420-477c-b29e-a16ba621bb20', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950'),
  ('María Fernández López', '71223344', '2026-01-20', '11:00', 'confirmada', '8ba0bbb9-d420-477c-b29e-a16ba621bb20', 'ff1394c3-72df-478f-9dff-ea9dc0b3e950');