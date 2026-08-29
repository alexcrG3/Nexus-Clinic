import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useExpedientes = () => {
  return useQuery({
    queryKey: ["expedientes"],
    queryFn: async () => {
      // Obtener expedientes con cliente y profesional (profile)
      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select(`
          *,
          cliente:clientes(*),
          profesional:profiles(id, user_id, nombre, apellidos, role)
        `)
        .order("fecha", { ascending: false });

      if (error) throw error;
      return expedientes || [];
    },
  });
};

export const useExpedienteDetalle = (expedienteId: string) => {
  return useQuery({
    queryKey: ["expediente", expedienteId],
    queryFn: async () => {
      const { data: expediente, error: expError } = await supabase
        .from("expedientes")
        .select(`
          *,
          cliente:clientes(*),
          profesional:profiles(*)
        `)
        .eq("id", expedienteId)
        .single();

      if (expError) throw expError;

      const { data: consultas, error: consError } = await supabase
        .from("consultas")
        .select("*")
        .eq("expediente_id", expedienteId)
        .order("fecha", { ascending: false });

      if (consError) throw consError;

      return {
        ...expediente,
        consultas: consultas || [],
      };
    },
    enabled: !!expedienteId,
  });
};
