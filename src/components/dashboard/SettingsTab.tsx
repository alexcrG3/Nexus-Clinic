import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Clock, DollarSign, Bell, Upload, Loader2, ImageIcon, Globe, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinicConfig, useUpdateClinicConfig, uploadClinicLogo } from "@/hooks/useClinicConfig";
import { useToast } from "@/hooks/use-toast";

const SettingsTab = () => {
  const { data: config, isLoading } = useClinicConfig();
  const updateConfig = useUpdateClinicConfig();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [clinicForm, setClinicForm] = useState({
    nombre_clinica: "",
    tipo_clinica: "odontologia",
    telefono: "",
    direccion: "",
    email: "",
  });

  const [horariosForm, setHorariosForm] = useState({
    hora_inicio: "08:00",
    hora_fin: "18:00",
    duracion_cita: 30,
    trabajo_sabado: true,
  });

  const [facturacionForm, setFacturacionForm] = useState({
    moneda_simbolo: "₡",
  });

  // Load config into forms
  useEffect(() => {
    if (config) {
      setClinicForm({
        nombre_clinica: config.nombre_clinica || "",
        tipo_clinica: config.tipo_clinica || "odontologia",
        telefono: config.telefono || "",
        direccion: config.direccion || "",
        email: config.email || "",
      });
      setHorariosForm({
        hora_inicio: config.hora_inicio || "08:00",
        hora_fin: config.hora_fin || "18:00",
        duracion_cita: config.duracion_cita || 30,
        trabajo_sabado: config.trabajo_sabado ?? true,
      });
      setFacturacionForm({
        moneda_simbolo: config.moneda_simbolo || "₡",
      });
    }
  }, [config]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const logoUrl = await uploadClinicLogo(file);
      await updateConfig.mutateAsync({ logo_url: logoUrl });
      toast({
        title: "Logo actualizado",
        description: "El logo de la clínica se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveClinic = () => {
    updateConfig.mutate(clinicForm);
  };

  const handleSaveHorarios = () => {
    updateConfig.mutate(horariosForm);
  };

  const handleSaveFacturacion = () => {
    updateConfig.mutate(facturacionForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Configuración</h3>
        <p className="text-muted-foreground">Administra la configuración de tu clínica</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Información de la Clínica</CardTitle>
            </div>
            <CardDescription>Datos generales de tu organización</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-3">
              <Label>Logo de la Clínica</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {config?.logo_url ? (
                    <img 
                      src={config.logo_url} 
                      alt="Logo de la clínica" 
                      className="w-full h-full object-contain"
                    />
                  ) : uploadingLogo ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Subir Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG o SVG. Máximo 2MB.
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Nombre de la Clínica</Label>
                <Input 
                  id="clinic-name" 
                  value={clinicForm.nombre_clinica}
                  onChange={(e) => setClinicForm({ ...clinicForm, nombre_clinica: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-type">Especialidad / Tipo de Clínica</Label>
                <Select 
                  value={clinicForm.tipo_clinica} 
                  onValueChange={(val) => setClinicForm({ ...clinicForm, tipo_clinica: val })}
                >
                  <SelectTrigger id="clinic-type" className="bg-white dark:bg-slate-900 font-semibold">
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odontologia">🦷 Odontología / Dental (con Odontograma)</SelectItem>
                    <SelectItem value="psicologia">🧠 Psicología y Psiquiatría</SelectItem>
                    <SelectItem value="pediatria">👶 Pediatría y Neonatología</SelectItem>
                    <SelectItem value="nutricion">🥗 Nutrición y Dietética</SelectItem>
                    <SelectItem value="ginecologia">🩺 Ginecología y Obstetricia</SelectItem>
                    <SelectItem value="dermatologia">✨ Dermatología y Medicina Estética</SelectItem>
                    <SelectItem value="fisioterapia">🏃 Fisioterapia y Rehabilitación</SelectItem>
                    <SelectItem value="quiropractica">👐 Quiropráctica y Medicina Integral</SelectItem>
                    <SelectItem value="general">🏥 Medicina General / Policlínica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs text-muted-foreground">
              {clinicForm.tipo_clinica === "odontologia" ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ <strong>Especialidad Dental:</strong> Se activará el Odontograma clínico 3D y planes de tratamiento odontológico en los expedientes.
                </span>
              ) : (
                <span className="text-primary font-medium">
                  ✦ <strong>Especialidad Médica ({clinicForm.tipo_clinica}):</strong> El Odontograma permanecerá oculto. Los expedientes se adaptarán automáticamente a la historia médica general y evolución de tu especialidad.
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-phone">Teléfono</Label>
                <Input 
                  id="clinic-phone" 
                  value={clinicForm.telefono}
                  onChange={(e) => setClinicForm({ ...clinicForm, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-email">Email</Label>
                <Input 
                  id="clinic-email" 
                  type="email" 
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-address">Dirección</Label>
              <Input 
                id="clinic-address" 
                value={clinicForm.direccion}
                onChange={(e) => setClinicForm({ ...clinicForm, direccion: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveClinic} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* Presencia Digital / Landing Page */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Sitio Web Público (Landing Page)</CardTitle>
              </div>
              <Badge className={config?.mostrar_landing_publica !== false ? "bg-emerald-500 text-white font-bold" : "bg-slate-500 text-white font-bold"}>
                {config?.mostrar_landing_publica !== false ? "Página Web Activa" : "Modo Solo-App"}
              </Badge>
            </div>
            <CardDescription>
              Activa o desactiva la página web pública de la clínica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-md">
                <Label className="font-bold">Habilitar Sitio Web / Landing Page</Label>
                <p className="text-xs text-muted-foreground">
                  {config?.mostrar_landing_publica !== false
                    ? "Tu clínica cuenta con una página web moderna con catálogo, doctores y agendamiento IA en la raíz (/)."
                    : "Tu clínica ya cuenta con una página web externa. El enlace principal redirige directamente a la app de citas y autenticación."
                  }
                </p>
              </div>
              <Switch 
                checked={config?.mostrar_landing_publica !== false}
                onCheckedChange={(checked) => {
                  updateConfig.mutate({ mostrar_landing_publica: checked });
                }}
              />
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-muted-foreground">Enlace de acceso directo a la App de Citas:</span>
              <code className="font-mono text-primary font-bold">{window.location.origin}/auth</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Horarios de Atención</CardTitle>
            </div>
            <CardDescription>Configure los horarios de operación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Hora de Inicio</Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  value={horariosForm.hora_inicio}
                  onChange={(e) => setHorariosForm({ ...horariosForm, hora_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Hora de Fin</Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  value={horariosForm.hora_fin}
                  onChange={(e) => setHorariosForm({ ...horariosForm, hora_fin: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-duration">Duración de Citas (minutos)</Label>
              <Input 
                id="appointment-duration" 
                type="number" 
                value={horariosForm.duracion_cita}
                onChange={(e) => setHorariosForm({ ...horariosForm, duracion_cita: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Trabajar Sábados</Label>
                <p className="text-sm text-muted-foreground">Habilitar citas los sábados</p>
              </div>
              <Switch 
                checked={horariosForm.trabajo_sabado}
                onCheckedChange={(checked) => setHorariosForm({ ...horariosForm, trabajo_sabado: checked })}
              />
            </div>
            <Button onClick={handleSaveHorarios} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Horarios
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Configuración de Facturación</CardTitle>
            </div>
            <CardDescription>Parámetros de facturación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Símbolo de Moneda</Label>
              <Input 
                id="currency" 
                value={facturacionForm.moneda_simbolo}
                onChange={(e) => setFacturacionForm({ ...facturacionForm, moneda_simbolo: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Impuestos Incluidos</Label>
                <p className="text-sm text-muted-foreground">Aplicar IVA automáticamente</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button onClick={handleSaveFacturacion} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>Administra las notificaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorios de Citas</Label>
                <p className="text-sm text-muted-foreground">Enviar SMS a pacientes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones de Email</Label>
                <p className="text-sm text-muted-foreground">Recibir alertas por correo</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmación de Citas</Label>
                <p className="text-sm text-muted-foreground">Solicitar confirmación 24h antes</p>
              </div>
              <Switch />
            </div>
            <Button>Guardar Preferencias</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;
