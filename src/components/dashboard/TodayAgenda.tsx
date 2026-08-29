import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodayAppointments } from "@/hooks/useTodayAppointments";
import { Loader2, User, Phone, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TodayAgenda = () => {
  const { data: appointments, isLoading } = useTodayAppointments();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes del Día</CardTitle>
        <CardDescription>Pacientes con citas programadas para hoy</CardDescription>
        <Button variant="outline" className="mt-2" onClick={() => navigate("/dashboard/agenda")}>
          Ver Calendario Completo
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{appointment.nombre}</h4>
                      <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {appointment.telefono}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment.hora_cita || (appointment.fechaCita ? appointment.fechaCita.split('T')[1]?.substring(0, 5) : '--:--')}
                        </div>
                      </div>
                      <Badge className="mt-2" variant={appointment.estado === 'confirmada' ? 'default' : 'secondary'}>
                        {appointment.estado || 'pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay pacientes programados para hoy
          </p>
        )}
      </CardContent>
    </Card>
  );
};
