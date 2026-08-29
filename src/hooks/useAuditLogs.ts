import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string | null;
  user_profile?: {
    nombre: string | null;
    apellidos: string | null;
    email: string | null;
  };
}

export const useAuditLogs = (filters?: {
  tableName?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.tableName) {
        query = query.eq("table_name", filters.tableName);
      }

      if (filters?.action) {
        query = query.eq("action", filters.action);
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      query = query.limit(filters?.limit || 100);

      const { data: logs, error } = await query;

      if (error) throw error;

      // Get user profiles for the logs
      const userIds = [...new Set((logs || []).map(log => log.user_id))];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nombre, apellidos, email")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      return (logs || []).map(log => ({
        ...log,
        user_profile: profileMap.get(log.user_id) || null,
      })) as AuditLog[];
    },
  });
};
