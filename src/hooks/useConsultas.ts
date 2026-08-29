import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUpdateConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...consultaData }: any) => {
      const { data, error } = await supabase
        .from("consultas")
        .update(consultaData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expediente"] });
      toast.success("Consulta actualizada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar consulta: " + error.message);
    },
  });
};
