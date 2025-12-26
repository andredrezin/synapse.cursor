import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusRequest {
  connection_id: string;
  action: "refresh_qr" | "disconnect" | "reconnect" | "check_status";
}

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-status", message, ...(data && { data }) };
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    log("DEBUG", `[${requestId}] Environment check`, {
      hasEvolutionUrl: !!evolutionApiUrl,
      hasEvolutionKey: !!evolutionApiKey,
    });

    const body: StatusRequest = await req.json();
    log("INFO", `[${requestId}] Status request`, { connection_id: body.connection_id, action: body.action });

    const { connection_id, action } = body;

    if (!connection_id || !action) {
      log("WARN", `[${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: connection_id, action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("id", connection_id)
      .single();

    if (connError || !connection) {
      log("ERROR", `[${requestId}] Connection not found`, { connection_id, error: connError?.message });
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

    let result: any = { success: true };

    if (connection.provider === "evolution") {
      if (!evolutionApiUrl || !evolutionApiKey) {
        log("ERROR", `[${requestId}] Evolution API not configured`);
        return new Response(
          JSON.stringify({ success: false, error: "Evolution API não configurada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { instance_name } = connection;
      log("DEBUG", `[${requestId}] Processing Evolution action`, { action, instance_name });

      switch (action) {
        case "refresh_qr":
          log("INFO", `[${requestId}] Refreshing QR code`);
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance_name}`, {
            method: "GET",
            headers: { "apikey": evolutionApiKey },
          });

          log("DEBUG", `[${requestId}] QR refresh response`, { status: qrResponse.status });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.base64) {
              await supabase
                .from("whatsapp_connections")
                .update({
                  qr_code: qrData.base64,
                  status: "qr_pending",
                })
                .eq("id", connection_id);

              result.qr_code = qrData.base64;
              log("INFO", `[${requestId}] QR code refreshed successfully`);
            }
          } else {
            log("WARN", `[${requestId}] Failed to refresh QR code`);
          }
          break;

        case "disconnect":
          log("INFO", `[${requestId}] Disconnecting instance`);
          const logoutResponse = await fetch(`${evolutionApiUrl}/instance/logout/${instance_name}`, {
            method: "DELETE",
            headers: { "apikey": evolutionApiKey },
          });

          log("DEBUG", `[${requestId}] Logout response`, { status: logoutResponse.status });

          await supabase
            .from("whatsapp_connections")
            .update({
              status: "disconnected",
              qr_code: null,
            })
            .eq("id", connection_id);

          // Log the disconnect event
          await supabase.from("whatsapp_connection_logs").insert({
            connection_id: connection.id,
            event_type: "manual_disconnect",
            event_data: { action: "disconnect", timestamp: new Date().toISOString() },
          });

          result.message = "Disconnected successfully";
          log("INFO", `[${requestId}] Instance disconnected`);
          break;

        case "reconnect":
          log("INFO", `[${requestId}] Reconnecting instance`);
          const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instance_name}`, {
            method: "PUT",
            headers: { "apikey": evolutionApiKey },
          });

          log("DEBUG", `[${requestId}] Restart response`, { status: restartResponse.status });

          await supabase
            .from("whatsapp_connections")
            .update({ status: "connecting" })
            .eq("id", connection_id);

          result.message = "Reconnecting...";
          log("INFO", `[${requestId}] Instance reconnecting`);
          break;

        case "check_status":
          log("INFO", `[${requestId}] Checking connection status`);
          const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance_name}`, {
            method: "GET",
            headers: { "apikey": evolutionApiKey },
          });

          log("DEBUG", `[${requestId}] Status check response`, { status: statusResponse.status });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const state = statusData.instance?.state || "disconnected";

            let newStatus = "disconnected";
            if (state === "open" || state === "connected") {
              newStatus = "connected";
            } else if (state === "connecting") {
              newStatus = "connecting";
            }

            log("INFO", `[${requestId}] Status checked`, { state, newStatus });

            const updateData: any = { status: newStatus };

            // If connected, try to fetch the phone number
            if (newStatus === "connected") {
              try {
                log("INFO", `[${requestId}] Fetching number for connected instance`);
                // We use fetchInstances to get the owner JID which contains the number
                const instancesResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
                  method: "GET",
                  headers: { "apikey": evolutionApiKey },
                });

                if (instancesResponse.ok) {
                  const instances = await instancesResponse.json();
                  // Find our instance
                  // Evolution v1 might return array directly, v2 might return inside an object. 
                  // Usually it's an array of instance objects.
                  const instanceData = Array.isArray(instances)
                    ? instances.find((i: any) => i.instance.instanceName === instance_name || i.instance.name === instance_name)
                    : instances.find?.((i: any) => i.instance.instanceName === instance_name); // Fallback if it's a wrapper

                  // Evolution API structure varies. Often: record.instance.owner (JID)
                  if (instanceData && instanceData.instance && instanceData.instance.owner) {
                    const ownerJid = instanceData.instance.owner; // e.g. 551199999999@s.whatsapp.net
                    const phoneNumber = ownerJid.split('@')[0];
                    updateData.phone_number = phoneNumber;
                    log("INFO", `[${requestId}] Phone number found: ${phoneNumber}`);
                  } else {
                    log("WARN", `[${requestId}] Instance found but no owner/number`, { instanceData });
                  }
                } else {
                  log("WARN", `[${requestId}] Failed to fetch instances list`);
                }
              } catch (numErr) {
                log("ERROR", `[${requestId}] Error fetching phone number`, { error: numErr });
              }
            }

            await supabase
              .from("whatsapp_connections")
              .update(updateData)
              .eq("id", connection_id);

            result.status = newStatus;
            result.raw = statusData;
          } else {
            log("WARN", `[${requestId}] Failed to check status`);
          }
          break;

        default:
          log("WARN", `[${requestId}] Unknown action`, { action });
      }

    } else if (connection.provider === "official") {
      log("DEBUG", `[${requestId}] Processing Official API action`, { action });

      switch (action) {
        case "check_status":
          log("INFO", `[${requestId}] Checking Official API token`);
          const verifyResponse = await fetch(
            `https://graph.facebook.com/v18.0/${connection.instance_name}?access_token=${connection.api_key}`
          );

          log("DEBUG", `[${requestId}] Token verify response`, { status: verifyResponse.status });

          if (verifyResponse.ok) {
            result.status = "connected";
            log("INFO", `[${requestId}] Token valid, connected`);
          } else {
            await supabase
              .from("whatsapp_connections")
              .update({ status: "disconnected" })
              .eq("id", connection_id);

            result.status = "disconnected";
            result.message = "Token expired or invalid";
            log("WARN", `[${requestId}] Token invalid or expired`);
          }
          break;

        case "disconnect":
          log("INFO", `[${requestId}] Disconnecting Official API connection`);
          await supabase
            .from("whatsapp_connections")
            .update({ status: "disconnected" })
            .eq("id", connection_id);

          await supabase.from("whatsapp_connection_logs").insert({
            connection_id: connection.id,
            event_type: "manual_disconnect",
            event_data: { action: "disconnect", timestamp: new Date().toISOString() },
          });

          result.message = "Disconnected successfully";
          break;

        default:
          log("WARN", `[${requestId}] Action not supported for Official API`, { action });
          result.message = "Action not supported for Official API";
      }
    }

    log("INFO", `[${requestId}] Request completed`, { result });

    return new Response(
      JSON.stringify(result),
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
