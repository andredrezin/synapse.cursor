import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendRequest {
  connection_id: string;
  to: string;
  message: string;
  type?: "text" | "image" | "document";
  media_url?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  provider: "evolution" | "official";
  error?: string;
  fallbackUsed?: boolean;
}

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-send", message, ...(data && { data }) };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  log("INFO", `[${requestId}] Request received`, { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    log("DEBUG", `[${requestId}] Environment check`, {
      hasEvolutionUrl: !!evolutionApiUrl,
      hasEvolutionKey: !!evolutionApiKey,
    });

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("WARN", `[${requestId}] Missing authorization header`);
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
      log("ERROR", `[${requestId}] User authentication failed`, { error: userError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("INFO", `[${requestId}] User authenticated`, { userId: user.id });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const body: SendRequest = await req.json();
    log("INFO", `[${requestId}] Send request`, { 
      connection_id: body.connection_id,
      to: body.to,
      messageLength: body.message?.length,
      type: body.type || "text"
    });

    const { connection_id, to, message, type = "text" } = body;

    if (!connection_id || !to || !message) {
      log("WARN", `[${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: connection_id, to, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connection details
    const { data: connection, error: connError } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("*")
      .eq("id", connection_id)
      .single();

    if (connError || !connection) {
      log("ERROR", `[${requestId}] Connection not found`, { connection_id });
      return new Response(
        JSON.stringify({ success: false, error: "Connection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("DEBUG", `[${requestId}] Connection found`, { 
      connectionId: connection.id,
      provider: connection.provider,
      status: connection.status,
      instance_name: connection.instance_name
    });

    if (connection.status !== "connected") {
      log("WARN", `[${requestId}] WhatsApp not connected`, { status: connection.status });
      return new Response(
        JSON.stringify({ success: false, error: "WhatsApp is not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = to.replace(/\D/g, "");
    log("DEBUG", `[${requestId}] Formatted phone`, { original: to, formatted: formattedPhone });

    // Get all connected connections for this workspace for fallback
    const { data: allConnections } = await supabaseAdmin
      .from("whatsapp_connections")
      .select("*")
      .eq("workspace_id", connection.workspace_id)
      .eq("status", "connected");

    // Send message with fallback system
    const result = await sendWithFallback(
      connection,
      allConnections || [connection],
      formattedPhone,
      message,
      type,
      evolutionApiUrl,
      evolutionApiKey,
      requestId
    );

    if (!result.success) {
      log("ERROR", `[${requestId}] All providers failed`, { error: result.error });
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the lead and conversation
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("workspace_id", connection.workspace_id)
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (lead) {
      log("DEBUG", `[${requestId}] Lead found`, { leadId: lead.id });

      const { data: conversation } = await supabaseAdmin
        .from("conversations")
        .select("id, messages_count")
        .eq("workspace_id", connection.workspace_id)
        .eq("lead_id", lead.id)
        .eq("status", "open")
        .maybeSingle();

      if (conversation) {
        log("DEBUG", `[${requestId}] Conversation found, saving outgoing message`, { conversationId: conversation.id });

        await supabaseAdmin.from("messages").insert({
          workspace_id: connection.workspace_id,
          conversation_id: conversation.id,
          content: message,
          sender_type: "agent",
          sender_id: profile?.id || null,
          whatsapp_message_id: result.messageId,
          whatsapp_connection_id: connection.id,
        });

        await supabaseAdmin
          .from("conversations")
          .update({
            messages_count: (conversation.messages_count || 0) + 1,
          })
          .eq("id", conversation.id);
      }
    }

    log("INFO", `[${requestId}] Message sent successfully`, { 
      messageId: result.messageId,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        message: result.fallbackUsed 
          ? `Mensagem enviada via ${result.provider} (fallback)` 
          : "Mensagem enviada com sucesso"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Unhandled error`, { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWithFallback(
  primaryConnection: any,
  allConnections: any[],
  to: string,
  message: string,
  type: string,
  evolutionApiUrl: string | undefined,
  evolutionApiKey: string | undefined,
  requestId: string
): Promise<SendResult> {
  
  // Try primary connection first
  log("INFO", `[${requestId}] Attempting primary provider`, { provider: primaryConnection.provider });
  
  try {
    const result = await sendViaProvider(
      primaryConnection,
      to,
      message,
      type,
      evolutionApiUrl,
      evolutionApiKey,
      requestId
    );
    
    return {
      success: true,
      messageId: result.messageId,
      provider: primaryConnection.provider,
      fallbackUsed: false
    };
  } catch (primaryError: any) {
    log("WARN", `[${requestId}] Primary provider failed`, { 
      provider: primaryConnection.provider,
      error: primaryError.message 
    });

    // Get alternative connections (different provider)
    const alternativeConnections = allConnections.filter(
      conn => conn.id !== primaryConnection.id && conn.provider !== primaryConnection.provider
    );

    // Try same provider alternatives first
    const sameProviderAlternatives = allConnections.filter(
      conn => conn.id !== primaryConnection.id && conn.provider === primaryConnection.provider
    );

    const fallbackOrder = [...sameProviderAlternatives, ...alternativeConnections];

    for (const fallbackConnection of fallbackOrder) {
      log("INFO", `[${requestId}] Attempting fallback provider`, { 
        provider: fallbackConnection.provider,
        connectionId: fallbackConnection.id
      });

      try {
        const result = await sendViaProvider(
          fallbackConnection,
          to,
          message,
          type,
          evolutionApiUrl,
          evolutionApiKey,
          requestId
        );

        log("INFO", `[${requestId}] Fallback succeeded`, { 
          provider: fallbackConnection.provider 
        });

        return {
          success: true,
          messageId: result.messageId,
          provider: fallbackConnection.provider,
          fallbackUsed: true
        };
      } catch (fallbackError: any) {
        log("WARN", `[${requestId}] Fallback provider also failed`, { 
          provider: fallbackConnection.provider,
          error: fallbackError.message 
        });
        continue;
      }
    }

    // All providers failed
    return {
      success: false,
      provider: primaryConnection.provider,
      error: `Todas as APIs falharam. Erro primário: ${primaryError.message}`
    };
  }
}

async function sendViaProvider(
  connection: any,
  to: string,
  message: string,
  type: string,
  evolutionApiUrl: string | undefined,
  evolutionApiKey: string | undefined,
  requestId: string
): Promise<{ messageId: string }> {
  
  if (connection.provider === "evolution") {
    const apiUrl = connection.api_url || evolutionApiUrl;
    const apiKey = connection.api_key || evolutionApiKey;

    if (!apiUrl || !apiKey) {
      throw new Error("Evolution API não configurada");
    }

    return await sendViaEvolution(apiUrl, apiKey, connection.instance_name, to, message, type, requestId);
  } else if (connection.provider === "official") {
    return await sendViaOfficial(connection, to, message, type, requestId);
  } else {
    throw new Error(`Provider inválido: ${connection.provider}`);
  }
}

async function sendViaEvolution(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  to: string,
  message: string,
  type: string,
  requestId: string
): Promise<{ messageId: string }> {
  log("DEBUG", `[${requestId}] Evolution API call`, { 
    endpoint: `${apiUrl}/message/sendText/${instanceName}`,
    to
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify({
        number: to,
        text: message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    log("DEBUG", `[${requestId}] Evolution API response`, { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      log("ERROR", `[${requestId}] Evolution send failed`, { status: response.status, error: errorText });
      throw new Error(`Evolution API falhou: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    log("DEBUG", `[${requestId}] Evolution send success`, { responseData: data });

    return { messageId: data.key?.id || data.messageId || crypto.randomUUID() };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Evolution API timeout (30s)');
    }
    throw error;
  }
}

async function sendViaOfficial(
  connection: any,
  to: string,
  message: string,
  type: string,
  requestId: string
): Promise<{ messageId: string }> {
  const { api_key: accessToken, instance_name: phoneNumberId } = connection;

  if (!accessToken || !phoneNumberId) {
    throw new Error("API Oficial não configurada corretamente");
  }

  log("DEBUG", `[${requestId}] Official API call`, { phoneNumberId, to });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    log("DEBUG", `[${requestId}] Official API response`, { status: response.status });

    if (!response.ok) {
      const errorData = await response.json();
      log("ERROR", `[${requestId}] Official API send failed`, { error: errorData });
      throw new Error(`API Oficial falhou: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    log("DEBUG", `[${requestId}] Official API send success`, { messageId: data.messages?.[0]?.id });

    return { messageId: data.messages?.[0]?.id || crypto.randomUUID() };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API Oficial timeout (30s)');
    }
    throw error;
  }
}
