import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ExpedienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExpedienteFormDialog = ({ open, onOpenChange }: ExpedienteFormDialogProps) => {
  const [clienteId, setClienteId] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [detalle, setDetalle] = useState("");
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = userRole === "admin_sistema" || userRole === "admin_clinica";

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

  const { data: doctores } = useQuery({
    queryKey: ["doctores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
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

  const createExpediente = useMutation({
    mutationFn: async (data: { cliente_id: string; detalle: string; profesional_id?: string }) => {
      const { error } = await supabase.from("expedientes").insert({
        cliente_id: data.cliente_id,
        detalle: data.detalle,
        organizacion_id: profile?.organizacion_id,
        profesional_id: data.profesional_id || user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expedientes"] });
      toast.success("Expediente creado exitosamente");
      setClienteId("");
      setDoctorId("");
      setDetalle("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al crear expediente: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      toast.error("Selecciona un paciente");
      return;
    }
    await createExpediente.mutateAsync({ 
      cliente_id: clienteId, 
      detalle,
      profesional_id: doctorId || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Expediente</DialogTitle>
          <DialogDescription>
            Crea un nuevo expediente para un paciente
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

          {isAdmin && (
            <div className="space-y-2">
              <Label>Doctor asignado</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar doctor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Yo mismo</SelectItem>
                  {doctores?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si no seleccionas un doctor, se asignará a tu usuario
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="detalle">Detalle / Observaciones</Label>
            <Textarea
              id="detalle"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Observaciones iniciales del expediente..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExpediente.isPending}>
              {createExpediente.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Expediente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
