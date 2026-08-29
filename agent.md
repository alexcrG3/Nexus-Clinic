# Contexto de Nexus Clinic para el Agente

Este archivo proporciona un resumen técnico y de contexto para ayudar a los asistentes de IA a entender el estado y la estructura del proyecto **Nexus Clinic**.

## 🚀 Resumen del Proyecto
Nexus Clinic es un sistema de gestión institucional para clínicas de salud, centrado inicialmente en odontología pero diseñado con flexibilidad para otras áreas. 

## 🛠 Stack Tecnológico
- **Frontend:** React 18, Vite, TypeScript.
- **UI & Estilos:** Tailwind CSS, shadcn/ui, Lucide React.
- **Estado & Datos:** TanStack Query (React Query).
- **Backend (BaaS):** Supabase (Auth, PostgreSQL con RLS, Storage).
- **Móvil:** Capacitor (preparado para PWA/Nativo).

## 📁 Estructura Clave de Archivos
- `/src/pages/dashboard/`: Contiene las páginas principales del panel (Citas, Expedientes, Facturación).
- `/src/components/dashboard/`: Componentes modulares que alimentan las vistas del dashboard (ej. `AppointmentsTab.tsx`).
- `/supabase/migrations/`: Definiciones de tablas y políticas RLS.
- `package.json`: Definición de scripts y dependencias.

## 📈 Estado de Funcionalidades
- [x] **Gestión de Citas:** Completa con estados (Confirmada, Pendiente, Atendida).
- [x] **Expediente Clínico (EMR):** Estructura base para anamnesis, signos vitales y diagnósticos.
- [x] **Facturación:** Módulo base para pagos y presupuestos.
- [x] **Roles y Seguridad:** Sistema de aprobación de usuarios y roles (Admin, Doctor, Recepcionista).
- [/] **PWA/Mobile:** Configuración base lista, pendiente optimización de iconos y splash.

## 🎯 Instrucciones para el Agente
- Mantener siempre la estética premium con shadcn/ui y tonos profesionales.
- Al modificar el backend, priorizar el uso de migraciones de Supabase.
- Asegurar que todas las nuevas rutas estén protegidas por el componente `ProtectedRoute`.
