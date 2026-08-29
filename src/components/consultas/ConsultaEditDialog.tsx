import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsultaProfesional } from "@/components/consultas/ConsultaProfesional";

interface ConsultaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  consulta: any;
  isLoading?: boolean;
  pacienteNombre?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  profesionalNombre?: string;
}

export const ConsultaEditDialog = ({
  open,
  onOpenChange,
  onSubmit,
  consulta,
  pacienteNombre,
  pacienteTelefono,
  pacienteEmail,
  profesionalNombre,
}: ConsultaEditDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar consulta</DialogTitle>
          <DialogDescription>
            Actualiza el flujo clínico: motivo, examen físico, diagnóstico y receta.
          </DialogDescription>
        </DialogHeader>

        <ConsultaProfesional
          key={consulta?.id || (open ? "edit-open" : "edit-closed")}
          consulta={consulta}
          expedienteId={consulta?.expediente_id}
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
