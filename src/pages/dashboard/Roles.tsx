import { RolesTab } from "@/components/dashboard/RolesTab";
import { VincularDoctoresTab } from "@/components/dashboard/VincularDoctoresTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const Roles = () => {
  const { userRole } = useAuth();
  const isAdminSistema = userRole === "admin_sistema";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Roles y Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los roles de los usuarios del sistema</p>
      </div>

      {isAdminSistema ? (
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="roles">Gestión de Roles</TabsTrigger>
            <TabsTrigger value="vincular">Vincular Doctores</TabsTrigger>
          </TabsList>
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="vincular">
            <VincularDoctoresTab />
          </TabsContent>
        </Tabs>
      ) : (
        <RolesTab />
      )}
    </div>
  );
};

export default Roles;
