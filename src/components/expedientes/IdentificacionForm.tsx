import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Pencil, Save, X, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Cliente {
  id: string;
  nombre: string | null;
  apellidos: string | null;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  grupo_sanguineo: string | null;
}

interface IdentificacionFormProps {
  cliente: Cliente | null;
  onSave: (data: Partial<Cliente>) => Promise<void>;
  readOnly?: boolean;
}

const GRUPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEXOS = ["Masculino", "Femenino", "Otro"];

export const IdentificacionForm = ({ cliente, onSave, readOnly = false }: IdentificacionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: cliente?.nombre || "",
    apellidos: cliente?.apellidos || "",
    cedula: cliente?.cedula || "",
    telefono: cliente?.telefono || "",
    email: cliente?.email || "",
    direccion: cliente?.direccion || "",
    fecha_nacimiento: cliente?.fecha_nacimiento ? parseISO(cliente.fecha_nacimiento) : undefined as Date | undefined,
    sexo: cliente?.sexo || "",
    grupo_sanguineo: cliente?.grupo_sanguineo || "",
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        apellidos: cliente.apellidos || "",
        cedula: cliente.cedula || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        direccion: cliente.direccion || "",
        fecha_nacimiento: cliente.fecha_nacimiento ? parseISO(cliente.fecha_nacimiento) : undefined,
        sexo: cliente.sexo || "",
        grupo_sanguineo: cliente.grupo_sanguineo || "",
      });
    }
  }, [cliente]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: cliente?.id,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        cedula: formData.cedula,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        fecha_nacimiento: formData.fecha_nacimiento?.toISOString().split("T")[0],
        sexo: formData.sexo,
        grupo_sanguineo: formData.grupo_sanguineo,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        apellidos: cliente.apellidos || "",
        cedula: cliente.cedula || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        direccion: cliente.direccion || "",
        fecha_nacimiento: cliente.fecha_nacimiento ? parseISO(cliente.fecha_nacimiento) : undefined,
        sexo: cliente.sexo || "",
        grupo_sanguineo: cliente.grupo_sanguineo || "",
      });
    }
  };

  const calcularEdad = (fechaNacimiento?: Date) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const edad = Math.floor((hoy.getTime() - fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return edad;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos de Identificación del Paciente
            </CardTitle>
            <CardDescription>
              Información personal y de contacto
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Apellidos"
                />
              </div>
              <div className="space-y-2">
                <Label>Cédula</Label>
                <Input
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  placeholder="Número de cédula"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Teléfono"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={formData.fecha_nacimiento ? format(formData.fecha_nacimiento, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      setFormData({ ...formData, fecha_nacimiento: parseISO(dateValue) });
                    } else {
                      setFormData({ ...formData, fecha_nacimiento: undefined });
                    }
                  }}
                  max={format(new Date(), "yyyy-MM-dd")}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select
                  value={formData.sexo}
                  onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEXOS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grupo Sanguíneo</Label>
                <Select
                  value={formData.grupo_sanguineo}
                  onValueChange={(value) => setFormData({ ...formData, grupo_sanguineo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_SANGUINEOS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
              <p className="text-base">{cliente?.nombre || "—"} {cliente?.apellidos || ""}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cédula</p>
              <p className="text-base">{cliente?.cedula || "No especificada"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
              <p className="text-base">{cliente?.telefono || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{cliente?.email || "No especificado"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Dirección</p>
              <p className="text-base">{cliente?.direccion || "No especificada"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</p>
              <p className="text-base">
                {cliente?.fecha_nacimiento
                  ? format(parseISO(cliente.fecha_nacimiento), "d 'de' MMMM, yyyy", { locale: es })
                  : "No especificada"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Edad</p>
              <p className="text-base">
                {cliente?.fecha_nacimiento
                  ? `${calcularEdad(parseISO(cliente.fecha_nacimiento))} años`
                  : "No especificada"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Género</p>
              <p className="text-base">{cliente?.sexo || "No especificado"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grupo Sanguíneo</p>
              <p className="text-base">{cliente?.grupo_sanguineo || "No especificado"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
