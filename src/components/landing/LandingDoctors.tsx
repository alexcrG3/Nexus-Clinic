import React, { useState, useEffect } from "react";
import { Sparkles, Star, Calendar as CalendarIcon, Stethoscope, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface LandingDoctorsProps {
  onOpenBooking: () => void;
}

export const LandingDoctors: React.FC<LandingDoctorsProps> = ({ onOpenBooking }) => {
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    async function loadDoctors() {
      const { data } = await supabase
        .from("doctores")
        .select("*")
        .eq("activo", true);

      if (data && data.length > 0) {
        setDoctors(data);
      } else {
        // Fallback enriquecido
        setDoctors([
          {
            nombre: "Dra. Ana Lara",
            especialidad: "Ortodoncia & Estética Dental",
            experiencia: "10+ años de experiencia",
            image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80",
            rating: "4.9"
          },
          {
            nombre: "Dr. Juan Pérez",
            especialidad: "Implantología & Cirugía Oral",
            experiencia: "12+ años de experiencia",
            image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80",
            rating: "5.0"
          },
          {
            nombre: "Dra. María López",
            especialidad: "Endodoncia Microscópica",
            experiencia: "8+ años de experiencia",
            image: "https://images.unsplash.com/photo-1594824813626-d64e1011d615?w=600&auto=format&fit=crop&q=80",
            rating: "4.9"
          },
          {
            nombre: "Dr. Roberto Morales",
            especialidad: "Odontopediatría & Preventiva",
            experiencia: "9+ años de experiencia",
            image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80",
            rating: "4.8"
          }
        ]);
      }
    }
    loadDoctors();
  }, []);

  const doctorImages = [
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594824813626-d64e1011d615?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80"
  ];

  return (
    <section id="doctors-section" className="py-24 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        
        {/* Encabezado */}
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Equipo Médico Especialista
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Conoce a nuestros{" "}
            <span className="italic font-serif font-normal text-primary underline decoration-primary/30">
              Doctores Expertos
            </span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Profesionales altamente capacitados y comprometidos con devolverte la confianza de una sonrisa saludable.
          </p>
        </div>

        {/* Grid de Doctores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Foto del Doctor */}
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={doc.image || doctorImages[idx % doctorImages.length]}
                  alt={doc.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{doc.rating || "4.9"}</span>
                </div>
              </div>

              {/* Información */}
              <div className="p-5 text-left space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {doc.nombre}
                </h3>
                <p className="text-xs font-semibold text-primary">
                  {doc.especialidad || "Odontología Integral"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {doc.experiencia || "Especialista en práctica clínica"}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={onOpenBooking}
                    variant="outline"
                    className="w-full h-9 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Agendar con Doctor
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LandingDoctors;
