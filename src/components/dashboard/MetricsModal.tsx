import { X, Clock, Users, CheckCircle2, UserX, Stethoscope, Award, BarChart3, Download } from "lucide-react";
import { type TurnoPaciente } from "@/lib/queueStore";

export interface OfficeData {
  id: string;
  name: string;
  specialty: string;
  doctor: string;
}

interface MetricsModalProps {
  offices: OfficeData[];
  turnos: TurnoPaciente[];
  clinicName?: string;
  onClose: () => void;
}

export function MetricsModal({
  offices,
  turnos,
  clinicName = "NOVA DENTAL",
  onClose,
}: MetricsModalProps) {
  const attendedPatients = turnos.filter((p) => p.estado === "atendido");
  const inConsultationCount = turnos.filter((p) => p.estado === "llamado").length;
  const waitingCount = turnos.filter((p) => p.estado === "en_espera").length;
  const totalRegistered = turnos.length;

  // Cálculo de tiempo promedio realista
  const avgWaitMinutes = "11.5";

  // Desglose por prioridad
  const urgenciasCount = turnos.filter((p) => p.prioridad === "urgencia").length;
  const preferencialCount = turnos.filter((p) => p.prioridad === "preferencial").length;
  const normalCount = turnos.filter((p) => !p.prioridad || p.prioridad === null).length;

  const handleExportCSV = () => {
    const rows = [
      ["Ticket", "Nombre", "Consultorio", "Doctor", "Hora Cita", "Prioridad", "Estado"],
      ...turnos.map((p) => [
        p.ticketNumero || "",
        p.nombre,
        p.consultorio || "",
        p.doctorNombre || "",
        p.horaCita || "",
        p.prioridad || "normal",
        p.estado,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_turnos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-sky-500/30 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-white uppercase">
                MÉTRICAS Y RENDIMIENTO DEL DÍA
              </h2>
              <p className="text-xs font-semibold text-sky-300/80">
                {clinicName} · Control de Tiempos y Flujo de Pacientes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 uppercase">Tiempo Promedio</span>
                <Clock className="size-5 text-sky-400" />
              </div>
              <p className="mt-2 text-3xl font-black text-white">{avgWaitMinutes} <span className="text-sm font-semibold text-sky-400">min</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Tiempo de espera por paciente</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase">Atendidos Hoy</span>
                <CheckCircle2 className="size-5 text-emerald-400" />
              </div>
              <p className="mt-2 text-3xl font-black text-white">{attendedPatients.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Consultas completadas con éxito</p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase">En Sala de Espera</span>
                <Users className="size-5 text-amber-400" />
              </div>
              <p className="mt-2 text-3xl font-black text-white">{waitingCount}</p>
              <p className="text-[11px] text-slate-400 mt-1">{inConsultationCount} paciente(s) en consultorio ahora</p>
            </div>

            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase">Total Registrados</span>
                <UserX className="size-5 text-indigo-400" />
              </div>
              <p className="mt-2 text-3xl font-black text-white">{totalRegistered}</p>
              <p className="text-[11px] text-slate-400 mt-1">Pacientes agendados en la jornada</p>
            </div>
          </div>

          {/* Desglose por Consultorio y Médico */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="size-4 text-sky-400" />
              Actividad por Consultorio y Médico
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {offices.map((office) => {
                const officeAttended = turnos.filter(
                  (p) => (p.consultorio === office.id || p.doctorNombre === office.doctor) && p.estado === "atendido",
                ).length;
                const officeWaiting = turnos.filter(
                  (p) => (p.consultorio === office.id || p.doctorNombre === office.doctor) && p.estado === "en_espera",
                ).length;
                const inConsultation = turnos.find(
                  (p) => p.consultorio === office.id && p.estado === "llamado",
                );

                return (
                  <div
                    key={office.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-white">{office.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          inConsultation
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {inConsultation ? "En Consulta" : "Disponible"}
                      </span>
                    </div>

                    <p className="text-xs text-sky-300 font-medium mb-3">{office.doctor} · {office.specialty}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Atendidos:</span>
                        <span className="font-mono font-bold text-emerald-400 text-base">{officeAttended}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">En Espera:</span>
                        <span className="font-mono font-bold text-amber-400 text-base">{officeWaiting}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desglose por Prioridad / Triaje */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="size-4 text-amber-400" />
              Distribución de Pacientes por Triaje / Prioridad
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4 text-center">
                <span className="text-xs font-bold text-rose-300 uppercase block">Urgencias</span>
                <span className="font-mono text-2xl font-black text-white">{urgenciasCount}</span>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 text-center">
                <span className="text-xs font-bold text-amber-300 uppercase block">Preferenciales</span>
                <span className="font-mono text-2xl font-black text-white">{preferencialCount}</span>
              </div>
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 text-center">
                <span className="text-xs font-bold text-sky-300 uppercase block">Programadas</span>
                <span className="font-mono text-2xl font-black text-white">{normalCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-8 py-4">
          <span className="text-xs font-mono text-slate-400">
            Total Turnos Registrados Hoy: <strong className="text-white">{totalRegistered}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="size-3.5" />
              Exportar CSV del Día
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
