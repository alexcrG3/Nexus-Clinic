import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, Search, Filter, Download, Eye, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  insert: { label: "Creación", color: "bg-green-500", icon: <Plus className="h-3 w-3" /> },
  update: { label: "Actualización", color: "bg-blue-500", icon: <Edit className="h-3 w-3" /> },
  delete: { label: "Eliminación", color: "bg-red-500", icon: <Trash2 className="h-3 w-3" /> },
  view_medical_history: { label: "Ver historial médico", color: "bg-purple-500", icon: <Eye className="h-3 w-3" /> },
  view_consultations: { label: "Ver consultas", color: "bg-purple-500", icon: <Eye className="h-3 w-3" /> },
  view_contact_info: { label: "Ver contacto", color: "bg-purple-500", icon: <Eye className="h-3 w-3" /> },
  patient_search: { label: "Búsqueda paciente", color: "bg-amber-500", icon: <Search className="h-3 w-3" /> },
};

const TABLE_LABELS: Record<string, string> = {
  antecedentes_medicos: "Antecedentes Médicos",
  consultas: "Consultas",
  clientes: "Pacientes",
  odontogramas: "Odontogramas",
  tratamientos_dentales: "Tratamientos Dentales",
  expedientes: "Expedientes",
  citas: "Citas",
};

export default function Auditoria() {
  const { userRole } = useAuth();
  const [tableName, setTableName] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Solo admin_sistema puede ver esta página
  if (userRole !== "admin_sistema") {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: logs, isLoading, refetch, isRefetching } = useAuditLogs({
    tableName: tableName !== "all" ? tableName : undefined,
    action: action !== "all" ? action : undefined,
    limit: 500,
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_profile?.nombre?.toLowerCase().includes(searchLower) ||
      log.user_profile?.apellidos?.toLowerCase().includes(searchLower) ||
      log.user_profile?.email?.toLowerCase().includes(searchLower) ||
      log.table_name?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower)
    );
  });

  const getActionBadge = (actionType: string) => {
    const config = ACTION_LABELS[actionType] || { 
      label: actionType, 
      color: "bg-gray-500", 
      icon: <Eye className="h-3 w-3" /> 
    };
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    if (!filteredLogs?.length) return;

    const headers = ["Fecha", "Usuario", "Email", "Acción", "Tabla", "ID Registro"];
    const rows = filteredLogs.map(log => [
      log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss") : "",
      `${log.user_profile?.nombre || ""} ${log.user_profile?.apellidos || ""}`.trim(),
      log.user_profile?.email || "",
      log.action,
      log.table_name || "",
      log.record_id || "",
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Auditoría del Sistema</h1>
            <p className="text-muted-foreground">
              Registro de accesos y cambios a datos sensibles
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={exportToCSV} disabled={!filteredLogs?.length}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tableName} onValueChange={setTableName}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las tablas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tablas</SelectItem>
                <SelectItem value="antecedentes_medicos">Antecedentes Médicos</SelectItem>
                <SelectItem value="consultas">Consultas</SelectItem>
                <SelectItem value="clientes">Pacientes</SelectItem>
                <SelectItem value="odontogramas">Odontogramas</SelectItem>
                <SelectItem value="tratamientos_dentales">Tratamientos Dentales</SelectItem>
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="insert">Creación</SelectItem>
                <SelectItem value="update">Actualización</SelectItem>
                <SelectItem value="delete">Eliminación</SelectItem>
                <SelectItem value="view_medical_history">Ver historial médico</SelectItem>
                <SelectItem value="view_consultations">Ver consultas</SelectItem>
                <SelectItem value="view_contact_info">Ver contacto</SelectItem>
                <SelectItem value="patient_search">Búsqueda paciente</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setTableName("all");
                setAction("all");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredLogs?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs?.filter(l => l.action === "insert").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Creaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredLogs?.filter(l => l.action === "update").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Actualizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {filteredLogs?.filter(l => l.action?.startsWith("view_")).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Accesos a datos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            Últimos {filteredLogs?.length || 0} registros de actividad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Tabla</TableHead>
                    <TableHead>ID Registro</TableHead>
                    <TableHead className="text-right">Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron registros de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {log.created_at 
                            ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.user_profile?.nombre} {log.user_profile?.apellidos}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {log.user_profile?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          {TABLE_LABELS[log.table_name || ""] || log.table_name || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id ? log.record_id.substring(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
            <DialogDescription>
              Información completa del evento de auditoría
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                  <p className="font-medium">
                    {selectedLog.user_profile?.nombre} {selectedLog.user_profile?.apellidos}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user_profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha/Hora</label>
                  <p className="font-medium">
                    {selectedLog.created_at 
                      ? format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Acción</label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tabla</label>
                  <p className="font-medium">
                    {TABLE_LABELS[selectedLog.table_name || ""] || selectedLog.table_name || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">ID del Registro</label>
                  <p className="font-mono text-sm">{selectedLog.record_id || "-"}</p>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detalles</label>
                  <ScrollArea className="h-64 mt-2 rounded-md border bg-muted/50 p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
