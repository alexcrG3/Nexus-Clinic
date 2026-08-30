import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, Download, Pencil, Smile, Clock, Phone, CheckCircle2, XCircle, AlertCircle, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultaEditDialog } from "@/components/consultas/ConsultaEditDialog";
import { ConsultaFormDialog } from "@/components/consultas/ConsultaFormDialog";
import { ConsultaProfesional } from "@/components/consultas/ConsultaProfesional";
import { RecetaActions } from "@/components/consultas/RecetaActions";
import { useUpdateConsulta } from "@/hooks/useConsultas";
import { OdontogramaProfesional } from "@/components/odontologia/OdontogramaProfesional";
import { TratamientoDentalList } from "@/components/odontologia/TratamientoDentalList";
import { DocumentUploader } from "@/components/expedientes/DocumentUploader";
import { IdentificacionForm } from "@/components/expedientes/IdentificacionForm";
import { AntecedentesFormProfesional } from "@/components/expedientes/AntecedentesFormProfesional";
import { PatientHeader } from "@/components/expedientes/PatientHeader";
import { ConsentimientoInformado } from "@/components/expedientes/ConsentimientoInformado";
import { toast } from "sonner";
import { createExcelFromArrays } from "@/lib/excel-utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useClinicConfig } from "@/hooks/useClinicConfig";

const ExpedienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const { data: clinicConfig } = useClinicConfig();
  const [editingConsulta, setEditingConsulta] = useState<any>(null);
  const [showNewConsulta, setShowNewConsulta] = useState(false);
  const [creatingConsulta, setCreatingConsulta] = useState(false);
  const updateConsulta = useUpdateConsulta();

  // Solo profesionales médicos pueden crear/editar consultas
  const canEditConsultas = 
    userRole === "medico" || 
    userRole === "odontologo" || 
    userRole === "fisioterapeuta" || 
    userRole === "quiropractico" ||
    userRole === "admin_sistema" ||
    userRole === "admin_clinica";

  // Mostrar odontograma SOLO si la clínica es de especialidad odontológica o el rol es odontólogo
  const isDentalSpecialty = (clinicConfig?.tipo_clinica || "odontologia") === "odontologia";
  const isOdontologo = userRole === "odontologo";
  const showOdontograma = isDentalSpecialty || isOdontologo;

  const { data: expediente, isLoading } = useQuery({
    queryKey: ["expediente", id],
    queryFn: async () => {
      const { data: exp, error: expError } = await supabase
        .from("expedientes")
        .select(`
          *,
          cliente:clientes(*),
          profesional:profiles(*)
        `)
        .eq("id", id)
        .single();

      if (expError) throw expError;

      const { data: consultas, error: consError } = await supabase
        .from("consultas")
        .select("*")
        .eq("expediente_id", id)
        .order("fecha", { ascending: false });

      if (consError) console.error("Error cargando consultas:", consError);

      const { data: antecedentes, error: antError } = await supabase
        .from("antecedentes_medicos")
        .select("*")
        .eq("cliente_id", exp.cliente_id)
        .maybeSingle();

      if (antError) console.error("Error cargando antecedentes:", antError);

      const { data: odontograma } = await supabase
        .from("odontogramas")
        .select("*")
        .eq("expediente_id", id)
        .order("fecha", { ascending: false })
        .limit(1)
        .maybeSingle();

      let tratamientosDentales: any[] = [];
      if (odontograma) {
        const { data: tratamientos } = await supabase
          .from("tratamientos_dentales")
          .select("*")
          .eq("odontograma_id", odontograma.id)
          .order("fecha_tratamiento", { ascending: false });
        tratamientosDentales = tratamientos || [];
      }

      const { data: historialCitas } = await supabase
        .from("citas")
        .select("*")
        .eq("cliente_id", exp.cliente_id)
        .order("fechaCita", { ascending: false });

      // Get peso from latest consulta signos_vitales
      const ultimaConsulta = consultas?.[0];
      const signosVitales = ultimaConsulta?.signos_vitales as Record<string, any> | null;
      const pesoActual = signosVitales?.peso || null;

      return {
        ...exp,
        consultas: consultas || [],
        antecedentes: antecedentes || null,
        odontograma: odontograma || null,
        tratamientosDentales,
        historialCitas: historialCitas || [],
        pesoActual,
      };
    },
  });

  if (isLoading) {
    return <div className="p-6">Cargando expediente...</div>;
  }

  if (!expediente) {
    return <div className="p-6">Expediente no encontrado</div>;
  }

  const cliente = expediente.cliente;
  const antecedentes = expediente.antecedentes;

  const handleExportExcel = async () => {
    try {
      const sheets: Array<{ name: string; data: any[][]; columnWidths?: number[] }> = [];
      
      // Patient data sheet
      const patientData = [
        ["Campo", "Valor"],
        ["Nombre", `${cliente?.nombre || ""} ${cliente?.apellidos || ""}`],
        ["Cédula", cliente?.cedula || ""],
        ["Teléfono", cliente?.telefono || ""],
        ["Email", cliente?.email || ""],
        ["Dirección", cliente?.direccion || ""],
        ["Fecha Nacimiento", cliente?.fecha_nacimiento || ""],
        ["Sexo", cliente?.sexo || ""],
        ["Grupo Sanguíneo", cliente?.grupo_sanguineo || ""],
      ];
      sheets.push({ name: "Paciente", data: patientData, columnWidths: [20, 35] });

      // Medical history sheet
      if (antecedentes) {
        const historyData = [
          ["Campo", "Valor"],
          ["Enfermedades Crónicas", antecedentes.enfermedades_cronicas?.join(", ") || "Ninguna"],
          ["Alergias", antecedentes.alergias?.join(", ") || "Ninguna"],
          ["Cirugías Previas", antecedentes.cirugias_previas?.join(", ") || "Ninguna"],
          ["Medicamentos Actuales", antecedentes.medicamentos_actuales?.join(", ") || "Ninguno"],
        ];
        sheets.push({ name: "Antecedentes", data: historyData, columnWidths: [25, 40] });
      }

      // Consultations sheet
      if (expediente.consultas?.length > 0) {
        const consultasData = [
          ["Fecha", "Motivo", "Diagnóstico", "Tratamiento", "Recomendaciones"],
          ...expediente.consultas.map((c: any) => [
            c.fecha ? new Date(c.fecha).toLocaleDateString() : "",
            c.motivo_consulta || "",
            c.diagnostico_principal || "",
            c.plan_tratamiento || "",
            c.recomendaciones || "",
          ]),
        ];
        sheets.push({ name: "Consultas", data: consultasData, columnWidths: [15, 25, 25, 30, 30] });
      }

      const fileName = `expediente-${cliente?.nombre || "paciente"}-${id?.slice(0, 8)}.xlsx`;
      await createExcelFromArrays(sheets, fileName);
      toast.success("Expediente exportado a Excel");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error al exportar expediente");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" onClick={handleExportExcel}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Patient Header Card */}
      <PatientHeader cliente={cliente} peso={expediente.pesoActual} />

      <Tabs defaultValue="identificacion" className="w-full">
        <TabsList className={`grid w-full ${showOdontograma ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="identificacion">Identificación</TabsTrigger>
          <TabsTrigger value="antecedentes">Antecedentes</TabsTrigger>
          {showOdontograma && (
            <TabsTrigger value="odontograma" className="flex items-center gap-1">
              <Smile className="w-4 h-4" />
              Odontograma
            </TabsTrigger>
          )}
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
          <TabsTrigger value="consentimiento">Consentimiento</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="identificacion" className="space-y-4">
          <IdentificacionForm
            cliente={cliente}
            onSave={async (data) => {
              const { error } = await supabase
                .from("clientes")
                .update(data)
                .eq("id", cliente?.id);
              
              if (error) {
                toast.error("Error al actualizar paciente");
                throw error;
              }
              toast.success("Paciente actualizado");
              queryClient.invalidateQueries({ queryKey: ["expediente", id] });
            }}
          />
        </TabsContent>

        <TabsContent value="antecedentes" className="space-y-4">
          <AntecedentesFormProfesional
            antecedentes={antecedentes}
            clienteId={cliente?.id || ""}
            onSave={async (data) => {
              if (antecedentes?.id) {
                const { error } = await supabase
                  .from("antecedentes_medicos")
                  .update(data)
                  .eq("id", antecedentes.id);
                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from("antecedentes_medicos")
                  .insert({ ...data, cliente_id: cliente?.id });
                if (error) throw error;
              }
              toast.success("Antecedentes guardados");
              queryClient.invalidateQueries({ queryKey: ["expediente", id] });
            }}
          />
        </TabsContent>

        {showOdontograma && (
          <TabsContent value="odontograma" className="space-y-4">
            {expediente.odontograma ? (
              <>
                <OdontogramaProfesional
                  data={(expediente.odontograma.datos_dientes as Record<string, any>) || {}}
                  tratamientos={expediente.tratamientosDentales.map((t: any) => ({
                    id: t.id,
                    diente_numero: t.diente_numero,
                    superficie: t.superficie,
                    tratamiento: t.tratamiento,
                    estado: t.estado,
                    color: t.color,
                    notas: t.notas,
                    fecha_tratamiento: t.fecha_tratamiento,
                  }))}
                  readOnly={false}
                  onUpdate={async (newData) => {
                    const { error } = await supabase
                      .from("odontogramas")
                      .update({ datos_dientes: newData as any })
                      .eq("id", expediente.odontograma.id);
                    
                    if (error) toast.error("Error al actualizar odontograma");
                    else {
                      toast.success("Odontograma actualizado");
                      queryClient.invalidateQueries({ queryKey: ["expediente", id] });
                    }
                  }}
                />
                <TratamientoDentalList
                  tratamientos={expediente.tratamientosDentales.map((t: any) => ({
                    id: t.id,
                    diente_numero: t.diente_numero,
                    superficie: t.superficie,
                    tratamiento: t.tratamiento,
                    estado: t.estado,
                    color: t.color,
                    notas: t.notas,
                    fecha_tratamiento: t.fecha_tratamiento,
                  }))}
                  onAddTratamiento={async (tratamiento) => {
                    const { error } = await supabase.from("tratamientos_dentales").insert({
                      odontograma_id: expediente.odontograma.id,
                      ...tratamiento,
                    });
                    if (error) toast.error("Error al agregar tratamiento");
                    else {
                      toast.success("Tratamiento agregado");
                      queryClient.invalidateQueries({ queryKey: ["expediente", id] });
                    }
                  }}
                  onUpdateEstado={async (tratamientoId, estado) => {
                    const { error } = await supabase
                      .from("tratamientos_dentales")
                      .update({ estado })
                      .eq("id", tratamientoId);
                    if (error) toast.error("Error al actualizar estado");
                    else {
                      toast.success("Estado actualizado");
                      queryClient.invalidateQueries({ queryKey: ["expediente", id] });
                    }
                  }}
                />
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Smile className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay odontograma registrado</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    Este paciente aún no tiene un odontograma. Crea uno para registrar el estado dental inicial.
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) {
                          toast.error("Usuario no autenticado");
                          return;
                        }
                        
                        const { error } = await supabase.from("odontogramas").insert({
                          expediente_id: id,
                          cliente_id: cliente?.id,
                          profesional_id: user.id,
                          datos_dientes: {},
                          notas: "",
                        });
                        
                        if (error) {
                          console.error("Error creating odontograma:", error);
                          toast.error("Error al crear odontograma");
                          return;
                        }
                        
                        toast.success("Odontograma creado exitosamente");
                        queryClient.invalidateQueries({ queryKey: ["expediente", id] });
                      } catch (err) {
                        console.error("Error:", err);
                        toast.error("Error al crear odontograma");
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Odontograma
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="consultas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Historial de Consultas
                  </CardTitle>
                  <CardDescription>
                    {expediente.consultas?.length || 0} consulta(s) registrada(s)
                  </CardDescription>
                </div>
                {canEditConsultas && (
                  <Button onClick={() => setShowNewConsulta(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Consulta
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {expediente.consultas?.length > 0 ? (
                <div className="space-y-4">
                  {expediente.consultas.map((consulta: any, index: number) => (
                    <Card key={consulta.id} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">
                              Consulta #{expediente.consultas.length - index}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(consulta.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {canEditConsultas && (
                              <Button variant="outline" size="sm" onClick={() => setEditingConsulta(consulta)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            )}
                            <Badge className={
                              consulta.estado_consulta === "finalizada" ? "bg-green-500" : 
                              consulta.estado_consulta === "en_seguimiento" ? "bg-blue-500" : 
                              "bg-amber-500"
                            }>
                              {consulta.estado_consulta === "finalizada" ? "Terminada" : 
                               consulta.estado_consulta === "en_seguimiento" ? "En seguimiento" : 
                               "Pendiente revisión"}
                            </Badge>
                          </div>
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

                          {Array.isArray(consulta.medicamentos) && consulta.medicamentos.length > 0 && (
                            <div className="pt-2 border-t border-border mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  Medicamentos Prescritos ({consulta.medicamentos.length})
                                </p>
                                <RecetaActions
                                  medicamentos={consulta.medicamentos}
                                  pacienteNombre={cliente?.nombre ? `${cliente.nombre} ${cliente.apellidos || ""}`.trim() : "Paciente"}
                                  pacienteTelefono={cliente?.telefono}
                                  pacienteEmail={cliente?.email}
                                  profesionalNombre={expediente.profesional ? `${expediente.profesional.nombre || ""} ${expediente.profesional.apellidos || ""}`.trim() : "Dr. Tratante"}
                                  diagnostico={consulta.diagnostico_principal}
                                  fecha={format(new Date(consulta.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {consulta.medicamentos.map((med: any, i: number) => (
                                  <div key={i} className="p-2 rounded-lg bg-background border border-border text-xs">
                                    <span className="font-bold text-foreground block">{i + 1}. {med.nombre}</span>
                                    <span className="text-muted-foreground block text-[11px]">{med.indicaciones || med.dosis || "Sin indicaciones"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No hay consultas registradas</p>
                  {canEditConsultas && (
                    <Button onClick={() => setShowNewConsulta(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar primera consulta
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consentimiento" className="space-y-4">
          <ConsentimientoInformado
            cliente={cliente}
            profesional={expediente.profesional}
            consentimientos={(expediente.documentos as any)?.consentimientos || []}
            onSave={async (consentimientos) => {
              const documentos = (expediente.documentos || {}) as any;
              documentos.consentimientos = consentimientos;
              const { error } = await supabase
                .from("expedientes")
                .update({ documentos })
                .eq("id", id);
              if (error) throw error;
              toast.success("Consentimiento guardado");
              queryClient.invalidateQueries({ queryKey: ["expediente", id] });
            }}
          />
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <DocumentUploader
            expedienteId={id || ""}
            documentos={(Array.isArray(expediente.documentos) ? expediente.documentos : []) as any[]}
            onDocumentosChange={async (nuevosDocumentos) => {
              const { error } = await supabase
                .from("expedientes")
                .update({ documentos: nuevosDocumentos as any })
                .eq("id", id);
              if (error) toast.error("Error al actualizar documentos");
              else queryClient.invalidateQueries({ queryKey: ["expediente", id] });
            }}
          />
        </TabsContent>
      </Tabs>

      <ConsultaEditDialog
        open={!!editingConsulta}
        onOpenChange={(open) => !open && setEditingConsulta(null)}
        onSubmit={async (data) => {
          await updateConsulta.mutateAsync(data);
          setEditingConsulta(null);
        }}
        consulta={editingConsulta}
        pacienteNombre={`${cliente?.nombre || ""} ${cliente?.apellidos || ""}`}
        pacienteTelefono={cliente?.telefono || ""}
        pacienteEmail={cliente?.email || ""}
        profesionalNombre={expediente.profesional?.nombre || "Profesional"}
      />

      <ConsultaFormDialog
        open={showNewConsulta}
        onOpenChange={setShowNewConsulta}
        expedienteId={id || ""}
        pacienteNombre={`${cliente?.nombre || ""} ${cliente?.apellidos || ""}`}
        pacienteTelefono={cliente?.telefono || ""}
        pacienteEmail={cliente?.email || ""}
        profesionalNombre={expediente.profesional?.nombre || "Profesional"}
        onSubmit={async (data) => {
          setCreatingConsulta(true);
          try {
            const { error } = await supabase.from("consultas").insert(data);
            if (error) throw error;
            toast.success("Consulta registrada exitosamente");
            setShowNewConsulta(false);
            queryClient.invalidateQueries({ queryKey: ["expediente", id] });
          } catch (error: any) {
            toast.error("Error al registrar consulta: " + error.message);
          } finally {
            setCreatingConsulta(false);
          }
        }}
      />
    </div>
  );
};

export default ExpedienteDetalle;
