import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const MiniCalendar = () => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: occupancyData } = useQuery({
    queryKey: ["monthly-occupancy", format(today, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("citas")
        .select("fechaCita")
        .gte("fechaCita", format(monthStart, "yyyy-MM-dd"))
        .lte("fechaCita", format(monthEnd, "yyyy-MM-dd"));

      if (error) throw error;

      // Contar citas por día - extraer solo la fecha (sin hora)
      const countByDay: Record<string, number> = {};
      data?.forEach((cita) => {
        if (cita.fechaCita) {
          // Extract just the date part (YYYY-MM-DD) from fechaCita
          const dateOnly = cita.fechaCita.split('T')[0];
          countByDay[dateOnly] = (countByDay[dateOnly] || 0) + 1;
        }
      });

      return countByDay;
    },
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

  const getOccupancyColor = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const count = occupancyData?.[dateStr] || 0;

    if (count === 0) return "";
    if (count <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (count <= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          {format(today, "MMMM yyyy", { locale: es })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, index) => (
            <div key={`weekday-${index}`} className="text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
          
          {/* Espacios vacíos para el primer día */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-xs py-1 px-0.5 rounded-md transition-colors",
                isSameMonth(day, today) ? "text-foreground" : "text-muted-foreground/50",
                isToday(day) && "ring-2 ring-primary font-bold",
                getOccupancyColor(day)
              )}
            >
              {format(day, "d")}
            </div>
          ))}
        </div>
        
        {/* Leyenda */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>6+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
