import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  CalendarCheck, 
  MapPin, 
  LogOut,
  Smartphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LandingPatientModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LandingPatientModal: React.FC<LandingPatientModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [phoneInput, setPhoneInput] = useState(localStorage.getItem("nexus_patient_phone") || "");
  const [activePhone, setActivePhone] = useState(localStorage.getItem("nexus_patient_phone") || "");
  const [patientName, setPatientName] = useState(localStorage.getItem("nexus_patient_name") || "");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async (phone: string) => {
    setLoading(true);
    try {
      const clean = phone.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("citas")
        .select(`
          id,
          nombre,
          telefono,
          fechaCita,
          hora_cita,
          estado,
          precio,
          servicio_id,
          doctor_id
        `)
        .ilike("telefono", `%${clean}%`)
        .order("fechaCita", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);

      if (data && data.length > 0 && !patientName) {
        setPatientName(data[0].nombre || "");
        localStorage.setItem("nexus_patient_name", data[0].nombre || "");
      }
    } catch (err: any) {
      toast.error("Error al buscar citas del paciente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    const clean = phoneInput.trim();
    setActivePhone(clean);
    localStorage.setItem("nexus_patient_phone", clean);
    fetchAppointments(clean);
  };

  const handleCancelAppointment = async (citaId: string) => {
    if (!confirm("¿Deseas cancelar esta cita?")) return;
    try {
      const { error } = await supabase
        .from("citas")
        .update({ estado: "cancelada" })
        .eq("id", citaId);

      if (error) throw error;
      toast.success("Cita cancelada correctamente.");
      fetchAppointments(activePhone);
    } catch (err: any) {
      toast.error("Error al cancelar la cita.");
    }
  };

  const handleLogout = () => {
    setActivePhone("");
    setPatientName("");
    setAppointments([]);
    localStorage.removeItem("nexus_patient_phone");
    localStorage.removeItem("nexus_patient_name");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-2xl border-primary/20">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    Portal de Paciente
                  </DialogTitle>
                  <p className="text-xs text-primary-foreground/80">
                    Consulta tus citas activas y recordatorios
                  </p>
                </div>
              </div>
              {activePhone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-white hover:bg-white/15 h-8 px-2"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Salir
                </Button>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {!activePhone ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingresa el número telefónico que usaste al agendar para visualizar tus citas y confirmaciones en tiempo real:
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="tel"
                    placeholder="Ej. 55 1234 5678"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="pl-9 text-xs h-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold shadow-md h-10 text-xs">
                Buscar Mis Citas
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                <div>
                  <span className="text-[11px] text-muted-foreground">Paciente vinculado:</span>
                  <p className="text-sm font-bold text-foreground">{patientName || activePhone}</p>
                </div>
                <Badge variant="outline" className="text-xs font-medium border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Activo
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Historial y Próximas Citas
                </h4>

                {loading ? (
                  <p className="text-center py-6 text-xs text-muted-foreground">Buscando citas...</p>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl p-4 text-muted-foreground space-y-2">
                    <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                    <p className="text-xs font-medium">No se encontraron citas con este número ({activePhone}).</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {appointments.map((apt) => {
                      const isCancelled = apt.estado === "cancelada";
                      return (
                        <Card key={apt.id} className={`border ${isCancelled ? "opacity-60 bg-muted/30" : "bg-card"}`}>
                          <CardContent className="p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <Badge variant={isCancelled ? "destructive" : "default"} className="text-[10px] font-semibold">
                                {apt.estado?.toUpperCase() || "CONFIRMADA"}
                              </Badge>
                              <span className="font-bold text-primary">${apt.precio || 350}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg text-[11px]">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                <span className="font-semibold text-foreground">
                                  {apt.fechaCita ? new Date(apt.fechaCita).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "Por definir"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <span className="font-semibold text-foreground">
                                  {apt.hora_cita || (apt.fechaCita?.includes("T") ? apt.fechaCita.split("T")[1].slice(0, 5) : "10:00 AM")}
                                </span>
                              </div>
                            </div>

                            {!isCancelled && (
                              <div className="flex justify-end gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] text-muted-foreground"
                                  onClick={() => window.open("https://maps.app.goo.gl/UU3ypbdmix1R85KWA", "_blank")}
                                >
                                  <MapPin className="w-3 h-3 mr-1" /> Ubicación
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 text-[11px]"
                                  onClick={() => handleCancelAppointment(apt.id)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
