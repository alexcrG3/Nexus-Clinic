import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MessageSquare, Save, TestTube } from "lucide-react";

interface ChatwootConfig {
  id?: string;
  chatwoot_url: string;
  chatwoot_account_id: string;
  chatwoot_api_token: string;
  inbox_id: string;
  activo: boolean;
}

const ChatwootConfigForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [organizacionId, setOrganizacionId] = useState<string | null>(null);
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [config, setConfig] = useState<ChatwootConfig>({
    chatwoot_url: "",
    chatwoot_account_id: "",
    chatwoot_api_token: "",
    inbox_id: "",
    activo: true,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      if (!user) return;

      try {
        // Get user's organization
        const { data: profile } = await supabase
          .from("profiles")
          .select("organizacion_id")
          .eq("user_id", user.id)
          .single();

        if (profile?.organizacion_id) {
          setOrganizacionId(profile.organizacion_id);

          // Get existing config
          const { data: existingConfig } = await supabase
            .from("chatwoot_config")
            .select("*")
            .eq("organizacion_id", profile.organizacion_id)
            .single();

          if (existingConfig) {
            // Check if token is encrypted (stored as ***ENCRYPTED*** or has encrypted column)
            const tokenIsEncrypted = existingConfig.chatwoot_api_token === '***ENCRYPTED***' || 
                                     existingConfig.chatwoot_api_token_encrypted != null;
            setHasExistingToken(tokenIsEncrypted);
            
            setConfig({
              id: existingConfig.id,
              chatwoot_url: existingConfig.chatwoot_url || "",
              chatwoot_account_id: existingConfig.chatwoot_account_id || "",
              chatwoot_api_token: "", // Never display the actual token
              inbox_id: existingConfig.inbox_id || "",
              activo: existingConfig.activo ?? true,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  const handleSave = async () => {
    console.log("Saving config:", { config, organizacionId });
    
    if (!organizacionId) {
      toast({
        title: "Error",
        description: "No se encontró la organización. Por favor recarga la página.",
        variant: "destructive",
      });
      return;
    }

    const url = config.chatwoot_url?.trim();
    const accountId = config.chatwoot_account_id?.trim();
    const apiToken = config.chatwoot_api_token?.trim();

    console.log("Validated values:", { url, accountId, hasExistingToken });

    // Only require token if there's no existing encrypted token
    const tokenRequired = !hasExistingToken && !apiToken;
    
    if (!url || !accountId || tokenRequired) {
      toast({
        title: "Error",
        description: `Campos faltantes: ${!url ? "URL, " : ""}${!accountId ? "Account ID, " : ""}${tokenRequired ? "API Token" : ""}`.replace(/, $/, ""),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Clean the URL - remove trailing paths like /app/accounts/1/dashboard
      let cleanUrl = url;
      const urlMatch = url.match(/^(https?:\/\/[^\/]+)/);
      if (urlMatch) {
        cleanUrl = urlMatch[1];
      }

      console.log("Config data to save:", { cleanUrl, accountId, hasToken: !!apiToken });

      let result;
      if (config.id) {
        // For update, only include token if provided
        const updateData: { organizacion_id: string; chatwoot_url: string; chatwoot_account_id: string; inbox_id: string | null; activo: boolean; chatwoot_api_token?: string } = {
          organizacion_id: organizacionId,
          chatwoot_url: cleanUrl,
          chatwoot_account_id: accountId,
          inbox_id: config.inbox_id?.trim() || null,
          activo: config.activo,
        };
        if (apiToken) {
          updateData.chatwoot_api_token = apiToken;
        }
        
        result = await supabase
          .from("chatwoot_config")
          .update(updateData)
          .eq("id", config.id)
          .select()
          .single();
      } else {
        // For insert, token is required
        result = await supabase
          .from("chatwoot_config")
          .insert({
            organizacion_id: organizacionId,
            chatwoot_url: cleanUrl,
            chatwoot_account_id: accountId,
            chatwoot_api_token: apiToken,
            inbox_id: config.inbox_id?.trim() || null,
            activo: config.activo,
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error("Supabase error:", result.error);
        throw result.error;
      }

      // Update local state with the saved config including the ID
      if (result.data) {
        // Token is now encrypted, mark that we have an existing token
        if (apiToken) {
          setHasExistingToken(true);
        }
        setConfig({
          id: result.data.id,
          chatwoot_url: result.data.chatwoot_url || "",
          chatwoot_account_id: result.data.chatwoot_account_id || "",
          chatwoot_api_token: "", // Clear the input field after save
          inbox_id: result.data.inbox_id || "",
          activo: result.data.activo ?? true,
        });
      }

      toast({
        title: "Configuración guardada",
        description: "La integración con Chatwoot se ha configurado correctamente",
      });
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("chatwoot-proxy", {
        body: { action: "get_conversations" },
      });

      if (response.error) throw response.error;

      if (response.data?.configured === false) {
        toast({
          title: "Error",
          description: "Chatwoot no está configurado. Guarda la configuración primero.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Conexión exitosa",
        description: "La conexión con Chatwoot funciona correctamente",
      });
    } catch (error: any) {
      console.error("Test error:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Chatwoot. Verifica las credenciales.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Configuración de Chatwoot</CardTitle>
        </div>
        <CardDescription>
          Conecta tu cuenta de Chatwoot para gestionar conversaciones con pacientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chatwoot_url">URL de Chatwoot *</Label>
          <Input
            id="chatwoot_url"
            placeholder="https://tu-clinica.chatwoot.com"
            value={config.chatwoot_url}
            onChange={(e) => setConfig({ ...config, chatwoot_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            La URL de tu instancia de Chatwoot
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_account_id">Account ID *</Label>
          <Input
            id="chatwoot_account_id"
            placeholder="1"
            value={config.chatwoot_account_id}
            onChange={(e) => setConfig({ ...config, chatwoot_account_id: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Lo encuentras en Settings → Account Settings
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_api_token">
            API Access Token {hasExistingToken ? "(encrypted)" : "*"}
          </Label>
          <Input
            id="chatwoot_api_token"
            type="password"
            placeholder={hasExistingToken ? "Dejar vacío para mantener el actual" : "••••••••••••••••"}
            value={config.chatwoot_api_token}
            onChange={(e) => setConfig({ ...config, chatwoot_api_token: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {hasExistingToken 
              ? "Token almacenado de forma segura. Solo ingresa un nuevo valor si deseas cambiarlo."
              : "Lo encuentras en Settings → Profile Settings → Access Token"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inbox_id">Inbox ID (opcional)</Label>
          <Input
            id="inbox_id"
            placeholder="1"
            value={config.inbox_id}
            onChange={(e) => setConfig({ ...config, inbox_id: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Si deseas filtrar por un inbox específico
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Integración activa</Label>
            <p className="text-xs text-muted-foreground">
              Habilitar o deshabilitar la integración
            </p>
          </div>
          <Switch
            checked={config.activo}
            onCheckedChange={(checked) => setConfig({ ...config, activo: checked })}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !config.id}>
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Probar conexión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatwootConfigForm;
