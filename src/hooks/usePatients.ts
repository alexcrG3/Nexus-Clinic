import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePatients = () => {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      // Obtener pacientes
      const { data: patients, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const patientIds = patients?.map(p => p.id) || [];
      
      if (patientIds.length === 0) return patients || [];

      // Obtener expedientes con profesional asignado
      const { data: expedientesConProfesional } = await supabase
        .from("expedientes")
        .select(`
          cliente_id,
          profesional_id,
          profesional:profiles!expedientes_profesional_id_fkey(id, nombre, apellidos, role)
        `)
        .in("cliente_id", patientIds);

      // Crear mapa de profesional por paciente desde expedientes
      const profesionalPorPaciente: Record<string, any> = {};
      expedientesConProfesional?.forEach(exp => {
        if (exp.cliente_id && exp.profesional) {
          profesionalPorPaciente[exp.cliente_id] = {
            id: exp.profesional.id,
            nombre: `${exp.profesional.nombre || ''} ${exp.profesional.apellidos || ''}`.trim(),
            especialidad: exp.profesional.role
          };
        }
      });

      // Obtener citas con doctor para cada paciente (fallback)
      const { data: citasConDoctor } = await supabase
        .from("citas")
        .select(`
          cliente_id,
          doctor_id,
          fechaCita,
          doctores:doctor_id(id, nombre, especialidad)
        `)
        .in("cliente_id", patientIds)
        .order("fechaCita", { ascending: false });

      // Agrupar por paciente y obtener el último doctor de citas
      const doctorCitaPorPaciente: Record<string, any> = {};
      citasConDoctor?.forEach(cita => {
        if (cita.cliente_id && !doctorCitaPorPaciente[cita.cliente_id]) {
          doctorCitaPorPaciente[cita.cliente_id] = cita.doctores;
        }
      });

      // Combinar datos: prioridad al profesional del expediente, luego doctor de cita
      return patients?.map(patient => ({
        ...patient,
        ultimoDoctor: profesionalPorPaciente[patient.id] || doctorCitaPorPaciente[patient.id] || null
      })) || [];
    },
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("organizacion_id, id")
        .eq("user_id", user?.id)
        .single();

      // Crear el paciente
      const { data: paciente, error } = await supabase
        .from("clientes")
        .insert({
          ...patientData,
          organizacion_id: profile?.organizacion_id,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Crear expediente automáticamente para el nuevo paciente
      const { error: expedienteError } = await supabase
        .from("expedientes")
        .insert({
          cliente_id: paciente.id,
          organizacion_id: profile?.organizacion_id,
          profesional_id: profile?.id, // Asignar al profesional que crea el paciente
          detalle: `Expediente creado automáticamente al registrar paciente`,
        });

      if (expedienteError) {
        console.error("Error al crear expediente automático:", expedienteError);
        // No lanzar error, el paciente ya fue creado
      }

      return paciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Paciente y expediente creados exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear paciente: " + error.message);
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patientData }: any) => {
      const { error } = await supabase
        .from("clientes")
        .update(patientData)
        .eq("id", id);

      if (error) throw error;
      return { id, ...patientData };
    },
    onSuccess: () => {
      // Forzar refetch inmediato de los pacientes
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.refetchQueries({ queryKey: ["patients"] });
      toast.success("Paciente actualizado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar paciente: " + error.message);
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente eliminado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar paciente: " + error.message);
    },
  });
};
