import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Phone, User, FileText, CalendarClock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ConsultaFormDialog } from "@/components/consultas/ConsultaFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CitaRescheduleDialog } from "@/components/citas/CitaRescheduleDialog";

interface AgendaMedicaProps {
  citas: any[];
}

export const AgendaMedica = ({ citas }: AgendaMedicaProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConsultaForm, setShowConsultaForm] = useState(false);
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);
  const [isLoadingExpediente, setIsLoadingExpediente] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [citaToReschedule, setCitaToReschedule] = useState<any>(null);

  // Fetch current user profile for professional info
  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, nombre, apellidos, organizacion_id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const handleOpenReschedule = (cita: any) => {
    setCitaToReschedule(cita);
    setRescheduleDialogOpen(true);
  };

  // Ordenar citas por hora
  const citasOrdenadas = [...citas].sort((a, b) => {
    if (!a.hora_cita && !b.hora_cita) return 0;
    if (!a.hora_cita) return 1;
    if (!b.hora_cita) return -1;
    return a.hora_cita.localeCompare(b.hora_cita);
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

  const handleAtenderCita = async (cita: any) => {
    setIsLoadingExpediente(true);
    setSelectedCita(cita);
    
    try {
      let clienteId = cita.cliente_id;
      
      // Si no hay cliente_id, buscar por teléfono
      if (!clienteId && cita.telefono) {
        const { data: clienteExistente } = await supabase
          .from("clientes")
          .select("id")
          .eq("telefono", cita.telefono)
          .maybeSingle();
        
        if (clienteExistente) {
          clienteId = clienteExistente.id;
          // Actualizar la cita con el cliente_id
          await supabase
            .from("citas")
            .update({ cliente_id: clienteId })
            .eq("id", cita.id);
        }
      }

      if (!clienteId) {
        toast.error("Primero debes registrar al paciente en la sección de Pacientes");
        setIsLoadingExpediente(false);
        return;
      }

      // Obtener el expediente del paciente o crearlo si no existe
      const { data: expedienteData } = await supabase
        .from("expedientes")
        .select("id")
        .eq("cliente_id", clienteId)
        .maybeSingle();

      let expedienteId = expedienteData?.id;

      if (!expedienteId) {
        // Crear expediente si no existe
        const { data: nuevoExpediente, error: createError } = await supabase
          .from("expedientes")
          .insert({
            cliente_id: clienteId,
            profesional_id: currentProfile?.id,
            organizacion_id: currentProfile?.organizacion_id,
            detalle: "Expediente creado desde agenda",
          })
          .select()
          .single();

        if (createError) {
          toast.error("Error al crear expediente: " + createError.message);
          setIsLoadingExpediente(false);
          return;
        }
        expedienteId = nuevoExpediente.id;
      }

      setSelectedExpedienteId(expedienteId);
      setShowConsultaForm(true);
    } catch (error: any) {
      toast.error("Error al preparar consulta: " + error.message);
    } finally {
      setIsLoadingExpediente(false);
    }
  };

  const handleSubmitConsulta = async (data: any) => {
    if (!selectedCita || !selectedExpedienteId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Crear la consulta
      const { error: consultaError } = await supabase
        .from("consultas")
        .insert({
          expediente_id: selectedExpedienteId,
          profesional_id: user?.id,
          motivo_consulta: data.motivo_consulta,
          anamnesis: data.anamnesis,
          signos_vitales: data.signos_vitales,
          examen_fisico: data.examen_fisico,
          diagnostico_principal: data.diagnostico_principal,
          codigo_cie10: data.codigo_cie10,
          plan_tratamiento: data.plan_tratamiento,
          medicamentos_recetados: data.medicamentos_recetados || [],
          recomendaciones: data.recomendaciones,
          notas_internas: data.notas_internas,
          estado_consulta: "finalizada",
        });

      if (consultaError) throw consultaError;

      // Actualizar estado de la cita
      const { error: citaError } = await supabase
        .from("citas")
        .update({ estado: "atendida" })
        .eq("id", selectedCita.id);

      if (citaError) throw citaError;

      toast.success("Consulta registrada exitosamente");
      setShowConsultaForm(false);
      setSelectedCita(null);
      setSelectedExpedienteId(null);
      queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      console.error("Error al guardar consulta:", error);
      toast.error("Error al guardar la consulta: " + error.message);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {citasOrdenadas && citasOrdenadas.length > 0 ? (
          citasOrdenadas.map((cita) => (
            <Card key={cita.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base md:text-lg truncate">
                          {cita.nombre}
                        </h3>
                        <Badge className={getStatusColor(cita.estado || "pendiente")}>
                          {cita.estado || "pendiente"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-4 text-sm text-muted-foreground">
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
                              ? format(new Date(cita.fechaCita), "PPP", { locale: es })
                              : "Sin fecha"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{cita.telefono || "Sin teléfono"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      variant="default"
                      onClick={() => handleAtenderCita(cita)}
                      disabled={cita.estado === "atendida" || isLoadingExpediente}
                      className="h-12 px-6 font-semibold sm:w-auto"
                    >
                      {isLoadingExpediente && selectedCita?.id === cita.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {cita.estado === "atendida" ? "Atendida" : "Atender Paciente"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          let clienteId = cita.cliente_id;
                          
                          // Si no hay cliente_id, buscar o crear el cliente
                          if (!clienteId) {
                            // Buscar cliente por nombre y teléfono
                            const { data: clienteExistente } = await supabase
                              .from("clientes")
                              .select("id")
                              .eq("telefono", cita.telefono)
                              .maybeSingle();
                            
                            if (clienteExistente) {
                              clienteId = clienteExistente.id;
                              
                              // Actualizar la cita con el cliente_id
                              await supabase
                                .from("citas")
                                .update({ cliente_id: clienteId })
                                .eq("id", cita.id);
                            } else {
                              toast.error("Primero debes crear el paciente en la sección de Pacientes");
                              return;
                            }
                          }
                          
                          // Buscar expediente del paciente
                          const { data: expediente, error } = await supabase
                            .from("expedientes")
                            .select("id")
                            .eq("cliente_id", clienteId)
                            .maybeSingle();
                          
                          if (error) {
                            console.error("Error buscando expediente:", error);
                            toast.error("Error al buscar el expediente");
                            return;
                          }
                          
                          if (expediente) {
                            navigate(`/dashboard/expedientes/${expediente.id}`);
                          } else {
                            // Crear expediente automáticamente
                            const user = await supabase.auth.getUser();
                            const { data: profile } = await supabase
                              .from("profiles")
                              .select("organizacion_id")
                              .eq("user_id", user.data.user?.id)
                              .single();
                            
                            const { data: nuevoExpediente, error: createError } = await supabase
                              .from("expedientes")
                              .insert({
                                cliente_id: clienteId,
                                profesional_id: user.data.user?.id,
                                organizacion_id: profile?.organizacion_id,
                                detalle: "Expediente creado desde agenda",
                              })
                              .select()
                              .single();
                            
                            if (createError) {
                              console.error("Error creando expediente:", createError);
                              toast.error("Error al crear el expediente");
                              return;
                            }
                            
                            toast.success("Expediente creado exitosamente");
                            navigate(`/dashboard/expedientes/${nuevoExpediente.id}`);
                          }
                        } catch (err) {
                          console.error("Error:", err);
                          toast.error("Error al procesar el expediente");
                        }
                      }}
                      className="h-12 px-6 font-semibold sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Expediente
                    </Button>
                    {cita.estado !== "atendida" && cita.estado !== "cancelada" && (
                      <Button 
                        variant="outline"
                        onClick={() => handleOpenReschedule(cita)}
                        className="h-12 px-6 font-semibold sm:w-auto border-primary/30 text-primary hover:bg-primary/5"
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Reprogramar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay citas programadas para hoy
            </CardContent>
          </Card>
        )}
      </div>

      {selectedExpedienteId && (
        <ConsultaFormDialog
          open={showConsultaForm}
          onOpenChange={(open) => {
            setShowConsultaForm(open);
            if (!open) {
              setSelectedCita(null);
              setSelectedExpedienteId(null);
            }
          }}
          onSubmit={handleSubmitConsulta}
          expedienteId={selectedExpedienteId}
          pacienteNombre={selectedCita?.nombre}
          profesionalNombre={currentProfile ? `${currentProfile.nombre || ''} ${currentProfile.apellidos || ''}`.trim() : undefined}
        />
      )}

      <CitaRescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        cita={citaToReschedule}
      />
    </>
  );
};
