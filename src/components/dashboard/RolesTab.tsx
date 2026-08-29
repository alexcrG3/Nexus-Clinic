import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Building2, UserCheck, UserX, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
interface UserRole {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    nombre: string;
    apellidos: string;
    email: string;
    organizacion_id: string | null;
  };
}

interface Organization {
  id: string;
  nombre: string;
}

export const RolesTab = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("recepcionista");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const { toast } = useToast();

  const roles = [
    { value: "recepcionista", label: "Recepcionista" },
    { value: "medico", label: "Médico" },
    { value: "odontologo", label: "Odontólogo" },
    { value: "fisioterapeuta", label: "Fisioterapeuta" },
    { value: "quiropractico", label: "Quiropráctico" },
    { value: "admin_clinica", label: "Director / Admin de Clínica" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchUserRoles(), fetchUsers(), fetchOrganizations()]);
    } catch (err) {
      console.error("Error cargando roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (error) throw error;

      const userIds = data?.map(ur => ur.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, nombre, apellidos, email, organizacion_id")
        .in("user_id", userIds);

      const rolesWithProfiles = data?.map(ur => ({
        ...ur,
        profiles: profilesData?.find(p => p.user_id === ur.user_id) || { nombre: '', apellidos: '', email: '', organizacion_id: null }
      })) || [];

      // Excluir rol 'paciente' del listado de staff clínico
      const staffRoles = rolesWithProfiles.filter(r => r.role !== 'paciente');
      setUserRoles(staffRoles as any);
    } catch (err) {
      console.error("Error fetching user roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, nombre, apellidos, email, organizacion_id");

      // Fetch users with roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = new Set(rolesData?.map(r => r.user_id) || []);

      // Pending users son ÚNICAMENTE personal staff que no tiene rol y no es paciente
      const pending = allProfiles?.filter(p => {
        if (usersWithRoles.has(p.user_id)) return false;
        if (p.email?.toLowerCase() === 'alxndrgm@gmail.com') return false;
        return true;
      }) || [];

      setPendingUsers(pending);
      setUsers(allProfiles || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data } = await supabase
        .from("organizaciones")
        .select("id, nombre")
        .order("nombre");
      
      setOrganizations(data || []);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Selecciona un usuario",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOrg) {
      toast({
        title: "Error",
        description: "Selecciona una organización",
        variant: "destructive",
      });
      return;
    }

    // Update profile with organization and activate the account
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ organizacion_id: selectedOrg, activo: true })
      .eq("user_id", selectedUser);

    if (profileError) {
      toast({
        title: "Error",
        description: "No se pudo asignar la organización",
        variant: "destructive",
      });
      return;
    }

    // Insert role
    const { error } = await supabase
      .from("user_roles")
      .insert([{
        user_id: selectedUser,
        role: selectedRole as any,
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo asignar el rol",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Usuario activado correctamente",
      });
      fetchData();
      setSelectedUser("");
      setSelectedOrg("");
    }
  };

  const handleDeleteRole = async (id: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el rol",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Rol eliminado correctamente",
      });
      fetchData();
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUser(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuario eliminado",
        description: `${userName} ha sido eliminado completamente del sistema`,
      });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_sistema":
        return "destructive";
      case "admin_clinica":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-card rounded-2xl border border-border/50">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-sm font-medium text-muted-foreground">Cargando roles y usuarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usuarios pendientes de aprobación */}
      {pendingUsers.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              Usuarios Pendientes de Aprobación ({pendingUsers.length})
            </CardTitle>
            <CardDescription>Estos usuarios se han registrado y esperan que les asignes rol y organización</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.nombre} {user.apellidos}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pendiente
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const defaultOrg = organizations[0]?.id || null;
                          if (defaultOrg) {
                            await supabase.from("profiles").update({ organizacion_id: defaultOrg, activo: true }).eq("user_id", user.user_id);
                          }
                          const { error } = await supabase.from("user_roles").insert([{ user_id: user.user_id, role: 'paciente' as any }]);
                          if (error) {
                            toast({ title: "Error", description: error.message, variant: "destructive" });
                          } else {
                            toast({ title: "Activado", description: `${user.nombre} activado como Paciente` });
                            fetchData();
                          }
                        }}
                        className="text-[11px] h-7 font-bold border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40"
                      >
                        ⚡ Activar como Paciente
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user.user_id);
                          toast({ title: "Seleccionado", description: "Completa el rol y organización abajo" });
                        }}
                        className="text-[11px] h-7 font-semibold"
                      >
                        Asignar Rol Staff
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            disabled={deletingUser === user.user_id}
                          >
                            {deletingUser === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente a <strong>{user.nombre} {user.apellidos}</strong> ({user.email}) del sistema. No se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteUser(user.user_id, `${user.nombre} ${user.apellidos}`)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Activar Usuario
          </CardTitle>
          <CardDescription>Asigna rol y organización a un usuario para activar su cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona usuario" />
              </SelectTrigger>
              <SelectContent>
                {pendingUsers.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Pendientes</div>
                    {pendingUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.nombre} {user.apellidos}
                      </SelectItem>
                    ))}
                  </>
                )}
                {users.filter(u => !pendingUsers.find(p => p.user_id === u.user_id)).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Todos los usuarios</div>
                    {users.filter(u => !pendingUsers.find(p => p.user_id === u.user_id)).map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.nombre} {user.apellidos}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona organización" />
              </SelectTrigger>
              <SelectContent>
                {organizations.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay organizaciones</div>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddRole} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Activar Usuario
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Activos</CardTitle>
          <CardDescription>Gestiona los roles de usuarios activos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell>
                    {userRole.profiles?.nombre} {userRole.profiles?.apellidos}
                  </TableCell>
                  <TableCell>{userRole.profiles?.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(userRole.role)}>
                      {roles.find((r) => r.value === userRole.role)?.label || userRole.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(userRole.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
