import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultaProfesional } from "@/components/consultas/ConsultaProfesional";

interface ConsultaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  expedienteId: string;
  isLoading?: boolean;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  profesionalNombre?: string;
}

export const ConsultaFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  expedienteId,
  pacienteNombre,
  pacienteTelefono,
  pacienteEmail,
  profesionalNombre,
}: ConsultaFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Crear nueva consulta</DialogTitle>
          <DialogDescription>
            Completa el flujo clínico: motivo, examen físico, diagnóstico y receta en una sola vista.
          </DialogDescription>
        </DialogHeader>

        <ConsultaProfesional
          key={open ? "new-open" : "new-closed"}
          consulta={null}
          expedienteId={expedienteId}
          isNew
          pacienteNombre={pacienteNombre}
          pacienteTelefono={pacienteTelefono}
          pacienteEmail={pacienteEmail}
          profesionalNombre={profesionalNombre}
          onCancel={() => onOpenChange(false)}
          onSave={async (data) => {
            await onSubmit(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
