# 📋 BITÁCORA OFICIAL DE INCIDENCIAS Y DESARROLLO — NEXUS CLINIC

> **Regla de mantenimiento:** Lo último que se implemente o resuelva **SIEMPRE debe agregarse de primero** al inicio de esta bitácora, con su respectiva fecha, hora, diagnóstico del error, solución aplicada y lección aprendida para evitar su recurrencia.

---

## 📅 Jornada: 31 de Agosto de 2026

---

### 🕒 [20:30 - 20:36] — Implementación: Copiloto Clínico con IA (Estilo Heidi Health)
* **Objetivo / Requerimiento:**  
  Permitir que el médico active una escucha ambiental durante la consulta en vivo. La IA procesa el diálogo médico-paciente y auto-rellena en formato SOAP el motivo de consulta, examen físico, diagnóstico CIE-10, prescripción de medicamentos con posología completa y resumen claro para el paciente.
* **Componentes Creados / Integrados:**  
  1. `src/services/aiScribe/types.ts`: Tipado TypeScript para notas clínicas estructuradas, signos vitales y prescripción de fármacos.
  2. `src/services/aiScribe/scribeEngine.ts`: Motor de extracción clínica con prompts avanzados para GPT-4o y extractor clínico heurístico de respaldo sin requerir clave obligatoria.
  3. `src/components/consultas/AiAmbientScribeModal.tsx`: Modal interactivo con reconocimiento de voz continuo en tiempo real, cronómetro, transcripción editable, visor estructurado y botón *"Aplicar al Expediente y Receta"*.
  4. `src/components/consultas/ConsultaProfesional.tsx`: Banner interactivo en la cabecera e inyección automática en todos los estados del expediente y la receta médica.
* **Garantía de Cero Afectación:**  
  La integración se conecta exclusivamente a los `useState` del formulario existente sin modificar esquemas de base de datos ni romper las validaciones o flujos preexistentes.

---

## 📅 Jornada: 29 de Agosto de 2026

---

### 🕒 [22:58 - 23:00] — Incidencia: Asignación Incorrecta de Consultorio en Turnos (Juan Pérez -> Dra. Carmen Torres)
* **Contexto / Síntoma:**  
  El usuario inició sesión como médico con la cuenta `juanp@medicr.com` (`Dr. Juan Pérez`), pero el llamador de turnos mostraba la insignia `Su Consultorio: Consultorio 6 (Dra. Carmen Torres)`.
* **Causa Raíz:**  
  1. En la tabla `profiles`, el nombre estaba guardado como `"juan Perez"` (sin tilde).
  2. En la tabla `doctores`, el registro figuraba como `"Dr. Juan Pérez"` (con tilde y prefijo `Dr.`).
  3. La comparación de cadenas estricta fallaba por la tilde (`é` vs `e`), cayendo en el valor por defecto `doctoresDb[0]` (que por orden de consulta era Carmen Torres).
* **Solución Aplicada:**  
  Se implementó una función de **normalización de texto insensible a acentos** (`.normalize("NFD").replace(/[\u0300-\u036f]/g, "")`), removiendo prefijos (`dr.`, `dra.`, `lic.`) y agregando respaldo por coincidencia de prefijo de correo electrónico (`juanp` ➔ `Dr. Juan Pérez`).
* **Lección / Acción Preventiva:**  
  Nunca comparar nombres de usuarios y entidades médicas con igualdad estricta. Siempre normalizar tildes, mayúsculas y prefijos clínicos antes de realizar cruces de identidad.

---

### 🕒 [22:45 - 22:48] — Incidencia: Cobro Registrado No Aparecía en el Arqueo de Caja Diario + Tema Oscuro
* **Contexto / Síntoma:**  
  Tras cobrar una consulta de ₡30.000 a la paciente María Fernández López, el modal de **Arqueo y Cierre de Caja** marcaba `₡0` en ingresos y aparecía con fondo oscuro en lugar del tema claro del dashboard.
* **Causa Raíz:**  
  1. **Desfase de Zona Horaria (UTC vs Local):** Al registrar el pago a las 10:40 p. m. hora de Costa Rica (UTC-6), `new Date().toISOString()` generó `"2026-08-30T04:40:00Z"`. Como la columna en PostgreSQL es `timestamp without time zone`, se almacenó como `2026-08-30`, provocando que el filtro de `2026-08-29` no lo incluyera.
  2. **Estilo hardcodeado:** El modal tenía clases `bg-slate-950 text-white` en vez de usar las variables del tema de Tailwind (`bg-card text-foreground`).
* **Solución Aplicada:**  
  1. Se corrigió el guardado de timestamps para utilizar hora local (`format(new Date(), "yyyy-MM-dd HH:mm:ss")`).
  2. Se actualizó el registro en la base de datos a `2026-08-29 22:40:00`.
  3. Se rediseñó `CierreCajaModal.tsx` y `CobroConsultaModal.tsx` con el diseño en modo claro/institucional (`bg-card`, bordes sutiles, métricas en verde esmeralda y azul).
* **Lección / Acción Preventiva:**  
  Para columnas de tipo `timestamp without time zone` en Postgres, nunca enviar ISO strings en UTC (`Z`) sin previa conversión local, o de lo contrario las transacciones nocturnas pasarán al día siguiente contable.

---

### 🕒 [22:35 - 22:42] — Implementación: Módulos Clave para Producción
* **Trabajo Realizado:**  
  1. **📲 Enlace Directo a WhatsApp:** Utilidad `whatsappUtils.ts` que formatea automáticamente el número a Costa Rica (`+506`) y abre el chat con mensajes preformateados de recordatorio y confirmación de citas.
  2. **🧾 Cierre de Caja / Arqueo Diario:** Componente `CierreCajaModal.tsx` en Facturación que calcula automáticamente ingresos en Efectivo, Datáfono, SINPE Móvil y Transferencias, egresos de caja chica, saldo neto y exportación a Excel / Impresión.
  3. **📄 Receta Médica Imprimible en PDF:** Componente `RecetaActions.tsx` integrado en consultas y expedientes con membrete clínico, logotipo, datos del paciente, diagnóstico CIE-10, tabla de medicamentos y firma del profesional.
  4. **🔒 Restricción de Permisos por Rol:** Adaptación del menú lateral (`AppSidebar.tsx`) para ocultar módulos contables y administrativos a los médicos, y restringir módulos del sistema exclusivamente a administradores.

---

### 🕒 [21:50 - 22:15] — Incidencia: Bloqueo de Citas con Horas / Fechas Pasadas
* **Contexto / Síntoma:**  
  El sistema permitía agendar citas en fechas anteriores o en bloques horarios que ya habían transcurrido durante el día.
* **Causa Raíz:**  
  `CitaFormDialog.tsx` solo validaba si la fecha era anterior a hoy a nivel de días, pero no evaluaba si la hora seleccionada ya había pasado en la jornada actual.
* **Solución Aplicada:**  
  Se implementó la función `isPastSlot(date, slotTime)` que compara la hora de cada casilla contra `new Date()`. Si el horario ya pasó, se bloquea visualmente, se tacha y se inhabilita el clic. Se añadió además una validación en `handleSubmit` que cancela el guardado si la cita está en el pasado.
* **Lección / Acción Preventiva:**  
  La validación de agendamiento debe ser a nivel de minuto exacto y no únicamente de fecha (año/mes/día).

---

### 🕒 [21:20 - 21:45] — Incidencia: Error de Base de Datos `citas_estado_check`
* **Contexto / Síntoma:**  
  Al intentar finalizar una consulta desde el llamador de turnos o cambiar el estado de la cita a `'atendida'` o `'llamado'`, PostgreSQL rechazaba la consulta por fallo en la restricción de validación `citas_estado_check`.
* **Causa Raíz:**  
  El check constraint original de la tabla `citas` en Supabase únicamente admitía: `['pendiente', 'confirmada', 'proceso', 'completada', 'cancelada']`, bloqueando los estados necesarios del flujo clínico en tiempo real (`'atendida'`, `'llamado'`, `'finalizada'`).
* **Solución Aplicada:**  
  Se ejecutó una migración en PostgreSQL reemplazando el constraint `citas_estado_check` por uno ampliado que admite:  
  `ARRAY['pendiente', 'confirmada', 'proceso', 'completada', 'atendida', 'llamado', 'finalizada', 'cancelada']`.
* **Lección / Acción Preventiva:**  
  Antes de agregar nuevos estados en los tipos de TypeScript o en la lógica de Frontend, verificar siempre las restricciones (`CHECK constraints` y `ENUMs`) de las tablas correspondientes en PostgreSQL.

---

### 🕒 [20:30 - 21:15] — Incidencia: Reportes Financieros y Métricas de Citas Sin Datos
* **Contexto / Síntoma:**  
  La pantalla de Reportes no mostraba las estadísticas del día y lanzaba un error en consola `Uncaught ReferenceError: citasCompletadas is not defined`.
* **Causa Raíz:**  
  1. Variable `citasCompletadas` no estaba declarada en el alcance de la función de renderizado.
  2. No existía el filtro rápido de período `"Hoy"`, obligando al usuario a seleccionar rangos semanales o mensuales.
* **Solución Aplicada:**  
  1. Se corrigió la referencia a las citas completadas/atendidas.
  2. Se agregó la opción `"hoy"` en el selector de períodos para auditoría en tiempo real.
  3. Se organizaron los estados en tarjetas de colores (Verde = Atendidas, Azul = Confirmadas en sala, Ámbar = Pendientes, Rojo = Canceladas).

---

### 🕒 [19:30 - 20:20] — Incidencia: Botón Principal de Llamado en Consultorio No Realizaba el Llamado
* **Contexto / Síntoma:**  
  Al presionar el botón grande de llamada `LLAMAR A [PACIENTE]`, no se emitía la señal al monitor TV ni sonaba el sintetizador de voz, mientras que el botón pequeño sí funcionaba. Además, no se mostraba la fecha y hora de la cita en la fila de espera.
* **Causa Raíz:**  
  1. El manejador `onClick` del botón principal invocaba un método genérico sin pasar el ID específico del siguiente paciente en cola.
  2. La propiedad `fechaCita` no estaba mapeada en la interfaz `TurnoPaciente`.
* **Solución Aplicada:**  
  1. Se estandarizó el handler para llamar a `handleCallSpecificPatient(nextInOffice.id)`.
  2. Se agregó `fechaCita` a `TurnoPaciente` y se agregaron insignias visibles con `📅 DD/MM` y `🕒 HH:MM` en las tarjetas de consultorio y fila unificada.
