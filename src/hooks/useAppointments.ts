import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useAppointments = (filterByDoctor: boolean = false) => {
  return useQuery({
    queryKey: ["appointments", filterByDoctor],
    queryFn: async () => {
      // Si filterByDoctor es true, filtrar por el doctor vinculado al usuario actual
      if (filterByDoctor) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Buscar el doctor vinculado al usuario
        const { data: doctor } = await supabase
          .from("doctores")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (doctor) {
          // Filtrar citas por este doctor
          const { data, error } = await supabase
            .from("citas")
            .select("*")
            .eq("doctor_id", doctor.id)
            .order("fechaCita", { ascending: true })
            .order("hora_cita", { ascending: true, nullsFirst: false });

          if (error) throw error;
          return data || [];
        }
        
        // Si el usuario no tiene doctor vinculado, no mostrar citas
        return [];
      }

      // Para admins/recepcionistas: mostrar todas las citas de la organización
      const { data, error } = await supabase
        .from("citas")
        .select("*")
        .order("fechaCita", { ascending: true })
        .order("hora_cita", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newAppointment: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organizacion_id, id")
        .eq("user_id", user.id)
        .maybeSingle();

      const organizacionId = profile?.organizacion_id || localStorage.getItem("active_org_id") || null;

      // Filtrar estrictamente solo las columnas existentes en la tabla citas
      const validCitaPayload: any = {
        user_id: user.id,
        organizacion_id: organizacionId,
      };

      if (newAppointment.nombre !== undefined) validCitaPayload.nombre = newAppointment.nombre;
      if (newAppointment.telefono !== undefined) validCitaPayload.telefono = newAppointment.telefono || null;
      if (newAppointment.fechaCita !== undefined) validCitaPayload.fechaCita = newAppointment.fechaCita;
      if (newAppointment.hora_cita !== undefined) validCitaPayload.hora_cita = newAppointment.hora_cita || null;
      if (newAppointment.estado !== undefined) validCitaPayload.estado = newAppointment.estado || "confirmada";
      if (newAppointment.cliente_id !== undefined) validCitaPayload.cliente_id = newAppointment.cliente_id || null;
      if (newAppointment.doctor_id !== undefined) validCitaPayload.doctor_id = newAppointment.doctor_id || null;
      if (newAppointment.servicio_id !== undefined) validCitaPayload.servicio_id = newAppointment.servicio_id || null;
      if (newAppointment.precio !== undefined) validCitaPayload.precio = newAppointment.precio ?? null;
      if (newAppointment.duracion !== undefined) validCitaPayload.duracion = newAppointment.duracion ?? null;

      const { data: cita, error } = await supabase
        .from("citas")
        .insert([validCitaPayload])
        .select()
        .single();

      if (error) throw error;

      // Si la cita tiene un cliente_id, verificar si tiene expediente
      if (cita?.cliente_id) {
        const { data: expedienteExistente } = await supabase
          .from("expedientes")
          .select("id")
          .eq("cliente_id", cita.cliente_id)
          .maybeSingle();

        // Si no tiene expediente, crear uno automáticamente
        if (!expedienteExistente) {
          let profesionalId = profile?.id;
          
          if (cita.doctor_id) {
            const { data: doctor } = await supabase
              .from("doctores")
              .select("user_id")
              .eq("id", cita.doctor_id)
              .maybeSingle();
            
            if (doctor?.user_id) {
              const { data: doctorProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", doctor.user_id)
                .maybeSingle();
              
              if (doctorProfile) {
                profesionalId = doctorProfile.id;
              }
            }
          }

          try {
            const motivoNota = newAppointment.motivo ? `: ${newAppointment.motivo}` : "";
            await supabase
              .from("expedientes")
              .insert({
                cliente_id: cita.cliente_id,
                organizacion_id: organizacionId,
                profesional_id: profesionalId,
                detalle: `Expediente creado automáticamente al agendar cita${motivoNota}`,
              });
          } catch (expedienteError) {
            console.warn("No se pudo crear expediente automático:", expedienteError);
          }
        }
      }

      return cita;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast({
        title: "Cita creada",
        description: "La cita se ha creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la cita",
        variant: "destructive",
      });
      console.error("Error creating appointment:", error);
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      // Convert empty strings to null for time fields
      const cleanedUpdates = {
        ...updates,
        hora_cita: updates.hora_cita || null,
        doctor_id: updates.doctor_id || null,
      };

      const { data, error } = await supabase
        .from("citas")
        .update(cleanedUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      toast({
        title: "Cita actualizada",
        description: "La cita se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita",
        variant: "destructive",
      });
      console.error("Error updating appointment:", error);
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("citas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      toast({
        title: "Cita eliminada",
        description: "La cita se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cita",
        variant: "destructive",
      });
      console.error("Error deleting appointment:", error);
    },
  });
};
