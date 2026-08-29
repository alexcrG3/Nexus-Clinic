import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";
import { LogOut, Menu, Stethoscope, User, Settings, MessageSquare, ChevronDown } from "lucide-react";
import { useClinicConfig } from "@/hooks/useClinicConfig";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DashboardLayout = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const { data: clinicConfig } = useClinicConfig();
  const { data: profile } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const clinicName = clinicConfig?.nombre_clinica || "MediCR";

  // Determinar si el usuario es médico
  const isMedico = 
    userRole === "medico" || 
    userRole === "odontologo" || 
    userRole === "fisioterapeuta" || 
    userRole === "quiropractico";

  // Get initials from profile or email
  const getInitials = () => {
    if (profile?.nombre && profile?.apellidos) {
      return `${profile.nombre[0]}${profile.apellidos[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.nombre) {
      const prefix = isMedico ? 'Dr. ' : '';
      return `${prefix}${profile.nombre}`;
    }
    return user?.email?.split('@')[0] || 'Usuario';
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b bg-card sticky top-0 z-10 shrink-0">
            <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <SidebarTrigger className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground shadow-sm shrink-0">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-border rounded-xl flex items-center justify-center overflow-hidden shadow-sm p-1 shrink-0">
                    {clinicConfig?.logo_url ? (
                      <img 
                        src={clinicConfig.logo_url} 
                        alt={clinicName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    )}
                  </div>
                  <div className="truncate">
                    <h1 className="text-base sm:text-lg font-black text-foreground truncate">{clinicName}</h1>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">Sistema Médico</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Botón Volver al Centro de Mando para SuperAdmin */}
                {(userRole === 'admin_sistema' || user?.email?.toLowerCase() === 'admin@medicr.com') && (
                  <button
                    onClick={() => navigate('/superadmin')}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    ← Centro de Mando
                  </button>
                )}

                {/* Notification Bell */}
                <NotificationBell />
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <span className="hidden md:block text-sm font-medium text-foreground">
                        {getDisplayName()}
                      </span>
                      <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border shadow-lg z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-semibold">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer"
                      onClick={() => navigate('/dashboard/perfil')}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer"
                      onClick={() => navigate('/dashboard/mensajes')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Mensajes
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer"
                      onClick={() => navigate('/dashboard/configuracion')}
                    >
                      <Settings className="h-4 w-4" />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
