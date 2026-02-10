// Edge Function: meta-webhook
// Recebe webhooks da Meta WhatsApp Cloud API
// GET = verificação, POST = mensagens recebidas

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const N8N_WEBHOOK_URL =
  Deno.env.get("N8N_WEBHOOK_URL") ||
  "https://n8n.synapseautomacao.com.br/webhook/meta-whatsapp-incoming";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

Deno.serve(async (req: Request) => {
  // ===== GET: Verificação do Webhook pela Meta =====
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe") {
      // Procurar conexão com este verify_token
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("id, meta_verify_token")
        .eq("meta_verify_token", token)
        .eq("provider", "official")
        .maybeSingle();

      if (connection) {
        console.log("✅ Webhook verificado para conexão:", connection.id);
        return new Response(challenge, { status: 200 });
      }

      // Fallback: verificar com token global
      const GLOBAL_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN");
      if (token === GLOBAL_VERIFY_TOKEN) {
        console.log("✅ Webhook verificado com token global");
        return new Response(challenge, { status: 200 });
      }
    }

    console.log("❌ Verificação falhou:", { mode, token });
    return new Response("Forbidden", { status: 403 });
  }

  // ===== POST: Mensagens Recebidas =====
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Formato Meta webhook
      if (body.object !== "whatsapp_business_account") {
        return new Response(JSON.stringify({ status: "ignored" }), {
          status: 200,
        });
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          const phoneNumberId = value.metadata?.phone_number_id;
          const displayPhone = value.metadata?.display_phone_number;

          // Encontrar workspace pela phone_number_id
          const { data: connection } = await supabase
            .from("whatsapp_connections")
            .select("id, workspace_id, meta_access_token")
            .eq("phone_number_id", phoneNumberId)
            .eq("provider", "official")
            .maybeSingle();

          const workspaceId = connection?.workspace_id || null;
          const connectionId = connection?.id || null;

          // Processar mensagens
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              // Log do webhook
              await supabase.from("meta_webhook_logs").insert({
                workspace_id: workspaceId,
                connection_id: connectionId,
                event_type: "message_received",
                payload: {
                  message,
                  metadata: value.metadata,
                  contacts: value.contacts,
                },
              });

              if (!connection) {
                console.log(
                  "⚠️ Conexão não encontrada para phone_number_id:",
                  phoneNumberId,
                );
                continue;
              }

              // Extrair dados da mensagem
              const from = message.from; // número do remetente
              const messageId = message.id;
              const timestamp = message.timestamp;
              const type = message.type; // text, image, audio, interactive, etc.

              let messageText = "";
              let messageType = "text";

              switch (type) {
                case "text":
                  messageText = message.text?.body || "";
                  break;
                case "interactive":
                  // Resposta de lista ou botão
                  if (message.interactive?.type === "list_reply") {
                    messageText = message.interactive.list_reply.id;
                    messageType = "list_reply";
                  } else if (message.interactive?.type === "button_reply") {
                    messageText = message.interactive.button_reply.id;
                    messageType = "button_reply";
                  }
                  break;
                case "image":
                  messageText = message.image?.caption || "[Imagem]";
                  messageType = "image";
                  break;
                case "audio":
                  messageText = "[Áudio]";
                  messageType = "audio";
                  break;
                case "document":
                  messageText = message.document?.caption || "[Documento]";
                  messageType = "document";
                  break;
                default:
                  messageText = `[${type}]`;
                  messageType = type;
              }

              // Nome do contato
              const contactName = value.contacts?.[0]?.profile?.name || from;

              // Encaminhar para n8n
              const n8nPayload = {
                provider: "meta",
                workspace_id: workspaceId,
                connection_id: connectionId,
                phone_number_id: phoneNumberId,
                display_phone: displayPhone,
                telefone: from,
                pushName: contactName,
                mensagem: messageText,
                message_type: messageType,
                message_id: messageId,
                timestamp: timestamp,
                meta_access_token: connection.meta_access_token,
                raw_message: message,
              };

              try {
                const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(n8nPayload),
                });

                if (!n8nResponse.ok) {
                  console.error("❌ n8n error:", n8nResponse.status);
                  await supabase.from("meta_webhook_logs").insert({
                    workspace_id: workspaceId,
                    connection_id: connectionId,
                    event_type: "n8n_forward_error",
                    payload: {
                      status: n8nResponse.status,
                      message_id: messageId,
                    },
                  });
                }
              } catch (n8nError) {
                console.error("❌ n8n fetch error:", n8nError);
              }
            }
          }

          // Processar status de entrega
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await supabase.from("meta_webhook_logs").insert({
                workspace_id: workspaceId,
                connection_id: connectionId,
                event_type: `status_${status.status}`,
                payload: status,
              });
            }
          }
        }
      }

      // Meta exige retorno 200 rápido
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("❌ Webhook error:", error);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200, // Meta requer 200 mesmo com erro
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
