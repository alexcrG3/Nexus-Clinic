import React from "react";
import { Sparkles, Award, Wallet, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const LandingWhy = () => {
  const reasons = [
    {
      num: "01",
      icon: Award,
      title: "Especialistas Certificados y con Experiencia",
      description:
        "Nuestro equipo médico cuenta con posgrados y certificación continua en ortodoncia, endodoncia, estética dental e implantología.",
    },
    {
      num: "02",
      icon: Wallet,
      title: "Precios Transparentes y Facilidades de Pago",
      description:
        "Diagnósticos integrales desde la primera cita con presupuestos claros, sin costos sorpresa y opciones de financiamiento.",
    },
    {
      num: "03",
      icon: Smartphone,
      title: "Tecnología Digital, App Móvil y WhatsApp 24/7",
      description:
        "Reserva tus citas al instante, recibe recordatorios automáticos por WhatsApp y consulta tus recetas y tratamientos en tu celular.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="container px-4 md:px-6 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Imagen del Doctor explicando tratamiento */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50 dark:border-slate-800 aspect-[4/5] max-h-[480px]">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"
                alt="Doctor explicando diagnóstico dental al paciente con calidez"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Compromiso de Excelencia
                </div>
                <p className="text-xs text-slate-200 mt-1">
                  Más del 98% de nuestros pacientes nos recomiendan con sus familiares y amigos.
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjetas de Beneficios */}
          <div className="lg:col-span-7 space-y-8 order-1 lg:order-2 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide mb-3">
                <Sparkles className="w-3.5 h-3.5" /> ¿Por qué Elegirnos?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                ¿Por qué confiar en <br />
                <span className="italic font-serif font-normal text-primary underline decoration-primary/30">
                  Nova Dental
                </span>{" "}
                para tu sonrisa?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Combinamos calidez humana, tecnología de última generación y atención sin dolor para brindarte la mejor experiencia odontológica.
              </p>
            </div>

            <div className="space-y-4">
              {reasons.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary font-bold text-sm shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all">
                    {item.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingWhy;
