import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { CalendarIcon, Loader2, AlertTriangle, Clock, User, CalendarDays, CheckCircle2 } from "lucide-react";
import { format, parseISO, isBefore, startOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdateAppointment, useAppointments } from "@/hooks/useAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CitaRescheduleDialogProps {
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

export const CitaRescheduleDialog = ({ open, onOpenChange, cita }: CitaRescheduleDialogProps) => {
  const [fecha, setFecha] = useState<Date | undefined>();
  const [hora, setHora] = useState("");
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [conflicto, setConflicto] = useState<string | null>(null);

  const updateAppointment = useUpdateAppointment();
  const { data: allAppointments } = useAppointments();

  // Get list of doctors
  const { data: doctores } = useQuery({
    queryKey: ["doctores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad, horario_inicio, horario_fin, dias_trabajo")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  // Initialize with current cita values
  useEffect(() => {
    if (cita && open) {
      setFecha(cita.fechaCita ? parseISO(cita.fechaCita) : undefined);
      setHora(cita.hora_cita ? cita.hora_cita.substring(0, 5) : "");
      setDoctorId(cita.doctor_id || undefined);
      setConflicto(null);
    }
  }, [cita, open]);

  // Get current doctor's appointments for the selected date (excluding current cita)
  const appointmentsOnDate = useMemo(() => {
    if (!fecha || !allAppointments) return [];
    const fechaStr = format(fecha, "yyyy-MM-dd");
    return allAppointments.filter(
      (apt) => 
        apt.fechaCita === fechaStr && 
        apt.estado !== "cancelada" &&
        apt.id !== cita?.id && // Exclude current appointment
        (!doctorId || apt.doctor_id === doctorId) // Filter by doctor if selected
    );
  }, [fecha, allAppointments, doctorId, cita?.id]);

  // Calculate occupied hours
  const horasOcupadas = useMemo(() => {
    const occupied = new Set<string>();
    appointmentsOnDate.forEach((apt) => {
      if (apt.hora_cita) {
        occupied.add(apt.hora_cita.substring(0, 5));
      }
    });
    return occupied;
  }, [appointmentsOnDate]);

  // Generate time slots
  const horasBase = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  });

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (fecha && hora && allAppointments) {
      const fechaStr = format(fecha, "yyyy-MM-dd");
      const citaExistente = allAppointments.find(
        (apt) => 
          apt.fechaCita === fechaStr && 
          apt.hora_cita?.substring(0, 5) === hora && 
          apt.estado !== "cancelada" &&
          apt.id !== cita?.id &&
          (!doctorId || apt.doctor_id === doctorId)
      );
      
      if (citaExistente) {
        setConflicto(`Ya existe una cita a las ${hora} con ${citaExistente.nombre}`);
      } else {
        setConflicto(null);
      }
    } else {
      setConflicto(null);
    }
  }, [fecha, hora, allAppointments, cita?.id, doctorId]);

  // Check if date/time changed from original and is valid
  const hasChanges = useMemo(() => {
    if (!cita || !fecha || !hora) return false; // Require both date and time to be set
    const originalFecha = cita.fechaCita ? cita.fechaCita.split('T')[0] : null;
    const newFecha = format(fecha, "yyyy-MM-dd");
    const originalHora = cita.hora_cita?.substring(0, 5) || "";
    const originalDoctor = cita.doctor_id || undefined;
    
    return newFecha !== originalFecha || hora !== originalHora || doctorId !== originalDoctor;
  }, [cita, fecha, hora, doctorId]);

  // Check if missing required fields
  const missingHora = fecha && !hora;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields with user feedback
    if (!fecha) {
      toast.error("Debes seleccionar una fecha para la cita");
      return;
    }
    
    if (!hora) {
      toast.error("Debes seleccionar una hora para la cita");
      return;
    }
    
    if (conflicto) {
      toast.error("La hora seleccionada ya está ocupada");
      return;
    }
    
    if (!cita) return;

    await updateAppointment.mutateAsync({
      id: cita.id,
      fechaCita: format(fecha, "yyyy-MM-dd"),
      hora_cita: hora,
      doctor_id: doctorId || null,
      estado: "pendiente", // Reset to pending when rescheduled
    });

    toast.success("Cita reprogramada exitosamente", {
      description: `Nueva fecha: ${format(fecha, "EEEE d 'de' MMMM", { locale: es })} a las ${hora}`,
    });
    
    onOpenChange(false);
  };

  // Get selected doctor info
  const selectedDoctor = doctores?.find(d => d.id === doctorId);

  // Calculate available slots count for the selected date
  const availableSlotsCount = horasBase.filter(h => !horasOcupadas.has(h)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Reprogramar Cita
          </DialogTitle>
          <DialogDescription>
            Cambia la fecha y hora de la cita de{" "}
            <span className="font-semibold text-foreground">{cita?.nombre}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Current appointment info */}
        <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
          <p className="text-sm font-medium">Cita actual:</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {cita?.fechaCita ? format(parseISO(cita.fechaCita), "EEEE d 'de' MMMM", { locale: es }) : "Sin fecha"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {cita?.hora_cita?.substring(0, 5) || "Sin hora"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor selection */}
          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select 
              value={doctorId || "none"} 
              onValueChange={(val) => {
                setDoctorId(val === "none" ? undefined : val);
                // Reset hora when doctor changes to re-validate availability
                setHora("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {doctores?.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ""}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date picker */}
            <div className="space-y-2">
              <Label>Nueva Fecha</Label>
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
                    onSelect={(date) => {
                      setFecha(date);
                      // Reset hora when date changes
                      setHora("");
                    }}
                    locale={es}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Nueva Hora</Label>
                {fecha && (
                  <span className="text-xs text-muted-foreground">
                    {availableSlotsCount} disponibles
                  </span>
                )}
              </div>
              <Select value={hora} onValueChange={setHora}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {horasBase.map((h) => {
                    const ocupada = horasOcupadas.has(h);
                    return (
                      <SelectItem 
                        key={h} 
                        value={h}
                        disabled={ocupada}
                        className={ocupada ? "text-muted-foreground line-through" : ""}
                      >
                        {h} {ocupada && "(Ocupada)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show appointments on selected date */}
          {fecha && appointmentsOnDate.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Citas existentes el {format(fecha, "d 'de' MMMM", { locale: es })}:
              </p>
              <div className="space-y-1">
                {appointmentsOnDate.slice(0, 4).map((apt) => (
                  <div key={apt.id} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{apt.hora_cita?.substring(0, 5)}</span>
                    <span className="truncate">- {apt.nombre}</span>
                  </div>
                ))}
                {appointmentsOnDate.length > 4 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    +{appointmentsOnDate.length - 4} más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Missing hora alert */}
          {missingHora && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-amber-700 dark:text-amber-300">
                Selecciona una hora para la cita
              </span>
            </div>
          )}

          {/* Conflict alert */}
          {conflicto && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{conflicto}</span>
            </div>
          )}

          {/* Success preview */}
          {hasChanges && !conflicto && fecha && hora && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Nueva cita: {format(fecha, "EEEE d 'de' MMMM", { locale: es })} a las {hora}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateAppointment.isPending || !!conflicto || !hasChanges || !fecha || !hora}
            >
              {updateAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reprogramar Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
