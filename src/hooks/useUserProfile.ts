import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  user_id: string;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  avatar_url: string | null;
  licencia_profesional: string | null;
  especialidad_id: string | null;
  organizacion_id: string | null;
  activo: boolean;
}

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile | null;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Partial<UserProfile>) => {
      if (!user?.id) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Guardado",
        description: "Perfil actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    },
  });
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
