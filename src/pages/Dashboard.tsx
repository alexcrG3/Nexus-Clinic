import { useAuth } from "@/contexts/AuthContext";
import { DashboardMedico } from "@/components/medico/DashboardMedico";
import { DashboardPremium } from "@/components/dashboard/DashboardPremium";

const Dashboard = () => {
  const { userRole } = useAuth();

  // Dashboard específico para médicos y profesionales de la salud
  const isMedico = 
    userRole === "medico" || 
    userRole === "odontologo" || 
    userRole === "fisioterapeuta" || 
    userRole === "quiropractico";

  if (isMedico) {
    return <DashboardMedico />;
  }

  // Dashboard premium para recepcionistas y administradores
  return <DashboardPremium userRole={userRole} />;
};

export default Dashboard;
