import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, FileText, CreditCard, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DashboardStats = () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const startOfWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Citas de hoy
  const { data: citasHoy, isLoading: loadingCitas } = useQuery({
    queryKey: ["dashboard-citas-hoy", today],
    queryFn: async () => {
      const { count: todayCount } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true })
        .eq("fechaCita", today);

      const { count: yesterdayCount } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true })
        .eq("fechaCita", yesterday);

      return {
        today: todayCount || 0,
        diff: (todayCount || 0) - (yesterdayCount || 0),
      };
    },
  });

  // Pacientes activos (con citas en los últimos 90 días)
  const { data: pacientesActivos, isLoading: loadingPacientes } = useQuery({
    queryKey: ["dashboard-pacientes-activos"],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });

      const { count: weekCount } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfWeek);

      return {
        total: totalCount || 0,
        newThisWeek: weekCount || 0,
      };
    },
  });

  // Expedientes
  const { data: expedientes, isLoading: loadingExpedientes } = useQuery({
    queryKey: ["dashboard-expedientes"],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("expedientes")
        .select("*", { count: "exact", head: true });

      const { count: monthCount } = await supabase
        .from("expedientes")
        .select("*", { count: "exact", head: true })
        .gte("fecha", startOfMonth);

      return {
        total: totalCount || 0,
        newThisMonth: monthCount || 0,
      };
    },
  });

  // Facturas pendientes
  const { data: facturasPendientes, isLoading: loadingFacturas } = useQuery({
    queryKey: ["dashboard-facturas-pendientes"],
    queryFn: async () => {
      const { data: pendientes } = await supabase
        .from("pagos")
        .select("id, fecha")
        .eq("estado", "pendiente");

      const vencidas = pendientes?.filter(p => {
        if (!p.fecha) return false;
        return new Date(p.fecha) < new Date(yesterday);
      }).length || 0;

      return {
        total: pendientes?.length || 0,
        vencidas,
      };
    },
  });

  const isLoading = loadingCitas || loadingPacientes || loadingExpedientes || loadingFacturas;

  const stats = [
    {
      title: "Citas Hoy",
      value: isLoading ? "-" : citasHoy?.today.toString() || "0",
      subtitle: isLoading ? "Cargando..." : `${citasHoy?.diff >= 0 ? '+' : ''}${citasHoy?.diff || 0} vs ayer`,
      icon: Calendar,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
    },
    {
      title: "Pacientes",
      value: isLoading ? "-" : pacientesActivos?.total.toLocaleString() || "0",
      subtitle: isLoading ? "Cargando..." : `+${pacientesActivos?.newThisWeek || 0} esta semana`,
      icon: Users,
      iconColor: "text-green-500",
      iconBg: "bg-green-50",
    },
    {
      title: "Expedientes",
      value: isLoading ? "-" : expedientes?.total.toLocaleString() || "0",
      subtitle: isLoading ? "Cargando..." : `+${expedientes?.newThisMonth || 0} este mes`,
      icon: FileText,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-50",
    },
    {
      title: "Facturas Pendientes",
      value: isLoading ? "-" : facturasPendientes?.total.toString() || "0",
      subtitle: isLoading ? "Cargando..." : `${facturasPendientes?.vencidas || 0} vencidas`,
      icon: CreditCard,
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-2">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stat.value
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
