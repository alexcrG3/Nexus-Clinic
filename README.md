# Nexus Clinic - Sistema Integrado de Gestión Institucional

Nexus Clinic es una plataforma moderna integral diseñada para gestionar operaciones médicas, expedientes de pacientes, y citas en clínicas dentales. Está construida usando tecnologías web modernas que resultan en una aplicación rápida, segura y reactiva.

## 🚀 Características Principales

*   **Agenda Inteligente**: Sistema de control de turnos y citas médicas en tiempo real.
*   **Gestión de Pacientes**: Directorio exhaustivo para manejar la cartera de clientes.
*   **Expedientes Clínicos (EMR)**: Sistema integral de historial de salud, odontogramas y evolución de cada paciente.
*   **Mensajería**: Módulo integrado para comunicación.
*   **Facturación**: Manejo de ingresos, pagos y presupuestos asociados a los tratamientos.
*   **Reportes y Auditoría**: Visualización de métricas de crecimiento, reportes financieros y un registro detallado de las actividades en el sistema por motivos de seguridad. 
*   **Perfiles y Roles**: Control de acceso granular para administradores, dentistas, y recepcionistas.

## 💻 Tecnologías Utilizadas

Este proyecto es una aplicación frontend _Single Page Application_ (SPA) robusta.

*   **Framework Principal**: React (v18)
*   **Bundler**: Vite
*   **Lenguaje**: TypeScript
*   **Estilos**: Tailwind CSS con componentes UI listos para usar de shadcn-ui.
*   **Enrutamiento**: React Router DOM
*   **Estado Asíncrono**: TanStack Query (React Query)
*   **Backend como Servicio**: Supabase (Autenticación, Base de Datos PostgreSQL en tiempo real y Almacenamiento).
*   **Empaquetado Móvil**: Configurado marginalmente con Capacitor para capacidades nativas PWA/Mobile.

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu entorno local:

*   Node.js (versión 18 o superior)
*   npm o yarn instalado
*   Un proyecto en Supabase con sus credenciales correspondientes.

## ⚙️ Configuración y Despliegue Local

Sigue los pasos a continuación para iniciar el proyecto en desarrollo:

1.  **Clonar el repositorio** e ir al directorio principal:
```bash
git clone <URL_DEL_REPOSITORIO>
cd Nexus-Clinic
```

2.  **Instalar las dependencias** requeridas por el proyecto:
```bash
npm install
```

3.  **Configurar Variables de Entorno**:
    Crea un archivo local `.env` basado en la configuración del entorno para definir las claves requeridas para Supabase.
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
```

4.  **Iniciar el servidor de desarrollo**:
```bash
npm run dev
```

El proyecto estará corriendo y se recargará automáticamente cada vez que edites un archivo.

## 📦 Construcción para Producción

Para crear el paquete de front-end optimizado listo para alojar:

```bash
npm run build
```

El código minificado se generará en la carpeta `dist`.

---
*Diseñado a medida para optimizar el flujo de trabajo en la práctica odontológica moderna.*
