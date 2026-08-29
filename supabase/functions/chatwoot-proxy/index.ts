import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins - restrict to known domains
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

// Allowed actions for input validation
const ALLOWED_ACTIONS = ['get_conversations', 'get_messages', 'send_message', 'get_contacts'] as const;
type AllowedAction = typeof ALLOWED_ACTIONS[number];

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's organization
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organizacion_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organizacion_id) {
      return new Response(JSON.stringify({ error: 'No organization found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Chatwoot config using secure RPC function (handles decryption)
    const { data: configs, error: configError } = await supabaseClient
      .rpc('get_chatwoot_config_for_org', { org_id: profile.organizacion_id });

    if (configError || !configs || configs.length === 0) {
      return new Response(JSON.stringify({
        error: 'Chatwoot not configured',
        configured: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = configs[0];

    const requestBody = await req.json();
    const { action, conversationId, message } = requestBody;

    // Validate action parameter
    if (!action || !ALLOWED_ACTIONS.includes(action as AllowedAction)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate message content for send_message action
    if (action === 'send_message') {
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (message.length > 10000) {
        return new Response(JSON.stringify({ error: 'Message too long' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate conversationId for actions that require it
    if ((action === 'get_messages' || action === 'send_message') && !conversationId) {
      return new Response(JSON.stringify({ error: 'Conversation ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = config.chatwoot_url.replace(/\/$/, '');
    const accountId = config.chatwoot_account_id;
    const apiToken = config.chatwoot_api_token;

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      case 'get_conversations':
        endpoint = `/api/v1/accounts/${accountId}/conversations`;
        break;
      case 'get_messages':
        endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
        break;
      case 'send_message':
        endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
        method = 'POST';
        body = JSON.stringify({ content: message, message_type: 'outgoing' });
        break;
      case 'get_contacts':
        endpoint = `/api/v1/accounts/${accountId}/contacts`;
        break;
    }

    console.log(`Chatwoot request: ${method} ${baseUrl}${endpoint} for user ${user.id}`);

    const chatwootResponse = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'api_access_token': apiToken,
        'Content-Type': 'application/json',
      },
      ...(body && { body }),
    });

    const responseData = await chatwootResponse.json();

    return new Response(JSON.stringify({
      data: responseData,
      configured: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Chatwoot proxy error:', error);
    // Return generic error message to client (don't leak internal details)
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(req),
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json'
      },
    });
  }
});
