import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const useTodayAppointments = (filterByDoctor: boolean = false) => {
  return useQuery({
    queryKey: ["today-appointments", filterByDoctor],
    queryFn: async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        
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
            const { data: citas, error } = await supabase
              .from("citas")
              .select("*")
              .gte("fechaCita", today)
              .lte("fechaCita", `${today}T23:59:59`)
              .eq("doctor_id", doctor.id)
              .order("hora_cita", { ascending: true, nullsFirst: false });

            if (error) {
              // Fallback fetch all for doctor
              const { data: fallback } = await supabase.from("citas").select("*").eq("doctor_id", doctor.id);
              return fallback?.filter(c => c.fechaCita?.startsWith(today)) || [];
            }
            return citas || [];
          }
          
          return [];
        }

        // Para admins/recepcionistas: mostrar todas las citas de hoy
        const { data: citas, error } = await supabase
          .from("citas")
          .select("*")
          .gte("fechaCita", today)
          .lte("fechaCita", `${today}T23:59:59`)
          .order("hora_cita", { ascending: true, nullsFirst: false });

        if (error) {
          const { data: fallback } = await supabase.from("citas").select("*");
          return fallback?.filter(c => c.fechaCita?.startsWith(today)) || [];
        }
        return citas || [];
      } catch (err) {
        console.error("Error fetching today appointments:", err);
        return [];
      }
    },
  });
};