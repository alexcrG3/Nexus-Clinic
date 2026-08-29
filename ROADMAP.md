# 🗺️ Roadmap Nexus Clinic (Marzo 2026)

Este documento describe el estado actual del desarrollo de Nexus Clinic y las metas futuras para completar la plataforma.

## ✅ Fase 1: Cimientos y Core (Completado)
*   **Infraestructura:** Configuración de React + Vite + Supabase.
*   **Seguridad:** Sistema de autenticación con RLS (Row Level Security) y protección de rutas.
*   **Gestión de Citas:** Calendario funcional, creación de citas y gestión de estados.
*   **Expediente Básico:** Registro de pacientes y estructura inicial de consultas médicas.
*   **Diseño:** Interfaz premium basada en shadcn/ui y Tailwind CSS.

## 🚧 Fase 2: Optimización y Seguridad Crítica (En Progreso)
*   **Flujo de Recuperación:** Implementación del acceso de emergencia vía PIN para cuentas con correos ficticios (Opción B del roadmap original).
*   **Refuerzo de Roles:** Reactivación del muro de seguridad y pruebas de asignación de permisos granular.
*   **QA Operativo:** Simulacros de flujo real desde el registro hasta la atención del paciente.

## 📋 Fase 3: Funcionalidades Pendientes (Corto Plazo)
*   **Notificaciones:** Alertas para doctores sobre nuevas citas y recordatorios para pacientes.
*   **Historias Clínicas Avanzadas:** Integración de odontogramas interactivos y subida de archivos (Radiografías/Documentos).
*   **Facturación Detallada:** Generación de PDFs de presupuestos y reportes de ingresos mensuales.
*   **Auditoría:** Registro de actividad por usuario para cumplimiento de normas de salud.

## 🚀 Fase 4: Expansión y Lanzamiento (Largo Plazo)
*   **PWA Completa:** Optimización de iconos, modo offline básico y notificaciones push nativas.
*   **Multi-Sede:** Soporte para organizaciones que manejan varias clínicas bajo una misma cuenta.
*   **Telemedicina:** Integración básica para consultas remotas (videollamada).

## 🤖 Fase 5: Automatización Avanzada (IA + n8n)
*   **Orquestación con n8n:** Conectar Nexus Clinic con WhatsApp y Google Calendar de forma nativa (sin Chatwoot).
*   **Dictado con IA:** Implementación de captura de voz para llenado automático de expedientes.
*   **Agente de Citas:** Flujos automáticos de reserva y confirmación sin intervención humana.
