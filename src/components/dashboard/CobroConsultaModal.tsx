import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Check,
  User,
  Stethoscope,
  Receipt,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { TurnoPaciente } from "@/lib/queueStore";

interface CobroConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: TurnoPaciente | null;
  officeName?: string;
  onFinalizarSuccess: () => void;
}

export const CobroConsultaModal: React.FC<CobroConsultaModalProps> = ({
  open,
  onOpenChange,
  paciente,
  officeName,
  onFinalizarSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [monto, setMonto] = useState<string>("30000");
  const [metodo, setMetodo] = useState<string>("efectivo");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  // Buscar información de la cita en Supabase si tiene citaId
  useEffect(() => {
    if (!paciente) return;

    setMonto("30000");
    setMetodo("efectivo");

    const loadCitaData = async () => {
      if (paciente.citaId) {
        const { data: cita } = await supabase
          .from("citas")
          .select("id, precio, cliente_id")
          .eq("id", paciente.citaId)
          .maybeSingle();

        if (cita) {
          if (cita.precio && Number(cita.precio) > 0) {
            setMonto(String(cita.precio));
          }
          if (cita.cliente_id) {
            setClienteId(cita.cliente_id);
          }
        }
      } else {
        // Buscar cliente por nombre
        const { data: client } = await supabase
          .from("clientes")
          .select("id")
          .ilike("nombre", `%${paciente.nombre.split(" ")[0]}%`)
          .maybeSingle();
        if (client) {
          setClienteId(client.id);
        }
      }
    };

    loadCitaData();
  }, [paciente, open]);

  const handleConfirmarFinalizacion = async (conCobro: boolean) => {
    if (!paciente) return;
    setIsSubmitting(true);

    try {
      // 1. Si se registra cobro en Facturación y Reportes
      if (conCobro) {
        const montoNum = parseFloat(monto) || 0;
        if (montoNum <= 0) {
          toast.error("Por favor ingresa un monto válido a cobrar.");
          setIsSubmitting(false);
          return;
        }

        // Obtener organizacion_id del usuario
        let orgId: string | undefined;
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("organizacion_id")
            .eq("user_id", user.id)
            .maybeSingle();
          orgId = profile?.organizacion_id;
        }

        const localDateStr = format(new Date(), "yyyy-MM-dd HH:mm:ss");

        const { error: pagoError } = await supabase.from("pagos").insert({
          cita_id: paciente.citaId || null,
          cliente_id: clienteId || null,
          monto: montoNum,
          metodo: metodo,
          estado: "pagado",
          fecha: localDateStr,
          organizacion_id: orgId || null,
        });

        if (pagoError) {
          console.warn("Error al registrar pago:", pagoError);
          toast.error("Hubo un error al registrar el pago en la base de datos.");
        } else {
          toast.success(`💳 Cobro de ₡${montoNum.toLocaleString()} registrado en Facturación`);
        }
      }

      // 2. Actualizar cita en Supabase a estado 'atendida'
      if (paciente.citaId) {
        await supabase
          .from("citas")
          .update({ estado: "atendida" })
          .eq("id", paciente.citaId);
      }

      // 3. Invalidar queries de reportes, facturación y turnos
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["cierre-caja-pagos"] });
      queryClient.invalidateQueries({ queryKey: ["reportes-pagos"] });
      queryClient.invalidateQueries({ queryKey: ["reportes-citas"] });
      queryClient.invalidateQueries({ queryKey: ["citas-llamador-db"] });
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });

      // 4. Ejecutar cierre del consultorio en la pantalla y memoria
      onFinalizarSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error al finalizar consulta con cobro:", err);
      toast.error("Ocurrió un error al procesar el cierre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const metodosDisponibles = [
    { id: "efectivo", label: "Efectivo", icon: Banknote, activeClass: "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500" },
    { id: "tarjeta", label: "Tarjeta / Datáfono", icon: CreditCard, activeClass: "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500" },
    { id: "sinpe", label: "SINPE Móvil", icon: Smartphone, activeClass: "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500" },
    { id: "transferencia", label: "Transferencia", icon: Building2, activeClass: "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background text-foreground border border-border shadow-2xl rounded-2xl">
        {/* Header institucional */}
        <div className="bg-muted/40 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cobrar y Finalizar Consulta
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                Registra el pago en facturación y libera el consultorio
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Tarjeta resumen del paciente */}
          {paciente && (
            <div className="bg-card border border-border rounded-xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    <User className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{paciente.nombre}</h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Stethoscope className="size-3 text-primary" />
                      {paciente.doctorNombre || "Médico Especialista"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {paciente.ticketNumero || "A-01"}
                  </Badge>
                  {officeName && (
                    <span className="block text-[10px] text-muted-foreground mt-0.5 font-medium">
                      {officeName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Cobro */}
          <div className="space-y-4">
            {/* Monto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Monto de la Consulta (₡)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                  ₡
                </span>
                <Input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="30000"
                  className="pl-8 text-base font-bold rounded-xl h-11"
                />
              </div>
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Método de Pago
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {metodosDisponibles.map((item) => {
                  const Icon = item.icon;
                  const isSelected = metodo === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMetodo(item.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left shadow-sm",
                        isSelected
                          ? item.activeClass
                          : "bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 bg-muted/40 border-t border-border flex flex-col gap-2">
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleConfirmarFinalizacion(true)}
            className="w-full font-bold text-sm h-10 rounded-xl gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registrando cobro...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Registrar Cobro de ₡{Number(monto || 0).toLocaleString()} y Finalizar
              </>
            )}
          </Button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleConfirmarFinalizacion(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors underline underline-offset-4"
            >
              Finalizar sin registrar cobro
            </button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
