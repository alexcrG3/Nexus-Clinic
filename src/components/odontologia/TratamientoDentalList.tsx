import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Calendar, CheckCircle, Clock, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Tratamiento {
  id: string;
  diente_numero: number;
  superficie?: string;
  tratamiento: string;
  estado: string;
  color?: string;
  notas?: string;
  fecha_tratamiento: string;
}

interface TratamientoDentalListProps {
  tratamientos: Tratamiento[];
  onAddTratamiento?: (tratamiento: Omit<Tratamiento, "id">) => void;
  onUpdateEstado?: (id: string, estado: string) => void;
  onUpdateTratamiento?: (id: string, data: Partial<Tratamiento>) => void;
  onDeleteTratamiento?: (id: string) => void;
  readOnly?: boolean;
}

const TRATAMIENTOS_COMUNES = [
  "Limpieza dental",
  "Obturación con resina",
  "Obturación con amalgama",
  "Extracción simple",
  "Extracción quirúrgica",
  "Endodoncia",
  "Corona de porcelana",
  "Corona de zirconio",
  "Carilla dental",
  "Blanqueamiento",
  "Sellante de fosetas",
  "Curetaje",
  "Detartraje",
  "Aplicación de flúor",
  "Radiografía periapical",
  "Radiografía panorámica",
  "Implante dental",
  "Puente dental",
  "Prótesis parcial",
  "Prótesis total",
];

const COLORES_TRATAMIENTO = {
  limpieza: "#22c55e",
  obturacion: "#3b82f6",
  extraccion: "#ef4444",
  endodoncia: "#8b5cf6",
  corona: "#eab308",
  implante: "#06b6d4",
  blanqueamiento: "#f0f9ff",
  sellante: "#10b981",
  otro: "#6b7280",
};

export const TratamientoDentalList = ({
  tratamientos,
  onAddTratamiento,
  onUpdateEstado,
  onUpdateTratamiento,
  onDeleteTratamiento,
  readOnly = false,
}: TratamientoDentalListProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState<Tratamiento | null>(null);
  const [newTratamiento, setNewTratamiento] = useState({
    diente_numero: 0,
    superficie: "",
    tratamiento: "",
    notas: "",
    color: "#3b82f6",
  });

  const handleAdd = () => {
    if (onAddTratamiento && newTratamiento.diente_numero && newTratamiento.tratamiento) {
      onAddTratamiento({
        ...newTratamiento,
        estado: "pendiente",
        fecha_tratamiento: new Date().toISOString().split("T")[0],
      });
      setShowAddDialog(false);
      setNewTratamiento({
        diente_numero: 0,
        superficie: "",
        tratamiento: "",
        notas: "",
        color: "#3b82f6",
      });
    }
  };

  const handleEditSave = () => {
    if (editingTratamiento && onUpdateTratamiento) {
      onUpdateTratamiento(editingTratamiento.id, {
        tratamiento: editingTratamiento.tratamiento,
        superficie: editingTratamiento.superficie,
        notas: editingTratamiento.notas,
        color: editingTratamiento.color,
      });
      setEditingTratamiento(null);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "completado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "en_progreso":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completado":
        return <Badge className="bg-green-500">Completado</Badge>;
      case "en_progreso":
        return <Badge className="bg-yellow-500">En Progreso</Badge>;
      default:
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pendiente</Badge>;
    }
  };

  // Agrupar por estado
  const pendientes = tratamientos.filter((t) => t.estado === "pendiente");
  const enProgreso = tratamientos.filter((t) => t.estado === "en_progreso");
  const completados = tratamientos.filter((t) => t.estado === "completado");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plan de Tratamiento Dental</CardTitle>
            <CardDescription>
              {tratamientos.length} tratamiento(s) registrado(s)
            </CardDescription>
          </div>
          {!readOnly && onAddTratamiento && (
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pendientes */}
        {pendientes.length > 0 && (
          <div>
            <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pendientes ({pendientes.length})
            </h4>
            <div className="space-y-2">
              {pendientes.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.color || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">
                        Diente {t.diente_numero}
                        {t.superficie && <span className="text-muted-foreground"> ({t.superficie})</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.tratamiento}</p>
                      {t.notas && (
                        <p className="text-xs text-muted-foreground mt-1">{t.notas}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && onUpdateTratamiento && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingTratamiento(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && onDeleteTratamiento && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteTratamiento(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && onUpdateEstado && (
                      <Select
                        value={t.estado}
                        onValueChange={(value) => onUpdateEstado(t.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* En Progreso */}
        {enProgreso.length > 0 && (
          <div>
            <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En Progreso ({enProgreso.length})
            </h4>
            <div className="space-y-2">
              {enProgreso.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.color || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">
                        Diente {t.diente_numero}
                        {t.superficie && <span className="text-muted-foreground"> ({t.superficie})</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.tratamiento}</p>
                      {t.notas && (
                        <p className="text-xs text-muted-foreground mt-1">{t.notas}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && onUpdateTratamiento && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingTratamiento(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && onDeleteTratamiento && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteTratamiento(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && onUpdateEstado && (
                      <Select
                        value={t.estado}
                        onValueChange={(value) => onUpdateEstado(t.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completados */}
        {completados.length > 0 && (
          <div>
            <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completados ({completados.length})
            </h4>
            <div className="space-y-2">
              {completados.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: t.color || "#6b7280" }}
                    />
                    <div>
                      <p className="font-medium">
                        Diente {t.diente_numero}
                        {t.superficie && <span className="text-muted-foreground"> ({t.superficie})</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{t.tratamiento}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(t.fecha_tratamiento), "d MMM yyyy", { locale: es })}
                      </p>
                      {t.notas && (
                        <p className="text-xs text-muted-foreground mt-1">{t.notas}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && onUpdateTratamiento && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingTratamiento(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {getEstadoBadge(t.estado)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tratamientos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No hay tratamientos registrados
          </p>
        )}

        {/* Dialog para agregar tratamiento */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Tratamiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Diente *</Label>
                  <Input
                    type="number"
                    min={11}
                    max={48}
                    value={newTratamiento.diente_numero || ""}
                    onChange={(e) =>
                      setNewTratamiento((prev) => ({
                        ...prev,
                        diente_numero: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Ej: 16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Superficie (opcional)</Label>
                  <Select
                    value={newTratamiento.superficie}
                    onValueChange={(value) =>
                      setNewTratamiento((prev) => ({ ...prev, superficie: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oclusal">Oclusal</SelectItem>
                      <SelectItem value="mesial">Mesial</SelectItem>
                      <SelectItem value="distal">Distal</SelectItem>
                      <SelectItem value="vestibular">Vestibular</SelectItem>
                      <SelectItem value="lingual">Lingual/Palatina</SelectItem>
                      <SelectItem value="completa">Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tratamiento *</Label>
                <Select
                  value={newTratamiento.tratamiento}
                  onValueChange={(value) =>
                    setNewTratamiento((prev) => ({ ...prev, tratamiento: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRATAMIENTOS_COMUNES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color de Marcador</Label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(COLORES_TRATAMIENTO).map(([key, color]) => (
                    <button
                      key={key}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTratamiento.color === color ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTratamiento((prev) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={newTratamiento.notas}
                  onChange={(e) =>
                    setNewTratamiento((prev) => ({ ...prev, notas: e.target.value }))
                  }
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!newTratamiento.diente_numero || !newTratamiento.tratamiento}
              >
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar tratamiento */}
        <Dialog open={!!editingTratamiento} onOpenChange={() => setEditingTratamiento(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tratamiento</DialogTitle>
            </DialogHeader>
            {editingTratamiento && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Diente</Label>
                    <Input
                      type="number"
                      value={editingTratamiento.diente_numero}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Superficie</Label>
                    <Select
                      value={editingTratamiento.superficie || ""}
                      onValueChange={(value) =>
                        setEditingTratamiento((prev) => prev ? { ...prev, superficie: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oclusal">Oclusal</SelectItem>
                        <SelectItem value="mesial">Mesial</SelectItem>
                        <SelectItem value="distal">Distal</SelectItem>
                        <SelectItem value="vestibular">Vestibular</SelectItem>
                        <SelectItem value="lingual">Lingual/Palatina</SelectItem>
                        <SelectItem value="completa">Completa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tratamiento</Label>
                  <Select
                    value={editingTratamiento.tratamiento}
                    onValueChange={(value) =>
                      setEditingTratamiento((prev) => prev ? { ...prev, tratamiento: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tratamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRATAMIENTOS_COMUNES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color de Marcador</Label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(COLORES_TRATAMIENTO).map(([key, color]) => (
                      <button
                        key={key}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          editingTratamiento.color === color ? "border-foreground" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingTratamiento((prev) => prev ? { ...prev, color } : null)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={editingTratamiento.notas || ""}
                    onChange={(e) =>
                      setEditingTratamiento((prev) => prev ? { ...prev, notas: e.target.value } : null)
                    }
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTratamiento(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
