import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Calendar } from "lucide-react";

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor?: any;
  onSuccess: () => void;
}

const DAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const DoctorModal = ({ isOpen, onClose, doctor, onSuccess }: DoctorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    especialidad: "",
    email: "",
    foto_url: "",
    bio: "",
    activo: true,
  });

  const [horario, setHorario] = useState<Record<string, { activo: boolean; inicio: string; fin: string }>>(
    DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { activo: day !== "Dom", inicio: "08:00", fin: "17:00" }
    }), {})
  );

  const { toast } = useToast();

  useEffect(() => {
    if (doctor) {
      setFormData({
        nombre: doctor.nombre || "",
        especialidad: doctor.especialidad || "",
        email: doctor.email || "",
        foto_url: doctor.foto_url || "",
        bio: doctor.bio || "",
        activo: doctor.activo ?? true,
      });
      if (doctor.horario_semanal) {
        setHorario(doctor.horario_semanal);
      }
    } else {
      setFormData({
        nombre: "",
        especialidad: "",
        email: "",
        foto_url: "",
        bio: "",
        activo: true,
      });
      setHorario(DAYS.reduce((acc, day) => ({
        ...acc,
        [day]: { activo: day !== "Dom", inicio: "08:00", fin: "17:00" }
      }), {}));
    }
  }, [doctor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      horario_semanal: horario,
      dias_trabajo: Object.keys(horario).filter(day => horario[day].activo),
    };

    let error;
    if (doctor) {
      const { error: updateError } = await supabase
        .from("doctores")
        .update(payload)
        .eq("id", doctor.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("doctores")
        .insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la información del doctor",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Doctor ${doctor ? 'actualizado' : 'creado'} correctamente`,
      });
      onSuccess();
      onClose();
    }
  };

  const handleDayToggle = (day: string) => {
    setHorario(prev => ({
      ...prev,
      [day]: { ...prev[day], activo: !prev[day].activo }
    }));
  };

  const handleTimeChange = (day: string, field: 'inicio' | 'fin', value: string) => {
    setHorario(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Calendar className="text-primary h-6 w-6" />
            {doctor ? "Editar Doctor" : "Agregar Nuevo Doctor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-bold text-secondary">Nombre Completo</Label>
                <Input 
                  id="nombre" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Dr. Juan Pérez" 
                  required 
                  className="rounded-xl border-border/60 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad" className="text-sm font-bold text-secondary">Especialidad</Label>
                <Select 
                  value={formData.especialidad} 
                  onValueChange={val => setFormData({...formData, especialidad: val})}
                >
                  <SelectTrigger className="rounded-xl border-border/60">
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Medicina General">Medicina General</SelectItem>
                    <SelectItem value="Odontología">Odontología</SelectItem>
                    <SelectItem value="Fisioterapia">Fisioterapia</SelectItem>
                    <SelectItem value="Quiropráctica">Quiropráctica</SelectItem>
                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                    <SelectItem value="Psicología">Psicología</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-secondary">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="doctor@nexus.com" 
                  className="rounded-xl border-border/60"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="foto_url" className="text-sm font-bold text-secondary">URL de Foto</Label>
                <Input 
                  id="foto_url" 
                  value={formData.foto_url} 
                  onChange={e => setFormData({...formData, foto_url: e.target.value})} 
                  placeholder="https://..." 
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-bold text-secondary">Bio corta</Label>
                <Textarea 
                  id="bio" 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})} 
                  placeholder="Breve descripción profesional..." 
                  className="rounded-xl border-border/60 min-h-[95px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-muted/30 p-6 rounded-3xl border border-border/40">
            <h4 className="font-bold text-secondary flex items-center gap-2">
              <Clock className="text-primary h-5 w-5" />
              Horario Semanal
            </h4>
            <div className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-border/20">
                  <div className="flex items-center gap-3 min-w-[100px]">
                    <Checkbox 
                      id={`day-${day}`}
                      checked={horario[day].activo}
                      onCheckedChange={() => handleDayToggle(day)}
                      className="rounded-md data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor={`day-${day}`} className="font-bold cursor-pointer text-secondary">{day}</Label>
                  </div>
                  
                  {horario[day].activo ? (
                    <div className="flex items-center gap-3 flex-1 justify-end animate-in fade-in slide-in-from-right-2 duration-300">
                      <Input 
                        type="time" 
                        value={horario[day].inicio} 
                        onChange={e => handleTimeChange(day, 'inicio', e.target.value)}
                        className="w-32 rounded-xl h-9 text-xs"
                      />
                      <span className="text-xs text-muted-foreground font-bold">a</span>
                      <Input 
                        type="time" 
                        value={horario[day].fin} 
                        onChange={e => handleTimeChange(day, 'fin', e.target.value)}
                        className="w-32 rounded-xl h-9 text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic flex-1 text-right">No laborable</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {doctor ? "Guardar Cambios" : "Crear Doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorModal;
