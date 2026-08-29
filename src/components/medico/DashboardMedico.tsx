import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, Activity, CheckCircle2, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTodayAppointments } from "@/hooks/useTodayAppointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConsultaForm } from "@/components/consultas/ConsultaForm";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppointmentsTrendChart } from "@/components/dashboard/AppointmentsTrendChart";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { useNavigate } from "react-router-dom";

export const DashboardMedico = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: citasHoy, isLoading: loadingCitas } = useTodayAppointments();
  const [searchTerm, setSearchTerm] = useState("");
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estadísticas del día
  const citasPendientes = citasHoy?.filter(c => c.estado === "pendiente" || c.estado === "confirmada").length || 0;
  const citasAtendidas = citasHoy?.filter(c => c.estado === "atendida").length || 0;
  const citasCanceladas = citasHoy?.filter(c => c.estado === "cancelada").length || 0;

  // Ordenar citas por hora
  const citasOrdenadas = [...(citasHoy || [])].sort((a, b) => {
    if (!a.hora_cita && !b.hora_cita) return 0;
    if (!a.hora_cita) return 1;
    if (!b.hora_cita) return -1;
    return a.hora_cita.localeCompare(b.hora_cita);
  });

  // Buscar solo pacientes asignados al doctor
  const { data: pacientes } = useQuery({
    queryKey: ["pacientes-search-medico", searchTerm],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [{ data: doctor }, { data: profile }] = await Promise.all([
        supabase.from("doctores").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const patientIds = new Set<string>();

      if (doctor?.id) {
        const { data: citasIds } = await supabase
          .from("citas")
          .select("cliente_id")
          .eq("doctor_id", doctor.id)
          .not("cliente_id", "is", null);

        citasIds?.forEach((r: any) => r.cliente_id && patientIds.add(r.cliente_id));
      }

      if (profile?.id) {
        const { data: expedientesIds } = await supabase
          .from("expedientes")
          .select("cliente_id")
          .eq("profesional_id", profile.id)
          .not("cliente_id", "is", null);

        expedientesIds?.forEach((r: any) => r.cliente_id && patientIds.add(r.cliente_id));
      }

      const ids = Array.from(patientIds);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .in("id", ids)
        .or(`nombre.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,cedula.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  const getStatusColor = (estado: string) => {
    const colors = {
      confirmada: "bg-green-500/10 text-green-700 border-green-500/20",
      pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      cancelada: "bg-red-500/10 text-red-700 border-red-500/20",
      atendida: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    };
    return colors[estado as keyof typeof colors] || "";
  };

  const handleAtenderCita = (cita: any) => {
    setSelectedCita(cita);
    setShowConsultaForm(true);
  };

  const handleSubmitConsulta = async (data: any) => {
    if (!selectedCita) return;
    
    setIsSubmitting(true);
    try {
      const { data: expedienteData } = await supabase
        .from("expedientes")
        .select("id")
        .eq("cliente_id", selectedCita.cliente_id)
        .maybeSingle();

      let expedienteId = expedienteData?.id;

      if (!expedienteId) {
        const { data: nuevoExpediente, error: createError } = await supabase
          .from("expedientes")
          .insert({
            cliente_id: selectedCita.cliente_id,
            profesional_id: (await supabase.auth.getUser()).data.user?.id,
            detalle: "Expediente creado automáticamente",
          })
          .select()
          .single();

        if (createError) throw createError;
        expedienteId = nuevoExpediente.id;
      }

      const { error: consultaError } = await supabase
        .from("consultas")
        .insert({
          expediente_id: expedienteId,
          profesional_id: (await supabase.auth.getUser()).data.user?.id,
          motivo_consulta: data.motivo_consulta,
          anamnesis: data.anamnesis,
          signos_vitales: {
            presion_arterial: data.presion_arterial,
            frecuencia_cardiaca: data.frecuencia_cardiaca,
            temperatura: data.temperatura,
            peso: data.peso,
            talla: data.talla,
          },
          examen_fisico: data.examen_fisico,
          diagnostico_principal: data.diagnostico_principal,
          codigo_cie10: data.codigo_cie10,
          plan_tratamiento: data.plan_tratamiento,
          procedimiento_realizado: data.procedimiento_realizado,
          medicamentos_recetados: data.medicamentos ? [{ descripcion: data.medicamentos }] : [],
          recomendaciones: data.recomendaciones,
          proxima_cita: data.proxima_cita || null,
          motivo_proxima_cita: data.motivo_proxima_cita,
          notas_internas: data.notas_internas,
          estado_consulta: "finalizada",
        });

      if (consultaError) throw consultaError;

      const { error: citaError } = await supabase
        .from("citas")
        .update({ estado: "atendida" })
        .eq("id", selectedCita.id);

      if (citaError) throw citaError;

      toast.success("Consulta registrada exitosamente");
      setShowConsultaForm(false);
      setSelectedCita(null);
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    } catch (error: any) {
      console.error("Error al guardar consulta:", error);
      toast.error("Error al guardar la consulta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Médico</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>

        {/* Indicadores rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{citasAtendidas}</div>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Citas Pendientes</CardTitle>
              <Activity className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{citasPendientes}</div>
              <p className="text-xs text-muted-foreground">Por atender</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Citas Canceladas</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{citasCanceladas}</div>
              <p className="text-xs text-muted-foreground">Hoy</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos y Calendario */}
        <div className="grid gap-4 md:grid-cols-2">
          <AppointmentsTrendChart />
          <MiniCalendar />
        </div>

        {/* Buscador de pacientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Buscar por nombre, cédula o número de expediente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              {searchTerm.length >= 2 && pacientes && pacientes.length > 0 && (
                <div className="space-y-2 border rounded-md p-2">
                  {pacientes.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="flex items-center justify-between p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                      onClick={() => {
                        // Buscar expediente del paciente
                        navigate(`/dashboard/expedientes`);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{paciente.nombre} {paciente.apellidos}</p>
                          <p className="text-sm text-muted-foreground">Cédula: {paciente.cedula}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Expediente
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agenda del día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda del Día
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {citasOrdenadas.length} cita(s) programada(s)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingCitas ? (
                <p className="text-center text-muted-foreground py-8">Cargando citas...</p>
              ) : citasOrdenadas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay citas programadas para hoy</p>
              ) : (
                citasOrdenadas.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold truncate">{cita.nombre}</h4>
                          <Badge className={getStatusColor(cita.estado || "pendiente")}>
                            {cita.estado || "pendiente"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {cita.hora_cita && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold text-foreground">
                                {cita.hora_cita.substring(0, 5)}
                              </span>
                            </div>
                          )}
                          {cita.telefono && (
                            <span>Tel: {cita.telefono}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAtenderCita(cita)}
                        disabled={cita.estado === "atendida"}
                        className="flex-1 sm:flex-initial"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {cita.estado === "atendida" ? "Atendida" : "Atender"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConsultaForm
        open={showConsultaForm}
        onOpenChange={setShowConsultaForm}
        onSubmit={handleSubmitConsulta}
        pacienteNombre={selectedCita?.nombre}
        isLoading={isSubmitting}
      />
    </>
  );
};
