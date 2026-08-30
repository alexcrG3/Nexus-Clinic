import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Loader2, 
  Plus, 
  X,
  ChevronUp,
  Search,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMedicamentosCatalogo } from "@/hooks/useMedicamentosCatalogo";
import { RecetaActions } from "./RecetaActions";
import { VoiceDictationButton } from "@/components/ui/VoiceDictationButton";

interface SignosVitales {
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  saturacion_oxigeno?: number;
  temperatura?: number;
  frecuencia_respiratoria?: number;
  glucosa?: number;
  peso?: number;
  talla?: number;
}

interface Medicamento {
  nombre: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones?: string;
}

interface ConsultaData {
  id?: string;
  expediente_id: string;
  fecha?: string;
  tipo_consulta?: string;
  motivo_consulta?: string;
  padecimiento_actual?: string;
  anamnesis?: string;
  signos_vitales?: SignosVitales | any;
  examen_fisico?: string;
  diagnostico_principal?: string;
  codigo_cie10?: string;
  diagnosticos_secundarios?: string[];
  medicamentos_recetados?: Medicamento[] | any;
  plan_tratamiento?: string;
  recomendaciones?: string;
  notas_internas?: string;
  estado_consulta?: string;
  proxima_cita?: string;
  motivo_proxima_cita?: string;
}

interface ConsultaProfesionalProps {
  consulta?: ConsultaData | null;
  expedienteId: string;
  onSave: (data: ConsultaData) => Promise<void>;
  onCancel?: () => void;
  isNew?: boolean;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  profesionalNombre?: string;
}

// Input with underline style (primary color) - OUTSIDE component to prevent focus loss
const VitalInput = ({ 
  value, 
  onChange, 
  placeholder, 
  width = "w-14",
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder: string; 
  width?: string;
  label?: string;
}) => (
  <div className="flex flex-col">
    {label && <span className="text-xs text-muted-foreground mb-1">{label}</span>}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        width,
        "border-0 border-b-2 border-primary bg-transparent text-center text-lg font-medium focus:outline-none focus:border-primary/80 py-1 placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-base"
      )}
      placeholder={placeholder}
    />
  </div>
);

// Collapsible Section Component - styled like the reference images
const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="rounded-lg overflow-hidden border border-border shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <span className="font-semibold text-base">{title}</span>
        <ChevronUp className={cn("h-5 w-5 transition-transform", !isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="bg-card p-6 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export const ConsultaProfesional = ({
  consulta,
  expedienteId,
  onSave,
  onCancel,
  isNew = false,
  pacienteNombre,
  pacienteTelefono,
  pacienteEmail,
  profesionalNombre,
}: ConsultaProfesionalProps) => {
  const [saving, setSaving] = useState(false);

  // Tipo de consulta
  const [tipoConsulta, setTipoConsulta] = useState(consulta?.tipo_consulta || "inicial");
  
  // Motivo de consulta
  const [motivoConsulta, setMotivoConsulta] = useState(consulta?.motivo_consulta || "");
  const [padecimientoActual, setPadecimientoActual] = useState(consulta?.padecimiento_actual || consulta?.anamnesis || "");

  // Signos vitales with default values
  const signosVitalesData = consulta?.signos_vitales || {};
  const [presionSistolica, setPresionSistolica] = useState<string>(signosVitalesData.presion_sistolica?.toString() || "");
  const [presionDiastolica, setPresionDiastolica] = useState<string>(signosVitalesData.presion_diastolica?.toString() || "");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>(signosVitalesData.frecuencia_cardiaca?.toString() || "");
  const [saturacionOxigeno, setSaturacionOxigeno] = useState<string>(signosVitalesData.saturacion_oxigeno?.toString() || "");
  const [temperatura, setTemperatura] = useState<string>(signosVitalesData.temperatura?.toString() || "");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState<string>(signosVitalesData.frecuencia_respiratoria?.toString() || "");
  const [glucosa, setGlucosa] = useState<string>(signosVitalesData.glucosa?.toString() || "");
  const [peso, setPeso] = useState<string>(signosVitalesData.peso?.toString() || "");
  const [talla, setTalla] = useState<string>(signosVitalesData.talla?.toString() || "");
  
  // Physical exam text areas
  const [signosVitalesNotas, setSignosVitalesNotas] = useState("");
  const [examenFisico, setExamenFisico] = useState(consulta?.examen_fisico || "");
  const [notasEnfermero, setNotasEnfermero] = useState("");
  const [campoPersonalizado, setCampoPersonalizado] = useState("");
  const [nutricion, setNutricion] = useState("");

  // Diagnóstico
  const [impresionDiagnostica, setImpresionDiagnostica] = useState(consulta?.diagnostico_principal || "");
  const [codigoCie10, setCodigoCie10] = useState(consulta?.codigo_cie10 || "");

  // Medicamentos (receta)
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>(
    Array.isArray(consulta?.medicamentos_recetados) ? consulta.medicamentos_recetados : []
  );
  const [nuevoMedicamento, setNuevoMedicamento] = useState<Medicamento>({
    nombre: "",
    dosis: "",
    frecuencia: "",
    duracion: "",
    indicaciones: "",
  });

  // Autocomplete medicamentos
  const { buscarSugerencias, guardarMedicamento } = useMedicamentosCatalogo();
  const [sugerenciasMedicamentos, setSugerenciasMedicamentos] = useState<Array<{ id: string; nombre: string; indicaciones_comunes?: string }>>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const inputMedicamentoRef = useRef<HTMLInputElement>(null);
  const sugerenciasRef = useRef<HTMLDivElement>(null);

  // Buscar sugerencias cuando cambia el nombre del medicamento
  useEffect(() => {
    const buscar = async () => {
      if (nuevoMedicamento.nombre.length >= 1) {
        const sugerencias = await buscarSugerencias(nuevoMedicamento.nombre);
        setSugerenciasMedicamentos(sugerencias);
        setShowSugerencias(sugerencias.length > 0);
      } else {
        setSugerenciasMedicamentos([]);
        setShowSugerencias(false);
      }
    };
    
    const timeoutId = setTimeout(buscar, 200);
    return () => clearTimeout(timeoutId);
  }, [nuevoMedicamento.nombre, buscarSugerencias]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sugerenciasRef.current && 
        !sugerenciasRef.current.contains(e.target as Node) &&
        inputMedicamentoRef.current &&
        !inputMedicamentoRef.current.contains(e.target as Node)
      ) {
        setShowSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const seleccionarSugerencia = (sugerencia: { nombre: string; indicaciones_comunes?: string }) => {
    setNuevoMedicamento({
      ...nuevoMedicamento,
      nombre: sugerencia.nombre,
      indicaciones: sugerencia.indicaciones_comunes || ""
    });
    setShowSugerencias(false);
  };

  // Plan y recomendaciones
  const [otrasIndicaciones, setOtrasIndicaciones] = useState(consulta?.recomendaciones || "");

  // Seguimiento y próxima cita
  const [proximaCita, setProximaCita] = useState(consulta?.proxima_cita || "");
  const [motivoProximaCita, setMotivoProximaCita] = useState(consulta?.motivo_proxima_cita || "");
  const [notasInternas, setNotasInternas] = useState(consulta?.notas_internas || "");

  // Cálculo automático de IMC
  const imc = useMemo(() => {
    const pesoNum = parseFloat(peso);
    const tallaNum = parseFloat(talla) / 100;
    if (pesoNum > 0 && tallaNum > 0) {
      return (pesoNum / (tallaNum * tallaNum)).toFixed(1);
    }
    return null;
  }, [peso, talla]);

  const getImcCategory = (imcValue: number) => {
    if (imcValue < 18.5) return { label: "Bajo peso", color: "bg-blue-500" };
    if (imcValue < 25) return { label: "Normal", color: "bg-green-500" };
    if (imcValue < 30) return { label: "Sobrepeso", color: "bg-yellow-500" };
    return { label: "Obesidad", color: "bg-red-500" };
  };

  const agregarMedicamento = async () => {
    if (nuevoMedicamento.nombre.trim()) {
      setMedicamentos([...medicamentos, { ...nuevoMedicamento }]);
      
      // Guardar en catálogo para futuras sugerencias
      await guardarMedicamento({
        nombre: nuevoMedicamento.nombre.trim(),
        indicaciones: nuevoMedicamento.indicaciones
      });
      
      setNuevoMedicamento({
        nombre: "",
        dosis: "",
        frecuencia: "",
        duracion: "",
        indicaciones: "",
      });
    }
  };

  const eliminarMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: consulta?.id,
        expediente_id: expedienteId,
        fecha: consulta?.fecha || new Date().toISOString(),
        motivo_consulta: motivoConsulta,
        anamnesis: padecimientoActual,
        signos_vitales: {
          presion_sistolica: presionSistolica ? parseFloat(presionSistolica) : null,
          presion_diastolica: presionDiastolica ? parseFloat(presionDiastolica) : null,
          frecuencia_cardiaca: frecuenciaCardiaca ? parseFloat(frecuenciaCardiaca) : null,
          saturacion_oxigeno: saturacionOxigeno ? parseFloat(saturacionOxigeno) : null,
          temperatura: temperatura ? parseFloat(temperatura) : null,
          frecuencia_respiratoria: frecuenciaRespiratoria ? parseFloat(frecuenciaRespiratoria) : null,
          glucosa: glucosa ? parseFloat(glucosa) : null,
          peso: peso ? parseFloat(peso) : null,
          talla: talla ? parseFloat(talla) : null,
          imc: imc ? parseFloat(imc) : null,
          tipo_consulta: tipoConsulta,
        },
        examen_fisico: examenFisico,
        diagnostico_principal: impresionDiagnostica,
        codigo_cie10: codigoCie10,
        medicamentos_recetados: medicamentos,
        recomendaciones: otrasIndicaciones,
        notas_internas: notasInternas,
        proxima_cita: proximaCita || null,
        motivo_proxima_cita: motivoProximaCita,
        estado_consulta: consulta?.estado_consulta || "finalizada",
      });
    } catch (error) {
      console.error("Error saving consulta:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Motivo de consulta */}
      <CollapsibleSection title="Motivo de consulta">
        <div className="space-y-4">
          <div>
            <Label className="font-medium mb-2 block">Tipo de consulta</Label>
            <RadioGroup
              value={tipoConsulta}
              onValueChange={setTipoConsulta}
              className="flex items-center gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inicial" id="tipo-inicial" className="border-cyan-500 text-cyan-500" />
                <Label htmlFor="tipo-inicial" className="cursor-pointer">Consulta inicial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seguimiento" id="tipo-seguimiento" className="border-cyan-500 text-cyan-500" />
                <Label htmlFor="tipo-seguimiento" className="cursor-pointer">Consulta de seguimiento</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Motivo de consulta</Label>
              <VoiceDictationButton
                fieldLabel="Motivo de consulta"
                buttonText="Dictar"
                currentValue={motivoConsulta}
                onValueChange={setMotivoConsulta}
              />
            </div>
            <Textarea
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              placeholder="¿Cuál es la razón de visita del paciente?"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{motivoConsulta.length} / 3000</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Padecimiento</Label>
              <VoiceDictationButton
                fieldLabel="Padecimiento"
                buttonText="Dictar"
                currentValue={padecimientoActual}
                onValueChange={setPadecimientoActual}
              />
            </div>
            <Textarea
              value={padecimientoActual}
              onChange={(e) => setPadecimientoActual(e.target.value)}
              placeholder="¿Qué siente el paciente?"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{padecimientoActual.length} / 3000</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Examen físico */}
      <CollapsibleSection title="Examen físico">
        <div className="space-y-6">
          {/* Signos vitales text area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-semibold">Signos vitales / Hallazgos</Label>
              <VoiceDictationButton
                fieldLabel="Signos vitales"
                buttonText="Dictar"
                currentValue={signosVitalesNotas}
                onValueChange={setSignosVitalesNotas}
              />
            </div>
            <Textarea
              value={signosVitalesNotas}
              onChange={(e) => setSignosVitalesNotas(e.target.value)}
              placeholder="¿Qué encontraste en el paciente?"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{signosVitalesNotas.length} / 3000</p>
          </div>

          {/* Vital signs grid - compact horizontal layout */}
          <div className="space-y-4">
            {/* Row 1: PA, FC, SpO2, Temp, FR */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              {/* Presión Arterial */}
              <div className="flex items-end gap-1">
                <VitalInput value={presionSistolica} onChange={setPresionSistolica} placeholder="120" label="PA" />
                <span className="text-lg font-medium pb-1">/</span>
                <VitalInput value={presionDiastolica} onChange={setPresionDiastolica} placeholder="80" width="w-12" />
                <span className="text-sm text-muted-foreground pb-1 ml-1">mmHg</span>
              </div>

              {/* FC */}
              <div className="flex items-end gap-1">
                <VitalInput value={frecuenciaCardiaca} onChange={setFrecuenciaCardiaca} placeholder="72" label="FC" />
                <span className="text-sm text-muted-foreground pb-1">lpm</span>
              </div>

              {/* SpO2 */}
              <div className="flex items-end gap-1">
                <VitalInput value={saturacionOxigeno} onChange={setSaturacionOxigeno} placeholder="97" label="SpO2" />
                <span className="text-sm text-muted-foreground pb-1">%</span>
              </div>

              {/* Temperatura */}
              <div className="flex items-end gap-1">
                <VitalInput value={temperatura} onChange={setTemperatura} placeholder="36.5" label="Temp" />
                <span className="text-sm text-muted-foreground pb-1">°C</span>
              </div>

              {/* FR */}
              <div className="flex items-end gap-1">
                <VitalInput value={frecuenciaRespiratoria} onChange={setFrecuenciaRespiratoria} placeholder="18" label="FR" width="w-12" />
                <span className="text-sm text-muted-foreground pb-1">rpm</span>
              </div>
            </div>

            {/* Row 2: Glucosa */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div className="flex items-end gap-1">
                <VitalInput value={glucosa} onChange={setGlucosa} placeholder="100" label="Glucosa" />
                <span className="text-sm text-muted-foreground pb-1">mg/dl</span>
              </div>
            </div>

            {/* Row 3: Peso, Talla, IMC */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div className="flex items-end gap-1">
                <VitalInput value={peso} onChange={setPeso} placeholder="65" label="Peso" />
                <span className="text-sm text-muted-foreground pb-1">kg</span>
              </div>

              <div className="flex items-end gap-1">
                <VitalInput value={talla} onChange={setTalla} placeholder="160" label="Talla" />
                <span className="text-sm text-muted-foreground pb-1">cm</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-1">IMC</span>
                <div className="flex items-center gap-2">
                  <span className="border-b-2 border-primary px-3 py-1 text-lg font-medium min-w-[55px] text-center">
                    {imc || "—"}
                  </span>
                  {imc && (
                    <Badge className={cn(getImcCategory(parseFloat(imc)).color, "text-white text-xs")}>
                      {getImcCategory(parseFloat(imc)).label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notas de Enfermero(a) tratante */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Notas de Enfermero(a) tratante</Label>
              <VoiceDictationButton
                fieldLabel="Notas de enfermero"
                buttonText="Dictar"
                currentValue={notasEnfermero}
                onValueChange={setNotasEnfermero}
              />
            </div>
            <Textarea
              value={notasEnfermero}
              onChange={(e) => setNotasEnfermero(e.target.value)}
              placeholder="Respuesta"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{notasEnfermero.length} / 3000</p>
          </div>

          {/* Campo personalizado (Question 2) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Question 2</Label>
              <VoiceDictationButton
                fieldLabel="Campo adicional"
                buttonText="Dictar"
                currentValue={campoPersonalizado}
                onValueChange={setCampoPersonalizado}
              />
            </div>
            <Textarea
              value={campoPersonalizado}
              onChange={(e) => setCampoPersonalizado(e.target.value)}
              placeholder="Respuesta"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{campoPersonalizado.length} / 3000</p>
          </div>

          {/* Nutrición */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Nutrición</Label>
              <VoiceDictationButton
                fieldLabel="Nutrición"
                buttonText="Dictar"
                currentValue={nutricion}
                onValueChange={setNutricion}
              />
            </div>
            <Textarea
              value={nutricion}
              onChange={(e) => setNutricion(e.target.value)}
              placeholder="Respuesta"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{nutricion.length} / 3000</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Diagnóstico */}
      <CollapsibleSection title="Diagnóstico">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Impresión diagnóstica</Label>
              <VoiceDictationButton
                fieldLabel="Diagnóstico"
                buttonText="Dictar"
                currentValue={impresionDiagnostica}
                onValueChange={setImpresionDiagnostica}
              />
            </div>
            <Textarea
              value={impresionDiagnostica}
              onChange={(e) => setImpresionDiagnostica(e.target.value)}
              placeholder="Impresión diagnóstica"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{impresionDiagnostica.length} / 3000</p>
          </div>

          <div>
            <Label className="font-medium">CIE-10 (Diagnóstico)</Label>
            <div className="relative mt-1">
              <Input
                value={codigoCie10}
                onChange={(e) => setCodigoCie10(e.target.value)}
                placeholder="CIE-10 (Diagnóstico)"
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Puedes buscar por código o nombre de diagnóstico</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Tratamiento */}
      <CollapsibleSection title="Tratamiento">
        <div className="space-y-4">
          {/* Receta de medicamentos */}
          <div className="flex items-center justify-between">
            <Label className="font-semibold text-base">Receta de medicamentos</Label>
            <RecetaActions
              medicamentos={medicamentos}
              pacienteNombre={pacienteNombre}
              pacienteTelefono={pacienteTelefono}
              pacienteEmail={pacienteEmail}
              profesionalNombre={profesionalNombre}
              diagnostico={impresionDiagnostica}
            />
          </div>

          {/* Lista de medicamentos */}
          {medicamentos.length > 0 && (
            <div className="space-y-3">
              {medicamentos.map((med, idx) => (
                <div key={idx} className="flex items-start justify-between py-2 border-b border-border">
                  <div>
                    <p className="font-medium">{idx + 1}. {med.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.indicaciones || "Sin indicaciones adicionales"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => eliminarMedicamento(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agregar medicamento */}
          <div className="space-y-3">
            <div className="relative">
              <Input
                ref={inputMedicamentoRef}
                value={nuevoMedicamento.nombre}
                onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, nombre: e.target.value })}
                onFocus={() => {
                  if (sugerenciasMedicamentos.length > 0) {
                    setShowSugerencias(true);
                  }
                }}
                placeholder="Medicamento"
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              
              {/* Dropdown de sugerencias */}
              {showSugerencias && sugerenciasMedicamentos.length > 0 && (
                <div 
                  ref={sugerenciasRef}
                  className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {sugerenciasMedicamentos.map((sugerencia) => (
                    <button
                      key={sugerencia.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                      onClick={() => seleccionarSugerencia(sugerencia)}
                    >
                      <p className="font-medium text-sm">{sugerencia.nombre}</p>
                      {sugerencia.indicaciones_comunes && (
                        <p className="text-xs text-muted-foreground truncate">{sugerencia.indicaciones_comunes}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                value={nuevoMedicamento.indicaciones}
                onChange={(e) => setNuevoMedicamento({ ...nuevoMedicamento, indicaciones: e.target.value })}
                placeholder="Indicaciones"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nuevoMedicamento.nombre.trim()) {
                    e.preventDefault();
                    agregarMedicamento();
                  }
                }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="text-primary border-primary hover:bg-primary/10"
              onClick={agregarMedicamento}
              disabled={!nuevoMedicamento.nombre.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              {medicamentos.length > 0 ? "AGREGAR OTRO MEDICAMENTO" : "AGREGAR MEDICAMENTO"}
            </Button>
          </div>

          <Separator />

          {/* Otras indicaciones */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium text-muted-foreground">Otras indicaciones / Plan de tratamiento</Label>
              <VoiceDictationButton
                fieldLabel="Otras indicaciones"
                buttonText="Dictar"
                currentValue={otrasIndicaciones}
                onValueChange={setOtrasIndicaciones}
              />
            </div>
            <Textarea
              value={otrasIndicaciones}
              onChange={(e) => setOtrasIndicaciones(e.target.value)}
              placeholder="Escribe tus indicaciones"
              rows={3}
              className="mt-2 border-0 p-0 focus-visible:ring-0 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{otrasIndicaciones.length} / 3000</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Seguimiento y Próxima Cita */}
      <CollapsibleSection title="Seguimiento y Próxima Cita">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Fecha Próxima Cita</Label>
              <Input
                type="date"
                value={proximaCita}
                onChange={(e) => setProximaCita(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-medium">Motivo del Próximo Control</Label>
              <Input
                value={motivoProximaCita}
                onChange={(e) => setMotivoProximaCita(e.target.value)}
                placeholder="Ej: Control de evolución"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="font-medium">Notas Internas (Solo visible para equipo médico)</Label>
              <VoiceDictationButton
                fieldLabel="Notas internas"
                buttonText="Dictar"
                currentValue={notasInternas}
                onValueChange={setNotasInternas}
              />
            </div>
            <Textarea
              value={notasInternas}
              onChange={(e) => setNotasInternas(e.target.value)}
              placeholder="Observaciones internas, comentarios para el equipo..."
              rows={4}
              className="mt-1"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer with actions */}
      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background py-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving} className="bg-primary">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isNew ? "Guardar Consulta" : "Actualizar Consulta"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
