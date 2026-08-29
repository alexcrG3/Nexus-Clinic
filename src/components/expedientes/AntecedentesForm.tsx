import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Activity, Pencil, Save, X, Plus, Loader2 } from "lucide-react";

interface Antecedentes {
  id?: string;
  cliente_id: string;
  enfermedades_cronicas?: string[] | null;
  alergias?: string[] | null;
  cirugias_previas?: string[] | null;
  medicamentos_actuales?: string[] | null;
  antecedentes_familiares?: string | null;
  habitos?: any;
}

interface AntecedentesFormProps {
  antecedentes: Antecedentes | null;
  clienteId: string;
  detalleExpediente?: string;
  onSave: (data: Partial<Antecedentes>) => Promise<void>;
  onSaveDetalle?: (detalle: string) => Promise<void>;
  readOnly?: boolean;
}

export const AntecedentesForm = ({
  antecedentes,
  clienteId,
  detalleExpediente = "",
  onSave,
  onSaveDetalle,
  readOnly = false,
}: AntecedentesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [detalle, setDetalle] = useState(detalleExpediente);
  const [enfermedades, setEnfermedades] = useState<string[]>(antecedentes?.enfermedades_cronicas || []);
  const [alergias, setAlergias] = useState<string[]>(antecedentes?.alergias || []);
  const [cirugias, setCirugias] = useState<string[]>(antecedentes?.cirugias_previas || []);
  const [medicamentos, setMedicamentos] = useState<string[]>(antecedentes?.medicamentos_actuales || []);
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState(antecedentes?.antecedentes_familiares || "");
  const [tabaquismo, setTabaquismo] = useState((antecedentes?.habitos as any)?.tabaquismo || false);
  const [alcohol, setAlcohol] = useState((antecedentes?.habitos as any)?.alcohol || false);
  const [ejercicio, setEjercicio] = useState((antecedentes?.habitos as any)?.ejercicio || "");

  const [newEnfermedad, setNewEnfermedad] = useState("");
  const [newAlergia, setNewAlergia] = useState("");
  const [newCirugia, setNewCirugia] = useState("");
  const [newMedicamento, setNewMedicamento] = useState("");

  useEffect(() => {
    if (antecedentes) {
      setEnfermedades(antecedentes.enfermedades_cronicas || []);
      setAlergias(antecedentes.alergias || []);
      setCirugias(antecedentes.cirugias_previas || []);
      setMedicamentos(antecedentes.medicamentos_actuales || []);
      setAntecedentesFamiliares(antecedentes.antecedentes_familiares || "");
      setTabaquismo((antecedentes.habitos as any)?.tabaquismo || false);
      setAlcohol((antecedentes.habitos as any)?.alcohol || false);
      setEjercicio((antecedentes.habitos as any)?.ejercicio || "");
    }
    setDetalle(detalleExpediente);
  }, [antecedentes, detalleExpediente]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: antecedentes?.id,
        cliente_id: clienteId,
        enfermedades_cronicas: enfermedades,
        alergias: alergias,
        cirugias_previas: cirugias,
        medicamentos_actuales: medicamentos,
        antecedentes_familiares: antecedentesFamiliares,
        habitos: {
          tabaquismo,
          alcohol,
          ejercicio,
        },
      });
      if (onSaveDetalle) {
        await onSaveDetalle(detalle);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDetalle(detalleExpediente);
    setEnfermedades(antecedentes?.enfermedades_cronicas || []);
    setAlergias(antecedentes?.alergias || []);
    setCirugias(antecedentes?.cirugias_previas || []);
    setMedicamentos(antecedentes?.medicamentos_actuales || []);
    setAntecedentesFamiliares(antecedentes?.antecedentes_familiares || "");
    setTabaquismo((antecedentes?.habitos as any)?.tabaquismo || false);
    setAlcohol((antecedentes?.habitos as any)?.alcohol || false);
    setEjercicio((antecedentes?.habitos as any)?.ejercicio || "");
  };

  const addItem = (list: string[], setList: (l: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const renderList = (
    items: string[],
    setItems: (l: string[]) => void,
    newValue: string,
    setNewValue: (v: string) => void,
    placeholder: string,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, idx) => (
          <Badge key={idx} variant="secondary" className="gap-1">
            {item}
            {isEditing && (
              <button
                type="button"
                className="ml-1 hover:text-destructive"
                onClick={() => removeItem(items, setItems, idx)}
              >
                ×
              </button>
            )}
          </Badge>
        ))}
        {items.length === 0 && !isEditing && (
          <span className="text-muted-foreground text-sm">Ninguno reportado</span>
        )}
      </div>
      {isEditing && (
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(items, setItems, newValue, setNewValue);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addItem(items, setItems, newValue, setNewValue)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Antecedentes Médicos
            </CardTitle>
            <CardDescription>
              Historial médico y antecedentes del paciente
            </CardDescription>
          </div>
          {!readOnly && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label>Detalle del Expediente</Label>
              <Textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Notas generales del expediente..."
                rows={3}
              />
            </div>

            <Separator />

            {renderList(enfermedades, setEnfermedades, newEnfermedad, setNewEnfermedad, "Agregar enfermedad...", "Enfermedades Crónicas")}
            
            <Separator />
            
            {renderList(alergias, setAlergias, newAlergia, setNewAlergia, "Agregar alergia...", "Alergias")}
            
            <Separator />
            
            {renderList(cirugias, setCirugias, newCirugia, setNewCirugia, "Agregar cirugía...", "Cirugías Previas")}
            
            <Separator />
            
            {renderList(medicamentos, setMedicamentos, newMedicamento, setNewMedicamento, "Agregar medicamento...", "Medicamentos Actuales")}

            <Separator />

            <div className="space-y-2">
              <Label>Antecedentes Familiares</Label>
              <Textarea
                value={antecedentesFamiliares}
                onChange={(e) => setAntecedentesFamiliares(e.target.value)}
                placeholder="Describir antecedentes familiares relevantes..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Hábitos</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="tabaquismo" className="cursor-pointer">Tabaquismo</Label>
                  <Switch
                    id="tabaquismo"
                    checked={tabaquismo}
                    onCheckedChange={setTabaquismo}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="alcohol" className="cursor-pointer">Alcohol</Label>
                  <Switch
                    id="alcohol"
                    checked={alcohol}
                    onCheckedChange={setAlcohol}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={ejercicio}
                    onChange={(e) => setEjercicio(e.target.value)}
                    placeholder="Frecuencia de ejercicio"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Detalle del Expediente</p>
              <p className="text-base">{detalle || "No hay detalles registrados"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Enfermedades Crónicas</p>
              {enfermedades.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {enfermedades.map((e, idx) => (
                    <Badge key={idx} variant="secondary">{e}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base">Ninguna reportada</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Alergias</p>
              {alergias.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {alergias.map((a, idx) => (
                    <Badge key={idx} variant="destructive">{a}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base">Ninguna reportada</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Cirugías Previas</p>
              {cirugias.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cirugias.map((c, idx) => (
                    <Badge key={idx} variant="outline">{c}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base">Ninguna reportada</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Medicamentos Actuales</p>
              {medicamentos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicamentos.map((m, idx) => (
                    <Badge key={idx} variant="secondary">{m}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-base">Ninguno reportado</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Antecedentes Familiares</p>
              <p className="text-base">{antecedentesFamiliares || "Ninguno reportado"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Hábitos</p>
              <div className="space-y-1">
                <p className="text-base">Tabaquismo: {tabaquismo ? "Sí" : "No"}</p>
                <p className="text-base">Alcohol: {alcohol ? "Sí" : "No"}</p>
                {ejercicio && <p className="text-base">Ejercicio: {ejercicio}</p>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
