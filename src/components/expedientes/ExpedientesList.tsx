import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, User, Calendar, Eye, Stethoscope, UserPlus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { AsignarDoctorDialog } from "./AsignarDoctorDialog";

interface ExpedientesListProps {
  expedientes: any[];
}

export const ExpedientesList = ({ expedientes }: ExpedientesListProps) => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState<{id: string; nombre: string} | null>(null);

  const isAdmin = userRole === "admin_sistema" || userRole === "admin_clinica";

  const handleAsignarDoctor = (expedienteId: string, pacienteNombre: string) => {
    setSelectedExpediente({ id: expedienteId, nombre: pacienteNombre });
    setAsignarDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4">
        {expedientes.map((expediente) => (
          <Card key={expediente.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {expediente.cliente?.nombre || "—"} {expediente.cliente?.apellidos || ""}
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Cédula: {expediente.cliente?.cedula}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {expediente.fecha ? format(new Date(expediente.fecha), "PPP", { locale: es }) : "Sin fecha"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-primary via-indigo-600 to-sky-600 hover:from-primary/90 hover:to-sky-600/90 text-white font-bold gap-1.5 text-xs shadow-sm"
                    onClick={() => navigate(`/dashboard/expedientes/${expediente.id}`)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Consulta IA</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/dashboard/expedientes/${expediente.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Ver Detalle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {expediente.detalle || "Sin detalles registrados"}
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {expediente.profesional ? (
                  <>
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3 text-primary" />
                      {expediente.profesional.nombre} {expediente.profesional.apellidos}
                      {expediente.profesional.role && (
                        <span className="text-muted-foreground">({expediente.profesional.role})</span>
                      )}
                    </Badge>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAsignarDoctor(
                          expediente.id, 
                          `${expediente.cliente?.nombre} ${expediente.cliente?.apellidos}`
                        )}
                        className="h-7 text-xs gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        Cambiar Doctor
                      </Button>
                    )}
                  </>
                ) : !expediente.profesional_id ? (
                  <>
                    <Badge variant="destructive" className="text-xs">
                      Sin doctor asignado
                    </Badge>
                    {isAdmin && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAsignarDoctor(
                          expediente.id, 
                          `${expediente.cliente?.nombre} ${expediente.cliente?.apellidos}`
                        )}
                        className="h-7 text-xs gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        Asignar Doctor
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedExpediente && (
        <AsignarDoctorDialog 
          open={asignarDialogOpen}
          onOpenChange={setAsignarDialogOpen}
          expedienteId={selectedExpediente.id}
          pacienteNombre={selectedExpediente.nombre}
        />
      )}
    </>
  );
};
