import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  MapPin, 
  Stethoscope, 
  Search, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Star,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClinicConfig } from "@/hooks/useClinicConfig";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LandingHeroProps {
  config: ClinicConfig | null | undefined;
  onOpenBooking: () => void;
  onOpenPatientModal: () => void;
}

export const LandingHero = ({ config, onOpenBooking, onOpenPatientModal }: LandingHeroProps) => {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    async function getServices() {
      const { data } = await supabase.from("servicios").select("id, nombre").eq("activo", true).limit(6);
      if (data) setServices(data);
    }
    getServices();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenBooking();
  };

  const clinicName = config?.nombre_clinica || "Nova Dental";

  return (
    <section className="relative w-full pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Copywriting y Llamados a la Acción */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clínica Odontológica de Alta Especialidad</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Tu bienestar y confort, <br />
              <span className="italic font-serif font-normal text-primary underline decoration-primary/30 decoration-wavy">
                una sonrisa
              </span>{" "}
              a la vez.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Atención dental premium para ti y tu familia. Agenda tu cita en segundos con nuestro sistema inteligente, recibe recordatorios automáticos por WhatsApp y lleva tu historial médico en tu celular.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button 
                onClick={onOpenBooking}
                size="lg"
                className="h-12 px-7 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
              >
                <CalendarIcon className="w-4 h-4" />
                Agendar Cita en Línea
              </Button>

              <Button 
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("services-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-12 px-6 rounded-xl font-bold border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-sm"
              >
                Ver Servicios y Precios
              </Button>
            </div>

            {/* Prueba Social (Avatares y Estrellas) */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex -space-x-2 overflow-hidden">
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Paciente" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Paciente" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Paciente" />
                <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="Paciente" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1">4.9 / 5</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Más de <strong>1,200+</strong> pacientes atendidos con éxito
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Imagen Principal Estilo ToothEase y Tarjeta Flotante */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Imagen con bordes redondeados orgánicos */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-[4/5] max-h-[500px]">
                <img 
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80" 
                  alt="Doctora Odontóloga atendiendo paciente con sonrisa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Badge Flotante Superior: Garantía de Higiene y Cuidado */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-in fade-in zoom-in duration-500">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">100% Esterilización</p>
                  <p className="text-[10px] text-slate-500">Protocolos Médicos Top</p>
                </div>
              </div>

              {/* Badge Flotante Inferior: Asistente IA 24/7 */}
              <div 
                onClick={() => {
                  const chatBtn = document.querySelector('button[title*="Asistente Virtual"]') as HTMLButtonElement;
                  if (chatBtn) chatBtn.click();
                }}
                className="absolute -bottom-5 -right-4 sm:-right-6 bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-2xl border border-primary/20 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Asistente IA Nova</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] px-1 py-0 font-bold">
                      24/7
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Reservas y consultas en vivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda Rápida y Agendamiento Integrada en el Hero */}
        <div className="mt-14 max-w-4xl mx-auto bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800">
          <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            {/* Ubicación */}
            <div className="sm:col-span-3 flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="text-left leading-none overflow-hidden">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Ubicación</span>
                <span className="text-xs font-semibold text-foreground truncate block">{clinicName} Matriz</span>
              </div>
            </div>

            {/* Servicio / Especialidad */}
            <div className="sm:col-span-4 flex items-center gap-2.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <Stethoscope className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 text-left leading-none">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Especialidad</span>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-6 p-0 border-0 bg-transparent text-xs font-semibold focus:ring-0 shadow-none">
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha Deseada */}
            <div className="sm:col-span-3 flex items-center gap-2.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 text-left leading-none">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Fecha</span>
                <Input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-6 p-0 border-0 bg-transparent text-xs font-semibold focus-visible:ring-0 shadow-none"
                />
              </div>
            </div>

            {/* Botón Buscar */}
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full h-11 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20">
                <Search className="w-3.5 h-3.5" />
                Buscar
              </Button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
};

export default LandingHero;
