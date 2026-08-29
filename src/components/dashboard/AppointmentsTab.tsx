import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Clock, 
  Phone, 
  Plus, 
  MoreHorizontal, 
  Loader2, 
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Stethoscope,
  Edit
} from "lucide-react";
import { CitaFormDialog } from "@/components/citas/CitaFormDialog";
import { CitaEditDialog } from "@/components/citas/CitaEditDialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const getStatusConfig = (status: string) => {
  const configs = {
    confirmada: { 
      class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      icon: CheckCircle2,
      label: "Confirmada"
    },
    pendiente: { 
      class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      icon: AlertCircle,
      label: "Pendiente"
    },
    cancelada: { 
      class: "bg-red-500/10 text-red-700 border-red-500/20",
      icon: XCircle,
      label: "Cancelada"
    },
    atendida: { 
      class: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      icon: CheckCircle2,
      label: "Atendida"
    },
  };
  return configs[status as keyof typeof configs] || configs.pendiente;
};

const AppointmentsTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [didAutoSelectDate, setDidAutoSelectDate] = useState(false);
  const [showNewCitaDialog, setShowNewCitaDialog] = useState(false);
  const [editingCita, setEditingCita] = useState<any>(null);
  const { data: appointments, isLoading } = useAppointments();
  const updateAppointment = useUpdateAppointment();

  // Si hoy no tiene citas, ir automáticamente a la próxima fecha con citas
  useEffect(() => {
    if (didAutoSelectDate) return;
    if (!appointments || appointments.length === 0) return;

    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const hasForSelected = appointments.some(
      (a) => a.fechaCita && a.fechaCita.split("T")[0] === selectedDateStr,
    );

    if (hasForSelected) {
      setDidAutoSelectDate(true);
      return;
    }

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const next = [...appointments]
      .filter(
        (a) =>
          a.fechaCita &&
          a.fechaCita.split("T")[0] >= todayStr &&
          a.estado !== "cancelada",
      )
      .sort((a, b) => {
        const dateA = a.fechaCita?.split("T")[0] || "";
        const dateB = b.fechaCita?.split("T")[0] || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.hora_cita || "").localeCompare(b.hora_cita || "");
      })[0];

    if (next?.fechaCita) {
      const nextDateOnly = next.fechaCita.split("T")[0];
      setSelectedDate(new Date(`${nextDateOnly}T12:00:00`));
    }

    setDidAutoSelectDate(true);
  }, [appointments, didAutoSelectDate, selectedDate]);
  // Obtener doctores de la tabla doctores
  const { data: doctores } = useQuery({
    queryKey: ["doctores-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad")
        .eq("activo", true);
      if (error) throw error;
      return data || [];
    },
  });

  const getDoctorName = (doctorId: string | null) => {
    if (!doctorId || !doctores) return null;
    const doc = doctores.find(d => d.id === doctorId);
    return doc ? doc.nombre : null;
  };

  const getDoctorInfo = (doctorId: string | null) => {
    if (!doctorId || !doctores) return null;
    return doctores.find(d => d.id === doctorId);
  };

  const handleUpdateStatus = (id: string, estado: string) => {
    updateAppointment.mutate({ id, estado });
  };

  // Filter appointments for selected date
  const filteredAppointments = appointments?.filter((apt) => {
    if (!apt.fechaCita) return false;
    // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats
    const aptDateStr = apt.fechaCita.split('T')[0];
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return aptDateStr === selectedDateStr;
  }) || [];

  // Get dates that have appointments for calendar highlighting
  const appointmentDates = appointments?.reduce((acc, apt) => {
    if (apt.fechaCita) {
      // Normalize to YYYY-MM-DD format for consistent matching
      const dateKey = apt.fechaCita.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
    }
    return acc;
  }, {} as Record<string, typeof appointments>) || {};

  // Stats for selected date
  const stats = {
    total: filteredAppointments.length,
    confirmadas: filteredAppointments.filter(a => a.estado === "confirmada").length,
    pendientes: filteredAppointments.filter(a => a.estado === "pendiente").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Appointments List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold">
              Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </h3>
            <p className="text-muted-foreground">
              {stats.total} citas programadas • {stats.confirmadas} confirmadas • {stats.pendientes} pendientes
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewCitaDialog(true)}>
            <Plus className="h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.confirmadas}</p>
                  <p className="text-xs text-muted-foreground">Confirmadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Agenda del día</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No hay citas para esta fecha</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNewCitaDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Agendar cita
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAppointments
                  .sort((a, b) => (a.hora_cita || "").localeCompare(b.hora_cita || ""))
                  .map((appointment) => {
                    const statusConfig = getStatusConfig(appointment.estado || "pendiente");
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div 
                        key={appointment.id} 
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Time Column */}
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-lg font-bold text-primary">
                              {appointment.hora_cita?.substring(0, 5) || "--:--"}
                            </span>
                            <span className="text-xs text-muted-foreground">hrs</span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-16 bg-border self-center" />

                          {/* Patient Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{appointment.nombre}</h4>
                                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {appointment.telefono || "Sin teléfono"}
                                    </span>
                                    {appointment.doctor_id && getDoctorName(appointment.doctor_id) && (
                                      <span className="flex items-center gap-1 text-primary">
                                        <Stethoscope className="h-3 w-3" />
                                        {getDoctorName(appointment.doctor_id)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge className={cn("gap-1", statusConfig.class)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingCita(appointment)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar cita
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleUpdateStatus(appointment.id, "confirmada")}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                                      Confirmar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(appointment.id, "atendida")}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                                      Marcar atendida
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditingCita(appointment)}>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Reagendar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => handleUpdateStatus(appointment.id, "cancelada")}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Calendar */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md pointer-events-auto"
              modifiers={{
                hasAppointments: (date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  return !!appointmentDates[dateStr];
                }
              }}
              modifiersStyles={{
                hasAppointments: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  textDecorationColor: "hsl(var(--primary))",
                  textUnderlineOffset: "4px"
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Upcoming Appointments Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Próximas Citas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const today = format(new Date(), "yyyy-MM-dd");
              const upcomingAppointments = appointments
                ?.filter((apt) => {
                  if (!apt.fechaCita || apt.estado === "cancelada") return false;
                  const aptDateStr = apt.fechaCita.split('T')[0];
                  return aptDateStr >= today;
                })
                .sort((a, b) => {
                  const dateA = a.fechaCita?.split('T')[0] || '';
                  const dateB = b.fechaCita?.split('T')[0] || '';
                  if (dateA !== dateB) return dateA.localeCompare(dateB);
                  return (a.hora_cita || '').localeCompare(b.hora_cita || '');
                })
                .slice(0, 10) || [];
              
              if (upcomingAppointments.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay citas próximas
                  </p>
                );
              }

              return upcomingAppointments.map((apt) => {
                const doctorInfo = getDoctorInfo(apt.doctor_id);
                return (
                  <div 
                    key={apt.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => apt.fechaCita && setSelectedDate(parseISO(apt.fechaCita))}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {apt.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.fechaCita ? format(parseISO(apt.fechaCita), "d MMM", { locale: es }) : "Sin fecha"}
                        {apt.hora_cita && ` • ${apt.hora_cita.substring(0, 5)}`}
                      </p>
                      {doctorInfo && (
                        <p className="text-xs text-primary truncate flex items-center gap-1 mt-0.5">
                          <Stethoscope className="h-3 w-3" />
                          {doctorInfo.nombre}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusConfig(apt.estado || "pendiente").class)}>
                      {apt.estado?.substring(0, 4) || "Pend"}
                    </Badge>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      </div>

      <CitaFormDialog open={showNewCitaDialog} onOpenChange={setShowNewCitaDialog} />
      <CitaEditDialog open={!!editingCita} onOpenChange={(open) => !open && setEditingCita(null)} cita={editingCita} />
    </div>
  );
};

export default AppointmentsTab;
