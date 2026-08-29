import MessagesTab from "@/components/dashboard/MessagesTab";

const Mensajes = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
        <p className="text-muted-foreground">Gestiona las conversaciones con pacientes</p>
      </div>
      <MessagesTab />
    </div>
  );
};

export default Mensajes;
