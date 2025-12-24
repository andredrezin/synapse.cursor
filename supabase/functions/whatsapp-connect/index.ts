import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectRequest {
  workspace_id: string;
  name: string;
  provider: "evolution" | "official";
}

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-connect", message, ...(data && { data }) };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  log("INFO", `[${requestId}] Request received`, { method: req.method });

  if (req.method === "OPTIONS") {
    log("DEBUG", `[${requestId}] CORS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Log environment check
    log("DEBUG", `[${requestId}] Environment check`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
    });

    // Get centralized API credentials from secrets
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
    const metaAppId = Deno.env.get("META_APP_ID");
    const metaAppSecret = Deno.env.get("META_APP_SECRET");

    log("DEBUG", `[${requestId}] API credentials check`, {
      hasEvolutionUrl: !!evolutionApiUrl,
      hasEvolutionKey: !!evolutionApiKey,
      hasMetaAppId: !!metaAppId,
      hasMetaAppSecret: !!metaAppSecret,
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("WARN", `[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("DEBUG", `[${requestId}] Auth header present, validating user...`);

    // Create client with user's auth token to verify the user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      log("ERROR", `[${requestId}] User authentication failed`, { error: userError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("INFO", `[${requestId}] User authenticated`, { userId: user.id, email: user.email });

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: ConnectRequest = await req.json();
    log("INFO", `[${requestId}] Connect request`, { 
      workspace_id: body.workspace_id,
      name: body.name,
      provider: body.provider 
    });

    const { workspace_id, name, provider } = body;

    if (!workspace_id || !name || !provider) {
      log("WARN", `[${requestId}] Missing required fields`, { workspace_id: !!workspace_id, name: !!name, provider: !!provider });
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: workspace_id, name, provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to the workspace
    log("DEBUG", `[${requestId}] Checking workspace membership...`);
    const { data: member, error: memberError } = await supabaseAdmin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      log("ERROR", `[${requestId}] Workspace access denied`, { error: memberError?.message, workspace_id });
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado a este workspace" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("INFO", `[${requestId}] Workspace access granted`, { role: member.role });

    // Generate unique instance name
    const instanceName = `ws_${workspace_id.slice(0, 8)}_${Date.now()}`;
    log("DEBUG", `[${requestId}] Generated instance name`, { instanceName });
    
    // Build webhook URL for this function
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

    if (provider === "evolution") {
      // Check if Evolution API is configured
      if (!evolutionApiUrl || !evolutionApiKey) {
        log("ERROR", `[${requestId}] Evolution API not configured`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nas configurações." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log("INFO", `[${requestId}] Creating Evolution instance`, { instanceName, apiUrl: evolutionApiUrl });

      // Create instance in Evolution API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      let evolutionResponse;
      try {
        evolutionResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        log("ERROR", `[${requestId}] Evolution API connection failed`, { error: fetchError.message });
        
        const errorMessage = fetchError.name === 'AbortError'
          ? "Timeout ao conectar com Evolution API. Verifique se o servidor está online."
          : `Erro de conexão com Evolution API: ${fetchError.message}. Verifique se a URL está correta e o servidor está acessível.`;
        
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      clearTimeout(timeoutId);

      log("DEBUG", `[${requestId}] Evolution API response status`, { status: evolutionResponse.status });

      if (!evolutionResponse.ok) {
        const errorText = await evolutionResponse.text();
        log("ERROR", `[${requestId}] Evolution API create instance failed`, { status: evolutionResponse.status, error: errorText });
        return new Response(
          JSON.stringify({ success: false, error: `Erro Evolution API: ${evolutionResponse.status} - ${errorText}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const evolutionData = await evolutionResponse.json();
      log("INFO", `[${requestId}] Evolution instance created`, { hasQrCode: !!evolutionData.qrcode?.base64 });

      // Set webhook in Evolution API
      log("DEBUG", `[${requestId}] Setting up webhook`, { webhookUrl });
      const webhookSecret = crypto.randomUUID();
      
      // Try different webhook configuration approaches for Evolution API compatibility
      let webhookConfigured = false;
      
      // Approach 1: Modern Evolution API v2.x webhook configuration
      try {
        const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: true,
              events: [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE", 
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED",
              ],
            }
          }),
        });

        log("DEBUG", `[${requestId}] Webhook setup response (v2)`, { status: webhookResponse.status });
        
        if (webhookResponse.ok) {
          webhookConfigured = true;
        } else {
          // Approach 2: Legacy webhook format
          const legacyResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": evolutionApiKey,
            },
            body: JSON.stringify({
              enabled: true,
              url: webhookUrl,
              webhookByEvents: true,
              events: [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "CONNECTION_UPDATE", 
                "QRCODE_UPDATED",
              ],
            }),
          });
          
          log("DEBUG", `[${requestId}] Webhook setup response (legacy)`, { status: legacyResponse.status });
          webhookConfigured = legacyResponse.ok;
        }
      } catch (webhookError: any) {
        log("WARN", `[${requestId}] Webhook setup failed`, { error: webhookError.message });
      }

      if (!webhookConfigured) {
        log("WARN", `[${requestId}] Webhook not configured - status updates may not work automatically`);
      }

      // Save connection to database
      log("DEBUG", `[${requestId}] Saving connection to database...`);
      const { data: connection, error: dbError } = await supabaseAdmin
        .from("whatsapp_connections")
        .insert({
          workspace_id,
          name,
          provider,
          instance_name: instanceName,
          webhook_secret: webhookSecret,
          status: "qr_pending",
          qr_code: evolutionData.qrcode?.base64 || null,
        })
        .select()
        .single();

      if (dbError) {
        log("ERROR", `[${requestId}] Database insert failed`, { error: dbError.message });
        return new Response(
          JSON.stringify({ success: false, error: `Database error: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log("INFO", `[${requestId}] Connection saved`, { connectionId: connection.id });

      // Get QR code if not returned in create response
      if (!evolutionData.qrcode?.base64) {
        log("DEBUG", `[${requestId}] Fetching QR code separately...`);
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: { "apikey": evolutionApiKey },
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          if (qrData.base64) {
            await supabaseAdmin
              .from("whatsapp_connections")
              .update({ qr_code: qrData.base64 })
              .eq("id", connection.id);
            
            connection.qr_code = qrData.base64;
            log("INFO", `[${requestId}] QR code fetched and saved`);
          }
        } else {
          log("WARN", `[${requestId}] Failed to fetch QR code`, { status: qrResponse.status });
        }
      }

      log("INFO", `[${requestId}] Evolution connection completed successfully`, { connectionId: connection.id });

      return new Response(
        JSON.stringify({
          success: true,
          connection,
          qr_code: connection.qr_code,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (provider === "official") {
      // Facebook OAuth flow
      if (!metaAppId || !metaAppSecret) {
        log("ERROR", `[${requestId}] Meta App not configured`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Meta App não configurado. Configure META_APP_ID e META_APP_SECRET nas configurações." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log("INFO", `[${requestId}] Starting Official API OAuth flow`);

      // Create pending connection in database
      const webhookSecret = crypto.randomUUID();
      const { data: connection, error: dbError } = await supabaseAdmin
        .from("whatsapp_connections")
        .insert({
          workspace_id,
          name,
          provider,
          webhook_secret: webhookSecret,
          status: "connecting",
        })
        .select()
        .single();

      if (dbError) {
        log("ERROR", `[${requestId}] Database insert failed`, { error: dbError.message });
        return new Response(
          JSON.stringify({ success: false, error: `Database error: ${dbError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      log("INFO", `[${requestId}] Pending connection created`, { connectionId: connection.id });

      // Build Facebook OAuth URL
      const redirectUri = `${supabaseUrl}/functions/v1/whatsapp-oauth-callback`;
      const state = JSON.stringify({ connection_id: connection.id, workspace_id });
      const encodedState = encodeURIComponent(btoa(state));
      
      const facebookLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${metaAppId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=whatsapp_business_management,whatsapp_business_messaging` +
        `&state=${encodedState}` +
        `&response_type=code`;

      log("INFO", `[${requestId}] OAuth URL generated`, { redirectUri });

      return new Response(
        JSON.stringify({
          success: true,
          connection,
          connection_id: connection.id,
          oauth_url: facebookLoginUrl,
          message: "Redirecione para a URL para conectar com Facebook",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("ERROR", `[${requestId}] Invalid provider`, { provider });
    return new Response(
      JSON.stringify({ success: false, error: "Invalid provider" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Unhandled error`, { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
