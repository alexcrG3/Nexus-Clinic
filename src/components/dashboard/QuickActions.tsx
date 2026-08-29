import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserPlus, FileText, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Agendar Cita",
    icon: Calendar,
    description: "Nueva cita",
    path: "/dashboard/citas",
  },
  {
    title: "Nuevo Paciente",
    icon: UserPlus,
    description: "Registrar paciente",
    path: "/dashboard/pacientes",
  },
  {
    title: "Crear Expediente",
    icon: FileText,
    description: "Nuevo expediente",
    path: "/dashboard/expedientes",
  },
  {
    title: "Generar Factura",
    icon: DollarSign,
    description: "Nueva factura",
    path: "/dashboard/facturacion",
  },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Herramientas frecuentes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="h-4 w-4" />
              <div className="text-left">
                <p className="font-medium">{action.title}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
