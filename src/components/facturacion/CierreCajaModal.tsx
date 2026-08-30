import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  DollarSign,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Printer,
  TrendingDown,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createExcelWorkbook } from "@/lib/excel-utils";
import { toast } from "sonner";
import { useClinicConfig } from "@/hooks/useClinicConfig";

interface CierreCajaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
}

export const CierreCajaModal: React.FC<CierreCajaModalProps> = ({
  open,
  onOpenChange,
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const { data: clinicConfig } = useClinicConfig();
  const clinicName = clinicConfig?.nombre_clinica || "Nova Dental";

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dateFormatted = format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es });

  // 1. Pagos del día con filtro resiliente
  const { data: pagos = [], isLoading: loadingPagos } = useQuery({
    queryKey: ["cierre-caja-pagos", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select(`
          *,
          cliente:clientes(nombre, apellidos)
        `)
        .order("fecha", { ascending: false });
      if (error) throw error;
      
      return (data || []).filter((p) => {
        if (!p.fecha) return false;
        const pDate = p.fecha.split("T")[0].split(" ")[0];
        return pDate === dateStr;
      });
    },
    enabled: open,
  });

  // 2. Gastos de caja chica del día con filtro resiliente
  const { data: gastos = [], isLoading: loadingGastos } = useQuery({
    queryKey: ["cierre-caja-gastos", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caja_chica")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;

      return (data || []).filter((g) => {
        if (!g.fecha) return false;
        const gDate = g.fecha.split("T")[0].split(" ")[0];
        return gDate === dateStr;
      });
    },
    enabled: open,
  });

  // Cálculos por método de pago
  const pagosEfectivo = pagos.filter((p) => (p.metodo || "").toLowerCase() === "efectivo");
  const totalEfectivo = pagosEfectivo.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const pagosTarjeta = pagos.filter((p) => (p.metodo || "").toLowerCase() === "tarjeta");
  const totalTarjeta = pagosTarjeta.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const pagosSinpe = pagos.filter((p) => {
    const m = (p.metodo || "").toLowerCase();
    return m === "sinpe" || m.includes("sinpe") || m.includes("movil");
  });
  const totalSinpe = pagosSinpe.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const pagosTransferencia = pagos.filter((p) => {
    const m = (p.metodo || "").toLowerCase();
    return m === "transferencia" || m.includes("banco");
  });
  const totalTransferencia = pagosTransferencia.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalIngresos = pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0);
  const totalEgresos = gastos.filter((g) => g.tipo === "egreso").reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const saldoNeto = totalIngresos - totalEgresos;

  const handleExportExcel = async () => {
    if (pagos.length === 0 && gastos.length === 0) {
      toast.info("No hay transacciones registradas para este día.");
      return;
    }

    const resumenData = [
      { "Concepto": "Fecha de Cierre", "Monto": dateFormatted },
      { "Concepto": "Efectivo", "Monto": `₡${totalEfectivo.toLocaleString()}` },
      { "Concepto": "Tarjeta / Datáfono", "Monto": `₡${totalTarjeta.toLocaleString()}` },
      { "Concepto": "SINPE Móvil", "Monto": `₡${totalSinpe.toLocaleString()}` },
      { "Concepto": "Transferencias", "Monto": `₡${totalTransferencia.toLocaleString()}` },
      { "Concepto": "TOTAL INGRESOS", "Monto": `₡${totalIngresos.toLocaleString()}` },
      { "Concepto": "TOTAL EGRESOS (Caja Chica)", "Monto": `₡${totalEgresos.toLocaleString()}` },
      { "Concepto": "SALDO NETO EN CAJA", "Monto": `₡${saldoNeto.toLocaleString()}` },
    ];

    const detallePagos = pagos.map((p) => ({
      "Hora": p.fecha ? p.fecha.substring(11, 16) : "--:--",
      "Paciente": p.cliente ? `${p.cliente.nombre || ""} ${p.cliente.apellidos || ""}`.trim() : "Paciente",
      "Monto": Number(p.monto) || 0,
      "Método": p.metodo || "Efectivo",
      "Estado": p.estado || "pagado",
    }));

    const detalleGastos = gastos.map((g) => ({
      "Hora": g.fecha ? g.fecha.substring(11, 16) : "--:--",
      "Descripción": g.descripcion || "Gasto",
      "Monto": Number(g.monto) || 0,
      "Categoría": g.categoria || "Operativo",
    }));

    const filename = `cierre_caja_${dateStr}.xlsx`;

    await createExcelWorkbook([
      { name: "Resumen de Cierre", data: resumenData, columns: [{ header: "Concepto", key: "Concepto", width: 30 }, { header: "Monto", key: "Monto", width: 25 }] },
      { name: "Detalle de Ingresos", data: detallePagos, columns: [{ header: "Hora", key: "Hora", width: 12 }, { header: "Paciente", key: "Paciente", width: 30 }, { header: "Monto", key: "Monto", width: 15 }, { header: "Método", key: "Método", width: 15 }, { header: "Estado", key: "Estado", width: 12 }] },
      { name: "Detalle de Egresos", data: detalleGastos, columns: [{ header: "Hora", key: "Hora", width: 12 }, { header: "Descripción", key: "Descripción", width: 35 }, { header: "Monto", key: "Monto", width: 15 }, { header: "Categoría", key: "Categoría", width: 20 }] },
    ], filename);

    toast.success(`Cierre de caja exportado exitosamente: ${filename}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-background text-foreground border border-border shadow-2xl rounded-2xl">
        {/* Header con estilo claro / institucional */}
        <div className="bg-muted/40 border-b border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <Lock className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Arqueo y Cierre de Caja Diario
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs capitalize mt-0.5">
                  {clinicName} • {dateFormatted} {isToday(selectedDate) && <Badge variant="secondary" className="ml-1 text-[10px]">Hoy</Badge>}
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Tarjetas de Resumen Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                <span>Ingresos Totales</span>
                <TrendingUp className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-foreground">
                ₡{totalIngresos.toLocaleString()}
              </p>
              <span className="text-[10px] text-muted-foreground block font-medium">
                {pagos.length} cobros registrados
              </span>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-bold">
                <span>Egresos Caja Chica</span>
                <TrendingDown className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-foreground">
                ₡{totalEgresos.toLocaleString()}
              </p>
              <span className="text-[10px] text-muted-foreground block font-medium">
                {gastos.length} gastos del día
              </span>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-primary font-bold">
                <span>Saldo Neto en Caja</span>
                <Receipt className="size-4" />
              </div>
              <p className="text-xl font-extrabold text-primary">
                ₡{saldoNeto.toLocaleString()}
              </p>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Balance final de jornada
              </span>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Desglose de Recaudación por Método
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Efectivo */}
              <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Banknote className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Efectivo</h5>
                    <span className="text-[10px] text-muted-foreground">{pagosEfectivo.length} pagos</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  ₡{totalEfectivo.toLocaleString()}
                </span>
              </div>

              {/* Tarjeta */}
              <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <CreditCard className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Datáfono / Tarjeta</h5>
                    <span className="text-[10px] text-muted-foreground">{pagosTarjeta.length} pagos</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  ₡{totalTarjeta.toLocaleString()}
                </span>
              </div>

              {/* SINPE Móvil */}
              <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Smartphone className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">SINPE Móvil</h5>
                    <span className="text-[10px] text-muted-foreground">{pagosSinpe.length} pagos</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  ₡{totalSinpe.toLocaleString()}
                </span>
              </div>

              {/* Transferencia */}
              <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Transferencia</h5>
                    <span className="text-[10px] text-muted-foreground">{pagosTransferencia.length} pagos</span>
                  </div>
                </div>
                <span className="font-extrabold text-sm text-foreground">
                  ₡{totalTransferencia.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de comprobantes del día */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Comprobantes del Día ({pagos.length})
            </span>

            {pagos.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center text-xs text-muted-foreground">
                No hay pagos registrados para el día seleccionado.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {pagos.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {p.fecha ? p.fecha.substring(11, 16) : "--:--"}
                      </span>
                      <span className="font-bold text-foreground">
                        {p.cliente ? `${p.cliente.nombre} ${p.cliente.apellidos || ""}`.trim() : "Paciente"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {p.metodo || "Efectivo"}
                      </Badge>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₡{Number(p.monto || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            className="gap-2 text-xs font-bold"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            Exportar Excel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold"
            >
              <Printer className="size-4 text-primary" />
              Imprimir
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
