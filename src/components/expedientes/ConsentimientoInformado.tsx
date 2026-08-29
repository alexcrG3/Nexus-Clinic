import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileSignature, 
  Plus, 
  Save, 
  Loader2, 
  Printer,
  Trash2,
  Info,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { escapeHtml, isValidImageDataUrl } from "@/lib/sanitize";

interface Consentimiento {
  id?: string;
  procedimiento: string;
  descripcion: string;
  riesgos: string;
  alternativas: string;
  firmado: boolean;
  fecha_firma?: string;
  firma_paciente?: string;
  firma_profesional?: string;
}

interface ConsentimientoInformadoProps {
  cliente: {
    nombre: string | null;
    apellidos: string | null;
    cedula: string | null;
  } | null;
  profesional?: {
    nombre: string | null;
    apellidos: string | null;
  } | null;
  clinicaNombre?: string;
  consentimientos?: Consentimiento[];
  onSave: (consentimientos: Consentimiento[]) => Promise<void>;
  readOnly?: boolean;
}

export const ConsentimientoInformado = ({
  cliente,
  profesional,
  clinicaNombre = "Clínica",
  consentimientos: initialConsentimientos = [],
  onSave,
  readOnly = false,
}: ConsentimientoInformadoProps) => {
  const [saving, setSaving] = useState(false);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>(initialConsentimientos);
  const [showForm, setShowForm] = useState(false);
  const [selectedConsentimiento, setSelectedConsentimiento] = useState<number | null>(null);
  
  // Form state
  const [procedimiento, setProcedimiento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [riesgos, setRiesgos] = useState("");
  const [alternativas, setAlternativas] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasProfesionalRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingProfesional, setIsDrawingProfesional] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [hasSignatureProfesional, setHasSignatureProfesional] = useState(false);
  const [activeCanvas, setActiveCanvas] = useState<"paciente" | "profesional" | null>(null);

  useEffect(() => {
    if (initialConsentimientos) {
      setConsentimientos(initialConsentimientos);
    }
  }, [initialConsentimientos]);

  // Generic drawing functions for both canvases
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvasType: "paciente" | "profesional"
  ) => {
    const canvas = canvasType === "paciente" ? canvasRef.current : canvasProfesionalRef.current;
    if (!canvas) return;
    
    setActiveCanvas(canvasType);
    if (canvasType === "paciente") {
      setIsDrawing(true);
    } else {
      setIsDrawingProfesional(true);
    }
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvasType: "paciente" | "profesional"
  ) => {
    const isCurrentlyDrawing = canvasType === "paciente" ? isDrawing : isDrawingProfesional;
    if (!isCurrentlyDrawing) return;
    
    const canvas = canvasType === "paciente" ? canvasRef.current : canvasProfesionalRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
    
    if (canvasType === "paciente") {
      setHasSignature(true);
    } else {
      setHasSignatureProfesional(true);
    }
  };

  const stopDrawing = (canvasType: "paciente" | "profesional") => {
    if (canvasType === "paciente") {
      setIsDrawing(false);
    } else {
      setIsDrawingProfesional(false);
    }
    setActiveCanvas(null);
  };

  const clearSignature = (canvasType: "paciente" | "profesional") => {
    const canvas = canvasType === "paciente" ? canvasRef.current : canvasProfesionalRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (canvasType === "paciente") {
      setHasSignature(false);
    } else {
      setHasSignatureProfesional(false);
    }
  };

  const getSignatureData = (canvasType: "paciente" | "profesional") => {
    const canvas = canvasType === "paciente" ? canvasRef.current : canvasProfesionalRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  };

  const handleSaveConsentimiento = async () => {
    if (!aceptaTerminos || !hasSignature || !hasSignatureProfesional) return;

    const nuevoConsentimiento: Consentimiento = {
      procedimiento,
      descripcion,
      riesgos,
      alternativas,
      firmado: true,
      fecha_firma: new Date().toISOString(),
      firma_paciente: getSignatureData("paciente") || undefined,
      firma_profesional: getSignatureData("profesional") || undefined,
    };

    const nuevosConsentimientos = [...consentimientos, nuevoConsentimiento];
    
    setSaving(true);
    try {
      await onSave(nuevosConsentimientos);
      setConsentimientos(nuevosConsentimientos);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProcedimiento("");
    setDescripcion("");
    setRiesgos("");
    setAlternativas("");
    setAceptaTerminos(false);
    clearSignature("paciente");
    clearSignature("profesional");
    setHasSignature(false);
    setHasSignatureProfesional(false);
  };

  const eliminarConsentimiento = async (index: number) => {
    const nuevosConsentimientos = consentimientos.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await onSave(nuevosConsentimientos);
      setConsentimientos(nuevosConsentimientos);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const imprimirConsentimiento = (consent: Consentimiento) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consentimiento Informado</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section h3 { margin-bottom: 10px; color: #333; }
          .content { line-height: 1.6; text-align: justify; }
          .signature { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; }
          .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 60px; padding-top: 5px; }
          .date { margin-top: 30px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>CONSENTIMIENTO INFORMADO</h1>
        <h2 style="text-align: center;">${escapeHtml(consent.procedimiento)}</h2>
        
        <div class="content">
          <p>Yo, <strong>${escapeHtml(cliente?.nombre)} ${escapeHtml(cliente?.apellidos)}</strong>, con número de identificación 
          <strong>${escapeHtml(cliente?.cedula || "________________")}</strong>, he sido informado/a por el/la 
          <strong>Dr(a). ${escapeHtml(profesional?.nombre || "")} ${escapeHtml(profesional?.apellidos || "")}</strong> 
          de la ${escapeHtml(clinicaNombre)}, sobre el procedimiento de <strong>${escapeHtml(consent.procedimiento)}</strong>.</p>
          
          <div class="section">
            <h3>Descripción del procedimiento:</h3>
            <p>${escapeHtml(consent.descripcion)}</p>
          </div>
          
          <div class="section">
            <h3>Riesgos y complicaciones:</h3>
            <p>${escapeHtml(consent.riesgos)}</p>
          </div>
          
          <div class="section">
            <h3>Alternativas al procedimiento:</h3>
            <p>${escapeHtml(consent.alternativas)}</p>
          </div>
          
          <p>Declaro que he leído y entendido los términos y condiciones aplicables al Consentimiento Informado, 
          por lo que procederé a suscribir electrónicamente el mismo.</p>
          
          <p>Tuve tiempo para hacer preguntas y mis dudas fueron resueltas. Comprendo que no se garantiza un 
          resultado perfecto y, con pleno uso de mis facultades, doy mi consentimiento voluntario para el procedimiento.</p>
        </div>
        
        <div class="date">
          <p>Fecha: ${consent.fecha_firma ? format(new Date(consent.fecha_firma), "d 'de' MMMM 'de' yyyy", { locale: es }) : "________________"}</p>
        </div>
        
        <div class="signature">
          <div class="signature-box">
            ${consent.firma_paciente && isValidImageDataUrl(consent.firma_paciente) ? `<img src="${consent.firma_paciente}" style="max-width: 200px; max-height: 100px;" />` : ""}
            <div class="signature-line">Firma del Paciente</div>
          </div>
          <div class="signature-box">
            ${consent.firma_profesional && isValidImageDataUrl(consent.firma_profesional) ? `<img src="${consent.firma_profesional}" style="max-width: 200px; max-height: 100px;" />` : ""}
            <div class="signature-line">Firma del Profesional</div>
          </div>
        </div>
        
        <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; cursor: pointer;">
          Imprimir
        </button>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Consentimientos Informados
            </CardTitle>
            <CardDescription>
              Documentos de consentimiento para procedimientos médicos
            </CardDescription>
          </div>
          {!readOnly && !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Consentimiento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de consentimientos existentes */}
        {consentimientos.length > 0 && !showForm && (
          <div className="space-y-3">
            {consentimientos.map((consent, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{consent.procedimiento}</h4>
                      {consent.firmado && (
                        <Badge className="bg-green-500 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Firmado
                        </Badge>
                      )}
                    </div>
                    {consent.fecha_firma && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(consent.fecha_firma), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                    <p className="text-sm mt-2 line-clamp-2">{consent.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => imprimirConsentimiento(consent)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarConsentimiento(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Formulario para nuevo consentimiento */}
        {showForm && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Esta es una vista previa del consentimiento informado. No incluye los espacios para la firma 
                del profesional de salud ni del paciente; estos aparecerán al imprimir el documento si aún 
                no ha sido firmado. Revisa que toda la información sea correcta antes de continuar.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="font-medium">Procedimiento</Label>
              <Input
                value={procedimiento}
                onChange={(e) => setProcedimiento(e.target.value)}
                placeholder="Nombre del procedimiento..."
              />
            </div>

            <Separator />

            <Card className="p-6 bg-muted/30">
              <div className="prose prose-sm max-w-none">
                <p>
                  Yo, <strong>{cliente?.nombre} {cliente?.apellidos}</strong>, con número de identificación{" "}
                  <strong>{cliente?.cedula || "________________"}</strong>, he sido informado/a por el/la{" "}
                  <strong>Dr(a). {profesional?.nombre || ""} {profesional?.apellidos || ""}</strong> de la{" "}
                  {clinicaNombre}, sobre el procedimiento de{" "}
                  <strong>{procedimiento || "[procedimiento]"}</strong>.
                </p>
              </div>
            </Card>

            <div className="space-y-2">
              <Label className="font-medium">Descripción del procedimiento</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describa en qué consiste el procedimiento..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Riesgos y complicaciones posibles</Label>
              <Textarea
                value={riesgos}
                onChange={(e) => setRiesgos(e.target.value)}
                placeholder="Riesgos generales y específicos del procedimiento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Alternativas al procedimiento</Label>
              <Textarea
                value={alternativas}
                onChange={(e) => setAlternativas(e.target.value)}
                placeholder="Otras opciones de tratamiento disponibles..."
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terminos"
                  checked={aceptaTerminos}
                  onCheckedChange={(checked) => setAceptaTerminos(checked as boolean)}
                />
                <Label htmlFor="terminos" className="text-sm leading-relaxed cursor-pointer">
                  Declaro que he leído y entendido los términos y condiciones aplicables al Consentimiento 
                  Informado, por lo que procederé a suscribir electrónicamente el mismo.
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">Firma del paciente</Label>
                  <div className="border rounded-lg p-2 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="border rounded cursor-crosshair w-full touch-none"
                      onMouseDown={(e) => startDrawing(e, "paciente")}
                      onMouseMove={(e) => draw(e, "paciente")}
                      onMouseUp={() => stopDrawing("paciente")}
                      onMouseLeave={() => stopDrawing("paciente")}
                      onTouchStart={(e) => startDrawing(e, "paciente")}
                      onTouchMove={(e) => draw(e, "paciente")}
                      onTouchEnd={() => stopDrawing("paciente")}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSignature("paciente")}
                      className="mt-2"
                    >
                      Limpiar firma
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Firma del profesional</Label>
                  <div className="border rounded-lg p-2 bg-white">
                    <canvas
                      ref={canvasProfesionalRef}
                      width={400}
                      height={150}
                      className="border rounded cursor-crosshair w-full touch-none"
                      onMouseDown={(e) => startDrawing(e, "profesional")}
                      onMouseMove={(e) => draw(e, "profesional")}
                      onMouseUp={() => stopDrawing("profesional")}
                      onMouseLeave={() => stopDrawing("profesional")}
                      onTouchStart={(e) => startDrawing(e, "profesional")}
                      onTouchMove={(e) => draw(e, "profesional")}
                      onTouchEnd={() => stopDrawing("profesional")}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSignature("profesional")}
                      className="mt-2"
                    >
                      Limpiar firma
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveConsentimiento}
                disabled={saving || !aceptaTerminos || !hasSignature || !hasSignatureProfesional || !procedimiento}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Firmar y Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {consentimientos.length === 0 && !showForm && (
          <div className="text-center py-8">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay consentimientos informados registrados
            </p>
            {!readOnly && (
              <Button variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Consentimiento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
