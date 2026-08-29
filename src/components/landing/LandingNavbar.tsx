import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar as CalendarIcon, User, Smartphone, Sparkles } from "lucide-react";
import { ClinicConfig } from "@/hooks/useClinicConfig";
import { useAuth } from "@/contexts/AuthContext";

interface LandingNavbarProps {
  config: ClinicConfig | null | undefined;
  onOpenPatientModal: () => void;
  onOpenBooking: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  config,
  onOpenPatientModal,
  onOpenBooking,
}) => {
  const { user } = useAuth();
  const clinicName = config?.nombre_clinica || "Nova Dental";

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
      <div className="container max-w-6xl mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        
        {/* Logo de la Clínica */}
        <Link to="/" className="flex items-center gap-3 group transition-all">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform text-white">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="text-left leading-none">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {clinicName}
            </span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-0.5">
              Clínica Dental
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-slate-300">
          <button onClick={() => scrollTo("services-section")} className="hover:text-primary transition-colors">
            Servicios
          </button>
          <button onClick={() => scrollTo("doctors-section")} className="hover:text-primary transition-colors">
            Especialistas
          </button>
          <button onClick={() => scrollTo("app-section")} className="hover:text-primary transition-colors flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-primary" /> App Móvil
          </button>
        </nav>

        {/* Acciones del Navbar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            size="sm"
            onClick={onOpenBooking}
            className="font-bold text-xs rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 h-9 px-3.5 sm:px-4 flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Agendar Cita</span>
          </Button>

          <Link to={user ? "/paciente" : "/auth"}>
            <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3.5">
              {user ? "Mi Portal" : "Iniciar Sesión"}
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
};

export default LandingNavbar;
