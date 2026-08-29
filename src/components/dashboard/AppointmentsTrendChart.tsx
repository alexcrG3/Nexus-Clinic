import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

const chartConfig = {
  citas: {
    label: "Citas",
    color: "hsl(var(--primary))",
  },
};

export const AppointmentsTrendChart = () => {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ["appointments-trend-7days"],
    queryFn: async () => {
      const today = new Date();
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 6);
      
      const { data, error } = await supabase
        .from("citas")
        .select("fechaCita")
        .gte("fechaCita", format(today, "yyyy-MM-dd"))
        .lte("fechaCita", format(sevenDaysLater, "yyyy-MM-dd"));

      if (error) throw error;

      // Agrupar por día - próximos 7 días
      const grouped: Record<string, number> = {};
      for (let i = 0; i <= 6; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        const date = format(futureDate, "yyyy-MM-dd");
        grouped[date] = 0;
      }

      data?.forEach((cita) => {
        if (cita.fechaCita) {
          // Extract just the date part (YYYY-MM-DD) from fechaCita
          const dateOnly = cita.fechaCita.split('T')[0];
          if (grouped[dateOnly] !== undefined) {
            grouped[dateOnly]++;
          }
        }
      });

      return Object.entries(grouped).map(([date, count]) => ({
        date,
        day: format(new Date(date), "EEE", { locale: es }),
        citas: count,
      }));
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Tendencia de Citas (7 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[120px] flex items-center justify-center text-muted-foreground">
            Cargando...
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[120px] w-full">
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="citas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCitas)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
