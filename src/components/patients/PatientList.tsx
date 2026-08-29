import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Trash2, FileText, Search, Stethoscope } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  ultimoDoctor?: {
    id: string;
    nombre: string;
    especialidad: string;
  } | null;
}

interface PatientListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

export const PatientList = ({ patients, onEdit, onDelete }: PatientListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cedula?.includes(searchTerm) ||
      patient.telefono?.includes(searchTerm)
  );

  const handleViewExpediente = (patientId: string) => {
    navigate(`/dashboard/historial-pacientes/${patientId}`);
  };

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Vista de tabla para pantallas grandes */}
      <div className="hidden md:block border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Doctor Asignado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.nombre} {patient.apellidos}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.cedula}</Badge>
                  </TableCell>
                  <TableCell>{patient.telefono}</TableCell>
                  <TableCell>
                    {patient.ultimoDoctor ? (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{patient.ultimoDoctor.nombre}</p>
                          <p className="text-xs text-muted-foreground">{patient.ultimoDoctor.especialidad}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewExpediente(patient.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Expediente
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(patient)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(patient.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className="md:hidden space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No se encontraron pacientes
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-base">
                    {patient.nombre} {patient.apellidos}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Cédula:</span>
                      <Badge variant="outline" className="text-xs">{patient.cedula}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span>{patient.telefono}</span>
                    </div>
                    {patient.ultimoDoctor && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-primary/5 rounded">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{patient.ultimoDoctor.nombre}</p>
                          <p className="text-xs text-muted-foreground">{patient.ultimoDoctor.especialidad}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewExpediente(patient.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Expediente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(patient)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteId(patient.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-3"
                onClick={() => handleViewExpediente(patient.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Expediente
              </Button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              paciente y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
