import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Phone, User, FileText, CalendarClock, Check, X, MoreHorizontal, UserCircle, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CitaRescheduleDialog } from "@/components/citas/CitaRescheduleDialog";
import { emitLlamadoEvent, type TurnoPaciente } from "@/lib/queueStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgendaAdminProps {
  citas: any[];
}

export const AgendaAdmin = ({ citas }: AgendaAdminProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [citaToReschedule, setCitaToReschedule] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Fetch doctors for display
  const { data: doctores } = useQuery({
    queryKey: ["doctores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad");
      if (error) throw error;
      return data || [];
    },
  });

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId) return "Sin asignar";
    const doctor = doctores?.find(d => d.id === doctorId);
    return doctor?.nombre || "Sin asignar";
  };

  // Ordenar citas por hora
  const citasOrdenadas = [...citas].sort((a, b) => {
    if (!a.hora_cita && !b.hora_cita) return 0;
    if (!a.hora_cita) return 1;
    if (!b.hora_cita) return -1;
    return a.hora_cita.localeCompare(b.hora_cita);
  });

  const getStatusConfig = (estado: string) => {
    const configs = {
      confirmada: { 
        class: "bg-green-500/10 text-green-700 border-green-500/20",
        label: "Confirmada"
      },
      pendiente: { 
        class: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
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
    return configs[estado as keyof typeof configs] || configs.pendiente;
  };

  const handleConfirm = async (citaId: string) => {
    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: "confirmada" })
        .eq("id", citaId);

      if (error) throw error;
      toast.success("Cita confirmada");
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      toast.error("Error al confirmar: " + error.message);
    }
  };

  const handleCancelClick = (cita: any) => {
    setCitaToCancel(cita);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!citaToCancel || !cancelReason.trim()) {
      toast.error("Debes indicar un motivo de cancelación");
      return;
    }

    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: "cancelada" })
        .eq("id", citaToCancel.id);

      if (error) throw error;
      toast.success("Cita cancelada");
      setCancelDialogOpen(false);
      setCitaToCancel(null);
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      toast.error("Error al cancelar: " + error.message);
    }
  };

  const handleOpenReschedule = (cita: any) => {
    setCitaToReschedule(cita);
    setRescheduleDialogOpen(true);
  };

  const handleLlamarAlTv = (cita: any) => {
    const docName = getDoctorName(cita.doctor_id);
    const doctorObj = doctores?.find((d) => d.id === cita.doctor_id);
    const docIdx = doctores ? doctores.findIndex((d) => d.id === cita.doctor_id) : 0;
    const consultorioId = docIdx >= 0 ? String(docIdx + 1) : "1";

    const turno: TurnoPaciente = {
      id: cita.id,
      citaId: cita.id,
      nombre: cita.nombre || "Paciente",
      doctorNombre: docName || "Médico Especialista",
      especialidad: doctorObj?.especialidad || "Consulta Médica",
      consultorio: consultorioId,
      horaCita: cita.hora_cita ? cita.hora_cita.substring(0, 5) : "08:00",
      estado: "llamado",
      ticketNumero: "A-01",
    };

    emitLlamadoEvent(turno);
    toast.success(`📢 Llamando a ${cita.nombre} (Consultorio ${consultorioId}) en la Pantalla TV`);
  };

  const handleVerExpediente = async (cita: any) => {
    try {
      let clienteId = cita.cliente_id;
      
      if (!clienteId) {
        const { data: clienteExistente } = await supabase
          .from("clientes")
          .select("id")
          .eq("telefono", cita.telefono)
          .maybeSingle();
        
        if (clienteExistente) {
          clienteId = clienteExistente.id;
          await supabase
            .from("citas")
            .update({ cliente_id: clienteId })
            .eq("id", cita.id);
        } else {
          toast.error("Primero debes crear el paciente en la sección de Pacientes");
          return;
        }
      }
      
      const { data: expediente, error } = await supabase
        .from("expedientes")
        .select("id")
        .eq("cliente_id", clienteId)
        .maybeSingle();
      
      if (error) {
        toast.error("Error al buscar el expediente");
        return;
      }
      
      if (expediente) {
        navigate(`/dashboard/expedientes/${expediente.id}`);
      } else {
        const user = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("organizacion_id, id")
          .eq("user_id", user.data.user?.id)
          .single();
        
        const { data: nuevoExpediente, error: createError } = await supabase
          .from("expedientes")
          .insert({
            cliente_id: clienteId,
            profesional_id: profile?.id,
            organizacion_id: profile?.organizacion_id,
            detalle: "Expediente creado desde agenda",
          })
          .select()
          .single();
        
        if (createError) {
          toast.error("Error al crear el expediente");
          return;
        }
        
        toast.success("Expediente creado exitosamente");
        navigate(`/dashboard/expedientes/${nuevoExpediente.id}`);
      }
    } catch (err) {
      toast.error("Error al procesar el expediente");
    }
  };

  return (
    <>
      <div className="space-y-4">
        {citasOrdenadas && citasOrdenadas.length > 0 ? (
          citasOrdenadas.map((cita) => {
            const statusConfig = getStatusConfig(cita.estado || "pendiente");
            return (
              <Card key={cita.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex items-start gap-3 md:gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base md:text-lg truncate">
                            {cita.nombre}
                          </h3>
                          <Badge className={statusConfig.class}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-4 text-sm text-muted-foreground">
                          {cita.hora_cita && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span className="font-semibold text-foreground">
                                {cita.hora_cita.substring(0, 5)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {cita.fechaCita 
                                ? format(new Date(cita.fechaCita), "d MMM yyyy", { locale: es })
                                : "Sin fecha"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{cita.telefono || "Sin teléfono"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{getDoctorName(cita.doctor_id)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Botón directo del médico/recepción para llamar al TV */}
                      {cita.estado !== "cancelada" && cita.estado !== "atendida" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLlamarAlTv(cita)}
                          className="gap-1.5 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:border-emerald-600 font-bold transition-all shadow-sm"
                        >
                          <Megaphone className="h-4 w-4" />
                          <span className="hidden xs:inline">Llamar al TV</span>
                        </Button>
                      )}

                      {/* Quick Actions for pending */}
                      {cita.estado === "pendiente" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleConfirm(cita.id)}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Confirmar
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerExpediente(cita)}
                        className="gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Expediente</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cita.estado !== "atendida" && cita.estado !== "cancelada" && (
                            <>
                              <DropdownMenuItem onClick={() => handleOpenReschedule(cita)}>
                                <CalendarClock className="h-4 w-4 mr-2" />
                                Reprogramar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleCancelClick(cita)}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Cita
                              </DropdownMenuItem>
                            </>
                          )}
                          {(cita.estado === "atendida" || cita.estado === "cancelada") && (
                            <DropdownMenuItem onClick={() => handleVerExpediente(cita)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Expediente
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay citas programadas para hoy
            </CardContent>
          </Card>
        )}
      </div>

      <CitaRescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        cita={citaToReschedule}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Cita</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de cancelar la cita de {citaToCancel?.nombre}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Motivo de cancelación *</Label>
            <Input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Indica el motivo..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
