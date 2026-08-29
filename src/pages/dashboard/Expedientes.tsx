import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useExpedientes } from "@/hooks/useExpedientes";
import { ExpedientesList } from "@/components/expedientes/ExpedientesList";
import { ExpedienteFormDialog } from "@/components/expedientes/ExpedienteFormDialog";

const Expedientes = () => {
  const { data: expedientes, isLoading } = useExpedientes();
  const [showNewDialog, setShowNewDialog] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expedientes</h1>
          <p className="text-muted-foreground">Gestiona los expedientes clínicos</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Expediente
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : expedientes && expedientes.length > 0 ? (
        <ExpedientesList expedientes={expedientes} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="mb-4">No hay expedientes registrados</p>
            <Button onClick={() => setShowNewDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear primer expediente
            </Button>
          </CardContent>
        </Card>
      )}

      <ExpedienteFormDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
};

export default Expedientes;
