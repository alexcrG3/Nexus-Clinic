export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      antecedentes_medicos: {
        Row: {
          alergias: string[] | null
          antecedentes_familiares: string | null
          cirugias_previas: string[] | null
          cliente_id: string
          created_at: string | null
          enfermedades_cronicas: string[] | null
          habitos: Json | null
          id: string
          medicamentos_actuales: string[] | null
          updated_at: string | null
        }
        Insert: {
          alergias?: string[] | null
          antecedentes_familiares?: string | null
          cirugias_previas?: string[] | null
          cliente_id: string
          created_at?: string | null
          enfermedades_cronicas?: string[] | null
          habitos?: Json | null
          id?: string
          medicamentos_actuales?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alergias?: string[] | null
          antecedentes_familiares?: string | null
          cirugias_previas?: string[] | null
          cliente_id?: string
          created_at?: string | null
          enfermedades_cronicas?: string[] | null
          habitos?: Json | null
          id?: string
          medicamentos_actuales?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "antecedentes_medicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      caja_chica: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: string
          monto: number | null
          tipo: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: string
          monto?: number | null
          tipo?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: string
          monto?: number | null
          tipo?: string | null
        }
        Relationships: []
      }
      chatwoot_config: {
        Row: {
          activo: boolean | null
          chatwoot_account_id: string
          chatwoot_api_token: string
          chatwoot_api_token_encrypted: string | null
          chatwoot_url: string
          created_at: string | null
          id: string
          inbox_id: string | null
          organizacion_id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          chatwoot_account_id: string
          chatwoot_api_token: string
          chatwoot_api_token_encrypted?: string | null
          chatwoot_url: string
          created_at?: string | null
          id?: string
          inbox_id?: string | null
          organizacion_id: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          chatwoot_account_id?: string
          chatwoot_api_token?: string
          chatwoot_api_token_encrypted?: string | null
          chatwoot_url?: string
          created_at?: string | null
          id?: string
          inbox_id?: string | null
          organizacion_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      citas: {
        Row: {
          cliente_id: string | null
          created_at: string
          doctor_id: string | null
          duracion: number | null
          estado: string | null
          fechaCita: string | null
          hora_cita: string | null
          id: string
          nombre: string | null
          organizacion_id: string | null
          precio: number | null
          servicio_id: string | null
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          doctor_id?: string | null
          duracion?: number | null
          estado?: string | null
          fechaCita?: string | null
          hora_cita?: string | null
          id?: string
          nombre?: string | null
          organizacion_id?: string | null
          precio?: number | null
          servicio_id?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          doctor_id?: string | null
          duracion?: number | null
          estado?: string | null
          fechaCita?: string | null
          hora_cita?: string | null
          id?: string
          nombre?: string | null
          organizacion_id?: string | null
          precio?: number | null
          servicio_id?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          apellidos: string | null
          cedula: string | null
          created_at: string
          direccion: string | null
          email: string | null
          fecha_nacimiento: string | null
          grupo_sanguineo: string | null
          id: string
          nombre: string | null
          organizacion_id: string | null
          sexo: string | null
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          apellidos?: string | null
          cedula?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          nombre?: string | null
          organizacion_id?: string | null
          sexo?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          apellidos?: string | null
          cedula?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          nombre?: string | null
          organizacion_id?: string | null
          sexo?: string | null
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_clinica: {
        Row: {
          created_at: string
          direccion: string | null
          duracion_cita: number | null
          email: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          logo_url: string | null
          moneda_simbolo: string | null
          nombre_clinica: string | null
          telefono: string | null
          trabajo_sabado: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          duracion_cita?: number | null
          email?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          logo_url?: string | null
          moneda_simbolo?: string | null
          nombre_clinica?: string | null
          telefono?: string | null
          trabajo_sabado?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          duracion_cita?: number | null
          email?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          logo_url?: string | null
          moneda_simbolo?: string | null
          nombre_clinica?: string | null
          telefono?: string | null
          trabajo_sabado?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          alergias: string[] | null
          anamnesis: string | null
          cirugias_previas: string[] | null
          codigo_cie10: string | null
          created_at: string
          detalle: string | null
          diagnostico_principal: string | null
          diagnosticos_secundarios: string[] | null
          documentos: Json | null
          enfermedades_cronicas: string[] | null
          estado_consulta: string | null
          examen_fisico: string | null
          expediente_id: string
          fecha: string
          habitos: Json | null
          id: string
          materiales_usados: string[] | null
          medicamentos_actuales: string[] | null
          medicamentos_recetados: Json | null
          motivo_consulta: string | null
          motivo_proxima_cita: string | null
          notas: string | null
          notas_internas: string | null
          plan_tratamiento: string | null
          procedimiento_realizado: string | null
          profesional_id: string | null
          proxima_cita: string | null
          recomendaciones: string | null
          signos_vitales: Json | null
          updated_at: string
        }
        Insert: {
          alergias?: string[] | null
          anamnesis?: string | null
          cirugias_previas?: string[] | null
          codigo_cie10?: string | null
          created_at?: string
          detalle?: string | null
          diagnostico_principal?: string | null
          diagnosticos_secundarios?: string[] | null
          documentos?: Json | null
          enfermedades_cronicas?: string[] | null
          estado_consulta?: string | null
          examen_fisico?: string | null
          expediente_id: string
          fecha?: string
          habitos?: Json | null
          id?: string
          materiales_usados?: string[] | null
          medicamentos_actuales?: string[] | null
          medicamentos_recetados?: Json | null
          motivo_consulta?: string | null
          motivo_proxima_cita?: string | null
          notas?: string | null
          notas_internas?: string | null
          plan_tratamiento?: string | null
          procedimiento_realizado?: string | null
          profesional_id?: string | null
          proxima_cita?: string | null
          recomendaciones?: string | null
          signos_vitales?: Json | null
          updated_at?: string
        }
        Update: {
          alergias?: string[] | null
          anamnesis?: string | null
          cirugias_previas?: string[] | null
          codigo_cie10?: string | null
          created_at?: string
          detalle?: string | null
          diagnostico_principal?: string | null
          diagnosticos_secundarios?: string[] | null
          documentos?: Json | null
          enfermedades_cronicas?: string[] | null
          estado_consulta?: string | null
          examen_fisico?: string | null
          expediente_id?: string
          fecha?: string
          habitos?: Json | null
          id?: string
          materiales_usados?: string[] | null
          medicamentos_actuales?: string[] | null
          medicamentos_recetados?: Json | null
          motivo_consulta?: string | null
          motivo_proxima_cita?: string | null
          notas?: string | null
          notas_internas?: string | null
          plan_tratamiento?: string | null
          procedimiento_realizado?: string | null
          profesional_id?: string | null
          proxima_cita?: string | null
          recomendaciones?: string | null
          signos_vitales?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      doctor_servicios: {
        Row: {
          actualizado_en: string | null
          creado_en: string | null
          doctor_id: string
          id: string
          servicio_id: string
        }
        Insert: {
          actualizado_en?: string | null
          creado_en?: string | null
          doctor_id: string
          id?: string
          servicio_id: string
        }
        Update: {
          actualizado_en?: string | null
          creado_en?: string | null
          doctor_id?: string
          id?: string
          servicio_id?: string
        }
        Relationships: []
      }
      doctores: {
        Row: {
          activo: boolean | null
          calendar_id: string | null
          consultorio: string | null
          created_at: string | null
          dias_trabajo: string[] | null
          email: string | null
          especialidad: string | null
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          nombre: string
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          calendar_id?: string | null
          consultorio?: string | null
          created_at?: string | null
          dias_trabajo?: string[] | null
          email?: string | null
          especialidad?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          calendar_id?: string | null
          consultorio?: string | null
          created_at?: string | null
          dias_trabajo?: string[] | null
          email?: string | null
          especialidad?: string | null
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          cliente_id: string | null
          detalle: string | null
          documentos: Json | null
          fecha: string | null
          id: string
          organizacion_id: string | null
          profesional_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          detalle?: string | null
          documentos?: Json | null
          fecha?: string | null
          id?: string
          organizacion_id?: string | null
          profesional_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          detalle?: string | null
          documentos?: Json | null
          fecha?: string | null
          id?: string
          organizacion_id?: string | null
          profesional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          actualizado_en: string | null
          creado_en: string | null
          estado: string | null
          expira_en: string | null
          fecha_deseada: string | null
          horario_preferido: string | null
          id: number
          motivo: string | null
          nombre: string
          notificado_en: string | null
          prioridad: number | null
          servicio: string | null
          telefono: string
        }
        Insert: {
          actualizado_en?: string | null
          creado_en?: string | null
          estado?: string | null
          expira_en?: string | null
          fecha_deseada?: string | null
          horario_preferido?: string | null
          id?: number
          motivo?: string | null
          nombre: string
          notificado_en?: string | null
          prioridad?: number | null
          servicio?: string | null
          telefono: string
        }
        Update: {
          actualizado_en?: string | null
          creado_en?: string | null
          estado?: string | null
          expira_en?: string | null
          fecha_deseada?: string | null
          horario_preferido?: string | null
          id?: number
          motivo?: string | null
          nombre?: string
          notificado_en?: string | null
          prioridad?: number | null
          servicio?: string | null
          telefono?: string
        }
        Relationships: []
      }
      medicamentos_catalogo: {
        Row: {
          created_at: string
          dosis_comun: string | null
          duracion_comun: string | null
          frecuencia_comun: string | null
          id: string
          indicaciones_comunes: string | null
          nombre: string
          organizacion_id: string | null
          updated_at: string
          uso_count: number | null
        }
        Insert: {
          created_at?: string
          dosis_comun?: string | null
          duracion_comun?: string | null
          frecuencia_comun?: string | null
          id?: string
          indicaciones_comunes?: string | null
          nombre: string
          organizacion_id?: string | null
          updated_at?: string
          uso_count?: number | null
        }
        Update: {
          created_at?: string
          dosis_comun?: string | null
          duracion_comun?: string | null
          frecuencia_comun?: string | null
          id?: string
          indicaciones_comunes?: string | null
          nombre?: string
          organizacion_id?: string | null
          updated_at?: string
          uso_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_catalogo_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          leida: boolean | null
          mensaje: string
          prioridad: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean | null
          mensaje: string
          prioridad?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean | null
          mensaje?: string
          prioridad?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      odontogramas: {
        Row: {
          cliente_id: string
          created_at: string
          datos_dientes: Json
          expediente_id: string
          fecha: string
          id: string
          notas: string | null
          profesional_id: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          datos_dientes?: Json
          expediente_id: string
          fecha?: string
          id?: string
          notas?: string | null
          profesional_id?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          datos_dientes?: Json
          expediente_id?: string
          fecha?: string
          id?: string
          notas?: string | null
          profesional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogramas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogramas_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogramas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizaciones: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          telefono: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          telefono?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          cita_id: string | null
          cliente_id: string | null
          estado: string | null
          fecha: string | null
          id: string
          metodo: string | null
          monto: number
          organizacion_id: string | null
        }
        Insert: {
          cita_id?: string | null
          cliente_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto: number
          organizacion_id?: string | null
        }
        Update: {
          cita_id?: string | null
          cliente_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          metodo?: string | null
          monto?: number
          organizacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      pendientes_humanos: {
        Row: {
          asignado_a: string | null
          cliente_id: string | null
          descripcion: string | null
          estado: string | null
          fecha: string | null
          id: string
          tipo: string | null
        }
        Insert: {
          asignado_a?: string | null
          cliente_id?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          tipo?: string | null
        }
        Update: {
          asignado_a?: string | null
          cliente_id?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pendientes_humanos_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendientes_humanos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          apellidos: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          especialidad_id: string | null
          id: string
          licencia_profesional: string | null
          nombre: string | null
          organizacion_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          apellidos?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          especialidad_id?: string | null
          id?: string
          licencia_profesional?: string | null
          nombre?: string | null
          organizacion_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          apellidos?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          especialidad_id?: string | null
          id?: string
          licencia_profesional?: string | null
          nombre?: string | null
          organizacion_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string
          descripcion: string | null
          duracion: number | null
          id: string
          nombre: string
          organizacion_id: string | null
          precio: number
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          created_at?: string
          descripcion?: string | null
          duracion?: number | null
          id?: string
          nombre: string
          organizacion_id?: string | null
          precio: number
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string
          descripcion?: string | null
          duracion?: number | null
          id?: string
          nombre?: string
          organizacion_id?: string | null
          precio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamientos_dentales: {
        Row: {
          color: string | null
          created_at: string
          diente_numero: number
          estado: string
          fecha_tratamiento: string
          id: string
          notas: string | null
          odontograma_id: string
          profesional_id: string | null
          superficie: string | null
          tratamiento: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          diente_numero: number
          estado?: string
          fecha_tratamiento?: string
          id?: string
          notas?: string | null
          odontograma_id: string
          profesional_id?: string | null
          superficie?: string | null
          tratamiento: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          diente_numero?: number
          estado?: string
          fecha_tratamiento?: string
          id?: string
          notas?: string | null
          odontograma_id?: string
          profesional_id?: string | null
          superficie?: string | null
          tratamiento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamientos_dentales_odontograma_id_fkey"
            columns: ["odontograma_id"]
            isOneToOne: false
            referencedRelation: "odontogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_dentales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_cita_desde_n8n: {
        Args: {
          p_apellidos?: string
          p_cedula?: string
          p_email?: string
          p_fecha: string
          p_nombre: string
          p_nombre_doctor: string
          p_nombre_servicio: string
          p_telefono: string
        }
        Returns: Json
      }
      encrypt_chatwoot_token: { Args: { token: string }; Returns: string }
      get_chatwoot_config_for_org: {
        Args: { org_id: string }
        Returns: {
          activo: boolean
          chatwoot_account_id: string
          chatwoot_api_token: string
          chatwoot_url: string
          id: string
          inbox_id: string
        }[]
      }
      get_patient_antecedentes: {
        Args: { p_cliente_id: string }
        Returns: {
          alergias: string[] | null
          antecedentes_familiares: string | null
          cirugias_previas: string[] | null
          cliente_id: string
          created_at: string | null
          enfermedades_cronicas: string[] | null
          habitos: Json | null
          id: string
          medicamentos_actuales: string[] | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "antecedentes_medicos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_patient_consultas: {
        Args: { p_expediente_id: string }
        Returns: {
          alergias: string[] | null
          anamnesis: string | null
          cirugias_previas: string[] | null
          codigo_cie10: string | null
          created_at: string
          detalle: string | null
          diagnostico_principal: string | null
          diagnosticos_secundarios: string[] | null
          documentos: Json | null
          enfermedades_cronicas: string[] | null
          estado_consulta: string | null
          examen_fisico: string | null
          expediente_id: string
          fecha: string
          habitos: Json | null
          id: string
          materiales_usados: string[] | null
          medicamentos_actuales: string[] | null
          medicamentos_recetados: Json | null
          motivo_consulta: string | null
          motivo_proxima_cita: string | null
          notas: string | null
          notas_internas: string | null
          plan_tratamiento: string | null
          procedimiento_realizado: string | null
          profesional_id: string | null
          proxima_cita: string | null
          recomendaciones: string | null
          signos_vitales: Json | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "consultas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_patient_contact_info: {
        Args: { p_cliente_id: string }
        Returns: {
          apellidos: string
          cedula: string
          direccion: string
          email: string
          id: string
          nombre: string
          telefono: string
        }[]
      }
      get_primary_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_organization: { Args: never; Returns: string }
      get_user_role:
        | { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
        | { Args: { user_uuid: string }; Returns: string }
      get_user_roles: {
        Args: { user_uuid?: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_any_role: {
        Args: { roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: { required_role: string; user_uuid: string }
            Returns: boolean
          }
      insert_audit_log: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: string
          p_record_id?: string
          p_table_name?: string
          p_user_id: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: { p_action?: string; p_record_id: string; p_table_name: string }
        Returns: undefined
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      search_patients: {
        Args: { max_results?: number; search_term: string }
        Returns: {
          apellidos: string
          cedula: string
          email: string
          id: string
          nombre: string
          telefono: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin_sistema"
        | "admin_clinica"
        | "medico"
        | "odontologo"
        | "fisioterapeuta"
        | "quiropractico"
        | "recepcionista"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin_sistema",
        "admin_clinica",
        "medico",
        "odontologo",
        "fisioterapeuta",
        "quiropractico",
        "recepcionista",
      ],
    },
  },
} as const
