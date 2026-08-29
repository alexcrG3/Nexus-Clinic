import React from "react";
import { Stethoscope, MapPin, Phone, Mail, Clock, Send, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClinicConfig } from "@/hooks/useClinicConfig";

interface LandingFooterProps {
  config: ClinicConfig | null | undefined;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ config }) => {
  const clinicName = config?.nombre_clinica || "Nova Dental";

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-16 pb-12">
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Bloque Superior: Newsletter / Contacto */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 mb-16 text-left">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl font-bold text-white">
              ¿Tienes dudas sobre algún tratamiento?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Escríbenos o habla con nuestro Asistente de IA disponible las 24 horas del día.
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <Button
              onClick={() => {
                const chatBtn = document.querySelector('button[title*="Asistente Virtual"]') as HTMLButtonElement;
                if (chatBtn) chatBtn.click();
              }}
              className="font-bold bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6 text-xs sm:text-sm shadow-lg shadow-primary/25"
            >
              💬 Chatear con Asistente IA
            </Button>
          </div>
        </div>

        {/* Columnas del Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-left text-xs">
          
          {/* Columna 1: Info Clínica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-lg font-black text-white">{clinicName}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Clínica odontológica de alta especialidad. Cuidado integral, tratamientos indoloros y tecnología digital al servicio de tu sonrisa.
            </p>
          </div>

          {/* Columna 2: Horarios de Atención Oficiales */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Horarios de Atención
            </h4>
            <div className="space-y-1.5 text-slate-400">
              <p><strong>Lunes a Viernes:</strong> <br />7:00 am – 6:00 pm</p>
              <p><strong>Sábados:</strong> <br />9:00 am – 5:00 pm</p>
              <p className="text-slate-500"><strong>Domingos y feriados:</strong> Cerrado</p>
            </div>
          </div>

          {/* Columna 3: Contacto y Ubicación */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Ubicación y Contacto
            </h4>
            <div className="space-y-2 text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Av. Principal Médica 102, Edificio Nova, Piso 3</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+52 (55) 1234-5678</span>
              </p>
              <a 
                href="https://maps.app.goo.gl/UU3ypbdmix1R85KWA" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block text-primary hover:underline font-bold mt-1"
              >
                📍 Abrir en Google Maps
              </a>
            </div>
          </div>

          {/* Columna 4: Navegación Rápida */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white">Navegación Rápida</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#services-section" className="hover:text-primary transition-colors">Servicios Odontológicos</a>
              </li>
              <li>
                <a href="#doctors-section" className="hover:text-primary transition-colors">Nuestro Equipo Médico</a>
              </li>
              <li>
                <a href="#booking-section" className="hover:text-primary transition-colors">Agendar Cita en Línea</a>
              </li>
              <li>
                <a href="#app-section" className="hover:text-primary transition-colors">Descargar App Móvil PWA</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Diseñado con <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> para tu salud dental.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
