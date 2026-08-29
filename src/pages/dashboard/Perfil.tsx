import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User, Mail, Phone, BadgeCheck } from "lucide-react";
import { useUserProfile, useUpdateUserProfile, uploadAvatar } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Perfil = () => {
  const { user, userRole } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    telefono: "",
    licencia_profesional: "",
  });
  const [uploading, setUploading] = useState(false);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || "",
        apellidos: profile.apellidos || "",
        telefono: profile.telefono || "",
        licencia_profesional: profile.licencia_profesional || "",
      });
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setUploading(true);
      const avatarUrl = await uploadAvatar(user.id, file);
      await updateProfile.mutateAsync({ avatar_url: avatarUrl });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const getInitials = () => {
    if (profile?.nombre && profile?.apellidos) {
      return `${profile.nombre[0]}${profile.apellidos[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  const getRoleLabel = () => {
    const roles: Record<string, string> = {
      medico: "Médico General",
      odontologo: "Odontólogo",
      fisioterapeuta: "Fisioterapeuta",
      quiropractico: "Quiropráctico",
      recepcionista: "Recepcionista",
      admin_clinica: "Administrador de Clínica",
      admin_sistema: "Administrador del Sistema",
    };
    return roles[userRole || ""] || "Usuario";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Haz clic en la imagen para cambiarla</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar 
                className="h-32 w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : getInitials()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">
                {profile?.nombre} {profile?.apellidos}
              </p>
              <p className="text-sm text-muted-foreground">{getRoleLabel()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información Personal
            </CardTitle>
            <CardDescription>Actualiza tus datos personales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre || profile?.nombre || ""}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos || profile?.apellidos || ""}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Tus apellidos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                value={formData.telefono || profile?.telefono || ""}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+506 8888-8888"
              />
            </div>

            {(userRole === "medico" || userRole === "odontologo" || userRole === "fisioterapeuta" || userRole === "quiropractico") && (
              <div className="space-y-2">
                <Label htmlFor="licencia" className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Licencia Profesional
                </Label>
                <Input
                  id="licencia"
                  value={formData.licencia_profesional || profile?.licencia_profesional || ""}
                  onChange={(e) => setFormData({ ...formData, licencia_profesional: e.target.value })}
                  placeholder="Número de licencia"
                />
              </div>
            )}

            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending}
              className="w-full md:w-auto"
            >
              {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
