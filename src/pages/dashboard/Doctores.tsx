import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Stethoscope, 
  Calendar, 
  UserPlus, 
  XCircle, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import DoctorModal from "@/components/dashboard/DoctorModal";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface Doctor {
  id: string;
  nombre: string;
  especialidad: string | null;
  email: string | null;
  consultorio?: string | null;
  activo: boolean;
  foto_url?: string | null; // Placeholder as it might be in profiles
  dias_trabajo: string[] | null;
  bio?: string | null;
  horario_semanal?: any;
}

interface DoctorStats {
  citasEstaSemana: number;
  noShows: number;
}

const Doctores = () => {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, DoctorStats>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctores();
  }, []);

  const fetchDoctores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("doctores")
      .select("*")
      .order("nombre");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los doctores",
        variant: "destructive",
      });
    } else {
      setDoctores(data || []);
      // After fetching doctors, fetch stats for each
      fetchStats(data || []);
    }
    setLoading(false);
  };

  const fetchStats = async (doctorsList: Doctor[]) => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(new Date());

    const newStats: Record<string, DoctorStats> = {};

    for (const doc of doctorsList) {
      const { data: citasData, error } = await supabase
        .from("citas")
        .select("id, estado")
        .eq("doctor_id", doc.id)
        .gte("fechaCita", format(start, "yyyy-MM-dd"))
        .lte("fechaCita", format(end, "yyyy-MM-dd"));

      if (!error && citasData) {
        newStats[doc.id] = {
          citasEstaSemana: citasData.length,
          noShows: citasData.filter(c => c.estado === "no_show").length
        };
      } else {
        newStats[doc.id] = { citasEstaSemana: 0, noShows: 0 };
      }
    }
    setStats(newStats);
  };

  const toggleActivo = async (docId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("doctores")
      .update({ activo: !currentStatus })
      .eq("id", docId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } else {
      setDoctores(prev => prev.map(d => d.id === docId ? { ...d, activo: !currentStatus } : d));
      toast({
        title: "Éxito",
        description: `Doctor ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedDoctor(undefined);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-secondary">Doctores</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona el equipo médico y sus horarios profesionales.</p>
        </div>
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary-hover text-white rounded-xl h-11 px-6 shadow-lg shadow-primary/20 transition-all font-bold">
          <Plus className="mr-2 h-5 w-5" />
          Agregar Doctor
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {doctores.map((doctor) => {
          const docStats = stats[doctor.id] || { citasEstaSemana: 0, noShows: 0 };
          return (
            <Card key={doctor.id} className="overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-xl transition-all group bg-white rounded-3xl">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="h-16 w-16 rounded-2xl bg-muted overflow-hidden border border-border/50 ring-2 ring-primary/5">
                    {doctor.foto_url ? (
                      <img src={doctor.foto_url} alt={doctor.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                        <Stethoscope className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-secondary rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleEdit(doctor)} className="cursor-pointer gap-2">
                        <Edit className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-secondary leading-tight line-clamp-1">{doctor.nombre}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-primary font-semibold text-sm">{doctor.especialidad || "Medicina General"}</p>
                    {doctor.consultorio && (
                      <span className="text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md">
                        📍 {doctor.consultorio.toLowerCase().startsWith("consultorio") || doctor.consultorio.toLowerCase().startsWith("sala") ? doctor.consultorio : `Consultorio ${doctor.consultorio}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-y border-border/40">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${doctor.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {doctor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <Switch 
                    checked={doctor.activo} 
                    onCheckedChange={() => toggleActivo(doctor.id, doctor.activo)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-secondary">{docStats.citasEstaSemana}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Citas/Sem</span>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-destructive">{docStats.noShows}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">No-shows</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium bg-muted/20 p-2 rounded-xl">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="line-clamp-1">
                    {doctor.dias_trabajo?.join(", ") || "Sin horario configurado"}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <DoctorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        doctor={selectedDoctor}
        onSuccess={fetchDoctores}
      />
    </div>
  );
};

export default Doctores;
