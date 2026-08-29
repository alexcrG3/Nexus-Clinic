import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

interface MedicamentoCatalogo {
  id: string;
  nombre: string;
  dosis_comun?: string;
  frecuencia_comun?: string;
  duracion_comun?: string;
  indicaciones_comunes?: string;
  uso_count: number;
}

export const useMedicamentosCatalogo = () => {
  const [medicamentos, setMedicamentos] = useState<MedicamentoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: profile } = useUserProfile();

  // Fetch medications from catalog
  const fetchMedicamentos = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("medicamentos_catalogo")
        .select("*")
        .order("uso_count", { ascending: false })
        .limit(20);

      if (searchTerm && searchTerm.length > 0) {
        query = query.ilike("nombre", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching medications:", error);
        return [];
      }

      setMedicamentos(data || []);
      return data || [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Add or update medication in catalog
  const guardarMedicamento = useCallback(async (medicamento: {
    nombre: string;
    indicaciones?: string;
  }) => {
    if (!medicamento.nombre.trim()) return;

    try {
      // Check if medication already exists
      const { data: existing } = await supabase
        .from("medicamentos_catalogo")
        .select("id, uso_count")
        .eq("nombre", medicamento.nombre.trim())
        .maybeSingle();

      if (existing) {
        // Update use count
        await supabase
          .from("medicamentos_catalogo")
          .update({ 
            uso_count: (existing.uso_count || 1) + 1,
            indicaciones_comunes: medicamento.indicaciones || undefined
          })
          .eq("id", existing.id);
      } else {
        // Insert new medication
        await supabase
          .from("medicamentos_catalogo")
          .insert({
            nombre: medicamento.nombre.trim(),
            indicaciones_comunes: medicamento.indicaciones || null,
            organizacion_id: profile?.organizacion_id || null,
            uso_count: 1
          });
      }
    } catch (error) {
      console.error("Error saving medication to catalog:", error);
    }
  }, [profile?.organizacion_id]);

  // Search suggestions based on input
  const buscarSugerencias = useCallback(async (searchTerm: string): Promise<MedicamentoCatalogo[]> => {
    if (!searchTerm || searchTerm.length < 1) {
      return [];
    }

    const { data, error } = await supabase
      .from("medicamentos_catalogo")
      .select("*")
      .ilike("nombre", `%${searchTerm}%`)
      .order("uso_count", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error searching medications:", error);
      return [];
    }

    return data || [];
  }, []);

  return {
    medicamentos,
    loading,
    fetchMedicamentos,
    guardarMedicamento,
    buscarSugerencias
  };
};
