import { useEffect } from "react";
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

const patientSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidos: z.string().min(1, "Los apellidos son requeridos"),
  cedula: z.string().min(1, "La cédula es requerida"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PatientFormData) => void;
  initialData?: PatientFormData & { id?: string };
  isLoading?: boolean;
}

export const PatientForm = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: PatientFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nombre: "",
      apellidos: "",
      cedula: "",
      telefono: "",
      email: "",
      direccion: "",
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        nombre: initialData.nombre || "",
        apellidos: initialData.apellidos || "",
        cedula: initialData.cedula || "",
        telefono: initialData.telefono || "",
        email: initialData.email || "",
        direccion: initialData.direccion || "",
      });
    } else {
      reset({
        nombre: "",
        apellidos: "",
        cedula: "",
        telefono: "",
        email: "",
        direccion: "",
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: PatientFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Paciente" : "Nuevo Paciente"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Actualiza la información del paciente"
              : "Ingresa los datos del nuevo paciente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" {...register("nombre")} />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" {...register("apellidos")} />
              {errors.apellidos && (
                <p className="text-sm text-destructive">{errors.apellidos.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula</Label>
              <Input id="cedula" {...register("cedula")} />
              {errors.cedula && (
                <p className="text-sm text-destructive">{errors.cedula.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register("telefono")} />
              {errors.telefono && (
                <p className="text-sm text-destructive">{errors.telefono.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea id="direccion" {...register("direccion")} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
