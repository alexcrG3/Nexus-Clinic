import { Calendar, Users, FileText, MessageSquare, ClipboardList, DollarSign, BarChart3, Settings, UserCog, Home, Stethoscope, History, UserCircle, Shield, Megaphone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicConfig } from "@/hooks/useClinicConfig";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

// Navegación para médicos y profesionales de la salud
const medicoNavigation = [
  { title: "Panel Médico", url: "/dashboard", icon: Home },
  { title: "Agenda del Día", url: "/dashboard/agenda", icon: Calendar },
  { title: "Llamador de Turnos", url: "/dashboard/turnos", icon: Megaphone },
  { title: "Historial Pacientes", url: "/dashboard/historial-pacientes", icon: History },
  { title: "Expedientes", url: "/dashboard/expedientes", icon: FileText },
];

// Navegación para recepcionistas y administradores
const recepcionNavigation = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agenda", url: "/dashboard/agenda", icon: Calendar },
  { title: "Llamador de Turnos", url: "/dashboard/turnos", icon: Megaphone },
  { title: "Pacientes", url: "/dashboard/pacientes", icon: Users },
  { title: "Expedientes", url: "/dashboard/expedientes", icon: FileText },
  { title: "Doctores", url: "/dashboard/doctores", icon: Stethoscope },
  { title: "Citas", url: "/dashboard/citas", icon: ClipboardList },
];

const administration = [
  { title: "Facturación", url: "/dashboard/facturacion", icon: DollarSign },
  { title: "Reportes", url: "/dashboard/reportes", icon: BarChart3 },
];

const system = [
  { title: "Configuración", url: "/dashboard/configuracion", icon: Settings },
  { title: "Roles", url: "/dashboard/roles", icon: UserCog },
  { title: "Auditoría", url: "/dashboard/auditoria", icon: Shield },
];

import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { userRole, user } = useAuth();
  const { data: clinicConfig } = useClinicConfig();

  const isActive = (path: string) => currentPath === path;
  
  const collapsed = state === "collapsed";

  // Handle navigation click - close sidebar on mobile
  const handleNavClick = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Determinar si el usuario es médico
  const isMedico = 
    userRole === "medico" || 
    userRole === "odontologo" || 
    userRole === "fisioterapeuta" || 
    userRole === "quiropractico";

  // Determinar si es admin de sistema
  const isAdminSistema = userRole === "admin_sistema" || user?.email?.toLowerCase() === "admin@medicr.com";

  // Seleccionar navegación según el rol
  const mainNavigation = isMedico ? medicoNavigation : recepcionNavigation;

  // Determinar si es admin de clínica
  const isAdminClinica = userRole === "admin_clinica";

  // Filtrar items del sistema según rol
  const filteredSystem = system.filter(item => {
    if (item.url === "/dashboard/configuracion") {
      return isAdminSistema || isAdminClinica;
    }
    if (item.url === "/dashboard/roles") {
      return isAdminSistema || isAdminClinica;
    }
    if (item.url === "/dashboard/auditoria") {
      return isAdminSistema;
    }
    return true;
  });

  // Get clinic name
  const clinicName = clinicConfig?.nombre_clinica || "MediCR";

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-60"}>
      <SidebarHeader className="border-b border-sidebar-border">
        {!collapsed ? (
          <div className="p-4">
            {/* Clinic Logo and Name */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg p-2">
                {clinicConfig?.logo_url ? (
                  <img 
                    src={clinicConfig.logo_url} 
                    alt={clinicName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Stethoscope className="w-16 h-16 text-primary" />
                )}
              </div>
              <div className="text-center">
                <h2 className="font-bold text-lg text-sidebar-foreground">{clinicName}</h2>
                <p className="text-xs text-sidebar-foreground/70">Sistema Médico</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 flex items-center justify-center">
            {/* Collapsed Clinic Icon */}
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-md p-1.5">
              {clinicConfig?.logo_url ? (
                <img 
                  src={clinicConfig.logo_url} 
                  alt={clinicName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Stethoscope className="w-7 h-7 text-primary" />
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold text-xs uppercase tracking-wider">
            {isMedico ? "ATENCIÓN MÉDICA" : "GESTIÓN CLÍNICA"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavClick(item.url)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive(item.url) 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-4 border-sidebar-primary" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                    }`}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.url) ? "text-sidebar-primary" : ""}`} />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Solo mostrar administración si no es médico */}
        {!isMedico && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold text-xs uppercase tracking-wider">
              ADMINISTRACIÓN
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {administration.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNavClick(item.url)}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive(item.url) 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-4 border-sidebar-primary" 
                          : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                      }`}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <item.icon className={`h-4 w-4 ${isActive(item.url) ? "text-sidebar-primary" : ""}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold text-xs uppercase tracking-wider">
            SISTEMA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Mi Perfil link */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => handleNavClick("/dashboard/perfil")}
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive("/dashboard/perfil") 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-4 border-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                  }`}
                  tooltip={collapsed ? "Mi Perfil" : undefined}
                >
                  <UserCircle className={`h-4 w-4 ${isActive("/dashboard/perfil") ? "text-sidebar-primary" : ""}`} />
                  {!collapsed && <span>Mi Perfil</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {filteredSystem.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavClick(item.url)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive(item.url) 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-4 border-sidebar-primary" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
                    }`}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.url) ? "text-sidebar-primary" : ""}`} />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
