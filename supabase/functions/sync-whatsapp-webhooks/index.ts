import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function log(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  data?: any
) {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify({
      timestamp,
      level,
      function: "sync-whatsapp-webhooks",
      message,
      ...(data && { data }),
    })
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error("Evolution API not configured in secrets");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active/pending evolution connections
    const { data: connections, error: connError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("provider", "evolution");

    if (connError) throw connError;

    log("INFO", `Starting sync for ${connections.length} connections`);
    const results = [];

    // const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    const webhookUrl =
      "https://n8n.synapseautomacao.com.br/webhook/evolution-ingest";

    for (const conn of connections) {
      if (!conn.instance_name) continue;

      log("INFO", `Syncing instance: ${conn.instance_name}`);

      try {
        let response = await fetch(
          `${evolutionApiUrl}/webhook/set/${conn.instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: evolutionApiKey,
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
              },
            }),
          }
        );

        // Fallback for legacy Evolution API
        if (!response.ok) {
          log(
            "WARN",
            `New webhook format failed for ${conn.instance_name}, trying legacy...`
          );
          response = await fetch(
            `${evolutionApiUrl}/webhook/set/${conn.instance_name}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: evolutionApiKey,
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
            }
          );
        }

        results.push({
          instance: conn.instance_name,
          success: response.ok,
          status: response.status,
        });
      } catch (err: any) {
        log("ERROR", `Failed to sync ${conn.instance_name}`, {
          error: err.message,
        });
        results.push({
          instance: conn.instance_name,
          success: false,
          error: err.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    log("ERROR", "Global sync error", { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
