import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Building2, 
  Users, 
  Calendar, 
  Activity, 
  Plus, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  LogOut,
  Sparkles,
  CheckCircle2,
  Phone,
  MapPin,
  Stethoscope
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ClinicOrg {
  id: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo?: boolean;
  miembros_count?: number;
  citas_count?: number;
  created_at?: string;
}

export const CentroDeMando = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<ClinicOrg[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCitas, setTotalCitas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Nueva Clínica
  const [openNewModal, setOpenNewModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [newOrgPhone, setNewOrgPhone] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      // 1. Obtener Organizaciones / Clínicas
      const { data: orgsData, error: orgsErr } = await supabase
        .from("organizaciones")
        .select("*")
        .order("nombre");

      if (orgsErr) throw orgsErr;

      // 2. Obtener recuento de perfiles / usuarios
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 3. Obtener recuento de citas totales
      const { count: citasCount } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true });

      setTotalUsers(usersCount || 0);
      setTotalCitas(citasCount || 0);

      if (!orgsData || orgsData.length === 0) {
        setOrganizations([
          {
            id: "org-default-1",
            nombre: "Clínica Nova Dental",
            direccion: "Dirección Principal",
            telefono: "123-456-7890",
            activo: true,
            miembros_count: usersCount || 1,
            citas_count: citasCount || 0,
          },
        ]);
      } else {
        const enriched = orgsData.map((org) => ({
          ...org,
          activo: true,
          miembros_count: usersCount || 1,
          citas_count: citasCount || 0,
        }));
        setOrganizations(enriched);
      }
    } catch (err: any) {
      console.error("Error cargando Centro de Mando:", err);
      toast.error("Error al cargar datos globales");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      toast.error("Ingresa el nombre de la clínica.");
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("organizaciones")
        .insert({
          nombre: newOrgName,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`¡Clínica "${newOrgName}" creada exitosamente!`);
      setOpenNewModal(false);
      setNewOrgName("");
      setNewOrgAddress("");
      setNewOrgPhone("");
      fetchGlobalData();
    } catch (err: any) {
      toast.error(err.message || "Error al crear la clínica");
    } finally {
      setCreating(false);
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.direccion && org.direccion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Barra Superior Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white uppercase">
                  CENTRO DE MANDO
                </h1>
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                  SaaS Multi-Clínica
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Gestión global de clínicas y afiliados • Nexus Clinic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGlobalData}
              className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} /> Actualizar
            </Button>

            <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 gap-1.5 h-9">
                  <Plus className="w-4 h-4" /> + Nueva Clínica
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl">
                <form onSubmit={handleCreateClinic}>
                  <DialogHeader>
                    <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                      <Building2 className="w-5 h-5 text-primary" /> Afiliar Nueva Clínica
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Crea un nuevo consultorio u organización independiente en la plataforma.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4 text-left">
                    <div className="space-y-1.5">
                      <Label htmlFor="orgName" className="text-xs font-bold">Nombre de la Clínica</Label>
                      <Input
                        id="orgName"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Ej. Clínica Dental Sonrisas"
                        required
                        className="text-xs rounded-xl h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="orgAddress" className="text-xs font-bold">Ubicación / Ciudad</Label>
                      <Input
                        id="orgAddress"
                        value={newOrgAddress}
                        onChange={(e) => setNewOrgAddress(e.target.value)}
                        placeholder="Ej. San José, Costa Rica"
                        className="text-xs rounded-xl h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="orgPhone" className="text-xs font-bold">Teléfono de Contacto</Label>
                      <Input
                        id="orgPhone"
                        value={newOrgPhone}
                        onChange={(e) => setNewOrgPhone(e.target.value)}
                        placeholder="Ej. +506 8888-9999"
                        className="text-xs rounded-xl h-10"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenNewModal(false)}
                      className="text-xs rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90"
                    >
                      {creating ? "Creando..." : "Crear Clínica"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="text-xs text-muted-foreground hover:text-red-500 gap-1 h-9"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </Button>
          </div>

        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* 4 Tarjetas de Métricas Globales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Clínicas */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  TOTAL CLÍNICAS
                </span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {organizations.length}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Organizaciones conectadas
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Card 2: Activas */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  ACTIVAS
                </span>
                <h3 className="text-3xl font-black text-primary mt-1">
                  {organizations.length}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Estado operativo 100%
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Card 3: Usuarios Totales */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  USUARIOS TOTALES
                </span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {totalUsers || 1}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Doctores, staff y pacientes
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Card 4: Citas Procesadas */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  CITAS PROCESADAS
                </span>
                <h3 className="text-3xl font-black text-primary mt-1">
                  {totalCitas}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Agendadas por IA y doctores
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </Card>

        </div>

        {/* Sección Directorio de Clínicas */}
        <div className="space-y-4 text-left">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Directorio de Clínicas
              </h2>
              <p className="text-xs text-muted-foreground">
                Consulta todas las clínicas activas y accede como superadministrador.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, código, ubicación..."
                className="pl-9 text-xs rounded-xl h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Lista de Tarjetas de Clínicas */}
          <div className="space-y-3">
            {filteredOrgs.length === 0 ? (
              <Card className="text-center py-12 rounded-3xl border-dashed">
                <CardContent className="space-y-2">
                  <Building2 className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h3 className="font-bold text-sm">No se encontraron clínicas</h3>
                  <p className="text-xs text-muted-foreground">Prueba con otro término de búsqueda.</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrgs.map((org, index) => {
                const initials = org.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

                return (
                  <div
                    key={org.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                        {initials || "CL"}
                      </div>
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {org.nombre}
                          </h3>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-primary uppercase text-[10px]">
                            CLÍNICA DENTAL • CÓDIGO: {`000${index + 1}`.slice(-4)}
                          </span>
                          {org.direccion && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary" /> {org.direccion}
                            </span>
                          )}
                          {org.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-primary" /> {org.telefono}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="text-center">
                          <span className="font-bold text-foreground block">{org.miembros_count || 1}</span>
                          <span className="text-[10px]">MIEMBROS</span>
                        </div>
                        <div className="text-center">
                          <span className="font-bold text-foreground block">{org.citas_count || 0}</span>
                          <span className="text-[10px]">CITAS</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                          • ACTIVO
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          localStorage.setItem("active_org_id", org.id);
                          toast.success(`Accediendo al panel de ${org.nombre}`);
                          navigate("/dashboard");
                        }}
                        className="text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm px-4 h-9 gap-1"
                      >
                        Ingresar <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </main>
      
      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-muted-foreground border-t border-slate-200 dark:border-slate-800">
        ✦ NEXUS CLINIC — PLATAFORMA SAAS DE GESTIÓN CLÍNICA & AGENTES IA
      </footer>

    </div>
  );
};

export default CentroDeMando;
