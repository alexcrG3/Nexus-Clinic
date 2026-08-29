import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from "@/hooks/usePatients";
import { PatientList } from "@/components/patients/PatientList";
import { PatientForm } from "@/components/patients/PatientForm";

const Pacientes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: patients, isLoading } = usePatients();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  // Check for edit query parameter on mount and when patients load
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && patients) {
      const patientToEdit = patients.find((p: any) => p.id === editId);
      if (patientToEdit) {
        setEditingPatient(patientToEdit);
        setIsFormOpen(true);
        // Clear the query parameter
        setSearchParams({});
      }
    }
  }, [searchParams, patients, setSearchParams]);

  const handleCreate = () => {
    setEditingPatient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingPatient) {
      await updatePatient.mutateAsync({ id: editingPatient.id, ...data });
    } else {
      await createPatient.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingPatient(null);
  };

  const handleDelete = async (id: string) => {
    await deletePatient.mutateAsync(id);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gestiona la información de los pacientes</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {patients ? `${patients.length} pacientes registrados` : "Cargando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : patients && patients.length > 0 ? (
            <PatientList
              patients={patients}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay pacientes registrados. Crea uno nuevo para comenzar.
            </p>
          )}
        </CardContent>
      </Card>

      <PatientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        initialData={editingPatient}
        isLoading={createPatient.isPending || updatePatient.isPending}
      />
    </div>
  );
};

export default Pacientes;
