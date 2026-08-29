import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  MoreHorizontal, 
  Loader2, 
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  Stethoscope,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CitaFormDialog } from "@/components/citas/CitaFormDialog";
import { CitaEditDialog } from "@/components/citas/CitaEditDialog";
import { UpcomingAppointmentsCard } from "@/components/citas/UpcomingAppointmentsCard";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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

const Citas = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showNewCitaDialog, setShowNewCitaDialog] = useState(false);
  const [editingCita, setEditingCita] = useState<any>(null);
  const { data: appointments, isLoading } = useAppointments();
  const updateAppointment = useUpdateAppointment();

  // Get doctors list
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

  const handleUpdateStatus = (id: string, estado: string) => {
    updateAppointment.mutate({ id, estado });
  };

  // Filter appointments for today only
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments?.filter((apt) => {
    if (!apt.fechaCita) return false;
    const aptDateStr = apt.fechaCita.split('T')[0];
    return aptDateStr === todayStr;
  }).sort((a, b) => (a.hora_cita || "").localeCompare(b.hora_cita || "")) || [];

  // Get dates that have appointments for calendar highlighting
  const appointmentDates = appointments?.reduce((acc, apt) => {
    if (apt.fechaCita) {
      const dateKey = apt.fechaCita.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(apt);
    }
    return acc;
  }, {} as Record<string, typeof appointments>) || {};

  // Stats for today
  const stats = {
    total: todayAppointments.length,
    confirmadas: todayAppointments.filter(a => a.estado === "confirmada").length,
    pendientes: todayAppointments.filter(a => a.estado === "pendiente").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Citas</h1>
        <p className="text-muted-foreground">Gestiona las citas de los pacientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Today's Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold">
                Citas de Hoy - {format(new Date(), "d 'de' MMMM", { locale: es })}
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
                    <p className="text-xs text-muted-foreground">Total Hoy</p>
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

          {/* Today's Appointments List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Agenda del día</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay citas para hoy</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowNewCitaDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Agendar cita
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {todayAppointments.map((appointment) => {
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

          {/* Upcoming Appointments Card */}
          <UpcomingAppointmentsCard 
            appointments={appointments || []} 
            onSelectDate={setSelectedDate}
          />
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
        </div>
      </div>

      <CitaFormDialog open={showNewCitaDialog} onOpenChange={setShowNewCitaDialog} />
      <CitaEditDialog 
        open={!!editingCita} 
        onOpenChange={(open) => !open && setEditingCita(null)} 
        cita={editingCita}
      />
    </div>
  );
};

export default Citas;
