import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Home, 
  ArrowLeft, 
  Activity, 
  Calendar, 
  FileText, 
  Users, 
  Sparkles, 
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  useEffect(() => {
    console.warn("404 Error: Ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  const handleReturnHome = () => {
    if (!user) {
      navigate("/auth");
    } else if (userRole === "paciente") {
      navigate("/paciente");
    } else if (userRole === "admin_sistema") {
      navigate("/superadmin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-primary selection:text-white">
      
      {/* Luces de Fondo & Gradientes Nexus Teal */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra Superior Minimalista con Logo */}
      <header className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block">Nexus Clinic</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Plataforma Médica</span>
          </div>
        </div>

        <Badge className="bg-slate-900/80 border border-slate-800 text-slate-300 text-xs px-3 py-1 font-medium gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Estado del Sistema: Normal
        </Badge>
      </header>

      {/* Contenido Principal Centrado */}
      <main className="relative z-10 max-w-2xl mx-auto w-full px-6 py-10 text-center flex flex-col items-center">
        
        {/* Badge de Error */}
        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold py-1 px-3 mb-4 gap-1.5 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5" /> Error 404 • Ruta no encontrada
        </Badge>

        {/* 404 Tipografía Gigante con Gradiente */}
        <h1 className="text-7xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent drop-shadow-sm select-none">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
          Página o Registro Fuera de Rango
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          La consulta médica o enlace al que intentas acceder no existe, fue reubicado o la dirección fue modificada.
        </p>

        {/* Ruta intentada */}
        <div className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 font-mono text-xs max-w-md truncate">
          Ruta: <span className="text-primary font-semibold">{location.pathname}</span>
        </div>

        {/* Botones de Acción */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-2xl border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver Atrás
          </Button>

          <Button
            onClick={handleReturnHome}
            className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 shadow-lg shadow-primary/25"
          >
            <Home className="w-4 h-4" /> Regresar al Dashboard Principal
          </Button>
        </div>

        {/* Accesos Rápidos Sugeridos */}
        <div className="mt-12 w-full pt-8 border-t border-slate-800/80 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center">
            Módulos Clínicos Frecuentes
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate("/dashboard/agenda")}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left flex flex-col justify-between group"
            >
              <Calendar className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Agenda</span>
              <span className="text-[10px] text-slate-400">Citas en vivo</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/expedientes")}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left flex flex-col justify-between group"
            >
              <FileText className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Expedientes</span>
              <span className="text-[10px] text-slate-400">Historiales</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/pacientes")}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left flex flex-col justify-between group"
            >
              <Users className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Pacientes</span>
              <span className="text-[10px] text-slate-400">Directorio</span>
            </button>

            <button
              onClick={() => navigate("/dashboard/facturacion")}
              className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-primary/50 hover:bg-slate-800/50 transition-all text-left flex flex-col justify-between group"
            >
              <Sparkles className="w-4 h-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Facturación</span>
              <span className="text-[10px] text-slate-400">Cobros & Pagos</span>
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400 border-t border-slate-900">
        © {new Date().getFullYear()} Nexus Clinic Software Médico • Todos los derechos reservados
      </footer>

    </div>
  );
};

export default NotFound;
