import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PatientCardProps {
  id: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  expedienteId?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmada":
      return <Badge className="bg-green-500 hover:bg-green-600">Confirmada</Badge>;
    case "pendiente":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
    case "en-progreso":
      return <Badge className="bg-purple-500 hover:bg-purple-600">En Progreso</Badge>;
    case "completada":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Completada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PatientCard = ({
  id,
  nombre,
  apellidos,
  cedula,
  telefono,
  email,
  direccion,
  appointmentTime,
  appointmentType,
  status,
  expedienteId,
}: PatientCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {nombre} {apellidos}
              </h3>
              <p className="text-sm text-muted-foreground">#{id.slice(0, 8)} • DNI: {cedula}</p>
            </div>
          </div>
          {getStatusBadge(status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{telefono}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-full">
            <MapPin className="w-4 h-4" />
            <span>{direccion}</span>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{appointmentTime}</span>
          </div>
          <p className="text-sm text-muted-foreground">{appointmentType}</p>
        </div>

        <div className="flex gap-2">
          {expedienteId && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/dashboard/expedientes/${expedienteId}`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Expediente
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1">
            Editar Cliente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};