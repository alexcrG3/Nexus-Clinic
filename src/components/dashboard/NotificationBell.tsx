import { useState } from "react";
import { Bell, AlertTriangle, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "unconfirmed" | "overdue";
  title: string;
  description: string;
  priority: "high" | "medium";
}

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);

  const { data: alerts = [] } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const alertsList: Alert[] = [];
      const today = format(new Date(), "yyyy-MM-dd");
      const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

      // Citas sin confirmar para hoy y mañana
      const { data: unconfirmedCitas } = await supabase
        .from("citas")
        .select("id, nombre, fechaCita, hora_cita")
        .eq("estado", "pendiente")
        .in("fechaCita", [today, tomorrow]);

      unconfirmedCitas?.forEach((cita) => {
        alertsList.push({
          id: `unconfirmed-${cita.id}`,
          type: "unconfirmed",
          title: "Cita sin confirmar",
          description: `${cita.nombre} - ${cita.fechaCita === today ? "Hoy" : "Mañana"} ${cita.hora_cita?.substring(0, 5) || ""}`,
          priority: cita.fechaCita === today ? "high" : "medium",
        });
      });

      // Pagos vencidos (estado pendiente)
      const { data: overduePayments } = await supabase
        .from("pagos")
        .select("id, monto, cliente_id, clientes(nombre, apellidos)")
        .eq("estado", "pendiente")
        .lt("fecha", today);

      overduePayments?.forEach((pago: any) => {
        alertsList.push({
          id: `overdue-${pago.id}`,
          type: "overdue",
          title: "Pago vencido",
          description: `${pago.clientes?.nombre || "Cliente"} ${pago.clientes?.apellidos || ""} - $${pago.monto}`,
          priority: "high",
        });
      });

      return alertsList;
    },
    refetchInterval: 60000, // Refrescar cada minuto
  });

  const highPriorityCount = alerts.filter((a) => a.priority === "high").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {alerts.length > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs",
                highPriorityCount > 0
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-yellow-500 text-yellow-foreground"
              )}
            >
              {alerts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas Importantes
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {alerts.length} alerta(s) pendiente(s)
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No hay alertas pendientes
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                    alert.priority === "high" && "border-l-2 border-l-destructive"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {alert.type === "unconfirmed" ? (
                      <Calendar className="h-4 w-4 text-yellow-600 mt-0.5" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
