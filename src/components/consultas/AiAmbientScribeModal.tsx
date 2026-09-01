import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Stethoscope,
  Pill,
  FileText,
  Key,
  Loader2,
  Volume2,
  AlertCircle,
  Clock,
  Send,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AiScribeEngine } from "@/services/aiScribe/scribeEngine";
import { ClinicalAiExtraction } from "@/services/aiScribe/types";

interface AiAmbientScribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNombre?: string;
  especialidad?: string;
  onApplyExtraction: (extraction: ClinicalAiExtraction) => void;
}

export const AiAmbientScribeModal: React.FC<AiAmbientScribeModalProps> = ({
  open,
  onOpenChange,
  pacienteNombre = "Paciente",
  especialidad = "Medicina General",
  onApplyExtraction,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ClinicalAiExtraction | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(especialidad);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const engineRef = useRef<AiScribeEngine>(new AiScribeEngine());

  // Inicializar API Key existente
  useEffect(() => {
    const existingKey = engineRef.current.getApiKey();
    if (existingKey) {
      setApiKeyInput(existingKey);
    }
  }, [open]);

  // Manejador del temporizador
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Inicializar y controlar el reconocimiento de voz
  useEffect(() => {
    if (!open) {
      stopRecording();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition no soportado por este navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-CR"; // Español estándar

    recognition.onresult = (event: any) => {
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript + " ";
      }
      setTranscript(currentText.trim());
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Permiso de micrófono denegado. Por favor permite el acceso al micrófono.");
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [open]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.info("Reconocimiento de voz no disponible en este navegador. Puedes escribir o pegar la conversación.");
      setIsRecording(true);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      toast.success("🎙️ Escucha activa: Habla con naturalidad con el paciente.");
    } catch (err) {
      console.warn("Error al iniciar grabación:", err);
      setIsRecording(true);
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsPaused(true);
    toast.info("Escucha pausada");
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
    setIsPaused(false);
    toast.success("Escucha reanudada");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    stopRecording();
    setTranscript("");
    setRecordingSeconds(0);
    setExtractionResult(null);
  };

  const handleProcessAi = async () => {
    if (!transcript.trim() || transcript.trim().length < 15) {
      toast.error("El texto de la consulta es muy breve. Por favor conversa más o escribe los detalles clínicos.");
      return;
    }

    stopRecording();
    setIsProcessing(true);

    try {
      const result = await engineRef.current.generateClinicalNote(
        transcript,
        selectedSpecialty,
        pacienteNombre
      );
      setExtractionResult(result);
      toast.success("✨ ¡Consulta y receta médica estructuradas con éxito por la IA!");
    } catch (err: any) {
      console.error("Error procesando IA:", err);
      toast.error(err.message || "Error al procesar la consulta con IA");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToConsultation = () => {
    if (!extractionResult) return;
    onApplyExtraction(extractionResult);
    toast.success("✅ Datos aplicados al expediente clínico y a la receta médica.");
    onOpenChange(false);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      engineRef.current.setApiKey(apiKeyInput.trim());
      toast.success("Clave API de OpenAI guardada con éxito.");
      setShowKeyDialog(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden bg-background text-foreground border border-border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header estilo Copiloto / Heidi */}
        <div className="bg-gradient-to-r from-primary/15 via-sky-500/10 to-background border-b border-border p-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-primary to-sky-500 text-white flex items-center justify-center shadow-md">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Copiloto Clínico IA (Escriba Inteligente)</span>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    Estilo Heidi Health
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Escucha el diálogo en vivo con <strong>{pacienteNombre}</strong> y auto-genera la historia clínica y la receta.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowKeyDialog(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Configurar Clave API OpenAI"
            >
              <Key className="size-4" />
            </Button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Barra de Control de Grabación */}
          <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-full flex items-center justify-center transition-all ${
                  isRecording && !isPaused
                    ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/20"
                    : isPaused
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isRecording ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-foreground">
                    {formatSeconds(recordingSeconds)}
                  </span>
                  {isRecording && !isPaused && (
                    <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30 animate-pulse">
                      ● Grabando Audio
                    </Badge>
                  )}
                  {isPaused && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                      ⏸ En Pausa
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isRecording
                    ? "El micrófono está capturando la conversación en vivo..."
                    : "Presiona Iniciar para comenzar a escuchar la consulta."}
                </p>
              </div>
            </div>

            {/* Botones de Control */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  className="gap-2 bg-gradient-to-r from-primary to-sky-600 hover:from-primary/90 hover:to-sky-600/90 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md"
                >
                  <Play className="size-4" />
                  Iniciar Escucha
                </Button>
              ) : isPaused ? (
                <Button
                  type="button"
                  onClick={resumeRecording}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md"
                >
                  <Play className="size-4" />
                  Reanudar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={pauseRecording}
                  className="gap-2 text-xs font-bold h-9 px-3 rounded-xl border-border"
                >
                  <Pause className="size-4" />
                  Pausar
                </Button>
              )}

              {isRecording && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-1 text-xs font-bold h-9 px-3 rounded-xl"
                >
                  Detener
                </Button>
              )}

              {(transcript || recordingSeconds > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  title="Reiniciar diálogo"
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Área de Transcripción en Vivo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-primary" />
                Transcripción del Diálogo en Vivo:
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Puedes editar o complementar el texto antes de generar.
              </span>
            </div>

            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Ejemplo: 'Doctor, vengo porque desde hace 3 días tengo un dolor punzante en la muela inferior derecha al masticar. Al revisarlo observo caries en la pieza 46. Le prescribiré Amoxicilina 500mg cada 8 horas por 7 días e Ibuprofeno 400mg...'"
              rows={4}
              className="text-xs leading-relaxed font-sans bg-background border-border rounded-xl resize-none"
            />
          </div>

          {/* Botón de Generación con IA */}
          <Button
            type="button"
            disabled={isProcessing || !transcript.trim()}
            onClick={handleProcessAi}
            className="w-full h-11 bg-gradient-to-r from-primary via-indigo-600 to-sky-600 hover:from-primary/90 hover:to-sky-600/90 text-white font-bold text-sm rounded-xl shadow-lg gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analizando diálogo y estructurando expediente con IA...
              </>
            ) : (
              <>
                <Sparkles className="size-4 text-amber-300" />
                ✨ Generar Expediente Clínico y Receta con IA
              </>
            )}
          </Button>

          {/* Resultado Estructurado (Vista Previa SOAP) */}
          {extractionResult && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Estructura Clínica Generada (Formato SOAP)
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  CIE-10: {extractionResult.codigo_cie10 || "Z00.0"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Subjetivo */}
                <div className="bg-background border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-foreground block text-[11px] uppercase tracking-wide">
                    S • Motivo y Padecimiento
                  </span>
                  <p className="text-muted-foreground">{extractionResult.motivo_consulta}</p>
                  <p className="text-muted-foreground pt-1 border-t border-border/50 text-[11px]">
                    {extractionResult.padecimiento_actual}
                  </p>
                </div>

                {/* Objetivo */}
                <div className="bg-background border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-foreground block text-[11px] uppercase tracking-wide">
                    O • Examen Físico
                  </span>
                  <p className="text-muted-foreground">{extractionResult.examen_fisico}</p>
                </div>

                {/* Evaluación / Diagnóstico */}
                <div className="bg-background border border-border rounded-lg p-3 space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground block text-[11px] uppercase tracking-wide">
                      A • Diagnóstico Clínico
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px]">
                      {extractionResult.codigo_cie10}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground">{extractionResult.diagnostico_principal}</p>
                </div>

                {/* Plan & Receta */}
                <div className="bg-background border border-border rounded-lg p-3 space-y-2 md:col-span-2">
                  <span className="font-bold text-foreground block text-[11px] uppercase tracking-wide flex items-center gap-1">
                    <Pill className="size-3.5 text-primary" />
                    P • Receta Médica Extraída ({extractionResult.medicamentos.length} medicamentos)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extractionResult.medicamentos.map((med, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{med.nombre}</span>
                          <span className="text-[10px] text-primary font-mono">{med.dosis}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          {med.frecuencia} • {med.duracion}
                        </p>
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">
                          {med.indicaciones}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen para el paciente */}
                {extractionResult.recomendaciones_paciente && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-1 md:col-span-2 text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase flex items-center gap-1">
                      <MessageCircle className="size-3.5" />
                      Resumen Claro para el Paciente (WhatsApp)
                    </span>
                    <p className="text-emerald-900 dark:text-emerald-200">
                      {extractionResult.recomendaciones_paciente}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl"
          >
            Cerrar
          </Button>

          {extractionResult ? (
            <Button
              type="button"
              onClick={handleApplyToConsultation}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
            >
              <CheckCircle2 className="size-4" />
              Aplicar Todo al Expediente y Receta
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!transcript.trim() || isProcessing}
              onClick={handleProcessAi}
              className="gap-2 text-xs font-bold rounded-xl"
            >
              <Sparkles className="size-4" />
              Generar con IA
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Subdialog para Configurar Clave API */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Key className="size-4 text-primary" />
              Clave API de OpenAI / IA
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa tu propia clave API para utilizar el modelo GPT-4o de OpenAI. Si se deja vacía, se utilizará el motor clínico heurístico local.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">OpenAI API Key (sk-...)</Label>
              <Input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-proj-..."
                className="font-mono text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowKeyDialog(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveApiKey} className="font-bold">
              Guardar Clave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
