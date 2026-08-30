import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, DollarSign, CreditCard, Banknote, FileSpreadsheet, Calendar, Lock, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FacturaFormDialog } from "@/components/facturacion/FacturaFormDialog";
import { CierreCajaModal } from "@/components/facturacion/CierreCajaModal";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createExcelWorkbook } from "@/lib/excel-utils";

const Facturacion = () => {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [fechaExport, setFechaExport] = useState<Date>(new Date());

  const { data: pagos, isLoading } = useQuery({
    queryKey: ["pagos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select(`
          *,
          cliente:clientes(nombre, apellidos)
        `)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case "tarjeta":
        return <CreditCard className="h-4 w-4" />;
      case "efectivo":
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleExportExcel = async () => {
    if (!pagos || pagos.length === 0) {
      toast.error("No hay pagos para exportar");
      return;
    }

    const fechaInicio = startOfDay(fechaExport);
    const fechaFin = endOfDay(fechaExport);
    
    const pagosDelDia = pagos.filter((pago: any) => {
      if (!pago.fecha) return false;
      const fechaPago = new Date(pago.fecha);
      return fechaPago >= fechaInicio && fechaPago <= fechaFin;
    });

    if (pagosDelDia.length === 0) {
      toast.error(`No hay pagos para el ${format(fechaExport, "dd 'de' MMMM, yyyy", { locale: es })}`);
      return;
    }

    // Prepare data for Excel
    const datosExcel = pagosDelDia.map((pago: any) => ({
      "Fecha": pago.fecha ? format(new Date(pago.fecha), "dd/MM/yyyy HH:mm", { locale: es }) : "",
      "Cliente": pago.cliente ? `${pago.cliente.nombre || ""} ${pago.cliente.apellidos || ""}`.trim() : "Sin asignar",
      "Monto": pago.monto || 0,
      "Método de Pago": pago.metodo || "No especificado",
      "Estado": pago.estado || "pendiente",
    }));

    // Add total row
    const totalMonto = pagosDelDia.reduce((sum: number, pago: any) => sum + (pago.monto || 0), 0);
    datosExcel.push({
      "Fecha": "",
      "Cliente": "TOTAL",
      "Monto": totalMonto,
      "Método de Pago": "",
      "Estado": "",
    });

    // Generate filename
    const nombreArchivo = `pagos_${format(fechaExport, "yyyy-MM-dd")}.xlsx`;
    
    // Create workbook using ExcelJS utility
    await createExcelWorkbook([
      {
        name: "Pagos del Día",
        data: datosExcel,
        columns: [
          { header: "Fecha", key: "Fecha", width: 18 },
          { header: "Cliente", key: "Cliente", width: 30 },
          { header: "Monto", key: "Monto", width: 12 },
          { header: "Método de Pago", key: "Método de Pago", width: 15 },
          { header: "Estado", key: "Estado", width: 12 }
        ]
      }
    ], nombreArchivo);
    
    toast.success(`Excel generado: ${pagosDelDia.length} pagos exportados`);
  };

  // Calcular total del día seleccionado
  const getTotalDelDia = () => {
    if (!pagos) return 0;
    const fechaInicio = startOfDay(fechaExport);
    const fechaFin = endOfDay(fechaExport);
    
    return pagos
      .filter((pago: any) => {
        if (!pago.fecha) return false;
        const fechaPago = new Date(pago.fecha);
        return fechaPago >= fechaInicio && fechaPago <= fechaFin;
      })
      .reduce((sum: number, pago: any) => sum + (pago.monto || 0), 0);
  };

  const getPagosDelDia = () => {
    if (!pagos) return 0;
    const fechaInicio = startOfDay(fechaExport);
    const fechaFin = endOfDay(fechaExport);
    
    return pagos.filter((pago: any) => {
      if (!pago.fecha) return false;
      const fechaPago = new Date(pago.fecha);
      return fechaPago >= fechaInicio && fechaPago <= fechaFin;
    }).length;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturación</h1>
          <p className="text-muted-foreground">Gestiona facturas y pagos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setShowCierreModal(true)}
            variant="outline"
            className="gap-2 border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm"
          >
            <Lock className="h-4 w-4 text-indigo-500" />
            <span>Arqueo y Cierre de Caja</span>
          </Button>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2 font-bold">
            <Plus className="h-4 w-4" />
            Nuevo Pago
          </Button>
        </div>
      </div>

      {/* Tarjeta de Exportación */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar Pagos del Día
          </CardTitle>
          <CardDescription>Genera un reporte en Excel con los pagos de una fecha específica</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(fechaExport, "PPP", { locale: es })}
                    {isToday(fechaExport) && <Badge variant="secondary" className="ml-2">Hoy</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaExport}
                    onSelect={(date) => date && setFechaExport(date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Pagos: </span>
                <span className="font-semibold">{getPagosDelDia()}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold text-primary">${getTotalDelDia().toFixed(2)}</span>
              </div>
              <Button onClick={handleExportExcel} variant="secondary" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : pagos && pagos.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Todos los pagos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pagos.map((pago: any) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getMetodoIcon(pago.metodo || "efectivo")}
                      </div>
                      <div>
                        <p className="font-medium">
                          {pago.cliente?.nombre} {pago.cliente?.apellidos}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pago.fecha
                            ? format(new Date(pago.fecha), "d MMM yyyy", { locale: es })
                            : "Sin fecha"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {pago.metodo || "efectivo"}
                      </Badge>
                      <span className="font-bold text-lg">
                        ${pago.monto?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No hay pagos registrados</p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar primer pago
            </Button>
          </CardContent>
        </Card>
      )}

      <FacturaFormDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
      <CierreCajaModal open={showCierreModal} onOpenChange={setShowCierreModal} />
    </div>
  );
};

export default Facturacion;
