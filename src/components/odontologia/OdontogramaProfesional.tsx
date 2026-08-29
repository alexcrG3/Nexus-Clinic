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
              "relative flex flex-col items-center transition-all duration-150 group p-1",
              "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-lg",
              isSelected && "scale-105 ring-2 ring-primary ring-offset-1 bg-primary/5",
              readOnly && "cursor-default hover:scale-100",
              isAusente && "opacity-40"
            )}
          >
            {/* Diente anatómico SVG */}
            <div className={cn(
              "relative",
              !isSuperior && "rotate-180"
            )}>
              <ToothSVG
                numero={numero}
                condicion={data?.condicion}
                superficies={data?.superficies as Record<string, string> | undefined}
                width={toothType === "molar" ? 32 : toothType === "premolar" ? 28 : 24}
                height={55}
                isSelected={isSelected}
              />
            </div>
            
            {/* Indicador de superficies con diagrama pequeño */}
            <div className="w-8 h-8 mt-1">
              <ToothDiagram 
                data={data}
                isSuperior={isSuperior}
                size={32}
              />
            </div>
            
            {/* Número del diente */}
            <span className={cn(
              "text-[10px] font-bold mt-0.5 transition-colors",
              isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
            {data?.superficies && Object.keys(data.superficies).length > 0 && (
              <p className="text-muted-foreground">
                {Object.keys(data.superficies).length} superficie(s) marcada(s)
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
  size = 32 
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
  const scale = size / 44;

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
  dienteData: DienteData;
  historial: HistorialEntry[];
  tratamientosDiente: Tratamiento[];
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
    <div className="w-80 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">{dienteNumero}</span>
            </div>
            <div>
              <h3 className="font-semibold">Diente {dienteNumero}</h3>
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
          <div className="mt-3 flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: ESTADOS_DENTALES[dienteData.condicion]?.color }}
            />
            <span className="text-sm font-medium">
              {ESTADOS_DENTALES[dienteData.condicion]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("estado")}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors border-b-2",
            activeTab === "estado" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Estado
        </button>
        <button
          onClick={() => setActiveTab("superficies")}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors border-b-2",
            activeTab === "superficies" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Superficies
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors border-b-2 relative",
            activeTab === "historial" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Historial
          {historial.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
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
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Estado General
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ESTADOS_DENTALES).map(([key, { label, color, description }]) => (
                    <button
                      key={key}
                      disabled={readOnly}
                      onClick={() => onUpdateCondicion(key as EstadoDental)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm",
                        "hover:shadow-md hover:border-primary/50",
                        dienteData?.condicion === key && "ring-2 ring-primary bg-primary/5",
                        readOnly && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Tratamientos del diente */}
              {(tratamientosPendientes.length > 0 || tratamientosCompletados.length > 0) && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tratamientos
                  </h4>
                  
                  {tratamientosPendientes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-warning mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pendientes ({tratamientosPendientes.length})
                      </p>
                      <div className="space-y-1">
                        {tratamientosPendientes.map((t) => (
                          <div key={t.id} className="text-sm p-2 bg-warning/10 rounded border border-warning/20">
                            {t.tratamiento}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tratamientosCompletados.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-success mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completados ({tratamientosCompletados.length})
                      </p>
                      <div className="space-y-1">
                        {tratamientosCompletados.slice(0, 3).map((t) => (
                          <div key={t.id} className="text-sm p-2 bg-success/10 rounded border border-success/20">
                            {t.tratamiento}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Notas */}
              <div>
                <h4 className="text-sm font-medium mb-2">Notas clínicas</h4>
                <Textarea
                  value={dienteData?.notas || ""}
                  onChange={(e) => onUpdateNotas(e.target.value)}
                  placeholder="Observaciones..."
                  rows={3}
                  disabled={readOnly}
                  className="text-sm"
                />
              </div>
            </>
          )}

          {activeTab === "superficies" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Selecciona una superficie y asigna un estado en 2 clics.
              </p>
              
              {/* Vista previa del diente */}
              <div className="flex justify-center my-4">
                <svg width="120" height="120" viewBox="0 0 44 44">
                  <rect x="14" y="14" width="16" height="16" fill={dienteData?.superficies?.oclusal ? ESTADOS_DENTALES[dienteData.superficies.oclusal]?.color : "hsl(var(--muted))"} stroke="hsl(var(--border))" strokeWidth="1.5" rx="2" />
                  <path d="M14,14 L30,14 L44,0 L0,0 Z" fill={dienteData?.superficies?.vestibular ? ESTADOS_DENTALES[dienteData.superficies.vestibular]?.color : "hsl(var(--muted))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M14,30 L30,30 L44,44 L0,44 Z" fill={dienteData?.superficies?.[isSuperior ? "palatina" : "lingual"] ? ESTADOS_DENTALES[dienteData.superficies[isSuperior ? "palatina" : "lingual"]!]?.color : "hsl(var(--muted))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M0,0 L14,14 L14,30 L0,44 Z" fill={dienteData?.superficies?.mesial ? ESTADOS_DENTALES[dienteData.superficies.mesial]?.color : "hsl(var(--muted))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M44,0 L30,14 L30,30 L44,44 Z" fill={dienteData?.superficies?.distal ? ESTADOS_DENTALES[dienteData.superficies.distal]?.color : "hsl(var(--muted))"} stroke="hsl(var(--border))" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Lista de superficies */}
              {(["oclusal", "vestibular", isSuperior ? "palatina" : "lingual", "mesial", "distal"] as Superficie[]).map((sup) => (
                <div key={sup} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {sup === "oclusal" ? "Oclusal (O)" : 
                       sup === "vestibular" ? "Vestibular (V)" :
                       sup === "palatina" ? "Palatina (P)" :
                       sup === "lingual" ? "Lingual (L)" :
                       sup === "mesial" ? "Mesial (M)" : "Distal (D)"}
                    </span>
                    {dienteData?.superficies?.[sup] && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: ESTADOS_DENTALES[dienteData.superficies[sup]!]?.color }}
                      >
                        {ESTADOS_DENTALES[dienteData.superficies[sup]!]?.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(ESTADOS_DENTALES).slice(0, 6).map(([key, { color }]) => (
                      <button
                        key={key}
                        disabled={readOnly}
                        onClick={() => onUpdateSuperficie(sup, key as EstadoDental)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                          dienteData?.superficies?.[sup] === key ? "ring-2 ring-offset-2 ring-primary" : "border-transparent",
                          readOnly && "opacity-50 cursor-not-allowed"
                        )}
                        style={{ backgroundColor: color }}
                        title={ESTADOS_DENTALES[key as EstadoDental].label}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "historial" && (
            <div>
              {historial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin historial registrado</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {historial.map((entry, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium">{entry.accion}</p>
                          {entry.superficie && (
                            <p className="text-xs text-muted-foreground">
                              Superficie: {entry.superficie}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.fecha), "d MMM yyyy, HH:mm", { locale: es })}
                          </p>
                          {entry.profesional && (
                            <p className="text-xs text-muted-foreground">
                              Por: {entry.profesional}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
    ? tratamientos.filter(t => t.diente_numero === selectedDiente)
    : [];

  // Estadísticas rápidas
  const totalDientes = [...arcadaSuperior, ...arcadaInferior].length;
  const dientesConPatologia = Object.values(data).filter(d => d.condicion && d.condicion !== "sano").length;
  const dientesAusentes = Object.values(data).filter(d => d.condicion === "ausente").length;
  const tratamientosPendientes = tratamientos.filter(t => t.estado === "pendiente").length;

  return (
    <div className="flex h-[700px] border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Panel principal del odontograma */}
      <div className="flex-1 flex flex-col">
        <Card className="border-0 shadow-none h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Odontograma</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona un diente para ver detalles y editar
                </p>
              </div>
              
              {/* Estadísticas mini */}
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalDientes - dientesAusentes}</p>
                  <p className="text-xs text-muted-foreground">Presentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{dientesConPatologia}</p>
                  <p className="text-xs text-muted-foreground">Con patología</p>
                </div>
                {tratamientosPendientes > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{tratamientosPendientes}</p>
                    <p className="text-xs text-muted-foreground">Tx pendientes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Leyenda de colores */}
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(ESTADOS_DENTALES).map(([key, { label, color }]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-xs gap-1.5"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex items-center justify-center overflow-x-auto">
            <div className="space-y-4 min-w-fit px-4">
              {/* Arcada Superior */}
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
                  Arcada Superior
                </p>
                <div className="flex justify-center items-end gap-0.5">
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
              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                <span className="text-[10px] font-medium text-muted-foreground px-2 bg-card">LÍNEA MEDIA</span>
                <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
              </div>

              {/* Arcada Inferior */}
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
                  Arcada Inferior
                </p>
                <div className="flex justify-center items-start gap-0.5">
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

      {/* Panel lateral contextual */}
      {selectedDiente && (
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
      )}

      {/* Placeholder cuando no hay diente seleccionado */}
      {!selectedDiente && (
        <div className="w-80 border-l bg-muted/20 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ChevronRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Selecciona un diente para ver su información detallada
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
