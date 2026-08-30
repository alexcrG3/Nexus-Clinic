import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, MoreVertical, Mail, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { escapeHtml } from "@/lib/sanitize";
import { useClinicConfig } from "@/hooks/useClinicConfig";

interface Medicamento {
  nombre: string;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  indicaciones?: string;
}

interface RecetaActionsProps {
  medicamentos: Medicamento[];
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  profesionalNombre?: string;
  diagnostico?: string;
  fecha?: string;
}

const generarHTMLReceta = (
  medicamentos: Medicamento[],
  pacienteNombre: string,
  profesionalNombre: string,
  diagnostico: string,
  fecha: string,
  clinicName: string = "Nexus Clinic",
  logoUrl?: string
) => {
  const medicamentosHTML = medicamentos
    .map(
      (med, idx) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a;">${escapeHtml(med.nombre)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">${escapeHtml(med.dosis || "-")}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">${escapeHtml(med.frecuencia || "-")}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155;">${escapeHtml(med.duracion || "-")}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 13px;">${escapeHtml(med.indicaciones || "-")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Receta Médica - ${escapeHtml(pacienteNombre)}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          margin: 0; 
          padding: 30px 40px; 
          color: #0f172a; 
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding-bottom: 16px; 
          border-bottom: 3px solid #0284c7; 
          margin-bottom: 24px; 
        }
        .clinic-brand { display: flex; align-items: center; gap: 14px; }
        .clinic-logo { width: 52px; height: 52px; object-fit: contain; }
        .clinic-info h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
        .clinic-info p { margin: 2px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600; }
        .rx-badge { background: #0284c7; color: white; padding: 6px 14px; border-radius: 12px; font-weight: 800; font-size: 18px; letter-spacing: 1px; }
        
        .patient-card { 
          display: grid; 
          grid-template-columns: 2fr 1fr; 
          gap: 12px; 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          padding: 14px 18px; 
          border-radius: 12px; 
          margin-bottom: 24px; 
        }
        .data-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
        .data-field span { font-size: 14px; font-weight: 700; color: #0f172a; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        th { background: #0284c7; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        
        .instructions { margin-top: 24px; padding: 14px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px; color: #166534; }
        .instructions strong { display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; }
        
        .footer-signatures { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end; 
          margin-top: 60px; 
          padding-top: 20px; 
          border-top: 1px dashed #cbd5e1; 
        }
        .qr-placeholder { font-size: 10px; color: #94a3b8; text-align: left; }
        .doctor-signature { text-align: center; min-width: 220px; }
        .signature-line { border-top: 1.5px solid #0f172a; width: 100%; margin-bottom: 6px; }
        .doctor-signature p { margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; }
        .doctor-signature span { font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="clinic-brand">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" class="clinic-logo" alt="Logo" />` : `<div style="width:44px; height:44px; background:#0284c7; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:24px; font-weight:900;">+</div>`}
          <div class="clinic-info">
            <h1>${escapeHtml(clinicName)}</h1>
            <p>Servicios Médicos Profesionales • Prescripción Oficial</p>
          </div>
        </div>
        <div class="rx-badge">Rx</div>
      </div>
      
      <div class="patient-card">
        <div class="data-field">
          <label>Paciente</label>
          <span>${escapeHtml(pacienteNombre)}</span>
        </div>
        <div class="data-field" style="text-align: right;">
          <label>Fecha de Emisión</label>
          <span>${escapeHtml(fecha)}</span>
        </div>
        <div class="data-field" style="grid-column: span 2; margin-top: 4px;">
          <label>Diagnóstico / Impresión Clínica</label>
          <span>${escapeHtml(diagnostico || "Evaluación Médica General")}</span>
        </div>
      </div>

      <h3 style="color: #0284c7; margin: 0 0 10px 0; font-size: 15px; font-weight: 800; text-transform: uppercase;">Prescripción Farmacológica</h3>
      
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Medicamento</th>
            <th>Dosis</th>
            <th>Frecuencia</th>
            <th>Duración</th>
            <th>Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          ${medicamentosHTML}
        </tbody>
      </table>

      <div class="instructions">
        <strong>Indicaciones para el Paciente:</strong>
        Tomar los medicamentos según la pauta prescrita. En caso de presentar reacciones adversas o intolerancia, comuníquese de inmediato con la clínica.
      </div>

      <div class="footer-signatures">
        <div class="qr-placeholder">
          <span>Código Digital de Autenticidad</span><br/>
          <strong>Nexus-Clinic Rx</strong>
        </div>
        <div class="doctor-signature">
          <div class="signature-line"></div>
          <p>${escapeHtml(profesionalNombre)}</p>
          <span>Médico / Profesional Tratante</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generarTextoWhatsApp = (
  medicamentos: Medicamento[],
  pacienteNombre: string,
  profesionalNombre: string,
  diagnostico: string
) => {
  const medicamentosTexto = medicamentos
    .map(
      (med, idx) =>
        `${idx + 1}. *${med.nombre}*\n   ${med.indicaciones || "Sin indicaciones adicionales"}`
    )
    .join("\n\n");

  return `🏥 *RECETA MÉDICA*\n\n` +
    `👤 Paciente: ${pacienteNombre}\n` +
    `📋 Diagnóstico: ${diagnostico || "No especificado"}\n\n` +
    `💊 *Medicamentos:*\n\n${medicamentosTexto}\n\n` +
    `⚕️ Dr. ${profesionalNombre}\n` +
    `📅 Fecha: ${new Date().toLocaleDateString("es-ES")}`;
};

export const RecetaActions = ({
  medicamentos,
  pacienteNombre = "Paciente",
  pacienteTelefono = "",
  pacienteEmail = "",
  profesionalNombre = "Profesional de la salud",
  diagnostico = "",
  fecha = new Date().toLocaleDateString("es-ES"),
}: RecetaActionsProps) => {
  const { data: clinicConfig } = useClinicConfig();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [email, setEmail] = useState(pacienteEmail);
  const [telefono, setTelefono] = useState(pacienteTelefono);
  const [sending, setSending] = useState(false);

  const handlePrint = () => {
    if (medicamentos.length === 0) {
      toast.error("No hay medicamentos en la receta");
      return;
    }

    const html = generarHTMLReceta(
      medicamentos,
      pacienteNombre,
      profesionalNombre,
      diagnostico,
      fecha,
      clinicConfig?.nombre_clinica || "Nexus Clinic",
      clinicConfig?.logo_url
    );

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error("Ingresa un correo electrónico");
      return;
    }

    if (medicamentos.length === 0) {
      toast.error("No hay medicamentos en la receta");
      return;
    }

    setSending(true);
    try {
      // Here you would call an edge function to send the email
      // For now, we'll show a success message
      toast.info("Función de correo en desarrollo. Usa la opción de imprimir o WhatsApp.");
      setEmailDialogOpen(false);
    } catch (error) {
      toast.error("Error al enviar el correo");
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!telefono) {
      toast.error("Ingresa un número de teléfono");
      return;
    }

    if (medicamentos.length === 0) {
      toast.error("No hay medicamentos en la receta");
      return;
    }

    const texto = generarTextoWhatsApp(
      medicamentos,
      pacienteNombre,
      profesionalNombre,
      diagnostico
    );

    // Limpiar número de teléfono
    const telefonoLimpio = telefono.replace(/[^0-9]/g, "");
    
    // Agregar código de país si no lo tiene (Costa Rica: 506)
    const telefonoCompleto = telefonoLimpio.startsWith("506") 
      ? telefonoLimpio 
      : `506${telefonoLimpio}`;

    const url = `https://wa.me/${telefonoCompleto}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    setWhatsappDialogOpen(false);
    toast.success("Abriendo WhatsApp...");
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrint}
          title="Imprimir receta"
        >
          <Printer className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar por correo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setWhatsappDialogOpen(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar por WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar receta por correo</DialogTitle>
            <DialogDescription>
              La receta será enviada al correo electrónico del paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@ejemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar receta por WhatsApp</DialogTitle>
            <DialogDescription>
              Se abrirá WhatsApp con la receta lista para enviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Número de teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="8888-8888"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el número sin código de país (se agregará +506 automáticamente)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
