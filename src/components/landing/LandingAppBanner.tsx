import React, { useState, useEffect } from "react";
import { Smartphone, Download, CheckCircle2, Sparkles, Bell, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const LandingAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("¡App instalada con éxito en tu dispositivo!");
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      toast.info("Para instalar la app: presiona 'Compartir' o menú de opciones en tu navegador y selecciona 'Agregar a pantalla de inicio'.");
    }
  };

  return (
    <section id="app-section" className="py-20 bg-gradient-to-r from-primary/95 via-primary to-primary/90 text-white relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-2xl pointer-events-none" />

      <div className="container px-4 md:px-6 mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Texto y Beneficios */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold tracking-wide border border-white/20">
              <Smartphone className="w-3.5 h-3.5" /> App Móvil y PWA Nova Dental
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Lleva tu salud dental en <br />
              <span className="italic font-serif font-normal text-white/90 underline decoration-white/30">
                la palma de tu mano
              </span>
            </h2>

            <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
              Instala nuestra aplicación web directamente en tu teléfono (iOS o Android) sin necesidad de entrar a la App Store. Agenda citas con 1 toque y recibe notificaciones inteligentes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Bell className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="text-xs font-medium text-white/90">
                  Recordatorios automáticos 24h antes
                </span>
              </div>

              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Calendar className="w-5 h-5 text-emerald-300 shrink-0" />
                <span className="text-xs font-medium text-white/90">
                  Historial de citas y presupuestos
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <Button
                onClick={handleInstallClick}
                size="lg"
                className="h-12 px-7 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-black/20 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-primary" />
                Instalar App en mi Celular
              </Button>

              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById("booking-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-12 px-6 rounded-xl font-bold bg-slate-950 text-white hover:bg-slate-900 border border-white/20 shadow-lg text-xs sm:text-sm"
              >
                💬 Agendar con Asistente IA
              </Button>
            </div>
          </div>

          {/* Mockup de Teléfono Móvil */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-64 sm:w-72 rounded-[40px] border-[8px] border-slate-900 bg-slate-900 p-2 shadow-2xl shadow-black/40">
              {/* Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20" />
              
              {/* Pantalla del teléfono */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-[32px] overflow-hidden p-4 text-slate-900 dark:text-white space-y-3 aspect-[9/18]">
                {/* Header Mockup */}
                <div className="flex items-center justify-between pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                      🦷
                    </div>
                    <span className="text-xs font-bold">Nova Dental App</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold">Online</span>
                </div>

                {/* Tarjeta de Próxima Cita Mockup */}
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 text-left space-y-1.5">
                  <Badge className="bg-primary text-white text-[9px] px-1.5 py-0">PRÓXIMA CITA</Badge>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Ortodoncia & Limpieza</p>
                  <p className="text-[10px] text-muted-foreground">Mañana, 10:00 AM • Dra. Ana Lara</p>
                </div>

                {/* Acciones Rápidas Mockup */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                    📅 Agendar Cita
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                    💬 Asistente IA
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left text-[10px] text-emerald-700 dark:text-emerald-300">
                  🔔 <strong>Recordatorio:</strong> Te avisaremos 2h antes de tu llegada.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingAppBanner;
