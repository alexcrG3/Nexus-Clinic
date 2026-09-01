import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Circle, 
  X, 
  History, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ToothSVG, getToothType, isUpperArch } from "./ToothSVG";

// Estados dentales estandarizados con colores clínicos HSL
const ESTADOS_DENTALES = {
  sano: { 
    label: "Sano", 
    color: "hsl(var(--dental-healthy))",
    bgClass: "bg-dental-healthy",
    description: "Diente sin patología",
    icon: CheckCircle2
  },
  caries: { 
    label: "Caries", 
    color: "hsl(var(--dental-caries))",
    bgClass: "bg-dental-caries",
    description: "Lesión cariosa activa",
    icon: AlertCircle
  },
  obturacion: { 
    label: "Obturación", 
    color: "hsl(var(--dental-filling))",
    bgClass: "bg-dental-filling",
    description: "Restauración presente",
    icon: Circle
  },
  corona: { 
    label: "Corona", 
    color: "hsl(var(--dental-crown))",
    bgClass: "bg-dental-crown",
    description: "Corona protésica",
    icon: Circle
  },
  ausente: { 
    label: "Ausente", 
    color: "hsl(var(--dental-missing))",
    bgClass: "bg-dental-missing",
    description: "Diente no presente",
    icon: X
  },
  endodoncia: { 
    label: "Endodoncia", 
    color: "hsl(var(--dental-endodontics))",
    bgClass: "bg-dental-endodontics",
    description: "Tratamiento de conducto",
    icon: Stethoscope
  },
  implante: { 
    label: "Implante", 
    color: "hsl(var(--dental-implant))",
    bgClass: "bg-dental-implant",
    description: "Implante dental",
    icon: Circle
  },
  fractura: { 
    label: "Fractura", 
    color: "hsl(var(--dental-fracture))",
    bgClass: "bg-dental-fracture",
    description: "Fractura dental",
    icon: AlertCircle
  },
  sellante: { 
    label: "Sellante", 
    color: "hsl(var(--dental-sealant))",
    bgClass: "bg-dental-sealant",
    description: "Sellante de fosetas y fisuras",
    icon: Circle
  },
  extraccion_indicada: { 
    label: "Extracción Indicada", 
    color: "hsl(var(--dental-extraction))",
    bgClass: "bg-dental-extraction",
    description: "Indicado para extracción",
    icon: X
  },
};

type EstadoDental = keyof typeof ESTADOS_DENTALES;

const SUPERFICIES = ["oclusal", "mesial", "distal", "vestibular", "lingual", "palatina"] as const;
type Superficie = typeof SUPERFICIES[number];

interface DienteData {
  condicion?: EstadoDental;
  superficies?: Partial<Record<Superficie, EstadoDental>>;
  notas?: string;
}

interface HistorialEntry {
  fecha: string;
  accion: string;
  superficie?: string;
  estadoAnterior?: string;
  estadoNuevo: string;
  profesional?: string;
}

interface OdontogramaData {
  [diente: string]: DienteData;
}

interface Tratamiento {
  id: string;
  diente_numero: number;
  superficie?: string;
  tratamiento: string;
  estado: string;
  color?: string;
  notas?: string;
  fecha_tratamiento: string;
}

interface OdontogramaProfesionalProps {
  data: OdontogramaData;
  onUpdate?: (data: OdontogramaData) => void;
  readOnly?: boolean;
  tratamientos?: Tratamiento[];
  historial?: Record<string, HistorialEntry[]>;
  onAddTratamiento?: (tratamiento: Omit<Tratamiento, "id">) => void;
}

// Componente de diente individual con ilustración anatómica
const DienteInteractivo = ({
  numero,
  data,
  isSelected,
  onClick,
  readOnly,
}: {
  numero: number;
  data?: DienteData;
  isSelected: boolean;
  onClick: () => void;
  readOnly?: boolean;
}) => {
  const isAusente = data?.condicion === "ausente";
  const isSuperior = numero <= 28;
  const toothType = getToothType(numero);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={readOnly}
            className={cn(
              "relative flex flex-col items-center transition-all duration-150 group p-0.5 sm:p-1 shrink-0 rounded-lg",
              "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
              isSelected && "scale-105 ring-2 ring-primary ring-offset-1 bg-primary/10 shadow-sm",
              readOnly && "cursor-default hover:scale-100",
              isAusente && "opacity-40"
            )}
          >
            {/* Diente anatómico SVG */}
            <div className={cn("relative", !isSuperior && "rotate-180")}>
              <ToothSVG
                numero={numero}
                condicion={data?.condicion}
                superficies={data?.superficies as Record<string, string> | undefined}
                width={toothType === "molar" ? 28 : toothType === "premolar" ? 24 : 20}
                height={50}
                isSelected={isSelected}
              />
            </div>
            
            {/* Indicador de superficies con diagrama pequeño */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 mt-0.5">
              <ToothDiagram 
                data={data}
                isSuperior={isSuperior}
                size={26}
              />
            </div>
            
            {/* Número del diente */}
            <span className={cn(
              "text-[10px] sm:text-xs font-bold mt-0.5 transition-colors",
              isSelected ? "text-primary font-black" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {numero}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-sm space-y-1">
            <p className="font-semibold">Diente {numero}</p>
            {data?.condicion && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: ESTADOS_DENTALES[data.condicion]?.color }}
                />
                <span>{ESTADOS_DENTALES[data.condicion]?.label}</span>
              </div>
            )}
            {data?.notas && (
              <p className="text-xs text-muted-foreground border-t pt-1">
                {data.notas}
              </p>
            )}
            {!readOnly && <p className="text-xs text-muted-foreground italic">Clic para editar</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Diagrama de superficies pequeño
const ToothDiagram = ({ 
  data, 
  isSuperior, 
  size = 26 
}: { 
  data?: DienteData; 
  isSuperior: boolean;
  size?: number;
}) => {
  const getSuperficieColor = (superficie: Superficie): string => {
    if (!data?.superficies?.[superficie]) return "hsl(var(--muted))";
    const condicion = data.superficies[superficie];
    return condicion ? ESTADOS_DENTALES[condicion]?.color || "hsl(var(--muted))" : "hsl(var(--muted))";
  };

  const superficieBajo = isSuperior ? "palatina" : "lingual";

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="drop-shadow-sm">
      {/* Superficie Oclusal (centro) */}
      <rect
        x="14"
        y="14"
        width="16"
        height="16"
        fill={getSuperficieColor("oclusal")}
        stroke="hsl(var(--border))"
        strokeWidth="1"
        rx="1"
      />
      {/* Superficie Vestibular (arriba) */}
      <path
        d="M14,14 L30,14 L40,4 L4,4 Z"
        fill={getSuperficieColor("vestibular")}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      {/* Superficie Lingual/Palatina (abajo) */}
      <path
        d="M14,30 L30,30 L40,40 L4,40 Z"
        fill={getSuperficieColor(superficieBajo)}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      {/* Superficie Mesial (izquierda) */}
      <path
        d="M4,4 L14,14 L14,30 L4,40 Z"
        fill={getSuperficieColor("mesial")}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      {/* Superficie Distal (derecha) */}
      <path
        d="M40,4 L30,14 L30,30 L40,40 Z"
        fill={getSuperficieColor("distal")}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      
      {/* Indicadores especiales */}
      {data?.condicion === "ausente" && (
        <g>
          <line x1="8" y1="8" x2="36" y2="36" stroke="hsl(var(--dental-extraction))" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="8" x2="8" y2="36" stroke="hsl(var(--dental-extraction))" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {data?.condicion === "implante" && (
        <circle cx="22" cy="22" r="5" fill="none" stroke="hsl(var(--dental-implant))" strokeWidth="1.5" strokeDasharray="2 1" />
      )}
    </svg>
  );
};

// Panel lateral contextual
const PanelDiente = ({
  dienteNumero,
  dienteData,
  historial = [],
  tratamientosDiente = [],
  onUpdateCondicion,
  onUpdateSuperficie,
  onUpdateNotas,
  onClose,
  readOnly = false,
}: {
  dienteNumero: number;
  dienteData?: DienteData;
  historial?: HistorialEntry[];
  tratamientosDiente?: Tratamiento[];
  onUpdateCondicion: (condicion: EstadoDental) => void;
  onUpdateSuperficie: (superficie: Superficie, condicion: EstadoDental) => void;
  onUpdateNotas: (notas: string) => void;
  onClose: () => void;
  readOnly?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<"estado" | "superficies" | "historial">("estado");
  const isSuperior = dienteNumero <= 28;

  const tratamientosPendientes = tratamientosDiente.filter(t => t.estado === "pendiente");
  const tratamientosCompletados = tratamientosDiente.filter(t => t.estado === "completado");

  return (
    <div className="w-full xl:w-84 2xl:w-96 border-t xl:border-t-0 xl:border-l bg-card flex flex-col shrink-0 min-h-[460px] max-h-[700px]">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <span className="font-black text-primary text-base">{dienteNumero}</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Diente {dienteNumero}</h3>
              <p className="text-xs text-muted-foreground">
                {isSuperior ? "Arcada Superior" : "Arcada Inferior"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Estado actual */}
        {dienteData?.condicion && (
          <div className="mt-3 flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0" 
              style={{ backgroundColor: ESTADOS_DENTALES[dienteData.condicion]?.color }}
            />
            <span className="text-xs font-bold">
              {ESTADOS_DENTALES[dienteData.condicion]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-muted/10">
        <button
          onClick={() => setActiveTab("estado")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold transition-colors border-b-2",
            activeTab === "estado" 
              ? "border-primary text-primary bg-background" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Estado
        </button>
        <button
          onClick={() => setActiveTab("superficies")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold transition-colors border-b-2",
            activeTab === "superficies" 
              ? "border-primary text-primary bg-background" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Superficies
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={cn(
            "flex-1 py-2.5 text-xs font-bold transition-colors border-b-2 relative",
            activeTab === "historial" 
              ? "border-primary text-primary bg-background" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Historial
          {historial.length > 0 && (
            <span className="absolute top-1.5 right-2 w-3.5 h-3.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {historial.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeTab === "estado" && (
            <>
              {/* Acciones rápidas - Estado general */}
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                  Estado General
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ESTADOS_DENTALES).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      disabled={readOnly}
                      onClick={() => onUpdateCondicion(key as EstadoDental)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border text-left transition-all text-xs font-medium bg-background",
                        "hover:shadow-md hover:border-primary/50",
                        dienteData?.condicion === key && "ring-2 ring-primary bg-primary/10 border-primary font-bold",
                        readOnly && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div 
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notas del diente */}
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Notas clínicas
                </h4>
                <Textarea
                  placeholder="Observaciones clínicas para este diente..."
                  value={dienteData?.notas || ""}
                  onChange={(e) => onUpdateNotas(e.target.value)}
                  disabled={readOnly}
                  className="min-h-[80px] text-xs resize-none rounded-xl"
                />
              </div>

              {/* Tratamientos asociados */}
              {tratamientosDiente.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Tratamientos ({tratamientosDiente.length})
                  </h4>
                  <div className="space-y-1.5">
                    {tratamientosDiente.map((t) => (
                      <div 
                        key={t.id} 
                        className={cn(
                          "p-2 rounded-lg border text-xs flex items-center justify-between",
                          t.estado === "completado" ? "bg-muted/40 border-muted" : "bg-warning/10 border-warning/30"
                        )}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{t.tratamiento}</p>
                          {t.superficie && (
                            <p className="text-[10px] text-muted-foreground">
                              Superficie: {t.superficie}
                            </p>
                          )}
                        </div>
                        <Badge variant={t.estado === "completado" ? "secondary" : "outline"} className="text-[10px]">
                          {t.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "superficies" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-foreground mb-1">Superficies Dentales</h4>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Marca el estado específico para cada cara del diente
                </p>
                <div className="flex justify-center p-3 bg-muted/20 rounded-xl border">
                  <ToothDiagram data={dienteData} isSuperior={isSuperior} size={90} />
                </div>
              </div>

              <div className="space-y-2">
                {SUPERFICIES.map((sup) => {
                  const label = sup === "palatina" && !isSuperior ? "lingual" : sup;
                  const currentCondicion = dienteData?.superficies?.[sup];
                  return (
                    <div key={sup} className="flex items-center justify-between p-2 rounded-lg border bg-background text-xs">
                      <span className="capitalize font-semibold text-foreground">{label}</span>
                      <select 
                        disabled={readOnly}
                        value={currentCondicion || ""}
                        onChange={(e) => onUpdateSuperficie(sup, e.target.value as EstadoDental)}
                        className="text-xs border rounded-lg px-2 py-1 bg-background"
                      >
                        <option value="">-- Sin patología --</option>
                        {Object.entries(ESTADOS_DENTALES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "historial" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground">Historial de Cambios</h4>
              {historial.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Sin registros en el historial para esta pieza</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historial.map((h, i) => (
                    <div key={i} className="p-2 rounded-lg border bg-background text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{h.accion}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(h.fecha), "dd/MM/yyyy", { locale: es })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Estado: {h.estadoNuevo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const OdontogramaProfesional = ({ 
  data, 
  onUpdate, 
  readOnly = false, 
  tratamientos = [],
  historial = {},
}: OdontogramaProfesionalProps) => {
  const [selectedDiente, setSelectedDiente] = useState<number | null>(null);

  // Dientes permanentes (FDI notation)
  const arcadaSuperior = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const arcadaInferior = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const handleDienteClick = (numero: number) => {
    setSelectedDiente(numero === selectedDiente ? null : numero);
  };

  const handleUpdateCondicion = (condicion: EstadoDental) => {
    if (!selectedDiente || !onUpdate) return;
    const newData = {
      ...data,
      [selectedDiente.toString()]: {
        ...data[selectedDiente.toString()],
        condicion,
      },
    };
    onUpdate(newData);
  };

  const handleUpdateSuperficie = (superficie: Superficie, condicion: EstadoDental) => {
    if (!selectedDiente || !onUpdate) return;
    const currentDiente = data[selectedDiente.toString()] || {};
    const newData = {
      ...data,
      [selectedDiente.toString()]: {
        ...currentDiente,
        superficies: {
          ...currentDiente.superficies,
          [superficie]: condicion,
        },
      },
    };
    onUpdate(newData);
  };

  const handleUpdateNotas = (notas: string) => {
    if (!selectedDiente || !onUpdate) return;
    const newData = {
      ...data,
      [selectedDiente.toString()]: {
        ...data[selectedDiente.toString()],
        notas,
      },
    };
    onUpdate(newData);
  };

  const selectedDienteData = selectedDiente ? data[selectedDiente.toString()] || {} : {};
  const selectedHistorial = selectedDiente ? historial[selectedDiente.toString()] || [] : [];
  const tratamientosDiente = selectedDiente 
    ? tratamientos.filter((t) => t.diente_numero === selectedDiente)
    : [];

  // Estadísticas rápidas
  const totalDientes = [...arcadaSuperior, ...arcadaInferior].length;
  const dientesConPatologia = Object.values(data).filter((d) => d.condicion && d.condicion !== "sano").length;
  const dientesAusentes = Object.values(data).filter((d) => d.condicion === "ausente").length;
  const tratamientosPendientes = tratamientos.filter((t) => t.estado === "pendiente").length;

  return (
    <div className="flex flex-col xl:flex-row min-h-[580px] border rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Panel principal del odontograma */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardHeader className="p-3 sm:p-4 pb-2 border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <span>Odontograma Dental</span>
                  {selectedDiente && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      Pieza {selectedDiente} seleccionada
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Haz clic en cualquier diente para ver y marcar patologías, superficies y notas
                </p>
              </div>
              
              {/* Estadísticas mini */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="text-center px-2.5 py-1 bg-muted/40 rounded-lg border text-xs">
                  <p className="font-black text-sm text-foreground">{totalDientes - dientesAusentes}</p>
                  <p className="text-[10px] text-muted-foreground">Presentes</p>
                </div>
                <div className="text-center px-2.5 py-1 bg-destructive/10 rounded-lg border border-destructive/20 text-xs">
                  <p className="font-black text-sm text-destructive">{dientesConPatologia}</p>
                  <p className="text-[10px] text-destructive">Con patología</p>
                </div>
                {tratamientosPendientes > 0 && (
                  <div className="text-center px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs">
                    <p className="font-black text-sm text-amber-600 dark:text-amber-400">{tratamientosPendientes}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">Tx pendientes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Leyenda de colores */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {Object.entries(ESTADOS_DENTALES).map(([key, { label, color }]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-[10px] sm:text-xs gap-1 py-0.5 px-2 bg-background/80"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span>{label}</span>
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-x-auto w-full">
            <div className="w-full min-w-max mx-auto space-y-4 py-2 flex flex-col items-center">
              {/* Arcada Superior */}
              <div className="text-center w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                    Arcada Superior
                  </span>
                </div>
                <div className="flex justify-center items-end gap-0.5 sm:gap-1 p-1.5 bg-muted/10 rounded-2xl border border-border/40">
                  {arcadaSuperior.map((num) => (
                    <DienteInteractivo
                      key={num}
                      numero={num}
                      data={data[num.toString()]}
                      isSelected={selectedDiente === num}
                      onClick={() => handleDienteClick(num)}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>

              {/* Línea media */}
              <div className="w-full flex items-center justify-center gap-3 py-1">
                <div className="w-24 sm:w-40 border-t-2 border-dashed border-muted-foreground/30" />
                <span className="text-[10px] font-black tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  LÍNEA MEDIA
                </span>
                <div className="w-24 sm:w-40 border-t-2 border-dashed border-muted-foreground/30" />
              </div>

              {/* Arcada Inferior */}
              <div className="text-center w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                    Arcada Inferior
                  </span>
                </div>
                <div className="flex justify-center items-start gap-0.5 sm:gap-1 p-1.5 bg-muted/10 rounded-2xl border border-border/40">
                  {arcadaInferior.map((num) => (
                    <DienteInteractivo
                      key={num}
                      numero={num}
                      data={data[num.toString()]}
                      isSelected={selectedDiente === num}
                      onClick={() => handleDienteClick(num)}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel lateral / inferior contextual */}
      {selectedDiente ? (
        <PanelDiente
          dienteNumero={selectedDiente}
          dienteData={selectedDienteData}
          historial={selectedHistorial}
          tratamientosDiente={tratamientosDiente}
          onUpdateCondicion={handleUpdateCondicion}
          onUpdateSuperficie={handleUpdateSuperficie}
          onUpdateNotas={handleUpdateNotas}
          onClose={() => setSelectedDiente(null)}
          readOnly={readOnly}
        />
      ) : (
        <div className="w-full xl:w-84 2xl:w-96 border-t xl:border-t-0 xl:border-l bg-muted/10 flex items-center justify-center p-6 shrink-0">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <ChevronRight className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Detalle del Diente</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
              Haz clic en cualquier pieza dental para marcar su estado patológico, superficies o notas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
