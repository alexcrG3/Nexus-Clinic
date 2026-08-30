import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceDictationButtonProps {
  currentValue?: string;
  onValueChange?: (newValue: string) => void;
  onAppendText?: (newText: string) => void;
  className?: string;
  size?: "sm" | "default" | "icon";
  buttonText?: string;
  fieldLabel?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  currentValue = "",
  onValueChange,
  onAppendText,
  className,
  size = "sm",
  buttonText,
  fieldLabel,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // References to track initial text and accumulated text during speech session
  const initialTextRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");
  const currentValueRef = useRef<string>(currentValue);

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Permite ver las palabras en tiempo real mientras habla
      recognition.lang = "es-ES";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let newFinalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            newFinalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        if (newFinalTranscript) {
          const space = finalTranscriptRef.current ? " " : "";
          finalTranscriptRef.current += space + newFinalTranscript.trim();
        }

        // Texto completo en tiempo real
        const sessionSpoken = [finalTranscriptRef.current.trim(), interimTranscript.trim()]
          .filter(Boolean)
          .join(" ");

        const base = initialTextRef.current.trim();
        const combined = base
          ? `${base} ${sessionSpoken}`
          : sessionSpoken;

        if (onValueChange) {
          onValueChange(combined);
        } else if (onAppendText && newFinalTranscript.trim()) {
          onAppendText(newFinalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Permiso de micrófono denegado. Permite el acceso al micrófono en tu navegador.");
        } else if (event.error !== "no-speech") {
          toast.error(`Error en dictado por voz: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Speech recognition setup error:", err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [onValueChange, onAppendText]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported || !recognitionRef.current) {
      toast.error("Tu navegador no soporta dictado por voz nativo. Te recomendamos usar Google Chrome o Edge.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        toast.info("Dictado por voz finalizado");
      } catch (err) {
        console.warn("Error stopping speech recognition:", err);
      }
    } else {
      try {
        // Guardar el texto existente antes de empezar a hablar
        initialTextRef.current = currentValueRef.current || "";
        finalTranscriptRef.current = "";

        recognitionRef.current.start();
        setIsListening(true);
        toast.success(`🎙️ Dictando en tiempo real ${fieldLabel ? `en ${fieldLabel}` : ""}`);
      } catch (err: any) {
        console.warn("Error starting speech recognition:", err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            initialTextRef.current = currentValueRef.current || "";
            finalTranscriptRef.current = "";
            recognitionRef.current?.start();
            setIsListening(true);
          }, 200);
        } catch (e) {
          setIsListening(false);
        }
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={toggleListening}
      className={cn(
        "transition-all duration-300 gap-1.5 font-bold text-xs rounded-xl",
        isListening
          ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse ring-2 ring-rose-400/50"
          : "hover:border-primary hover:text-primary text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm",
        className
      )}
      title={isListening ? "Detener dictado en tiempo real" : "Dictar por voz en tiempo real"}
    >
      {isListening ? (
        <>
          <span className="relative flex size-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-white" />
          </span>
          <Mic className="size-3.5 animate-bounce" />
          <span>{buttonText ? `${buttonText}...` : "Escuchando en vivo..."}</span>
        </>
      ) : (
        <>
          <Mic className="size-3.5 text-primary" />
          {buttonText && <span>{buttonText}</span>}
        </>
      )}
    </Button>
  );
};
