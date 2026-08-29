import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins - restrict to known domains (same pattern as chatwoot-proxy)
const getAllowedOrigin = (req: Request): string => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [];

  // Allow configured domains
  if (
    origin.includes('localhost') ||
    allowedOrigins.includes(origin)
  ) {
    return origin;
  }

  // Default to first allowed origin or empty (blocking)
  return allowedOrigins[0] || '';
};

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if current user is admin
    const { data: roles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id);

    const isAdmin = roles?.some(r =>
      r.role === "admin_sistema" || r.role === "admin_clinica"
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores pueden eliminar usuarios" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user_id to delete from request body
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting yourself
    if (user_id === currentUser.id) {
      return new Response(
        JSON.stringify({ error: "No puedes eliminarte a ti mismo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client to delete user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get the profile id first (needed for consultas reference)
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .single();

    // Clear references in consultas (set profesional_id to null)
    if (profileData?.id) {
      await adminClient
        .from("consultas")
        .update({ profesional_id: null })
        .eq("profesional_id", user_id);

      // Also clear expedientes profesional reference
      await adminClient
        .from("expedientes")
        .update({ profesional_id: null })
        .eq("profesional_id", profileData.id);

      // Clear pendientes_humanos reference
      await adminClient
        .from("pendientes_humanos")
        .update({ asignado_a: null })
        .eq("asignado_a", profileData.id);
    }

    // Clear references in clientes (set user_id to null instead of deleting clients)
    await adminClient
      .from("clientes")
      .update({ user_id: null })
      .eq("user_id", user_id);

    // Clear references in citas
    await adminClient
      .from("citas")
      .update({ user_id: null })
      .eq("user_id", user_id);

    // Clear references in notificaciones
    await adminClient
      .from("notificaciones")
      .delete()
      .eq("user_id", user_id);

    // Delete from user_roles
    await adminClient.from("user_roles").delete().eq("user_id", user_id);

    // Delete from profiles
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Delete from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return new Response(
        JSON.stringify({ error: `Error al eliminar usuario: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado completamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in delete-user function:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});