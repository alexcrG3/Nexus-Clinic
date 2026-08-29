import { cn } from "@/lib/utils";

// Tipos de dientes según su posición
export type ToothType = "incisor" | "canine" | "premolar" | "molar";

// Determinar el tipo de diente por número FDI
export const getToothType = (numero: number): ToothType => {
  const position = numero % 10;
  if (position === 1 || position === 2) return "incisor";
  if (position === 3) return "canine";
  if (position === 4 || position === 5) return "premolar";
  return "molar"; // 6, 7, 8
};

// Determinar si es arcada superior o inferior
export const isUpperArch = (numero: number): boolean => {
  const quadrant = Math.floor(numero / 10);
  return quadrant === 1 || quadrant === 2;
};

// Determinar si es lado derecho
export const isRightSide = (numero: number): boolean => {
  const quadrant = Math.floor(numero / 10);
  return quadrant === 1 || quadrant === 4;
};

interface ToothSVGProps {
  numero: number;
  condicion?: string;
  superficies?: Record<string, string>;
  className?: string;
  width?: number;
  height?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

// Colores por condición
const getConditionStyles = (condicion?: string): { fill: string; stroke: string; opacity: number } => {
  const baseStroke = "hsl(var(--foreground) / 0.3)";
  
  switch (condicion) {
    case "caries": 
      return { fill: "hsl(var(--dental-caries))", stroke: baseStroke, opacity: 1 };
    case "obturacion": 
      return { fill: "hsl(var(--dental-filling))", stroke: baseStroke, opacity: 1 };
    case "corona": 
      return { fill: "hsl(var(--dental-crown))", stroke: baseStroke, opacity: 1 };
    case "endodoncia": 
      return { fill: "hsl(var(--background))", stroke: baseStroke, opacity: 1 };
    case "implante": 
      return { fill: "hsl(var(--dental-implant))", stroke: baseStroke, opacity: 1 };
    case "fractura": 
      return { fill: "hsl(var(--background))", stroke: baseStroke, opacity: 1 };
    case "sellante": 
      return { fill: "hsl(var(--dental-sealant))", stroke: baseStroke, opacity: 1 };
    case "extraccion_indicada": 
      return { fill: "hsl(var(--background))", stroke: "hsl(var(--dental-extraction))", opacity: 0.5 };
    case "ausente": 
      return { fill: "hsl(var(--muted))", stroke: baseStroke, opacity: 0.3 };
    default: 
      return { fill: "hsl(var(--background))", stroke: baseStroke, opacity: 1 };
  }
};

// Incisivo - Diente frontal con raíz única
const IncisorTooth = ({ fill, stroke }: { fill: string; stroke: string }) => (
  <g>
    {/* Corona - forma de pala */}
    <path
      d="M8 4 C4 4 2 10 2 18 C2 26 5 32 12 32 C19 32 22 26 22 18 C22 10 20 4 16 4 C14 4 10 4 8 4 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Raíz */}
    <path
      d="M9 32 L9 54 C9 58 11 60 12 60 C13 60 15 58 15 54 L15 32"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Detalle corona */}
    <line x1="6" y1="28" x2="18" y2="28" stroke={stroke} strokeWidth="0.5" opacity="0.4" />
  </g>
);

// Canino - Diente puntiagudo con raíz larga
const CanineTooth = ({ fill, stroke }: { fill: string; stroke: string }) => (
  <g>
    {/* Corona con cúspide */}
    <path
      d="M6 8 C4 12 3 18 3 24 C3 30 6 34 12 34 C18 34 21 30 21 24 C21 18 20 12 18 8 C16 4 14 2 12 2 C10 2 8 4 6 8 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Raíz larga */}
    <path
      d="M9 34 L8 56 C8 60 10 64 12 64 C14 64 16 60 16 56 L15 34"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Cúspide */}
    <path d="M8 12 L12 4 L16 12" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
  </g>
);

// Premolar - Dos cúspides, una o dos raíces
const PremolarTooth = ({ fill, stroke }: { fill: string; stroke: string }) => (
  <g>
    {/* Corona con dos cúspides */}
    <path
      d="M4 12 C2 16 2 22 3 28 C4 34 8 38 14 38 C20 38 24 34 25 28 C26 22 26 16 24 12 C22 6 18 2 14 2 C10 2 6 6 4 12 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Surco oclusal */}
    <path d="M8 8 L14 16 L20 8" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.3" />
    {/* Raíz bifurcada */}
    <path
      d="M10 38 L8 54 C8 58 9 60 11 60"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    <path
      d="M18 38 L20 54 C20 58 19 60 17 60"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
  </g>
);

// Molar - Corona grande con múltiples raíces
const MolarTooth = ({ fill, stroke }: { fill: string; stroke: string }) => (
  <g>
    {/* Corona amplia */}
    <path
      d="M2 14 C1 20 2 28 4 34 C6 40 12 44 18 44 C24 44 30 40 32 34 C34 28 35 20 34 14 C33 8 28 2 18 2 C8 2 3 8 2 14 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    {/* Surcos oclusales */}
    <path d="M10 12 L18 22 L26 12" fill="none" stroke={stroke} strokeWidth="0.6" opacity="0.3" />
    <path d="M18 10 L18 26" fill="none" stroke={stroke} strokeWidth="0.5" opacity="0.3" />
    {/* Tres raíces */}
    <path
      d="M8 44 L6 60 C6 64 7 66 9 66"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
    <path
      d="M18 44 L18 62 C18 64 18 66 18 66"
      fill={fill}
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      d="M28 44 L30 60 C30 64 29 66 27 66"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
  </g>
);

// Implante dental
const ImplantTooth = ({ stroke }: { stroke: string }) => (
  <g>
    {/* Pilar/Abutment */}
    <rect x="10" y="2" width="16" height="12" rx="2" fill="hsl(var(--dental-implant))" stroke={stroke} strokeWidth="1" />
    {/* Tornillo */}
    <path
      d="M12 14 L24 14 L23 22 L13 22 Z"
      fill="hsl(var(--dental-implant))"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      d="M13 22 L23 22 L22 32 L14 32 Z"
      fill="hsl(var(--dental-implant))"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      d="M14 32 L22 32 L21 42 L15 42 Z"
      fill="hsl(var(--dental-implant))"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      d="M15 42 L21 42 L20 52 L16 52 Z"
      fill="hsl(var(--dental-implant))"
      stroke={stroke}
      strokeWidth="1"
    />
    <path
      d="M16 52 L20 52 L18 60 L18 60 Z"
      fill="hsl(var(--dental-implant))"
      stroke={stroke}
      strokeWidth="1"
    />
    {/* Roscas */}
    <line x1="13" y1="18" x2="23" y2="18" stroke={stroke} strokeWidth="0.5" />
    <line x1="14" y1="27" x2="22" y2="27" stroke={stroke} strokeWidth="0.5" />
    <line x1="15" y1="37" x2="21" y2="37" stroke={stroke} strokeWidth="0.5" />
    <line x1="16" y1="47" x2="20" y2="47" stroke={stroke} strokeWidth="0.5" />
  </g>
);

// Marca de X para diente ausente
const AbsentMark = () => (
  <g>
    <line x1="4" y1="4" x2="32" y2="60" stroke="hsl(var(--dental-extraction))" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="4" x2="4" y2="60" stroke="hsl(var(--dental-extraction))" strokeWidth="2.5" strokeLinecap="round" />
  </g>
);

// Marca de fractura (rayo)
const FractureMark = () => (
  <path
    d="M16 2 L20 20 L14 24 L22 44 L16 48 L20 64"
    fill="none"
    stroke="hsl(var(--dental-fracture))"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

// Marca de endodoncia
const EndodonciaMark = () => (
  <g>
    <line x1="18" y1="36" x2="18" y2="58" stroke="hsl(var(--dental-endodontics))" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="18" cy="60" r="2.5" fill="hsl(var(--dental-endodontics))" />
  </g>
);

// Componente principal
export const ToothSVG = ({
  numero,
  condicion,
  className,
  width = 28,
  height = 55,
  isSelected = false,
  onClick
}: ToothSVGProps) => {
  const toothType = getToothType(numero);
  const isUpper = isUpperArch(numero);
  const isRight = isRightSide(numero);
  
  const { fill, stroke, opacity } = getConditionStyles(condicion);
  
  // ViewBox según tipo de diente
  const viewBox = toothType === "molar" ? "0 0 36 70" : "0 0 24 65";
  
  // Ajustar tamaño según tipo
  const getSize = () => {
    switch (toothType) {
      case "molar": return { w: width * 1.4, h: height * 1.1 };
      case "premolar": return { w: width * 1.15, h: height };
      case "canine": return { w: width, h: height * 1.05 };
      default: return { w: width * 0.95, h: height };
    }
  };

  const size = getSize();
  
  // Mirror horizontal para lado izquierdo
  const mirrorTransform = !isRight ? "scale(-1, 1)" : "";
  const translateX = !isRight ? (toothType === "molar" ? -36 : -24) : 0;

  const renderTooth = () => {
    if (condicion === "implante") {
      return <ImplantTooth stroke={stroke} />;
    }

    const ToothShape = () => {
      switch (toothType) {
        case "incisor": return <IncisorTooth fill={fill} stroke={stroke} />;
        case "canine": return <CanineTooth fill={fill} stroke={stroke} />;
        case "premolar": return <PremolarTooth fill={fill} stroke={stroke} />;
        case "molar": return <MolarTooth fill={fill} stroke={stroke} />;
        default: return <IncisorTooth fill={fill} stroke={stroke} />;
      }
    };

    return <ToothShape />;
  };

  return (
    <svg
      width={size.w}
      height={size.h}
      viewBox={viewBox}
      className={cn(
        "transition-all duration-150",
        isSelected && "drop-shadow-md",
        onClick && "cursor-pointer hover:drop-shadow-lg",
        className
      )}
      onClick={onClick}
      style={{ opacity }}
    >
      <g transform={`${mirrorTransform} translate(${translateX}, 0)`}>
        {renderTooth()}
        
        {/* Marcas especiales */}
        {condicion === "fractura" && <FractureMark />}
        {condicion === "ausente" && <AbsentMark />}
        {condicion === "endodoncia" && <EndodonciaMark />}
      </g>
    </svg>
  );
};

export default ToothSVG;
