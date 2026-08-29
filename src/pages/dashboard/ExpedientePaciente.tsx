import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Calendar, FileText, Activity, Clipboard, Download, Edit, Plus, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const ExpedientePaciente = () => {
  const { clienteId } = useParams();
  const navigate = useNavigate();

  // First, get the patient info
  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ["cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", clienteId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  // Then, get or create the expediente for this patient
  const { data: expediente, isLoading: isLoadingExpediente, refetch: refetchExpediente } = useQuery({
    queryKey: ["expediente-by-cliente", clienteId],
    queryFn: async () => {
      // Try to find existing expediente
      const { data: existingExp, error: fetchError } = await supabase
        .from("expedientes")
        .select(`
          *,
          profesional:profiles(*)
        `)
        .eq("cliente_id", clienteId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingExp) {
        // Get consultas
        const { data: consultas } = await supabase
          .from("consultas")
          .select("*")
          .eq("expediente_id", existingExp.id)
          .order("fecha", { ascending: false });

        // Get antecedentes
        const { data: antecedentes } = await supabase
          .from("antecedentes_medicos")
          .select("*")
          .eq("cliente_id", clienteId)
          .maybeSingle();

        return {
          ...existingExp,
          consultas: consultas || [],
          antecedentes: antecedentes || null,
        };
      }

      return null;
    },
    enabled: !!clienteId,
  });

  const handleCreateExpediente = async () => {
    try {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("organizacion_id")
        .eq("user_id", user?.id)
        .single();

      const { data: newExp, error } = await supabase
        .from("expedientes")
        .insert({
          cliente_id: clienteId,
          organizacion_id: profile?.organizacion_id,
          profesional_id: user?.id,
          fecha: new Date().toISOString(),
          detalle: "",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Expediente creado exitosamente");
      refetchExpediente();
    } catch (error: any) {
      toast.error("Error al crear expediente: " + error.message);
    }
  };

  const isLoading = isLoadingCliente || isLoadingExpediente;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <p className="text-muted-foreground">Paciente no encontrado</p>
      </div>
    );
  }

  // If no expediente exists, show creation prompt
  if (!expediente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {cliente.nombre} {cliente.apellidos}
            </h1>
            <p className="text-muted-foreground">
              Cédula: {cliente.cedula}
            </p>
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Sin Expediente</CardTitle>
            <CardDescription>
              Este paciente aún no tiene un expediente médico creado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleCreateExpediente}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Expediente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const antecedentes = expediente.antecedentes;
  const detalle = expediente.detalle || "";

  const calcularEdad = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return "No especificada";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {cliente.nombre} {cliente.apellidos}
            </h1>
            <p className="text-muted-foreground">
              Expediente #{expediente.id?.slice(0, 8)} • {new Date(expediente.fecha).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => navigate(`/dashboard/expediente/${expediente.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Ver Detalle Completo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identificacion" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identificacion">Identificación</TabsTrigger>
          <TabsTrigger value="antecedentes">Antecedentes</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
          <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="identificacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos de Identificación del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="text-base">{cliente.nombre} {cliente.apellidos}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cédula</p>
                  <p className="text-base">{cliente.cedula || "No especificada"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-base">{cliente.telefono || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{cliente.email || "No especificado"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p className="text-base">{cliente.direccion || "No especificada"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="text-base">
                    {cliente.fecha_nacimiento 
                      ? new Date(cliente.fecha_nacimiento).toLocaleDateString() 
                      : "No especificada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Edad</p>
                  <p className="text-base">{calcularEdad(cliente.fecha_nacimiento)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sexo</p>
                  <p className="text-base">{cliente.sexo || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grupo Sanguíneo</p>
                  <p className="text-base">{cliente.grupo_sanguineo || "No especificado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antecedentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Antecedentes Médicos Generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Detalle del Expediente</p>
                <p className="text-base">{detalle || "No hay detalles registrados"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Enfermedades Crónicas</p>
                {antecedentes?.enfermedades_cronicas && antecedentes.enfermedades_cronicas.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {antecedentes.enfermedades_cronicas.map((enfermedad: string, idx: number) => (
                      <li key={idx}>{enfermedad}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base">Ninguna reportada</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Alergias</p>
                {antecedentes?.alergias && antecedentes.alergias.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {antecedentes.alergias.map((alergia: string, idx: number) => (
                      <li key={idx}>{alergia}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base">Ninguna reportada</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Cirugías Previas</p>
                {antecedentes?.cirugias_previas && antecedentes.cirugias_previas.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {antecedentes.cirugias_previas.map((cirugia: string, idx: number) => (
                      <li key={idx}>{cirugia}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base">Ninguna reportada</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Medicamentos Actuales</p>
                {antecedentes?.medicamentos_actuales && antecedentes.medicamentos_actuales.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {antecedentes.medicamentos_actuales.map((medicamento: string, idx: number) => (
                      <li key={idx}>{medicamento}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base">Ninguno reportado</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Antecedentes Familiares</p>
                <p className="text-base">{antecedentes?.antecedentes_familiares || "Ninguno reportado"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Hábitos</p>
                {antecedentes?.habitos ? (
                  <div className="space-y-1">
                    <p className="text-base">Tabaquismo: {(antecedentes.habitos as any).tabaquismo ? "Sí" : "No"}</p>
                    <p className="text-base">Alcohol: {(antecedentes.habitos as any).alcohol ? "Sí" : "No"}</p>
                    {(antecedentes.habitos as any).ejercicio && (
                      <p className="text-base">Ejercicio: {(antecedentes.habitos as any).ejercicio}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-base">No registrado</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Historial de Consultas
              </CardTitle>
              <CardDescription>
                {expediente.consultas?.length || 0} consulta(s) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expediente.consultas && expediente.consultas.length > 0 ? (
                <div className="space-y-4">
                  {expediente.consultas.map((consulta: any, index: number) => (
                    <Card key={consulta.id} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">
                              Consulta #{index + 1}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(consulta.fecha).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-green-500">Completada</Badge>
                        </div>
                        <div className="space-y-3">
                          {consulta.motivo_consulta && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Motivo de Consulta</p>
                              <p className="text-base">{consulta.motivo_consulta}</p>
                            </div>
                          )}
                          {consulta.diagnostico_principal && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Diagnóstico</p>
                              <p className="text-base">{consulta.diagnostico_principal}</p>
                            </div>
                          )}
                          {consulta.plan_tratamiento && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Plan de Tratamiento</p>
                              <p className="text-base">{consulta.plan_tratamiento}</p>
                            </div>
                          )}
                          {consulta.detalle && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Detalle</p>
                              <p className="text-base">{consulta.detalle}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay consultas registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratamiento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="w-5 h-5" />
                Plan de Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tratamiento Actual</p>
                <p className="text-base">No hay plan de tratamiento definido</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Evolución y Seguimiento</p>
                <p className="text-base">Sin seguimiento registrado</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Próxima Cita</p>
                <p className="text-base">No programada</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Archivos Adjuntos
              </CardTitle>
              <CardDescription>Documentos, exámenes y registros fotográficos</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(expediente.documentos) && expediente.documentos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {(expediente.documentos as any[]).map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay documentos adjuntos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpedientePaciente;
