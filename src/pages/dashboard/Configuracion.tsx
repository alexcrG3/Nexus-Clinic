import SettingsTab from "@/components/dashboard/SettingsTab";

const Configuracion = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Configura los parámetros de la clínica</p>
      </div>
      <SettingsTab />
    </div>
  );
};

export default Configuracion;
