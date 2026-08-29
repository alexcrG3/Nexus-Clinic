import { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CitaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cita: {
    id: string;
    nombre?: string | null;
    telefono?: string | null;
    fechaCita?: string | null;
    hora_cita?: string | null;
    estado?: string | null;
    doctor_id?: string | null;
  } | null;
}

export const CitaEditDialog = ({ open, onOpenChange, cita }: CitaEditDialogProps) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>();
  const [hora, setHora] = useState("");
  const [estado, setEstado] = useState("");
  const [doctorId, setDoctorId] = useState<string | undefined>();

  const updateAppointment = useUpdateAppointment();

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
  });

  useEffect(() => {
    if (cita) {
      setNombre(cita.nombre || "");
      setTelefono(cita.telefono || "");
      setFecha(cita.fechaCita ? parseISO(cita.fechaCita) : undefined);
      // Strip seconds from hora_cita (e.g., "14:00:00" -> "14:00")
      setHora(cita.hora_cita ? cita.hora_cita.substring(0, 5) : "");
      setEstado(cita.estado || "pendiente");
      setDoctorId(cita.doctor_id || undefined);
    }
  }, [cita]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cita) return;

    await updateAppointment.mutateAsync({
      id: cita.id,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      fechaCita: fecha ? format(fecha, "yyyy-MM-dd") : null,
      hora_cita: hora,
      estado,
      doctor_id: doctorId || null,
    });

    onOpenChange(false);
  };

  const horasBase = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cita</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la cita
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del paciente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profesional asignado</Label>
            <Select 
              value={doctorId || "none"} 
              onValueChange={(val) => setDoctorId(val === "none" ? undefined : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {doctores?.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="atendida">Atendida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fecha && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Select value={hora} onValueChange={setHora}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {horasBase.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAppointment.isPending}>
              {updateAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
