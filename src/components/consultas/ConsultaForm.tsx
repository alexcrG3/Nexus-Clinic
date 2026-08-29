import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const consultaSchema = z.object({
  motivo_consulta: z.string().min(1, "El motivo de consulta es requerido"),
  anamnesis: z.string().optional(),
  presion_arterial: z.string().optional(),
  frecuencia_cardiaca: z.string().optional(),
  temperatura: z.string().optional(),
  peso: z.string().optional(),
  talla: z.string().optional(),
  examen_fisico: z.string().optional(),
  diagnostico_principal: z.string().min(1, "El diagnóstico principal es requerido"),
  codigo_cie10: z.string().optional(),
  plan_tratamiento: z.string().optional(),
  procedimiento_realizado: z.string().optional(),
  medicamentos: z.string().optional(),
  recomendaciones: z.string().optional(),
  proxima_cita: z.string().optional(),
  motivo_proxima_cita: z.string().optional(),
  notas_internas: z.string().optional(),
});

type ConsultaFormData = z.infer<typeof consultaSchema>;

interface ConsultaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ConsultaFormData) => void;
  pacienteNombre?: string;
  isLoading?: boolean;
}

export const ConsultaForm = ({
  open,
  onOpenChange,
  onSubmit,
  pacienteNombre,
  isLoading,
}: ConsultaFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
  });

  const handleFormSubmit = (data: ConsultaFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registro de Atención Médica</DialogTitle>
          <DialogDescription>
            {pacienteNombre && (
              <div className="flex items-center gap-2 mt-2">
                <span>Paciente:</span>
                <Badge variant="outline" className="text-base">{pacienteNombre}</Badge>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="motivo" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="motivo">Motivo</TabsTrigger>
              <TabsTrigger value="examen">Examen</TabsTrigger>
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="tratamiento">Tratamiento</TabsTrigger>
              <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
            </TabsList>

            <TabsContent value="motivo" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Motivo de la Consulta</CardTitle>
                  <CardDescription>¿Por qué viene el paciente hoy?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="motivo_consulta">Motivo de la Consulta *</Label>
                    <Textarea 
                      id="motivo_consulta" 
                      {...register("motivo_consulta")}
                      placeholder="Ej: Dolor en la espalda baja desde hace 3 días"
                      rows={3}
                    />
                    {errors.motivo_consulta && (
                      <p className="text-sm text-destructive">{errors.motivo_consulta.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anamnesis">Anamnesis (Historia del caso actual)</Label>
                    <Textarea 
                      id="anamnesis" 
                      {...register("anamnesis")}
                      placeholder="Descripción detallada: inicio, evolución, factores que mejoran o empeoran..."
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examen" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signos Vitales y Examen Físico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="presion_arterial">Presión Arterial</Label>
                      <Input 
                        id="presion_arterial" 
                        {...register("presion_arterial")}
                        placeholder="120/80 mmHg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frecuencia_cardiaca">Frecuencia Cardíaca</Label>
                      <Input 
                        id="frecuencia_cardiaca" 
                        {...register("frecuencia_cardiaca")}
                        placeholder="72 lpm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperatura">Temperatura</Label>
                      <Input 
                        id="temperatura" 
                        {...register("temperatura")}
                        placeholder="36.5 °C"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso (kg)</Label>
                      <Input 
                        id="peso" 
                        {...register("peso")}
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="talla">Talla (cm)</Label>
                      <Input 
                        id="talla" 
                        {...register("talla")}
                        placeholder="170"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="examen_fisico">Examen Físico</Label>
                    <Textarea 
                      id="examen_fisico" 
                      {...register("examen_fisico")}
                      placeholder="Auscultación, palpación, inspección, observaciones..."
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnostico_principal">Diagnóstico Principal *</Label>
                    <Textarea 
                      id="diagnostico_principal" 
                      {...register("diagnostico_principal")}
                      placeholder="Diagnóstico o impresión clínica principal"
                      rows={3}
                    />
                    {errors.diagnostico_principal && (
                      <p className="text-sm text-destructive">{errors.diagnostico_principal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo_cie10">Código CIE-10 (Opcional)</Label>
                    <Input 
                      id="codigo_cie10" 
                      {...register("codigo_cie10")}
                      placeholder="Ej: M54.5"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tratamiento" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan de Tratamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="procedimiento_realizado">Procedimiento Realizado</Label>
                    <Textarea 
                      id="procedimiento_realizado" 
                      {...register("procedimiento_realizado")}
                      placeholder="Descripción del procedimiento o terapia aplicada"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan_tratamiento">Plan de Tratamiento</Label>
                    <Textarea 
                      id="plan_tratamiento" 
                      {...register("plan_tratamiento")}
                      placeholder="Estrategia terapéutica a seguir"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicamentos">Medicamentos Recetados</Label>
                    <Textarea 
                      id="medicamentos" 
                      {...register("medicamentos")}
                      placeholder="Nombre, dosis, frecuencia y duración&#10;Ej: Ibuprofeno 400mg cada 8 horas por 5 días"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recomendaciones">Recomendaciones y Cuidados</Label>
                    <Textarea 
                      id="recomendaciones" 
                      {...register("recomendaciones")}
                      placeholder="Recomendaciones para el paciente, cuidados especiales..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seguimiento" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seguimiento y Próxima Cita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proxima_cita">Fecha Próxima Cita</Label>
                      <Input 
                        id="proxima_cita" 
                        type="date"
                        {...register("proxima_cita")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motivo_proxima_cita">Motivo del Próximo Control</Label>
                      <Input 
                        id="motivo_proxima_cita" 
                        {...register("motivo_proxima_cita")}
                        placeholder="Ej: Control de evolución"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notas_internas">Notas Internas (Solo visible para equipo médico)</Label>
                    <Textarea 
                      id="notas_internas" 
                      {...register("notas_internas")}
                      placeholder="Observaciones internas, comentarios para el equipo..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};