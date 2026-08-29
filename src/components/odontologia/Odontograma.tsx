import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Tipos de condiciones dentales
const CONDICIONES = {
  sano: { color: "#22c55e", label: "Sano" },
  caries: { color: "#ef4444", label: "Caries" },
  obturacion: { color: "#3b82f6", label: "Obturación" },
  corona: { color: "#eab308", label: "Corona" },
  ausente: { color: "#6b7280", label: "Ausente" },
  endodoncia: { color: "#8b5cf6", label: "Endodoncia" },
  implante: { color: "#06b6d4", label: "Implante" },
  fractura: { color: "#f97316", label: "Fractura" },
  sellante: { color: "#10b981", label: "Sellante" },
  extraccion_indicada: { color: "#dc2626", label: "Extracción Indicada" },
};

// Superficies del diente
const SUPERFICIES = {
  oclusal: "O",
  mesial: "M",
  distal: "D",
  vestibular: "V",
  lingual: "L",
  palatina: "P",
};

interface DienteData {
  condicion?: string;
  superficies?: { [key: string]: string };
  notas?: string;
}

interface OdontogramaData {
  [diente: string]: DienteData;
}

interface OdontogramaProps {
  data: OdontogramaData;
  onUpdate?: (data: OdontogramaData) => void;
  readOnly?: boolean;
  tratamientos?: any[];
}

// Componente de un diente individual con 5 superficies
const Diente = ({
  numero,
  data,
  onClick,
  readOnly,
}: {
  numero: number;
  data?: DienteData;
  onClick: () => void;
  readOnly?: boolean;
}) => {
  const getSuperficieColor = (superficie: string) => {
    if (!data?.superficies?.[superficie]) return "hsl(var(--muted))";
    const condicion = data.superficies[superficie];
    return CONDICIONES[condicion as keyof typeof CONDICIONES]?.color || "hsl(var(--muted))";
  };

  const isAusente = data?.condicion === "ausente";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110",
              readOnly && "cursor-default hover:scale-100",
              isAusente && "opacity-40"
            )}
            onClick={readOnly ? undefined : onClick}
          >
            {/* Representación del diente con 5 superficies */}
            <svg width="40" height="40" viewBox="0 0 40 40">
              {/* Superficie Oclusal (centro) */}
              <rect
                x="12"
                y="12"
                width="16"
                height="16"
                fill={getSuperficieColor("oclusal")}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* Superficie Vestibular (arriba) */}
              <polygon
                points="12,12 28,12 40,0 0,0"
                fill={getSuperficieColor("vestibular")}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* Superficie Lingual/Palatina (abajo) */}
              <polygon
                points="12,28 28,28 40,40 0,40"
                fill={getSuperficieColor(numero <= 16 ? "palatina" : "lingual")}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* Superficie Mesial (izquierda) */}
              <polygon
                points="0,0 12,12 12,28 0,40"
                fill={getSuperficieColor("mesial")}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* Superficie Distal (derecha) */}
              <polygon
                points="40,0 28,12 28,28 40,40"
                fill={getSuperficieColor("distal")}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* X para diente ausente */}
              {isAusente && (
                <>
                  <line x1="5" y1="5" x2="35" y2="35" stroke="#dc2626" strokeWidth="3" />
                  <line x1="35" y1="5" x2="5" y2="35" stroke="#dc2626" strokeWidth="3" />
                </>
              )}
            </svg>
            <span className="text-xs font-medium mt-1">{numero}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Diente {numero}</p>
            {data?.condicion && (
              <p>Estado: {CONDICIONES[data.condicion as keyof typeof CONDICIONES]?.label || data.condicion}</p>
            )}
            {data?.notas && <p className="text-muted-foreground">{data.notas}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const Odontograma = ({ data, onUpdate, readOnly = false, tratamientos = [] }: OdontogramaProps) => {
  const [selectedDiente, setSelectedDiente] = useState<number | null>(null);
  const [editData, setEditData] = useState<DienteData>({});
  const [selectedSuperficie, setSelectedSuperficie] = useState<string>("");
  const [selectedCondicion, setSelectedCondicion] = useState<string>("");

  // Dientes permanentes (FDI notation)
  const arcadaSuperior = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const arcadaInferior = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const handleDienteClick = (numero: number) => {
    setSelectedDiente(numero);
    setEditData(data[numero.toString()] || {});
    setSelectedSuperficie("");
    setSelectedCondicion("");
  };

  const handleSave = () => {
    if (selectedDiente && onUpdate) {
      const newData = {
        ...data,
        [selectedDiente.toString()]: editData,
      };
      onUpdate(newData);
    }
    setSelectedDiente(null);
  };

  const handleSuperficieCondicion = () => {
    if (selectedSuperficie && selectedCondicion) {
      setEditData((prev) => ({
        ...prev,
        superficies: {
          ...prev.superficies,
          [selectedSuperficie]: selectedCondicion,
        },
      }));
      setSelectedSuperficie("");
      setSelectedCondicion("");
    }
  };

  const handleCondicionGeneral = (condicion: string) => {
    setEditData((prev) => ({
      ...prev,
      condicion,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Odontograma</span>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CONDICIONES).map(([key, { color, label }]) => (
              <Badge
                key={key}
                variant="outline"
                className="text-xs"
                style={{ borderColor: color, color }}
              >
                {label}
              </Badge>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Arcada Superior */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">Arcada Superior</p>
            <div className="flex justify-center gap-1 flex-wrap">
              {arcadaSuperior.map((num) => (
                <Diente
                  key={num}
                  numero={num}
                  data={data[num.toString()]}
                  onClick={() => handleDienteClick(num)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>

          {/* Línea divisoria */}
          <div className="border-t-2 border-dashed border-muted-foreground/30" />

          {/* Arcada Inferior */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">Arcada Inferior</p>
            <div className="flex justify-center gap-1 flex-wrap">
              {arcadaInferior.map((num) => (
                <Diente
                  key={num}
                  numero={num}
                  data={data[num.toString()]}
                  onClick={() => handleDienteClick(num)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Lista de tratamientos recientes */}
        {tratamientos.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Historial de Tratamientos</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tratamientos.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: t.color || "#6b7280" }}
                    />
                    <span>Diente {t.diente_numero}</span>
                    <span className="text-muted-foreground">- {t.tratamiento}</span>
                  </div>
                  <Badge variant={t.estado === "completado" ? "default" : "secondary"}>
                    {t.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialog para editar diente */}
        <Dialog open={selectedDiente !== null} onOpenChange={() => setSelectedDiente(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Diente {selectedDiente}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Estado general del diente */}
              <div className="space-y-2">
                <Label>Estado General</Label>
                <Select
                  value={editData.condicion || ""}
                  onValueChange={handleCondicionGeneral}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sano">Sano</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="implante">Implante</SelectItem>
                    <SelectItem value="corona">Corona Completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marcar superficies */}
              <div className="space-y-2">
                <Label>Marcar Superficie</Label>
                <div className="flex gap-2">
                  <Select value={selectedSuperficie} onValueChange={setSelectedSuperficie}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Superficie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oclusal">Oclusal (O)</SelectItem>
                      <SelectItem value="mesial">Mesial (M)</SelectItem>
                      <SelectItem value="distal">Distal (D)</SelectItem>
                      <SelectItem value="vestibular">Vestibular (V)</SelectItem>
                      <SelectItem value={selectedDiente && selectedDiente <= 28 ? "palatina" : "lingual"}>
                        {selectedDiente && selectedDiente <= 28 ? "Palatina (P)" : "Lingual (L)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCondicion} onValueChange={setSelectedCondicion}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Condición" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONDICIONES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSuperficieCondicion} disabled={!selectedSuperficie || !selectedCondicion}>
                    +
                  </Button>
                </div>
              </div>

              {/* Superficies marcadas */}
              {editData.superficies && Object.keys(editData.superficies).length > 0 && (
                <div className="space-y-2">
                  <Label>Superficies Marcadas</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(editData.superficies).map(([sup, cond]) => (
                      <Badge
                        key={sup}
                        style={{
                          backgroundColor: CONDICIONES[cond as keyof typeof CONDICIONES]?.color,
                          color: "white",
                        }}
                      >
                        {sup.charAt(0).toUpperCase()}: {CONDICIONES[cond as keyof typeof CONDICIONES]?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={editData.notas || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, notas: e.target.value }))}
                  placeholder="Observaciones sobre este diente..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDiente(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
