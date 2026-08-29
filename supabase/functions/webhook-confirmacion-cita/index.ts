import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

// Verify HMAC signature
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = new TextDecoder().decode(encode(new Uint8Array(signatureBuffer)));
  
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    
    // Verify webhook secret is configured
    if (!webhookSecret) {
      console.error("WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signature from header
    const signature = req.headers.get("x-webhook-signature");
    
    // Read body as text for signature verification
    const bodyText = await req.text();
    
    // Verify HMAC signature
    const isValid = await verifySignature(bodyText, signature, webhookSecret);
    
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body after verification
    const { telefono, respuesta, fecha_cita } = JSON.parse(bodyText);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!telefono) {
      return new Response(
        JSON.stringify({ error: "Se requiere el número de teléfono" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalizar teléfono (remover +, espacios, guiones)
    const telefonoNormalizado = telefono.replace(/[\s\-\+]/g, "");
    
    // Buscar citas pendientes para este teléfono
    let query = supabase
      .from("citas")
      .select("id, nombre, telefono, fechaCita, estado")
      .or(`telefono.ilike.%${telefonoNormalizado.slice(-8)}%`)
      .eq("estado", "pendiente");

    // Si se proporciona fecha, filtrar por esa fecha
    if (fecha_cita) {
      query = query.eq("fechaCita", fecha_cita);
    } else {
      // Si no hay fecha, buscar citas de mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      query = query.eq("fechaCita", tomorrowStr);
    }

    const { data: citas, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching citas:", fetchError);
      return new Response(
        JSON.stringify({ error: "Error al buscar citas", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!citas || citas.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No se encontraron citas pendientes para este teléfono" 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar el nuevo estado basado en la respuesta
    let nuevoEstado = "pendiente";
    
    if (respuesta) {
      const respuestaLower = String(respuesta).toLowerCase().trim();
      const respuestasPositivas = ["si", "sí", "yes", "confirmar", "confirmo", "1", "true", "ok", "va", "dale"];
      const respuestasNegativas = ["no", "cancelar", "cancelo", "2", "false"];
      
      if (respuestasPositivas.some(r => respuestaLower.includes(r))) {
        nuevoEstado = "confirmada";
      } else if (respuestasNegativas.some(r => respuestaLower.includes(r))) {
        nuevoEstado = "cancelada";
      }
    }

    // Actualizar todas las citas encontradas
    const citaIds = citas.map(c => c.id);
    const { data: updatedCitas, error: updateError } = await supabase
      .from("citas")
      .update({ estado: nuevoEstado })
      .in("id", citaIds)
      .select();

    if (updateError) {
      console.error("Error updating citas:", updateError);
      return new Response(
        JSON.stringify({ error: "Error al actualizar citas", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log para auditoría
    console.log(`Webhook authenticated - Citas actualizadas: ${citaIds.join(", ")} -> estado: ${nuevoEstado}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${updatedCitas?.length || 0} cita(s) actualizada(s) a estado: ${nuevoEstado}`,
        citas_actualizadas: updatedCitas,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
