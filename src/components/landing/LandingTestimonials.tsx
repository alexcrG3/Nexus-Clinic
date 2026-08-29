import React from "react";
import { Sparkles, Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const LandingTestimonials = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        
        {/* Encabezado */}
        <div className="text-left space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Testimonios Reales
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lo que dicen nuestros <br />
            <span className="italic font-serif font-normal text-primary underline decoration-primary/30">
              Pacientes Felices
            </span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            Historias reales de personas que recuperaron su salud bucal, su seguridad y su mejor sonrisa con nosotros.
          </p>
        </div>

        {/* Bloque Testimonial Estilo ToothEase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Foto del Paciente */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800 aspect-[4/5] max-h-[440px]">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80"
                alt="Paciente feliz y satisfecha tras su tratamiento dental"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Cita y Estadísticas Clave */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* Tarjeta de Cita */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 relative">
              <Quote className="w-10 h-10 text-primary/30 absolute top-6 right-6" />
              
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>

              <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                “El tratamiento de ortodoncia e higiene en Nova Dental me devolvió la seguridad de sonreír sin pena. Su asistente virtual me recordó cada cita y la atención de los doctores fue 100% libre de dolor.”
              </p>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Sofía Ramírez</h4>
                  <p className="text-xs text-muted-foreground">Tratamiento de Ortodoncia & Estética</p>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200">
                  Paciente Verificado
                </Badge>
              </div>
            </div>

            {/* Métricas / Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white block">
                  2,500<span className="text-primary">+</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
                  Citas y Consultas Atendidas
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white block">
                  99<span className="text-primary">%</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
                  Índice de Satisfacción y Recomendación
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default LandingTestimonials;
