import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Phone, User, Calendar, MoreVertical, Check, X, AlertCircle, FileText, CalendarClock, UserCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CitaRescheduleDialog } from "./CitaRescheduleDialog";

interface Appointment {
  id: string;
  nombre: string | null;
  telefono: string | null;
  fechaCita: string | null;
  hora_cita: string | null;
  estado: string | null;
  doctor_id?: string | null;
  cliente_id?: string | null;
}

interface GroupedAppointments {
  date: string;
  appointments: Appointment[];
}

interface UpcomingAppointmentsCardProps {
  appointments: Appointment[];
  onSelectDate?: (date: Date) => void;
}

const getStatusConfig = (status: string) => {
  const configs = {
    confirmada: { 
      class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      label: "Confirmada"
    },
    pendiente: { 
      class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      label: "Pendiente"
    },
    cancelada: { 
      class: "bg-red-500/10 text-red-700 border-red-500/20",
      label: "Cancelada"
    },
    atendida: { 
      class: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      label: "Atendida"
    },
  };
  return configs[status as keyof typeof configs] || configs.pendiente;
};

export const UpcomingAppointmentsCard = ({ appointments, onSelectDate }: UpcomingAppointmentsCardProps) => {
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  const updateAppointment = useUpdateAppointment();

  // Get all unique cliente_ids to fetch their expedientes
  const clienteIds = [...new Set(appointments.filter(a => a.cliente_id).map(a => a.cliente_id as string))];
  
  // Get all unique doctor_ids to fetch doctor names
  const doctorIds = [...new Set(appointments.filter(a => a.doctor_id).map(a => a.doctor_id as string))];
  
  const { data: expedientesMap } = useQuery({
    queryKey: ["expedientes-by-cliente", clienteIds],
    queryFn: async () => {
      if (clienteIds.length === 0) return {};
      const { data } = await supabase
        .from("expedientes")
        .select("id, cliente_id")
        .in("cliente_id", clienteIds);
      
      const map: Record<string, string> = {};
      data?.forEach(e => {
        if (e.cliente_id) map[e.cliente_id] = e.id;
      });
      return map;
    },
    enabled: clienteIds.length > 0,
  });

  // Fetch doctor names
  const { data: doctoresMap } = useQuery({
    queryKey: ["doctores-by-id", doctorIds],
    queryFn: async () => {
      if (doctorIds.length === 0) return {};
      const { data } = await supabase
        .from("doctores")
        .select("id, nombre")
        .in("id", doctorIds);
      
      const map: Record<string, string> = {};
      data?.forEach(d => {
        map[d.id] = d.nombre;
      });
      return map;
    },
    enabled: doctorIds.length > 0,
  });

  const handleViewExpediente = async (clienteId: string | null | undefined) => {
    if (!clienteId) {
      toast.error("Esta cita no tiene un paciente asociado");
      return;
    }
    
    const expedienteId = expedientesMap?.[clienteId];
    if (expedienteId) {
      navigate(`/dashboard/expedientes/${expedienteId}`);
    } else {
      // Crear expediente automáticamente
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("organizacion_id")
          .eq("user_id", user?.id)
          .single();

        const { data: nuevoExp, error } = await supabase
          .from("expedientes")
          .insert({
            cliente_id: clienteId,
            organizacion_id: profile?.organizacion_id,
            detalle: "Expediente creado desde agenda",
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Expediente creado");
        navigate(`/dashboard/expedientes/${nuevoExp.id}`);
      } catch (err) {
        console.error("Error creating expediente:", err);
        toast.error("Error al crear expediente");
      }
    }
  };
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Filter future appointments (excluding today) and sort by date/time
  const futureAppointments = appointments
    .filter((apt) => {
      if (!apt.fechaCita || apt.estado === "cancelada") return false;
      const aptDateStr = apt.fechaCita.split('T')[0];
      return aptDateStr > today;
    })
    .sort((a, b) => {
      const dateA = a.fechaCita?.split('T')[0] || '';
      const dateB = b.fechaCita?.split('T')[0] || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.hora_cita || '').localeCompare(b.hora_cita || '');
    });

  // Group appointments by date
  const groupedAppointments: GroupedAppointments[] = futureAppointments.reduce((groups, apt) => {
    const dateStr = apt.fechaCita?.split('T')[0] || '';
    const existingGroup = groups.find(g => g.date === dateStr);
    if (existingGroup) {
      existingGroup.appointments.push(apt);
    } else {
      groups.push({ date: dateStr, appointments: [apt] });
    }
    return groups;
  }, [] as GroupedAppointments[]);

  const handleConfirm = async (apt: Appointment) => {
    try {
      await updateAppointment.mutateAsync({
        id: apt.id,
        estado: "confirmada",
      });
      toast.success("Cita confirmada exitosamente");
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const handleOpenCancelDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleOpenRescheduleDialog = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setRescheduleDialogOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      await updateAppointment.mutateAsync({
        id: selectedAppointment.id,
        estado: "cancelada",
        // Store cancel reason in notas or a dedicated field if needed
      });
      toast.success("Cita cancelada", {
        description: cancelReason ? `Motivo: ${cancelReason}` : undefined,
      });
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  if (groupedAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay citas próximas programadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Citas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Citas programadas a partir de mañana
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedAppointments.slice(0, 5).map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(group.date), "EEEE d 'de' MMMM", { locale: es })}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {group.appointments.length} {group.appointments.length === 1 ? 'cita' : 'citas'}
                </Badge>
              </div>
              
              {/* Appointments for this date */}
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                {group.appointments.map((apt) => {
                  const statusConfig = getStatusConfig(apt.estado || "pendiente");
                  const isPending = apt.estado === "pendiente";
                  
                  return (
                    <div 
                      key={apt.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 cursor-pointer"
                        onClick={() => onSelectDate?.(parseISO(group.date))}
                      >
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onSelectDate?.(parseISO(group.date))}
                      >
                        <p className="font-medium truncate">{apt.nombre || "Sin nombre"}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apt.hora_cita?.substring(0, 5) || "--:--"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {apt.telefono || "Sin tel."}
                          </span>
                          {apt.doctor_id && doctoresMap?.[apt.doctor_id] && (
                            <span className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {doctoresMap[apt.doctor_id]}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Badge className={cn("text-xs", statusConfig.class)}>
                        {statusConfig.label}
                      </Badge>

                      {/* Quick expediente button + actions dropdown */}
                      <div className="flex items-center gap-1">
                        {apt.cliente_id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewExpediente(apt.cliente_id)}
                            aria-label="Ver expediente"
                            title="Ver expediente"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más opciones">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {apt.cliente_id && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleViewExpediente(apt.cliente_id)}
                                  className="text-primary"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Ver Expediente
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {isPending && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleConfirm(apt)}
                                  className="text-emerald-600"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Confirmar cita
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {apt.estado !== "cancelada" && apt.estado !== "atendida" && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleOpenRescheduleDialog(apt)}
                                  className="text-primary"
                                >
                                  <CalendarClock className="h-4 w-4 mr-2" />
                                  Reprogramar cita
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {apt.estado !== "cancelada" && (
                              <DropdownMenuItem 
                                onClick={() => handleOpenCancelDialog(apt)}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar cita
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onSelectDate?.(parseISO(group.date))}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Ver en calendario
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cancel Dialog with Reason */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancelar Cita
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea cancelar la cita de{" "}
              <span className="font-semibold">{selectedAppointment?.nombre}</span> programada para el{" "}
              {selectedAppointment?.fechaCita && format(parseISO(selectedAppointment.fechaCita.split('T')[0]), "d 'de' MMMM", { locale: es })} a las{" "}
              {selectedAppointment?.hora_cita?.substring(0, 5)}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Motivo de cancelación (opcional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Ej: El paciente solicitó reprogramar, emergencia médica, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAppointment}
              disabled={updateAppointment.isPending}
            >
              {updateAppointment.isPending ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <CitaRescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        cita={selectedAppointment}
      />
    </>
  );
};
