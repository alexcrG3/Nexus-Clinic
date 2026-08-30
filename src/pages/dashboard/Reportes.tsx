import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar as CalendarIcon, Activity, Target, Percent, FileSpreadsheet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createExcelWorkbook } from "@/lib/excel-utils";

type RangoTipo = "hoy" | "semana" | "quincena" | "mes" | "personalizado";

const Reportes = () => {
  const [rangoTipo, setRangoTipo] = useState<RangoTipo>("mes");
  const [fechaInicio, setFechaInicio] = useState<Date>(() => startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(() => endOfMonth(new Date()));

  // Actualizar fechas según el tipo de rango seleccionado
  const handleRangoChange = (tipo: RangoTipo) => {
    setRangoTipo(tipo);
    const hoy = new Date();
    
    switch (tipo) {
      case "hoy":
        setFechaInicio(hoy);
        setFechaFin(hoy);
        break;
      case "semana":
        setFechaInicio(startOfWeek(hoy, { weekStartsOn: 1 }));
        setFechaFin(endOfWeek(hoy, { weekStartsOn: 1 }));
        break;
      case "quincena":
        setFechaInicio(subDays(hoy, 14));
        setFechaFin(hoy);
        break;
      case "mes":
        setFechaInicio(startOfMonth(hoy));
        setFechaFin(endOfMonth(hoy));
        break;
      case "personalizado":
        // Mantener las fechas actuales
        break;
    }
  };

  const rangoStart = format(fechaInicio, 'yyyy-MM-dd');
  const rangoEnd = format(fechaFin, 'yyyy-MM-dd');
  
  // Calcular período anterior para comparación
  const diasEnRango = differenceInDays(fechaFin, fechaInicio) + 1;
  const prevRangoEnd = subDays(fechaInicio, 1);
  const prevRangoStart = subDays(prevRangoEnd, diasEnRango - 1);
  const prevStart = format(prevRangoStart, 'yyyy-MM-dd');
  const prevEnd = format(prevRangoEnd, 'yyyy-MM-dd');

  // Fetch payments for current range
  const { data: pagos, isLoading: loadingPagos } = useQuery({
    queryKey: ['reportes-pagos', rangoStart, rangoEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select(`
          *,
          cliente:clientes(nombre, apellidos)
        `)
        .gte('fecha', rangoStart)
        .lte('fecha', rangoEnd + 'T23:59:59');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch payments for previous period (for comparison)
  const { data: pagosPrevPeriod } = useQuery({
    queryKey: ['reportes-pagos-prev', prevStart, prevEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .gte('fecha', prevStart)
        .lte('fecha', prevEnd + 'T23:59:59');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch appointments for current range
  const { data: citas, isLoading: loadingCitas } = useQuery({
    queryKey: ['reportes-citas', rangoStart, rangoEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citas')
        .select('*')
        .gte('fechaCita', rangoStart)
        .lte('fechaCita', rangoEnd + 'T23:59:59');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch patients for current range
  const { data: pacientes, isLoading: loadingPacientes } = useQuery({
    queryKey: ['reportes-pacientes', rangoStart, rangoEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .gte('created_at', rangoStart)
        .lte('created_at', rangoEnd + 'T23:59:59');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch expenses (caja_chica)
  const { data: gastos } = useQuery({
    queryKey: ['reportes-gastos', rangoStart, rangoEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caja_chica')
        .select('*')
        .gte('fecha', rangoStart)
        .lte('fecha', rangoEnd + 'T23:59:59');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate metrics
  const ingresosBrutos = pagos?.reduce((acc, pago) => acc + (Number(pago.monto) || 0), 0) || 0;
  const ingresosPrevPeriod = pagosPrevPeriod?.reduce((acc, pago) => acc + (Number(pago.monto) || 0), 0) || 0;
  const totalGastos = gastos?.filter(g => g.tipo === 'egreso').reduce((acc, g) => acc + (Number(g.monto) || 0), 0) || 0;
  const ingresosNetos = ingresosBrutos - totalGastos;
  
  // ROI calculation
  const roi = totalGastos > 0 ? ((ingresosNetos / totalGastos) * 100) : 0;
  
  // Growth percentage
  const crecimiento = ingresosPrevPeriod > 0 
    ? ((ingresosBrutos - ingresosPrevPeriod) / ingresosPrevPeriod * 100) 
    : 0;

  // Appointment stats
  const citasAtendidas = citas?.filter(c => c.estado === 'atendida' || c.estado === 'completada' || c.estado === 'finalizada' || c.estado === 'atendido').length || 0;
  const citasCompletadas = citasAtendidas;
  const citasConfirmadas = citas?.filter(c => c.estado === 'confirmada' || c.estado === 'en_espera' || c.estado === 'llamado').length || 0;
  const citasPendientes = citas?.filter(c => c.estado === 'pendiente').length || 0;
  const citasCanceladas = citas?.filter(c => c.estado === 'cancelada').length || 0;
  const totalCitas = citas?.length || 0;
  const tasaConversion = totalCitas > 0 ? (citasAtendidas / totalCitas * 100) : 0;

  // Average revenue per patient
  const ingresoPorPaciente = pacientes?.length ? (ingresosBrutos / pacientes.length) : 0;

  // Data for charts
  const citasData = [
    { name: 'Atendidas', value: citasAtendidas, fill: '#10b981' },
    { name: 'Confirmadas (En sala)', value: citasConfirmadas, fill: '#0ea5e9' },
    { name: 'Pendientes', value: citasPendientes, fill: '#f59e0b' },
    { name: 'Canceladas', value: citasCanceladas, fill: '#ef4444' },
  ].filter(item => item.value > 0);

  // Daily revenue data
  const dailyRevenue = pagos?.reduce((acc: Record<string, number>, pago) => {
    const day = format(new Date(pago.fecha || ''), 'dd/MM');
    acc[day] = (acc[day] || 0) + (Number(pago.monto) || 0);
    return acc;
  }, {}) || {};

  const dailyRevenueData = Object.entries(dailyRevenue)
    .map(([day, amount]) => ({ day, amount }))
    .sort((a, b) => {
      const [dayA, monthA] = a.day.split('/').map(Number);
      const [dayB, monthB] = b.day.split('/').map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });

  // Payment methods breakdown
  const metodosPago = pagos?.reduce((acc: Record<string, number>, pago) => {
    const metodo = pago.metodo || 'Efectivo';
    acc[metodo] = (acc[metodo] || 0) + (Number(pago.monto) || 0);
    return acc;
  }, {}) || {};

  const metodosPagoData = Object.entries(metodosPago).map(([name, value]) => ({ name, value }));

  const isLoading = loadingPagos || loadingCitas || loadingPacientes;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getRangoLabel = () => {
    switch (rangoTipo) {
      case "semana":
        return "Semanal";
      case "quincena":
        return "Quincenal";
      case "mes":
        return "Mensual";
      case "personalizado":
        return "Personalizado";
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!pagos || pagos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Sheet 1: Resumen
    const resumenData = [
      { "Métrica": "Período", "Valor": `${format(fechaInicio, 'd MMM yyyy', { locale: es })} - ${format(fechaFin, 'd MMM yyyy', { locale: es })}` },
      { "Métrica": "Ingresos Brutos", "Valor": formatCurrency(ingresosBrutos) },
      { "Métrica": "Gastos Operativos", "Valor": formatCurrency(totalGastos) },
      { "Métrica": "Ingresos Netos", "Valor": formatCurrency(ingresosNetos) },
      { "Métrica": "ROI", "Valor": `${roi.toFixed(1)}%` },
      { "Métrica": "Crecimiento vs período anterior", "Valor": `${crecimiento.toFixed(1)}%` },
      { "Métrica": "Nuevos Pacientes", "Valor": pacientes?.length || 0 },
      { "Métrica": "Total Citas", "Valor": citas?.length || 0 },
      { "Métrica": "Citas Completadas", "Valor": citasCompletadas },
      { "Métrica": "Tasa de Conversión", "Valor": `${tasaConversion.toFixed(1)}%` },
    ];

    // Sheet 2: Detalle de Pagos
    const pagosData = pagos.map((pago: any) => ({
      "Fecha": pago.fecha ? format(new Date(pago.fecha), "dd/MM/yyyy HH:mm", { locale: es }) : "Sin fecha",
      "Cliente": `${pago.cliente?.nombre || ""} ${pago.cliente?.apellidos || ""}`.trim() || "Sin cliente",
      "Monto": pago.monto || 0,
      "Método": pago.metodo || "efectivo",
      "Estado": pago.estado || "pagado",
    }));

    // Add total row
    pagosData.push({
      "Fecha": "",
      "Cliente": "TOTAL",
      "Monto": ingresosBrutos,
      "Método": "",
      "Estado": "",
    });

    // Sheet 3: Métodos de Pago
    const metodosData = metodosPagoData.map(m => ({
      "Método de Pago": m.name,
      "Monto Total": m.value,
      "Porcentaje": ingresosBrutos > 0 ? `${((m.value / ingresosBrutos) * 100).toFixed(1)}%` : "0%"
    }));

    // Generate filename
    const nombreArchivo = `reporte_roi_${format(fechaInicio, "yyyy-MM-dd")}_a_${format(fechaFin, "yyyy-MM-dd")}.xlsx`;
    
    // Create workbook using ExcelJS utility
    await createExcelWorkbook([
      {
        name: "Resumen",
        data: resumenData,
        columns: [
          { header: "Métrica", key: "Métrica", width: 30 },
          { header: "Valor", key: "Valor", width: 25 }
        ]
      },
      {
        name: "Detalle Pagos",
        data: pagosData,
        columns: [
          { header: "Fecha", key: "Fecha", width: 18 },
          { header: "Cliente", key: "Cliente", width: 30 },
          { header: "Monto", key: "Monto", width: 12 },
          { header: "Método", key: "Método", width: 12 },
          { header: "Estado", key: "Estado", width: 12 }
        ]
      },
      {
        name: "Métodos de Pago",
        data: metodosData,
        columns: [
          { header: "Método de Pago", key: "Método de Pago", width: 20 },
          { header: "Monto Total", key: "Monto Total", width: 15 },
          { header: "Porcentaje", key: "Porcentaje", width: 12 }
        ]
      }
    ], nombreArchivo);
    
    toast.success(`Reporte exportado: ${pagos.length} pagos`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reporte ROI</h1>
            <p className="text-muted-foreground">Análisis de retorno de inversión y métricas financieras</p>
          </div>
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Período:</span>
                <Select value={rangoTipo} onValueChange={(value) => handleRangoChange(value as RangoTipo)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="quincena">Últimos 15 días</SelectItem>
                    <SelectItem value="mes">Este Mes</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Desde:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(fechaInicio, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaInicio}
                      onSelect={(date) => {
                        if (date) {
                          setFechaInicio(date);
                          setRangoTipo("personalizado");
                        }
                      }}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-sm text-muted-foreground">Hasta:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(fechaFin, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaFin}
                      onSelect={(date) => {
                        if (date) {
                          setFechaFin(date);
                          setRangoTipo("personalizado");
                        }
                      }}
                      locale={es}
                      disabled={(date) => date < fechaInicio}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Badge variant="secondary" className="ml-auto">
                {diasEnRango} días • {getRangoLabel()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(ingresosBrutos)}</div>
                <div className={`text-xs flex items-center gap-1 ${crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {crecimiento >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {crecimiento.toFixed(1)}% vs período anterior
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalGastos)}</div>
                <div className="text-xs text-muted-foreground">
                  Total egresos del período
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${ingresosNetos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(ingresosNetos)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Ganancia después de gastos
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Retorno sobre inversión
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pacientes?.length || 0}</div>
                <div className="text-xs text-muted-foreground">
                  Registrados en el período
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{citas?.length || 0}</div>
                <div className="text-xs text-muted-foreground">
                  Citas programadas
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{tasaConversion.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  Citas completadas
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso por Paciente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(ingresoPorPaciente)}</div>
                <div className="text-xs text-muted-foreground">
                  Promedio por paciente nuevo
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
            <CardDescription>Tendencia de ingresos en el período</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : dailyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    labelFormatter={(label) => `Día ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de ingresos para este período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Citas</CardTitle>
            <CardDescription>Distribución de citas por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : citasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={citasData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {citasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay citas para este período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Distribución de ingresos por método de pago</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : metodosPagoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metodosPagoData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Monto']} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos de pagos para este período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle>
            Resumen Ejecutivo - {format(fechaInicio, "d MMM", { locale: es })} a {format(fechaFin, "d MMM yyyy", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-xl font-bold">{formatCurrency(ingresosBrutos)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gastos Totales</p>
              <p className="text-xl font-bold">{formatCurrency(totalGastos)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Beneficio Neto</p>
              <p className={`text-xl font-bold ${ingresosNetos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(ingresosNetos)}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Durante este período de <strong>{diasEnRango} días</strong>, la clínica generó un ROI del <strong>{roi.toFixed(1)}%</strong>.
              {crecimiento >= 0 
                ? ` Los ingresos aumentaron un ${crecimiento.toFixed(1)}% respecto al período anterior.`
                : ` Los ingresos disminuyeron un ${Math.abs(crecimiento).toFixed(1)}% respecto al período anterior.`
              }
              {' '}Se registraron <strong>{pacientes?.length || 0}</strong> nuevos pacientes y se completaron <strong>{citasCompletadas}</strong> de <strong>{citas?.length || 0}</strong> citas programadas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reportes;