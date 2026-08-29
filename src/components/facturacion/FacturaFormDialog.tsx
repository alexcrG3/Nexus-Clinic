import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FacturaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FacturaFormDialog = ({ open, onOpenChange }: FacturaFormDialogProps) => {
  const [clienteId, setClienteId] = useState<string>("");
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre, apellidos")
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("organizacion_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createPago = useMutation({
    mutationFn: async (data: { cliente_id: string; monto: number; metodo: string }) => {
      const { error } = await supabase.from("pagos").insert({
        cliente_id: data.cliente_id,
        monto: data.monto,
        metodo: data.metodo,
        estado: "pagado",
        organizacion_id: profile?.organizacion_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      toast.success("Pago registrado exitosamente");
      setClienteId("");
      setMonto("");
      setMetodo("efectivo");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al registrar pago: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !monto) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    await createPago.mutateAsync({ 
      cliente_id: clienteId, 
      monto: parseFloat(monto),
      metodo 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Pago / Factura</DialogTitle>
          <DialogDescription>
            Registra un nuevo pago para un paciente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {clientes?.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPago.isPending}>
              {createPago.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Pago
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
