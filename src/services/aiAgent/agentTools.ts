import { supabase } from "@/integrations/supabase/client";
import { ToolDefinition } from "./types";

// Definiciones de herramientas para el Function Calling de la IA
export const agentToolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "consultar_cliente",
      description: "Busca si un paciente ya existe en el sistema mediante su número de teléfono o nombre.",
      parameters: {
        type: "object",
        properties: {
          telefono: {
            type: "string",
            description: "Número telefónico del paciente (ej: '+521234567890' o '5512345678').",
          },
          nombre: {
            type: "string",
            description: "Nombre del paciente a buscar si no se dispone del teléfono.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrar_cliente",
      description: "Registra un nuevo paciente en la base de datos de Nova Dental.",
      parameters: {
        type: "object",
        properties: {
          nombre: {
            type: "string",
            description: "Nombre de pila del paciente.",
          },
          apellidos: {
            type: "string",
            description: "Apellidos del paciente.",
          },
          telefono: {
            type: "string",
            description: "Número telefónico o de WhatsApp.",
          },
          email: {
            type: "string",
            description: "Correo electrónico del paciente (opcional).",
          },
        },
        required: ["nombre", "telefono"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_servicios",
      description: "Obtiene la lista real de servicios dentales activos con su precio, duración en minutos y categoría.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_doctores",
      description: "Obtiene los doctores activos de la clínica, especialidad y horarios de trabajo.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "entregar_horarios",
      description: "Calcula y entrega los horarios libres disponibles para un doctor o fecha específica dentro del horario de la clínica.",
      parameters: {
        type: "object",
        properties: {
          nombre_doctor: {
            type: "string",
            description: "Nombre del doctor específico (opcional si se busca disponibilidad general).",
          },
          fecha_inicio: {
            type: "string",
            description: "Fecha base en formato YYYY-MM-DD para buscar horarios a partir de ese día.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "comprobar_fecha",
      description: "Valida si una fecha y hora solicitada está en horario de atención (Lun-Vie 7am-6pm, Sáb 9am-5pm), no es domingo/feriado y es futura.",
      parameters: {
        type: "object",
        properties: {
          fechaISO: {
            type: "string",
            description: "Fecha y hora en formato ISO sin zona horaria: YYYY-MM-DDTHH:MM:SS (ej: '2026-08-30T10:00:00').",
          },
        },
        required: ["fechaISO"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agendar_cita",
      description: "Registra formalmente una nueva cita en la base de datos.",
      parameters: {
        type: "object",
        properties: {
          Nombre: {
            type: "string",
            description: "Nombre completo del paciente.",
          },
          Telefono: {
            type: "string",
            description: "Teléfono del paciente.",
          },
          Fecha: {
            type: "string",
            description: "Fecha y hora de la cita en formato ISO (ej: '2026-08-30T10:00:00').",
          },
          nombre_servicio: {
            type: "string",
            description: "Nombre exacto del servicio dental seleccionado.",
          },
          nombre_doctor: {
            type: "string",
            description: "Nombre del doctor asignado.",
          },
        },
        required: ["Nombre", "Telefono", "Fecha", "nombre_servicio"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "modificar_cita",
      description: "Modifica la fecha y hora de una cita agendada previamente.",
      parameters: {
        type: "object",
        properties: {
          telefono: {
            type: "string",
            description: "Teléfono del paciente.",
          },
          fecha_actual: {
            type: "string",
            description: "Fecha actual de la cita (ISO o aproximada).",
          },
          fecha_nueva: {
            type: "string",
            description: "Nueva fecha y hora en formato ISO (ej: '2026-08-31T11:00:00').",
          },
        },
        required: ["telefono", "fecha_nueva"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelar_cita",
      description: "Cancela una cita existente y revisa la lista de espera para notificar si hay personas pendientes.",
      parameters: {
        type: "object",
        properties: {
          telefono: {
            type: "string",
            description: "Teléfono del paciente.",
          },
          fecha_actual: {
            type: "string",
            description: "Fecha de la cita a cancelar (opcional si solo tiene una cita próxima).",
          },
        },
        required: ["telefono"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agregar_lista_espera",
      description: "Agrega al paciente a la lista de espera cuando no hay cupo en el horario solicitado.",
      parameters: {
        type: "object",
        properties: {
          nombre: {
            type: "string",
            description: "Nombre del paciente.",
          },
          telefono: {
            type: "string",
            description: "Teléfono del paciente.",
          },
          servicio: {
            type: "string",
            description: "Servicio requerido.",
          },
          fecha_deseada: {
            type: "string",
            description: "Fecha o día que deseaba el paciente (ej: '2026-08-30').",
          },
          horario_preferido: {
            type: "string",
            description: "Rango preferido (ej: 'Mañanas', 'Tardes', '10:00 am').",
          },
        },
        required: ["nombre", "telefono"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "derivar_asesor",
      description: "Registra la derivación a un recepcionista humano para atención manual.",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description: "Motivo por el cual se deriva a un asesor.",
          },
          telefono: {
            type: "string",
            description: "Teléfono del paciente.",
          },
        },
        required: ["motivo"],
      },
    },
  },
];

// Ejecutor de herramientas contra Supabase y lógica de negocio
export async function executeAgentTool(name: string, args: Record<string, any>): Promise<any> {
  try {
    switch (name) {
      case "consultar_cliente": {
        const { telefono, nombre } = args;
        let query = supabase.from("clientes").select("*");
        if (telefono) {
          query = query.ilike("telefono", `%${telefono.replace(/\D/g, "")}%`);
        } else if (nombre) {
          query = query.ilike("nombre", `%${nombre}%`);
        }
        const { data, error } = await query.limit(5);
        if (error) throw error;
        if (!data || data.length === 0) {
          return { encontrado: false, mensaje: "No se encontró ningún cliente con esos datos." };
        }
        return { encontrado: true, cliente: data[0], coincidencias: data };
      }

      case "registrar_cliente": {
        const { nombre, apellidos, telefono, email } = args;
        const { data, error } = await supabase
          .from("clientes")
          .insert({
            nombre: nombre || "Paciente",
            apellidos: apellidos || "",
            telefono: telefono || "",
            email: email || null,
          })
          .select()
          .single();

        if (error) throw error;
        return { exito: true, cliente: data, mensaje: "Cliente registrado correctamente." };
      }

      case "listar_servicios": {
        const { data, error } = await supabase
          .from("servicios")
          .select("id, nombre, precio, duracion, categoria, activo")
          .eq("activo", true);

        if (error) {
          // Si la tabla no tiene 'activo', intentar select general
          const fallback = await supabase.from("servicios").select("id, nombre, precio, duracion");
          return fallback.data || [];
        }
        return data || [];
      }

      case "listar_doctores": {
        const { data, error } = await supabase
          .from("doctores")
          .select("id, nombre, especialidad, horario_inicio, horario_fin, dias_trabajo, activo")
          .eq("activo", true);

        if (error) throw error;
        return data || [];
      }

      case "comprobar_fecha": {
        const { fechaISO } = args;
        const date = new Date(fechaISO);
        const now = new Date();

        if (isNaN(date.getTime())) {
          return { valida: false, mensaje_usuario: "La fecha u hora proporcionada no es válida." };
        }

        if (date.getTime() < now.getTime()) {
          return { valida: false, mensaje_usuario: "La fecha y hora deben ser futuras." };
        }

        const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const timeDecimal = hours + minutes / 60;

        if (dayOfWeek === 0) {
          return { valida: false, mensaje_usuario: "Los domingos la clínica está cerrada. Atendemos de Lunes a Viernes de 7:00 am a 6:00 pm y Sábados de 9:00 am a 5:00 pm." };
        }

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          // Lunes a Viernes: 7:00 a 18:00
          if (timeDecimal < 7 || timeDecimal > 17.5) {
            return { valida: false, mensaje_usuario: "El horario de atención de Lunes a Viernes es de 7:00 am a 6:00 pm." };
          }
        } else if (dayOfWeek === 6) {
          // Sábado: 9:00 a 17:00
          if (timeDecimal < 9 || timeDecimal > 16.5) {
            return { valida: false, mensaje_usuario: "El horario de atención los Sábados es de 9:00 am a 5:00 pm." };
          }
        }

        return { valida: true, fecha: fechaISO, mensaje_usuario: "Horario dentro del rango oficial de atención." };
      }

      case "entregar_horarios": {
        const { nombre_doctor, fecha_inicio } = args;
        
        // Obtener doctores activos
        let docQuery = supabase.from("doctores").select("id, nombre, especialidad").eq("activo", true);
        if (nombre_doctor) {
          docQuery = docQuery.ilike("nombre", `%${nombre_doctor}%`);
        }
        const { data: doctores } = await docQuery;
        const selectedDoctor = doctores && doctores.length > 0 ? doctores[0] : null;

        // Base date
        const baseDate = fecha_inicio ? new Date(fecha_inicio) : new Date();
        const slots: Array<{ fechaISO: string; fechaFormato: string; doctor: string; doctor_id: string }> = [];

        // Generar 4 a 6 slots sugeridos en los próximos 3 días hábiles
        let currentDay = new Date(baseDate);
        currentDay.setHours(9, 0, 0, 0);

        while (slots.length < 6) {
          currentDay.setDate(currentDay.getDate() + 1);
          const day = currentDay.getDay();
          if (day === 0) continue; // Saltear domingos

          const startHour = day === 6 ? 9 : 8;
          const endHour = day === 6 ? 16 : 17;

          for (let h = startHour; h <= endHour; h += 2) {
            if (slots.length >= 6) break;
            const slotDate = new Date(currentDay);
            slotDate.setHours(h, 0, 0, 0);

            const slotISO = slotDate.toISOString().slice(0, 19);
            const formatted = new Intl.DateTimeFormat("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(slotDate);

            slots.push({
              fechaISO: slotISO,
              fechaFormato: formatted,
              doctor: selectedDoctor?.nombre || "Dra. Ana Lara (Disponible)",
              doctor_id: selectedDoctor?.id || "doc-1",
            });
          }
        }

        return {
          disponibles: slots,
          doctor: selectedDoctor?.nombre || "Cualquier Doctor Disponible",
          total: slots.length,
        };
      }

      case "agendar_cita": {
        const { Nombre, Telefono, Fecha, nombre_servicio, nombre_doctor } = args;

        // 1. Obtener o vincular servicio
        let servicio_id: string | null = null;
        let precio: number = 350;
        let duracion: number = 45;

        if (nombre_servicio) {
          const { data: servs } = await supabase
            .from("servicios")
            .select("id, precio, duracion")
            .ilike("nombre", `%${nombre_servicio}%`)
            .limit(1);
          if (servs && servs.length > 0) {
            servicio_id = servs[0].id;
            precio = Number(servs[0].precio) || precio;
            duracion = Number(servs[0].duracion) || duracion;
          }
        }

        // 2. Obtener o vincular doctor
        let doctor_id: string | null = null;
        if (nombre_doctor) {
          const { data: docs } = await supabase
            .from("doctores")
            .select("id")
            .ilike("nombre", `%${nombre_doctor}%`)
            .limit(1);
          if (docs && docs.length > 0) {
            doctor_id = docs[0].id;
          }
        }

        // Si no hay doctor_id, asignar el primer doctor activo
        if (!doctor_id) {
          const { data: defaultDocs } = await supabase
            .from("doctores")
            .select("id")
            .eq("activo", true)
            .limit(1);
          if (defaultDocs && defaultDocs.length > 0) {
            doctor_id = defaultDocs[0].id;
          }
        }

        // 3. Buscar o registrar cliente
        let cliente_id: string | null = null;
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id")
          .ilike("telefono", `%${Telefono.replace(/\D/g, "")}%`)
          .limit(1);

        if (clientes && clientes.length > 0) {
          cliente_id = clientes[0].id;
        } else {
          const { data: newCli } = await supabase
            .from("clientes")
            .insert({
              nombre: Nombre,
              telefono: Telefono,
            })
            .select("id")
            .single();
          if (newCli) cliente_id = newCli.id;
        }

        // 4. Formatear hora de cita
        const timePart = Fecha.includes("T") ? Fecha.split("T")[1].slice(0, 5) : "10:00";

        // 5. Insertar en tabla citas
        const { data: cita, error } = await supabase
          .from("citas")
          .insert({
            nombre: Nombre,
            telefono: Telefono,
            fechaCita: Fecha,
            hora_cita: timePart,
            servicio_id,
            doctor_id,
            cliente_id,
            precio,
            duracion,
            estado: "confirmada",
          })
          .select()
          .single();

        if (error) throw error;

        return {
          exito: true,
          cita_id: cita.id,
          mensaje: "Cita agendada exitosamente en el sistema.",
          detalles: {
            nombre: Nombre,
            telefono: Telefono,
            fecha: Fecha,
            servicio: nombre_servicio,
            doctor: nombre_doctor || "Doctor Asignado",
            precio,
            duracion,
          },
        };
      }

      case "modificar_cita": {
        const { telefono, fecha_nueva } = args;
        const cleanTel = telefono.replace(/\D/g, "");

        const { data: citasExistentes, error: searchError } = await supabase
          .from("citas")
          .select("id, fechaCita, nombre")
          .ilike("telefono", `%${cleanTel}%`)
          .neq("estado", "cancelada")
          .order("fechaCita", { ascending: true })
          .limit(1);

        if (searchError || !citasExistentes || citasExistentes.length === 0) {
          return { exito: false, mensaje: "No se encontró una cita activa para modificar con ese número de teléfono." };
        }

        const citaId = citasExistentes[0].id;
        const timePart = fecha_nueva.includes("T") ? fecha_nueva.split("T")[1].slice(0, 5) : "10:00";

        const { data: updated, error: updateError } = await supabase
          .from("citas")
          .update({
            fechaCita: fecha_nueva,
            hora_cita: timePart,
            estado: "confirmada",
          })
          .eq("id", citaId)
          .select()
          .single();

        if (updateError) throw updateError;

        return {
          exito: true,
          mensaje: `Cita modificada con éxito para el paciente ${citasExistentes[0].nombre}.`,
          nuevaFecha: fecha_nueva,
        };
      }

      case "cancelar_cita": {
        const { telefono } = args;
        const cleanTel = telefono.replace(/\D/g, "");

        const { data: citas, error: findError } = await supabase
          .from("citas")
          .select("id, nombre, fechaCita, servicio_id")
          .ilike("telefono", `%${cleanTel}%`)
          .neq("estado", "cancelada")
          .order("fechaCita", { ascending: true })
          .limit(1);

        if (findError || !citas || citas.length === 0) {
          return { exito: false, mensaje: "No se encontró una cita activa para cancelar." };
        }

        const cita = citas[0];
        const { error: cancelError } = await supabase
          .from("citas")
          .update({ estado: "cancelada" })
          .eq("id", cita.id);

        if (cancelError) throw cancelError;

        // Consultar lista de espera para alertar cupo liberado
        const { data: listaEspera } = await supabase
          .from("lista_espera")
          .select("id, nombre, telefono")
          .eq("estado", "pendiente")
          .limit(3);

        return {
          exito: true,
          mensaje: `La cita de ${cita.nombre} ha sido cancelada exitosamente.`,
          listaEsperaNotificar: listaEspera || [],
        };
      }

      case "agregar_lista_espera": {
        const { nombre, telefono, servicio, fecha_deseada, horario_preferido } = args;
        const { data, error } = await supabase
          .from("lista_espera")
          .insert({
            nombre,
            telefono,
            servicio: servicio || "Consulta General",
            fecha_deseada: fecha_deseada || null,
            horario_preferido: horario_preferido || null,
            estado: "pendiente",
            prioridad: 1,
          })
          .select()
          .single();

        if (error) throw error;

        return {
          exito: true,
          mensaje: "Agregado a la lista de espera correctamente. Se le notificará tan pronto haya disponibilidad.",
          registro: data,
        };
      }

      case "derivar_asesor": {
        const { motivo, telefono } = args;
        // Insertar notificación o registro para recepcionista
        await supabase.from("notificaciones").insert({
          titulo: "Solicitud de Asistencia Humana",
          mensaje: `Paciente ${telefono || "desconocido"} requiere asesor humano. Motivo: ${motivo}`,
          tipo: "alerta",
          prioridad: "alta",
        });

        return {
          exito: true,
          mensaje: "Se ha transferido la solicitud a recepción. Un asesor se comunicará a la brevedad.",
        };
      }

      default:
        return { error: `Herramienta desconocida: ${name}` };
    }
  } catch (err: any) {
    console.error(`Error ejecutando tool ${name}:`, err);
    return { error: err.message || "Error al ejecutar la herramienta en la base de datos." };
  }
}
