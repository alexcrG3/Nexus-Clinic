import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Clipboard, Plus, CalendarIcon, Pencil, CheckCircle, Clock, AlertCircle, Save } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TratamientoGeneralFormProps {
  planTratamiento?: string;
  evolucion?: string;
  proximaCita?: string;
  motivoProximaCita?: string;
  onSave: (data: {
    plan_tratamiento?: string;
    notas?: string;
    proxima_cita?: string;
    motivo_proxima_cita?: string;
  }) => Promise<void>;
  readOnly?: boolean;
}

export const TratamientoGeneralForm = ({
  planTratamiento = "",
  evolucion = "",
  proximaCita,
  motivoProximaCita = "",
  onSave,
  readOnly = false,
}: TratamientoGeneralFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [plan, setPlan] = useState(planTratamiento);
  const [seguimiento, setSeguimiento] = useState(evolucion);
  const [fechaCita, setFechaCita] = useState<Date | undefined>(
    proximaCita ? new Date(proximaCita) : undefined
  );
  const [motivoCita, setMotivoCita] = useState(motivoProximaCita);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        plan_tratamiento: plan,
        notas: seguimiento,
        proxima_cita: fechaCita?.toISOString(),
        motivo_proxima_cita: motivoCita,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasContent = plan || seguimiento || fechaCita;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clipboard className="w-5 h-5" />
              Plan de Tratamiento
            </CardTitle>
            <CardDescription>
              Tratamiento actual y seguimiento del paciente
            </CardDescription>
          </div>
          {!readOnly && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              {hasContent ? "Editar" : "Agregar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Plan de Tratamiento Actual</Label>
              <Textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Describe el plan de tratamiento del paciente..."
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Evolución y Seguimiento</Label>
              <Textarea
                value={seguimiento}
                onChange={(e) => setSeguimiento(e.target.value)}
                placeholder="Notas de evolución y seguimiento del tratamiento..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Próxima Cita</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaCita && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaCita
                        ? format(fechaCita, "PPP", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaCita}
                      onSelect={setFechaCita}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Motivo de Próxima Cita</Label>
                <Input
                  value={motivoCita}
                  onChange={(e) => setMotivoCita(e.target.value)}
                  placeholder="Ej: Control, continuación de tratamiento..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setPlan(planTratamiento);
                  setSeguimiento(evolucion);
                  setFechaCita(proximaCita ? new Date(proximaCita) : undefined);
                  setMotivoCita(motivoProximaCita);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </>
        ) : hasContent ? (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Tratamiento Actual
              </p>
              <p className="text-base whitespace-pre-wrap">
                {plan || "No definido"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Evolución y Seguimiento
              </p>
              <p className="text-base whitespace-pre-wrap">
                {seguimiento || "Sin seguimiento registrado"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Próxima Cita
              </p>
              {fechaCita ? (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span>{format(fechaCita, "PPP", { locale: es })}</span>
                  {motivoCita && (
                    <span className="text-muted-foreground">— {motivoCita}</span>
                  )}
                </div>
              ) : (
                <p className="text-base text-muted-foreground">No programada</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Clipboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              No hay plan de tratamiento definido
            </p>
            {!readOnly && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Plan de Tratamiento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
