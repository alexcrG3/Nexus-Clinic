import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Smile, 
  Stethoscope, 
  ShieldAlert, 
  Zap, 
  Check, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface LandingSpecialtiesProps {
  onOpenBooking: () => void;
}

export const LandingSpecialties: React.FC<LandingSpecialtiesProps> = ({ onOpenBooking }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase
        .from("servicios")
        .select("*")
        .eq("activo", true);

      if (data && data.length > 0) {
        setServices(data);
      } else {
        // Fallback enriquecido si no hay en la DB
        setServices([
          {
            nombre: "Odontología Integral y Diagnóstico 3D",
            categoria: "General",
            precio: 350,
            duracion: 45,
            descripcion: "Evaluación completa con radiografía digital, limpieza profunda por ultrasonido y plan preventivo personalizado.",
            image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80"
          },
          {
            nombre: "Ortodoncia y Alineadores Invisibles",
            categoria: "Ortodoncia",
            precio: 1200,
            duracion: 60,
            descripcion: "Corrección de mordida y alineación dental estética mediante brackets de autoligado y alineadores transparentes.",
            image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80"
          },
          {
            nombre: "Endodoncia Microscópica Sin Dolor",
            categoria: "Especialidad",
            precio: 1500,
            duracion: 90,
            descripcion: "Tratamiento de conductos con magnificación óptica y anestesia computarizada para salvar tus piezas dentales sin dolor.",
            image: "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&auto=format&fit=crop&q=80"
          },
          {
            nombre: "Estética Dental, Carillas y Blanqueamiento Láser",
            categoria: "Estética",
            precio: 850,
            duracion: 45,
            descripcion: "Diseño de sonrisa digital, carillas de porcelana ultra finas y blanqueamiento dental en 1 sola sesión.",
            image: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&auto=format&fit=crop&q=80"
          },
          {
            nombre: "Implantes Dentales y Cirugía Maxilofacial",
            categoria: "Cirugía",
            precio: 2500,
            duracion: 90,
            descripcion: "Reemplazo de piezas perdidas con implantes de titanio de grado médico y regeneración ósea guiada.",
            image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80"
          }
        ]);
      }
    }
    loadServices();
  }, []);

  const activeService = services[activeTab] || services[0];

  return (
    <section id="services-section" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-4 md:px-6 mx-auto max-w-6xl relative z-10">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-primary-foreground text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Servicios Odontológicos
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Tratamientos diseñados para <br />
              <span className="italic font-serif font-normal text-primary">
                tu salud y estética dental
              </span>
            </h2>
          </div>

          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Ofrecemos un catálogo integral con la más alta tecnología clínica para brindarte resultados duraderos y confortables.
          </p>
        </div>

        {/* Bloque Principal de Servicios Interactivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lista de Servicios a la Izquierda */}
          <div className="lg:col-span-6 space-y-3 text-left">
            {services.map((serv, index) => {
              const isActive = activeTab === index;
              return (
                <div
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border flex items-center justify-between group ${
                    isActive
                      ? "bg-slate-900 border-primary shadow-xl shadow-primary/10 translate-x-1"
                      : "bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "bg-slate-800 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold transition-colors ${isActive ? "text-white" : "text-slate-300"}`}>
                        {serv.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {serv.categoria || "Especialidad"} • {serv.duracion || 45} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">
                      ${serv.precio || 350}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive ? "text-primary rotate-90" : "text-slate-600 group-hover:text-slate-400"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjeta Detalle con Foto a la Derecha */}
          {activeService && (
            <div className="lg:col-span-6 text-left">
              <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6">
                
                {/* Imagen del Servicio */}
                <div className="rounded-2xl overflow-hidden aspect-video relative border border-slate-700/50">
                  <img
                    src={
                      activeService.image ||
                      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80"
                    }
                    alt={activeService.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <Badge className="absolute top-3 left-3 bg-primary text-white text-xs font-bold">
                    {activeService.categoria || "Especialidad"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {activeService.nombre}
                    </h3>
                    <span className="text-lg font-extrabold text-primary">
                      ${activeService.precio || 350} MXN
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeService.descripcion ||
                      "Atención profesional garantizada con instrumental estéril de grado médico y valoración personalizada."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    ⏱️ Duración estimada: <strong className="text-white">{activeService.duracion || 45} min</strong>
                  </div>

                  <Button
                    onClick={onOpenBooking}
                    className="font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/30 h-10 px-5 text-xs flex items-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Agendar Tratamiento
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default LandingSpecialties;
