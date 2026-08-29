import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodayAppointments } from "@/hooks/useTodayAppointments";
import { useAppointments } from "@/hooks/useAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { AgendaMedica } from "@/components/medico/AgendaMedica";
import { AgendaAdmin } from "@/components/citas/AgendaAdmin";
import { CitaFormDialog } from "@/components/citas/CitaFormDialog";
import { UpcomingAppointmentsCard } from "@/components/citas/UpcomingAppointmentsCard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Agenda = () => {
  const { userRole } = useAuth();
  const [showNewCitaDialog, setShowNewCitaDialog] = useState(false);

  const isMedico = userRole === "medico" || userRole === "odontologo" || userRole === "fisioterapeuta" || userRole === "quiropractico";
  
  // Today's appointments - filter by doctor if user is a medical professional
  const { data: todayAppointments, isLoading: loadingToday } = useTodayAppointments(isMedico);
  // All appointments for upcoming section - filter by doctor if user is a medical professional
  const { data: allAppointments, isLoading: loadingAll } = useAppointments(isMedico);

  const isLoading = loadingToday || loadingAll;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">
            {isMedico ? "Visualiza tus pacientes del día" : "Gestiona la agenda de citas"}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewCitaDialog(true)}>
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <div className="space-y-6">
        {/* Today's Agenda */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Citas de Hoy - {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          {/* Render different component based on role */}
          {isLoading ? (
            <div className="flex items-center justify-center py-10 bg-card rounded-2xl border border-border/50">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Cargando agenda...</span>
            </div>
          ) : isMedico ? (
            <AgendaMedica citas={todayAppointments ?? []} />
          ) : (
            <AgendaAdmin citas={todayAppointments ?? []} />
          )}
        </div>

        {/* Upcoming Appointments */}
        <UpcomingAppointmentsCard appointments={allAppointments || []} />
      </div>

      <CitaFormDialog open={showNewCitaDialog} onOpenChange={setShowNewCitaDialog} />
    </div>
  );
};

export default Agenda;
