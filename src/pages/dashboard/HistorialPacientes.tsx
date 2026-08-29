import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const HistorialPacientes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener pacientes asignados (por citas del doctor y/o expedientes asignados)
  const { data: pacientes, isLoading } = useQuery({
    queryKey: ["pacientes-historial", searchTerm],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return [];

      const [{ data: doctor }, { data: profile }] = await Promise.all([
        supabase.from("doctores").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const patientIds = new Set<string>();

      if (doctor?.id) {
        const { data: citasIds } = await supabase
          .from("citas")
          .select("cliente_id")
          .eq("doctor_id", doctor.id)
          .not("cliente_id", "is", null);

        citasIds?.forEach((r: any) => r.cliente_id && patientIds.add(r.cliente_id));
      }

      if (profile?.id) {
        const { data: expedientesIds } = await supabase
          .from("expedientes")
          .select("cliente_id")
          .eq("profesional_id", profile.id)
          .not("cliente_id", "is", null);

        expedientesIds?.forEach((r: any) => r.cliente_id && patientIds.add(r.cliente_id));
      }

      const ids = Array.from(patientIds);
      if (ids.length === 0) return [];

      let query = supabase
        .from("clientes")
        .select(
          `
          *,
          expedientes(
            id,
            fecha,
            consultas(count)
          )
        `
        )
        .in("id", ids)
        .order("created_at", { ascending: false });

      if (searchTerm.length >= 2) {
        query = query.or(
          `nombre.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,cedula.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historial de Pacientes</h1>
        <p className="text-muted-foreground">Acceso rápido a expedientes y consultas</p>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar paciente por nombre, cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de pacientes */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Cargando pacientes...
          </CardContent>
        </Card>
      ) : pacientes && pacientes.length > 0 ? (
        <div className="grid gap-4">
          {pacientes.map((paciente) => {
            const expediente = Array.isArray(paciente.expedientes) && paciente.expedientes.length > 0 
              ? paciente.expedientes[0] 
              : null;
            const numConsultas = expediente?.consultas?.[0]?.count || 0;

            return (
              <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">
                          {paciente.nombre} {paciente.apellidos}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <span>Cédula: {paciente.cedula}</span>
                          </div>
                          {paciente.telefono && (
                            <div className="flex items-center gap-1">
                              <span>Tel: {paciente.telefono}</span>
                            </div>
                          )}
                          {expediente && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>{numConsultas} consulta(s)</span>
                            </div>
                          )}
                          {expediente && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Última visita: {format(new Date(expediente.fecha), "dd/MM/yyyy", { locale: es })}
                              </span>
                            </div>
                          )}
                        </div>
                        {!expediente && (
                          <Badge variant="outline" className="mt-2">
                            Sin expediente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (expediente) {
                            navigate(`/dashboard/expedientes/${expediente.id}`);
                          } else {
                            navigate(`/dashboard/expedientes`);
                          }
                        }}
                        className="flex-1 md:flex-initial"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Expediente
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchTerm.length >= 2 
              ? "No se encontraron pacientes" 
              : "No hay pacientes registrados"}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
