import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link2, Link2Off, Stethoscope, Loader2 } from "lucide-react";

interface Doctor {
  id: string;
  nombre: string;
  especialidad: string | null;
  email: string | null;
  user_id: string | null;
  activo: boolean;
}

interface UserProfile {
  user_id: string;
  id: string;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  activo?: boolean | null;
  role: string;
}

export const VincularDoctoresTab = () => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchDoctores(), fetchUsuarios()]);
    setLoading(false);
  };

  const fetchDoctores = async () => {
    const { data, error } = await supabase
      .from("doctores")
      .select("id, nombre, especialidad, email, user_id, activo")
      .order("nombre");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los doctores",
        variant: "destructive",
      });
      return;
    }
    setDoctores(data || []);
  };

  const fetchUsuarios = async () => {
    // Get user_roles with medical roles and join with profiles
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["medico", "odontologo", "fisioterapeuta", "quiropractico"]);

    if (rolesError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
      return;
    }

    if (!rolesData || rolesData.length === 0) {
      setUsuarios([]);
      return;
    }

    const userIds = rolesData.map(r => r.user_id);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, id, nombre, apellidos, email, activo")
      .in("user_id", userIds);

    if (profilesError) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles",
        variant: "destructive",
      });
      return;
    }

    // Combine profiles with roles
    const usuariosConRol = profilesData?.map(p => {
      const roleInfo = rolesData.find(r => r.user_id === p.user_id);
      return {
        ...p,
        role: roleInfo?.role || ""
      };
    }) || [];

    setUsuarios(usuariosConRol);
  };

  const handleVincular = async () => {
    if (!selectedDoctor || !selectedUsuario) {
      toast({
        title: "Error",
        description: "Selecciona un doctor y un usuario",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    // Check if user is already linked to another doctor
    const existingDoctor = doctores.find(d => d.user_id === selectedUsuario && d.id !== selectedDoctor);
    if (existingDoctor) {
      toast({
        title: "Error",
        description: `Este usuario ya está vinculado a ${existingDoctor.nombre}`,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("doctores")
      .update({ user_id: selectedUsuario })
      .eq("id", selectedDoctor);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo vincular el doctor",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Doctor vinculado correctamente",
      });
      fetchDoctores();
      setSelectedDoctor("");
      setSelectedUsuario("");
    }
  };

  const handleDesvincular = async (doctorId: string) => {
    const { error } = await supabase
      .from("doctores")
      .update({ user_id: null })
      .eq("id", doctorId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo desvincular el doctor",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Doctor desvinculado correctamente",
      });
      fetchDoctores();
    }
  };

  const getUsuarioVinculado = (userId: string | null) => {
    if (!userId) return null;
    return usuarios.find(u => u.user_id === userId);
  };

  const doctoresSinVincular = doctores.filter(d => !d.user_id);
  const usuariosDisponibles = usuarios.filter(u => !doctores.find(d => d.user_id === u.user_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card para vincular */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Vincular Doctor con Usuario
          </CardTitle>
          <CardDescription>
            Asocia un doctor de la tabla de doctores con su cuenta de usuario para que pueda ver sus expedientes y pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctoresSinVincular.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Todos los doctores están vinculados
                  </div>
                ) : (
                  doctoresSinVincular.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.nombre} {doc.especialidad ? `(${doc.especialidad})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona usuario" />
              </SelectTrigger>
              <SelectContent>
                {usuariosDisponibles.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {usuarios.length === 0
                      ? "No hay usuarios con rol médico disponibles"
                      : "Todos los usuarios con rol médico ya están vinculados"}
                  </div>
                ) : (
                  usuariosDisponibles.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.nombre} {user.apellidos} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleVincular} 
              disabled={saving || !selectedDoctor || !selectedUsuario || usuariosDisponibles.length === 0}
              className="w-full"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Link2 className="w-4 h-4 mr-2" />
              Vincular
            </Button>
          </div>

          {doctoresSinVincular.length > 0 && usuariosDisponibles.length === 0 && (
            <p className="text-sm text-amber-600 mt-4">
              ⚠️ {usuarios.length === 0
                ? "No hay usuarios con rol médico (médico/odontólogo/fisioterapeuta/quiropráctico). Asígnalo en la pestaña 'Gestión de Roles'."
                : "Todos los usuarios con rol médico ya están vinculados a algún doctor. Desvincula uno si necesitas reutilizarlo."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabla de doctores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Estado de Vinculación de Doctores
          </CardTitle>
          <CardDescription>
            Doctores registrados y su estado de vinculación con cuentas de usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Email Doctor</TableHead>
                <TableHead>Usuario Vinculado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctores.map((doctor) => {
                const usuarioVinculado = getUsuarioVinculado(doctor.user_id);
                return (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.nombre}</TableCell>
                    <TableCell>{doctor.especialidad || "-"}</TableCell>
                    <TableCell>{doctor.email || "-"}</TableCell>
                    <TableCell>
                      {usuarioVinculado ? (
                        <span>
                          {usuarioVinculado.nombre} {usuarioVinculado.apellidos}
                          <span className="text-muted-foreground text-sm ml-1">
                            ({usuarioVinculado.email})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin vincular</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {doctor.user_id ? (
                        <Badge variant="default" className="bg-green-600">
                          Vinculado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {doctor.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDesvincular(doctor.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Link2Off className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
