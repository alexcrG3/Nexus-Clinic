import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Agenda from "./pages/dashboard/Agenda";
import Pacientes from "./pages/dashboard/Pacientes";
import Expedientes from "./pages/dashboard/Expedientes";
import ExpedienteDetalle from "./pages/dashboard/ExpedienteDetalle";
import Mensajes from "./pages/dashboard/Mensajes";
import Citas from "./pages/dashboard/Citas";
import Facturacion from "./pages/dashboard/Facturacion";
import Reportes from "./pages/dashboard/Reportes";
import Configuracion from "./pages/dashboard/Configuracion";
import Roles from "./pages/dashboard/Roles";
import Perfil from "./pages/dashboard/Perfil";
import { HistorialPacientes } from "./pages/dashboard/HistorialPacientes";
import ExpedientePaciente from "./pages/dashboard/ExpedientePaciente";
import Auditoria from "./pages/dashboard/Auditoria";
import Doctores from "./pages/dashboard/Doctores";

import CentroDeMando from "./pages/dashboard/CentroDeMando";
import Landing from "./pages/Landing";
import PortalPaciente from "./pages/PortalPaciente";
import PantallaTV from "./pages/PantallaTV";
import TurnosLlamador from "./pages/dashboard/TurnosLlamador";
import { ClinicAiChatWidget } from "./components/chat/ClinicAiChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ClinicAiChatWidget />
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/web" element={<Landing />} />
            <Route path="/paciente" element={<PortalPaciente />} />
            <Route path="/portal" element={<PortalPaciente />} />
            <Route path="/tv" element={<PantallaTV />} />
            <Route path="/pantalla-tv" element={<PantallaTV />} />
            <Route path="/sala-espera" element={<PantallaTV />} />
            <Route path="/turnos" element={<TurnosLlamador />} />
            <Route path="/llamador" element={<TurnosLlamador />} />
            <Route path="/superadmin" element={<ProtectedRoute><CentroDeMando /></ProtectedRoute>} />
            <Route path="/centro-de-mando" element={<ProtectedRoute><CentroDeMando /></ProtectedRoute>} />
            {/* Turnos Llamador: pantalla completa, sin sidebar */}
            <Route path="/dashboard/turnos" element={<ProtectedRoute><TurnosLlamador /></ProtectedRoute>} />
            <Route path="/dashboard/llamador" element={<ProtectedRoute><TurnosLlamador /></ProtectedRoute>} />
            {/* Redirect /home to /dashboard for backwards compatibility */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="historial-pacientes" element={<HistorialPacientes />} />
              <Route path="historial-pacientes/:clienteId" element={<ExpedientePaciente />} />
              <Route path="expedientes" element={<Expedientes />} />
              <Route path="expedientes/:id" element={<ExpedienteDetalle />} />
              <Route path="expediente/:id" element={<ExpedienteDetalle />} />
              <Route path="citas" element={<Citas />} />
              <Route path="doctores" element={<Doctores />} />
              <Route path="facturacion" element={<Facturacion />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="roles" element={<Roles />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="auditoria" element={<Auditoria />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
