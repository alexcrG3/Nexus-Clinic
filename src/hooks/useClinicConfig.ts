import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClinicConfig {
  id: string;
  nombre_clinica: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  duracion_cita: number | null;
  trabajo_sabado: boolean | null;
  moneda_simbolo: string | null;
  mostrar_landing_publica?: boolean | null;
  tipo_clinica?: string | null;
}

export const useClinicConfig = () => {
  return useQuery({
    queryKey: ["clinic-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_clinica")
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn("Error fetching clinic config:", error);
      }

      const localLanding = localStorage.getItem("mostrar_landing_publica");
      const mostrarLanding = localLanding !== null 
        ? localLanding === "true" 
        : (data?.mostrar_landing_publica ?? false);

      const localTipo = localStorage.getItem("tipo_clinica");
      const tipoClinica = localTipo || (data as any)?.tipo_clinica || "odontologia";

      return {
        ...(data || {}),
        mostrar_landing_publica: mostrarLanding,
        tipo_clinica: tipoClinica,
      } as ClinicConfig;
    },
  });
};

export const useUpdateClinicConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<ClinicConfig>) => {
      // Guardar preferencias en localStorage
      if (config.mostrar_landing_publica !== undefined) {
        localStorage.setItem("mostrar_landing_publica", String(config.mostrar_landing_publica));
      }
      if (config.tipo_clinica !== undefined) {
        localStorage.setItem("tipo_clinica", String(config.tipo_clinica));
      }

      // Separar campos de base de datos
      const { mostrar_landing_publica, tipo_clinica, ...dbFields } = config;

      if (Object.keys(dbFields).length > 0) {
        const { data: existing } = await supabase
          .from("configuracion_clinica")
          .select("id")
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from("configuracion_clinica")
            .update(dbFields)
            .eq("id", existing.id)
            .select()
            .maybeSingle();

          if (error) {
            console.warn("Error actualizando configuracion_clinica:", error);
          }
          return data;
        } else {
          const { data, error } = await supabase
            .from("configuracion_clinica")
            .insert(dbFields)
            .select()
            .maybeSingle();

          if (error) {
            console.warn("Error insertando configuracion_clinica:", error);
          }
          return data;
        }
      }

      return { mostrar_landing_publica: config.mostrar_landing_publica };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-config"] });
      toast({
        title: "Guardado",
        description: "Configuración actualizada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
      console.error("Error updating clinic config:", error);
    },
  });
};

export const uploadClinicLogo = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `clinic-logo.${fileExt}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("imagenes")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("imagenes")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
