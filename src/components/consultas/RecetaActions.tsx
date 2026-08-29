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
  fecha: string
) => {
  const medicamentosHTML = medicamentos
    .map(
      (med, idx) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${escapeHtml(med.nombre)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(med.dosis || "-")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(med.frecuencia || "-")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(med.duracion || "-")}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(med.indicaciones || "-")}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receta Médica</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1f2937; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #7c3aed; margin-bottom: 20px; }
        .header h1 { color: #7c3aed; margin: 0; font-size: 24px; }
        .header p { color: #6b7280; margin: 5px 0 0 0; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .info-group { }
        .info-group label { font-size: 12px; color: #6b7280; display: block; }
        .info-group span { font-weight: 600; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #7c3aed; color: white; padding: 12px; text-align: left; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .signature { margin-top: 60px; text-align: center; }
        .signature-line { border-top: 1px solid #1f2937; width: 200px; margin: 0 auto 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 Receta Médica</h1>
        <p>Nova Dental Clinic</p>
      </div>
      
      <div class="info-section">
        <div class="info-group">
          <label>Paciente</label>
          <span>${escapeHtml(pacienteNombre)}</span>
        </div>
        <div class="info-group">
          <label>Fecha</label>
          <span>${escapeHtml(fecha)}</span>
        </div>
        <div class="info-group">
          <label>Diagnóstico</label>
          <span>${escapeHtml(diagnostico || "No especificado")}</span>
        </div>
      </div>

      <h3 style="color: #7c3aed; margin-bottom: 10px;">Medicamentos Recetados</h3>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
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

      <div class="footer">
        <p><strong>Indicaciones generales:</strong> Seguir las indicaciones al pie de la letra. Acudir a consulta si presenta efectos adversos.</p>
      </div>

      <div class="signature">
        <div class="signature-line"></div>
        <p style="margin: 0; font-weight: 600;">${escapeHtml(profesionalNombre)}</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Firma del Profesional</p>
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
      fecha
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
