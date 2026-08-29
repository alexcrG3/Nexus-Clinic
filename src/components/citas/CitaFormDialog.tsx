import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail,
  CreditCard,
  Stethoscope, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  Globe,
  UserPlus,
  Search
} from "lucide-react";
import { format, addDays, isSameDay, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import { useCreateAppointment, useAppointments } from "@/hooks/useAppointments";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CitaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CitaFormDialog = ({ open, onOpenChange }: CitaFormDialogProps) => {
  const queryClient = useQueryClient();

  // Modo Paciente: 'registrado' o 'nuevo'
  const [patientMode, setPatientMode] = useState<"registrado" | "nuevo">("registrado");

  // Campos Paciente
  const [clienteId, setClienteId] = useState<string | undefined>();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");

  // Campos Consulta & Horarios
  const [notas, setNotas] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHora, setSelectedHora] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAppointment = useCreateAppointment();
  const { data: appointments } = useAppointments();

  // Pacientes registrados
  const { data: clientes } = useQuery({
    queryKey: ["clientes-dialog-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre, apellidos, telefono, email, cedula")
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  // Doctores activos
  const { data: doctores } = useQuery({
    queryKey: ["doctores-activos-dialog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctores")
        .select("id, nombre, especialidad, activo")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
  });

  // Default doctor
  useEffect(() => {
    if (doctores && doctores.length > 0 && !doctorId) {
      setDoctorId(doctores[0].id);
    }
  }, [doctores, doctorId]);

  // Lista de los próximos 14 días
  const nextDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Horarios de atención clínica estándar
  const allTimeSlots = [
    "08:30", "09:15", "10:00", "10:45", "11:30", 
    "13:00", "13:45", "14:30", "15:15", "16:00", "16:45"
  ];

  // Helper para saber qué horas están ocupadas en una fecha dada
  const getOccupiedHoursForDate = (date: Date, filterDoctor?: string) => {
    if (!appointments) return new Set<string>();
    const dateStr = format(date, "yyyy-MM-dd");

    return new Set(
      appointments
        .filter((apt) => {
          if (!apt.fechaCita || apt.estado === "cancelada") return false;
          const aptDateOnly = apt.fechaCita.split("T")[0];
          const matchesDate = aptDateOnly === dateStr;
          const matchesDoc = filterDoctor ? apt.doctor_id === filterDoctor : true;
          return matchesDate && matchesDoc;
        })
        .map((apt) => (apt.hora_cita ? apt.hora_cita.substring(0, 5) : ""))
    );
  };

  const occupiedToday = getOccupiedHoursForDate(selectedDate, doctorId);

  // Calcular cantidad de horarios libres para un día
  const getFreeSlotsCount = (date: Date) => {
    if (isWeekend(date) && date.getDay() === 0) return 0; // Domingo cerrado
    const occupied = getOccupiedHoursForDate(date, doctorId);
    return allTimeSlots.filter((slot) => !occupied.has(slot)).length;
  };

  const handleSelectExistingClient = (value: string) => {
    setClienteId(value);
    const cliente = clientes?.find((c) => c.id === value);
    if (cliente) {
      setNombre(cliente.nombre || "");
      setApellidos(cliente.apellidos || "");
      setTelefono(cliente.telefono || "");
      setEmail(cliente.email || "");
      setCedula(cliente.cedula || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreTrimmed = nombre.trim();
    const apellidosTrimmed = apellidos.trim();
    const telefonoTrimmed = telefono.trim();
    const fullName = `${nombreTrimmed} ${apellidosTrimmed}`.trim();

    if (!nombreTrimmed) {
      toast.error("Por favor ingresa el nombre del paciente.");
      return;
    }

    if (!selectedHora) {
      toast.error("Por favor selecciona un horario disponible.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalClienteId = clienteId;

      // 1. Si es paciente nuevo, crearlo en la base de datos de clientes
      if (patientMode === "nuevo") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organizacion_id")
          .single();

        const orgId = profile?.organizacion_id || localStorage.getItem("active_org_id") || null;

        const { data: newClient, error: clientErr } = await supabase
          .from("clientes")
          .insert({
            nombre: nombreTrimmed,
            apellidos: apellidosTrimmed,
            telefono: telefonoTrimmed || null,
            email: email.trim() || null,
            cedula: cedula.trim() || null,
            organizacion_id: orgId,
          })
          .select("id")
          .single();

        if (clientErr) {
          console.warn("No se pudo insertar en clientes:", clientErr);
        } else if (newClient) {
          finalClienteId = newClient.id;
          queryClient.invalidateQueries({ queryKey: ["clientes"] });
          queryClient.invalidateQueries({ queryKey: ["clientes-dialog-list"] });
        }
      }

      // 2. Crear la Cita Médica
      await createAppointment.mutateAsync({
        nombre: fullName,
        telefono: telefonoTrimmed,
        fechaCita: format(selectedDate, "yyyy-MM-dd"),
        hora_cita: selectedHora,
        estado: "confirmada",
        cliente_id: finalClienteId || null,
        doctor_id: doctorId || null,
        motivo: notas.trim() || undefined,
      });

      toast.success(`¡Cita agendada exitosamente para ${fullName}!`);

      // Reset
      setNombre("");
      setApellidos("");
      setTelefono("");
      setEmail("");
      setCedula("");
      setNotas("");
      setSelectedHora("");
      setClienteId(undefined);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al programar la cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDoctor = doctores?.find((d) => d.id === doctorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] rounded-3xl p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-2xl font-sans max-h-[92vh] flex flex-col">
        
        {/* Cabecera de la Cita */}
        <div className="bg-slate-50 dark:bg-slate-900/90 p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 text-left shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 mr-1" /> Agendamiento Clínico Inteligente
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Agenda tu Consulta Médica
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            <span className="font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              {currentDoctor ? `${currentDoctor.nombre} (${currentDoctor.especialidad || "Odontología"})` : "Especialista Clínico"}
            </span>
            <span>• Duración: <strong className="text-slate-900 dark:text-white">30 - 45 min</strong></span>
          </div>

          {/* Selector de Doctor */}
          <div className="mt-3 flex items-center gap-2.5">
            <span className="text-xs font-bold text-muted-foreground shrink-0">Doctor:</span>
            <Select value={doctorId || "none"} onValueChange={(val) => setDoctorId(val === "none" ? undefined : val)}>
              <SelectTrigger className="h-8 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 max-w-xs border-slate-200">
                <SelectValue placeholder="Seleccionar doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctores?.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.nombre} - {doc.especialidad || "Odontólogo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Formulario Principal con Scroll */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-left overflow-y-auto flex-1">
          
          {/* Bloque de Paciente (Toggle Registrado vs Nuevo) */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Datos del Paciente
              </span>

              {/* Toggle de Selección */}
              <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                <button
                  type="button"
                  onClick={() => setPatientMode("registrado")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    patientMode === "registrado"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Search className="w-3 h-3" /> Paciente Registrado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode("nuevo");
                    setClienteId(undefined);
                    setNombre("");
                    setApellidos("");
                    setTelefono("");
                    setEmail("");
                    setCedula("");
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    patientMode === "nuevo"
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="w-3 h-3" /> + Nuevo Paciente
                </button>
              </div>
            </div>

            {/* Si es paciente registrado: Buscador Dropdown */}
            {patientMode === "registrado" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Buscar en el directorio de pacientes:
                  </Label>
                  <Select onValueChange={handleSelectExistingClient} value={clienteId || ""}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200">
                      <SelectValue placeholder="Selecciona un paciente por nombre..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {clientes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} {c.apellidos} {c.telefono ? `(${c.telefono})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {clienteId && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block">NOMBRE:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">{nombre} {apellidos}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block">TELÉFONO:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{telefono || "Sin teléfono"}</span>
                    </div>
                    {email && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-muted-foreground block">EMAIL:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Si es paciente nuevo: Formulario completo de registro */
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nombre" className="text-[11px] font-bold">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan"
                      required
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="apellidos" className="text-[11px] font-bold">Apellidos</Label>
                    <Input
                      id="apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      placeholder="Ej. Pérez Gómez"
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="telefono" className="text-[11px] font-bold">Teléfono / WhatsApp *</Label>
                    <Input
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. +506 8888-1234"
                      required
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[11px] font-bold">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cedula" className="text-[11px] font-bold">Cédula / Identificación</Label>
                    <Input
                      id="cedula"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="1-2345-6789"
                      className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✦ Al confirmar, se creará el expediente clínico y perfil del paciente automáticamente.
                </p>
              </div>
            )}
          </div>

          {/* Selector Interactivo de Fecha y Horarios Libres (2 Columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Columna Izquierda (5 cols): Fechas Disponibles */}
            <div className="md:col-span-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fechas Disponibles
              </span>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {nextDays.map((day, idx) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const freeCount = getFreeSlotsCount(day);
                  const isSunday = day.getDay() === 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isSunday}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedHora("");
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSunday
                          ? "opacity-40 bg-slate-100 dark:bg-slate-800/40 border-transparent cursor-not-allowed"
                          : isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/40 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarIcon className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="capitalize">
                          {format(day, "EEE d MMM", { locale: es })}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] py-0 px-2 font-bold ${
                          isSunday
                            ? "bg-slate-200 text-slate-500"
                            : isSelected
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {isSunday ? "Cerrado" : `${freeCount} libres`}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha (7 cols): Horarios Disponibles en Grid */}
            <div className="md:col-span-7 space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </h4>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Globe className="w-3 h-3 text-primary" /> Horarios en: <span className="font-semibold text-slate-700 dark:text-slate-300">America/Costa_Rica</span>
                </p>
              </div>

              {/* Grid de Horarios */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Horarios Disponibles
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {allTimeSlots.map((slot) => {
                    const isOccupied = occupiedToday.has(slot);
                    const isSelected = selectedHora === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setSelectedHora(slot)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center relative ${
                          isOccupied
                            ? "opacity-35 bg-slate-100 dark:bg-slate-800/40 border-slate-200 line-through cursor-not-allowed text-muted-foreground"
                            : isSelected
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas Opcionales */}
              <div className="space-y-1 pt-1">
                <Label htmlFor="notas" className="text-[11px] font-bold text-muted-foreground">
                  Notas / Motivo de Consulta (Opcional)
                </Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Revisión general, dolor en molar o profilaxis..."
                  rows={2}
                  className="text-xs rounded-xl resize-none bg-white dark:bg-slate-800"
                />
              </div>
            </div>

          </div>

          {/* Footer Inferior con Resumen y Botón de Confirmación */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {selectedHora ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Se agendará para las <strong className="text-primary font-black">{selectedHora}</strong> el{" "}
                    <strong className="capitalize">{format(selectedDate, "EEE d 'de' MMM", { locale: es })}</strong>
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Selecciona un horario en el panel
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl h-10 px-4 w-1/2 sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedHora || !nombre.trim()}
                className="text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 h-10 px-5 w-1/2 sm:w-auto gap-1.5"
              >
                <CalendarIcon className="w-4 h-4" /> {isSubmitting ? "Agendando..." : "Confirmar Cita"}
              </Button>
            </div>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
};

export default CitaFormDialog;
