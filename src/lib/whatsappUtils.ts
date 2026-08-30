/**
 * Utilidades para el envío de recordatorios y confirmaciones directas por WhatsApp
 */

export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  // Remover caracteres no numéricos excepto el +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Si no tiene código de país y tiene 8 dígitos (formato estándar de Costa Rica), agregar 506
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    return `506${digitsOnly}`;
  }

  return digitsOnly;
}

export interface WhatsAppCitaData {
  pacienteNombre: string;
  pacienteTelefono?: string | null;
  fechaCita: string; // "2026-08-31" o formato legible
  horaCita: string;  // "10:00"
  doctorNombre?: string | null;
  clinicaNombre?: string | null;
  tipoMensaje?: "recordatorio" | "confirmacion";
}

export function buildWhatsAppMessage({
  pacienteNombre,
  fechaCita,
  horaCita,
  doctorNombre = "su especialista",
  clinicaNombre = "Nexus Clinic",
  tipoMensaje = "recordatorio",
}: WhatsAppCitaData): string {
  const nombreCorto = pacienteNombre.split(" ")[0];

  if (tipoMensaje === "confirmacion") {
    return (
      `👋 ¡Hola, *${nombreCorto}*! Le saludamos de *${clinicaNombre}*.\n\n` +
      `✅ Su cita médica ha sido *CONFIRMADA* con éxito:\n` +
      `📅 *Fecha:* ${fechaCita}\n` +
      `🕒 *Hora:* ${horaCita}\n` +
      `👨‍⚕️ *Especialista:* ${doctorNombre}\n\n` +
      `📍 Le recordamos presentarse 10 minutos antes.\n` +
      `¡Muchas gracias por su confianza!`
    );
  }

  // Recordatorio estándar
  return (
    `👋 ¡Hola, *${nombreCorto}*! Le saludamos de *${clinicaNombre}*.\n\n` +
    `🔔 Le recordamos su cita médica programada:\n` +
    `📅 *Fecha:* ${fechaCita}\n` +
    `🕒 *Hora:* ${horaCita}\n` +
    `👨‍⚕️ *Especialista:* ${doctorNombre}\n\n` +
    `Por favor confírmenos su asistencia respondiendo a este mensaje.\n` +
    `¡Le esperamos con gusto!`
  );
}

export function sendWhatsAppCita(data: WhatsAppCitaData): boolean {
  const phone = cleanPhoneNumber(data.pacienteTelefono);
  if (!phone) {
    return false;
  }

  const message = buildWhatsAppMessage(data);
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encodedText}`;

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
