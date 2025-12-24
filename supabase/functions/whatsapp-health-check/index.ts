import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  connectionId: string;
  provider: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseTimeMs: number;
  errorMessage?: string;
}

function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-health-check", message, ...(data && { data }) };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  log("INFO", `[${requestId}] Health check request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get workspace from request body or user's current workspace
    const body = await req.json().catch(() => ({}));
    let workspaceId = body.workspace_id;

    if (!workspaceId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("current_workspace_id")
        .eq("user_id", user.id)
        .single();
      
      workspaceId = profile?.current_workspace_id;
    }

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ success: false, error: "No workspace found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all connections for this workspace
    const { data: connections, error: connError } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (connError) {
      log("ERROR", `[${requestId}] Failed to fetch connections`, { error: connError.message });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch connections" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], message: "No connections to check" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("INFO", `[${requestId}] Checking ${connections.length} connections`);

    const results: HealthCheckResult[] = [];

    for (const connection of connections) {
      let result: HealthCheckResult;

      if (connection.provider === "evolution") {
        result = await checkEvolutionHealth(
          connection,
          evolutionApiUrl,
          evolutionApiKey,
          requestId
        );
      } else if (connection.provider === "official") {
        result = await checkOfficialHealth(connection, requestId);
      } else {
        result = {
          connectionId: connection.id,
          provider: connection.provider,
          status: "unknown",
          responseTimeMs: 0,
          errorMessage: "Provider desconhecido",
        };
      }

      results.push(result);

      // Save to database
      await supabaseAdmin
        .from("api_health_checks")
        .upsert({
          workspace_id: workspaceId,
          connection_id: connection.id,
          provider: connection.provider,
          status: result.status,
          response_time_ms: result.responseTimeMs,
          error_message: result.errorMessage || null,
          last_check_at: new Date().toISOString(),
        }, {
          onConflict: "connection_id",
          ignoreDuplicates: false,
        });

      // Create notification if API is down
      if (result.status === "down") {
        await supabaseAdmin.from("notifications").insert({
          workspace_id: workspaceId,
          type: "api_health",
          title: `API ${connection.provider.toUpperCase()} está fora do ar`,
          description: `A conexão "${connection.name}" está com problemas: ${result.errorMessage}`,
          priority: "high",
        });

        log("WARN", `[${requestId}] API down alert created`, { 
          connection: connection.name,
          provider: connection.provider 
        });
      }
    }

    log("INFO", `[${requestId}] Health check completed`, { 
      totalConnections: connections.length,
      healthy: results.filter(r => r.status === "healthy").length,
      degraded: results.filter(r => r.status === "degraded").length,
      down: results.filter(r => r.status === "down").length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          total: results.length,
          healthy: results.filter(r => r.status === "healthy").length,
          degraded: results.filter(r => r.status === "degraded").length,
          down: results.filter(r => r.status === "down").length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Unhandled error`, { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function checkEvolutionHealth(
  connection: any,
  defaultApiUrl: string | undefined,
  defaultApiKey: string | undefined,
  requestId: string
): Promise<HealthCheckResult> {
  const apiUrl = connection.api_url || defaultApiUrl;
  const apiKey = connection.api_key || defaultApiKey;

  if (!apiUrl || !apiKey) {
    return {
      connectionId: connection.id,
      provider: "evolution",
      status: "unknown",
      responseTimeMs: 0,
      errorMessage: "API não configurada",
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Check instance status
    const endpoint = connection.instance_name 
      ? `${apiUrl}/instance/connectionState/${connection.instance_name}`
      : `${apiUrl}/instance/fetchInstances`;

    log("DEBUG", `[${requestId}] Checking Evolution API`, { endpoint });

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "apikey": apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        connectionId: connection.id,
        provider: "evolution",
        status: "down",
        responseTimeMs,
        errorMessage: `HTTP ${response.status}`,
      };
    }

    // Check response time for degraded status
    if (responseTimeMs > 5000) {
      return {
        connectionId: connection.id,
        provider: "evolution",
        status: "degraded",
        responseTimeMs,
        errorMessage: "Tempo de resposta alto",
      };
    }

    return {
      connectionId: connection.id,
      provider: "evolution",
      status: "healthy",
      responseTimeMs,
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    return {
      connectionId: connection.id,
      provider: "evolution",
      status: "down",
      responseTimeMs,
      errorMessage: error.name === "AbortError" ? "Timeout (10s)" : error.message,
    };
  }
}

async function checkOfficialHealth(
  connection: any,
  requestId: string
): Promise<HealthCheckResult> {
  const { api_key: accessToken, instance_name: phoneNumberId } = connection;

  if (!accessToken || !phoneNumberId) {
    return {
      connectionId: connection.id,
      provider: "official",
      status: "unknown",
      responseTimeMs: 0,
      errorMessage: "API não configurada",
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // Check phone number status
    const endpoint = `https://graph.facebook.com/v18.0/${phoneNumberId}`;

    log("DEBUG", `[${requestId}] Checking Official API`, { phoneNumberId });

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        connectionId: connection.id,
        provider: "official",
        status: "down",
        responseTimeMs,
        errorMessage: errorData.error?.message || `HTTP ${response.status}`,
      };
    }

    // Check response time for degraded status
    if (responseTimeMs > 3000) {
      return {
        connectionId: connection.id,
        provider: "official",
        status: "degraded",
        responseTimeMs,
        errorMessage: "Tempo de resposta alto",
      };
    }

    return {
      connectionId: connection.id,
      provider: "official",
      status: "healthy",
      responseTimeMs,
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    return {
      connectionId: connection.id,
      provider: "official",
      status: "down",
      responseTimeMs,
      errorMessage: error.name === "AbortError" ? "Timeout (10s)" : error.message,
    };
  }
}
