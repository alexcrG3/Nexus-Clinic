import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useClinicConfig } from "@/hooks/useClinicConfig";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingWhy from "@/components/landing/LandingWhy";
import LandingSpecialties from "@/components/landing/LandingSpecialties";
import LandingDoctors from "@/components/landing/LandingDoctors";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingBookingForm from "@/components/landing/LandingBookingForm";
import LandingAppBanner from "@/components/landing/LandingAppBanner";
import LandingFooter from "@/components/landing/LandingFooter";
import { LandingPatientModal } from "@/components/landing/LandingPatientModal";

const Landing = () => {
  const { data: config, isLoading } = useClinicConfig();
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Si la clínica tiene desactivada la landing pública (porque ya tiene su propia web), ir directo a la app
  if (!isLoading && config?.mostrar_landing_publica === false) {
    return <Navigate to="/auth" replace />;
  }

  const scrollToBooking = () => {
    const el = document.getElementById("booking-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Modal de Consulta de Citas del Paciente */}
      <LandingPatientModal
        isOpen={isPatientModalOpen}
        onOpenChange={setIsPatientModalOpen}
      />

      {/* Navbar Superior */}
      <LandingNavbar
        config={config}
        onOpenPatientModal={() => setIsPatientModalOpen(true)}
        onOpenBooking={scrollToBooking}
      />

      {/* Contenido Principal */}
      <main className="flex-1">
        {/* 1. Hero Section con Búsqueda Rápida y Social Proof */}
        <LandingHero
          config={config}
          onOpenBooking={scrollToBooking}
          onOpenPatientModal={() => setIsPatientModalOpen(true)}
        />

        {/* 2. ¿Por qué Elegirnos? (Estadísticas y Calidad) */}
        <LandingWhy />

        {/* 3. Servicios y Precios */}
        <LandingSpecialties onOpenBooking={scrollToBooking} />

        {/* 4. Equipo de Doctores Especialistas */}
        <LandingDoctors onOpenBooking={scrollToBooking} />

        {/* 5. Testimonios de Pacientes y Métricas */}
        <LandingTestimonials />

        {/* 6. Formulario Directo de Agendamiento de Citas */}
        <LandingBookingForm />

        {/* 7. Banner de Instalación de la App Móvil / PWA */}
        <LandingAppBanner />
      </main>

      {/* Pie de Página */}
      <LandingFooter config={config} />
    </div>
  );
};

export default Landing;
