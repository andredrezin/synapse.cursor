import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    audioMessage?: {
      url?: string;
      mimetype?: string;
      fileSha256?: string;
      fileLength?: number;
      seconds?: number;
      ptt?: boolean;
      mediaKey?: string;
    };
    imageMessage?: {
      url?: string;
      mimetype?: string;
      caption?: string;
      fileSha256?: string;
      fileLength?: number;
      height?: number;
      width?: number;
      mediaKey?: string;
    };
    documentMessage?: {
      url?: string;
      mimetype?: string;
      title?: string;
      fileSha256?: string;
      fileLength?: number;
      fileName?: string;
      mediaKey?: string;
    };
  };
  messageTimestamp?: number;
  pushName?: string;
}

interface EvolutionWebhook {
  event: string;
  instance: string;
  data: any;
}

interface OfficialWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          audio?: { 
            id: string; 
            mime_type: string;
          };
          image?: { 
            id: string; 
            mime_type: string;
            caption?: string;
          };
          document?: { 
            id: string; 
            mime_type: string;
            filename?: string;
          };
        }>;
        statuses?: Array<any>;
      };
      field: string;
    }>;
  }>;
}

// Structured logging helper
function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, function: "whatsapp-webhook", message, ...(data && { data }) };
  console.log(JSON.stringify(logEntry));
}

// Helper function to transcribe audio via our edge function
async function transcribeAudio(
  supabaseUrl: string, 
  supabaseKey: string, 
  audioUrl: string | undefined, 
  mimeType: string | undefined,
  requestId: string
): Promise<string> {
  if (!audioUrl) {
    log("WARN", `[${requestId}] No audio URL provided`);
    return "";
  }

  try {
    // First, download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      log("ERROR", `[${requestId}] Failed to download audio`, { status: audioResponse.status });
      return "";
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    log("DEBUG", `[${requestId}] Audio downloaded`, { size: audioBuffer.byteLength, mimeType });

    // Call our transcribe-audio function
    const transcribeUrl = `${supabaseUrl}/functions/v1/transcribe-audio`;
    const response = await fetch(transcribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        audio: base64Audio,
        mimeType: mimeType || "audio/ogg",
      }),
    });

    const data = await response.json();
    if (data.success && data.text) {
      log("INFO", `[${requestId}] Audio transcribed successfully`, { textLength: data.text.length });
      return data.text;
    }

    log("WARN", `[${requestId}] Transcription failed`, { error: data.error });
    return "";
  } catch (error: any) {
    log("ERROR", `[${requestId}] Transcription error`, { error: error.message });
    return "";
  }
}

// Helper function to analyze images via our edge function
async function analyzeImage(
  supabaseUrl: string, 
  supabaseKey: string, 
  imageUrl: string | undefined, 
  mimeType: string | undefined,
  context: string | null,
  requestId: string
): Promise<string> {
  if (!imageUrl) {
    log("WARN", `[${requestId}] No image URL provided`);
    return "Imagem não disponível";
  }

  try {
    // Call our analyze-image function
    const analyzeUrl = `${supabaseUrl}/functions/v1/analyze-image`;
    const response = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        imageUrl,
        mimeType: mimeType || "image/jpeg",
        context,
      }),
    });

    const data = await response.json();
    if (data.success && data.description) {
      log("INFO", `[${requestId}] Image analyzed successfully`, { descriptionLength: data.description.length });
      return data.description;
    }

    log("WARN", `[${requestId}] Image analysis failed`, { error: data.error });
    return "Não foi possível analisar a imagem";
  } catch (error: any) {
    log("ERROR", `[${requestId}] Image analysis error`, { error: error.message });
    return "Erro ao analisar imagem";
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // Handle webhook verification for Official API
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    log("INFO", `[${requestId}] Webhook verification request`, { mode, hasToken: !!token, hasChallenge: !!challenge });

    if (mode === "subscribe" && challenge) {
      log("INFO", `[${requestId}] Webhook verified successfully`);
      return new Response(challenge, { status: 200 });
    }

    return new Response("OK", { status: 200 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    log("INFO", `[${requestId}] Webhook received`, { 
      bodyType: body.event ? "evolution" : body.object ? "official" : "unknown",
      event: body.event,
      instance: body.instance,
      object: body.object
    });
    log("DEBUG", `[${requestId}] Full webhook payload`, { body: JSON.stringify(body) });

    // Detect webhook type
    if (body.event && body.instance) {
      log("INFO", `[${requestId}] Processing Evolution API webhook`, { event: body.event, instance: body.instance });
      await handleEvolutionWebhook(supabase, supabaseUrl, supabaseKey, body as EvolutionWebhook, requestId);
    } else if (body.object === "whatsapp_business_account") {
      log("INFO", `[${requestId}] Processing Official WhatsApp API webhook`);
      await handleOfficialWebhook(supabase, supabaseUrl, supabaseKey, body as OfficialWebhook, requestId);
    } else {
      log("WARN", `[${requestId}] Unknown webhook format`, { bodyKeys: Object.keys(body) });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Webhook processing error`, { error: error.message, stack: error.stack });
    // Always return 200 to prevent webhook retries
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleEvolutionWebhook(supabase: any, supabaseUrl: string, supabaseKey: string, webhook: EvolutionWebhook, requestId: string) {
  const { event, instance, data } = webhook;
  log("DEBUG", `[${requestId}] Evolution event processing`, { event, instance });

  // Find connection by instance name
  const { data: connection, error: connError } = await supabase
    .from("whatsapp_connections")
    .select("*")
    .eq("instance_name", instance)
    .single();

  if (connError || !connection) {
    log("ERROR", `[${requestId}] Connection not found for instance`, { instance, error: connError?.message });
    return;
  }

  log("DEBUG", `[${requestId}] Connection found`, { connectionId: connection.id, workspace_id: connection.workspace_id });

  switch (event) {
    case "CONNECTION_UPDATE":
      const state = data?.state || data?.status;
      let newStatus = "disconnected";
      
      if (state === "open" || state === "connected") {
        newStatus = "connected";
      } else if (state === "connecting") {
        newStatus = "connecting";
      } else if (state === "close" || state === "disconnected") {
        newStatus = "disconnected";
      }

      log("INFO", `[${requestId}] Connection status update`, { 
        connectionId: connection.id, 
        previousStatus: connection.status,
        newStatus,
        state 
      });

      await supabase
        .from("whatsapp_connections")
        .update({ 
          status: newStatus,
          phone_number: data?.phoneNumber || connection.phone_number,
          qr_code: newStatus === "connected" ? null : connection.qr_code,
        })
        .eq("id", connection.id);

      // Log connection event
      await supabase.from("whatsapp_connection_logs").insert({
        connection_id: connection.id,
        event_type: "connection_update",
        event_data: { state, newStatus, phoneNumber: data?.phoneNumber },
      });

      break;

    case "QRCODE_UPDATED":
      const qrCode = data?.qrcode?.base64 || data?.base64;
      log("INFO", `[${requestId}] QR code update`, { connectionId: connection.id, hasQrCode: !!qrCode });
      
      if (qrCode) {
        await supabase
          .from("whatsapp_connections")
          .update({ 
            qr_code: qrCode,
            status: "qr_pending",
          })
          .eq("id", connection.id);
      }
      break;

    case "MESSAGES_UPSERT":
      const messages = Array.isArray(data) ? data : [data];
      log("INFO", `[${requestId}] Messages received`, { connectionId: connection.id, messageCount: messages.length });
      
      for (const msgData of messages) {
        await processIncomingMessage(supabase, supabaseUrl, supabaseKey, connection, msgData, requestId);
      }
      break;

    case "MESSAGES_UPDATE":
      log("DEBUG", `[${requestId}] Message status update`, { connectionId: connection.id, data });
      break;

    default:
      log("DEBUG", `[${requestId}] Unhandled Evolution event`, { event });
  }
}

async function handleOfficialWebhook(supabase: any, supabaseUrl: string, supabaseKey: string, webhook: OfficialWebhook, requestId: string) {
  for (const entry of webhook.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") {
        log("DEBUG", `[${requestId}] Skipping non-messages field`, { field: change.field });
        continue;
      }

      const value = change.value;
      const phoneNumberId = value.metadata.phone_number_id;

      log("DEBUG", `[${requestId}] Processing Official API entry`, { phoneNumberId, hasMessages: !!value.messages });

      const { data: connection, error: connError } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("instance_name", phoneNumberId)
        .single();

      if (connError || !connection) {
        log("ERROR", `[${requestId}] Connection not found for phone_number_id`, { phoneNumberId });
        continue;
      }

      if (value.messages) {
        log("INFO", `[${requestId}] Processing Official API messages`, { 
          connectionId: connection.id, 
          messageCount: value.messages.length 
        });
        
        for (const msg of value.messages) {
          await processOfficialMessage(supabase, supabaseUrl, supabaseKey, connection, msg, requestId);
        }
      }
    }
  }
}

async function processIncomingMessage(supabase: any, supabaseUrl: string, supabaseKey: string, connection: any, msgData: any, requestId: string) {
  try {
    const key = msgData.key;
    if (!key) {
      log("WARN", `[${requestId}] Message without key, skipping`);
      return;
    }

    if (key.fromMe) {
      log("DEBUG", `[${requestId}] Skipping outgoing message`);
      return;
    }

    const remoteJid = key.remoteJid;
    const phoneNumber = remoteJid.split("@")[0];
    
    let content = "";
    let messageType = "text";
    let mediaInfo: { url?: string; mimeType?: string; caption?: string } | null = null;
    
    if (msgData.message?.conversation) {
      content = msgData.message.conversation;
    } else if (msgData.message?.extendedTextMessage?.text) {
      content = msgData.message.extendedTextMessage.text;
    } else if (msgData.message?.audioMessage) {
      // Audio message - needs transcription
      messageType = "audio";
      const audio = msgData.message.audioMessage;
      mediaInfo = { 
        url: audio.url, 
        mimeType: audio.mimetype 
      };
      log("INFO", `[${requestId}] Audio message detected`, { 
        mimeType: audio.mimetype, 
        seconds: audio.seconds,
        ptt: audio.ptt 
      });
      
      // Transcribe audio
      content = await transcribeAudio(supabaseUrl, supabaseKey, audio.url, audio.mimetype, requestId);
      if (!content) {
        content = "[Áudio recebido - transcrição não disponível]";
      }
    } else if (msgData.message?.imageMessage) {
      // Image message - needs analysis
      messageType = "image";
      const image = msgData.message.imageMessage;
      mediaInfo = { 
        url: image.url, 
        mimeType: image.mimetype,
        caption: image.caption 
      };
      log("INFO", `[${requestId}] Image message detected`, { 
        mimeType: image.mimetype,
        dimensions: `${image.width}x${image.height}`,
        hasCaption: !!image.caption
      });
      
      // Analyze image
      const imageDescription = await analyzeImage(supabaseUrl, supabaseKey, image.url, image.mimetype, null, requestId);
      content = image.caption 
        ? `${image.caption}\n\n[Descrição da imagem: ${imageDescription}]`
        : `[Imagem: ${imageDescription}]`;
    } else if (msgData.message?.documentMessage) {
      // Document - just notify, don't process
      messageType = "document";
      const doc = msgData.message.documentMessage;
      content = `[Documento recebido: ${doc.fileName || doc.title || 'arquivo'}]`;
      log("INFO", `[${requestId}] Document message detected`, { fileName: doc.fileName });
    } else {
      log("DEBUG", `[${requestId}] Unsupported message type, skipping`, { messageType: Object.keys(msgData.message || {}) });
      return;
    }

    const senderName = msgData.pushName || phoneNumber;

    log("INFO", `[${requestId}] Processing incoming message`, { 
      phoneNumber, 
      senderName, 
      contentLength: content.length,
      messageId: key.id
    });

    // Find or create lead
    let lead = await findOrCreateLead(supabase, connection, phoneNumber, senderName, requestId);

    // Find or create conversation
    let conversation = await findOrCreateConversation(supabase, connection, lead, requestId);

    // Save message
    const { data: savedMessage, error: msgError } = await supabase.from("messages").insert({
      workspace_id: connection.workspace_id,
      conversation_id: conversation.id,
      content,
      sender_type: "lead",
      sender_id: null,
      whatsapp_message_id: key.id,
      whatsapp_connection_id: connection.id,
    }).select().single();

    if (msgError) {
      log("ERROR", `[${requestId}] Failed to save message`, { error: msgError.message });
    } else {
      log("INFO", `[${requestId}] Message saved`, { messageId: savedMessage.id, leadId: lead.id });
    }

    // Update lead's last message
    await supabase
      .from("leads")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        messages_count: (lead.messages_count || 0) + 1,
      })
      .eq("id", lead.id);

    // Update conversation messages count
    await supabase
      .from("conversations")
      .update({
        messages_count: (conversation.messages_count || 0) + 1,
      })
      .eq("id", conversation.id);

    // Create notification for new message
    await supabase.from("notifications").insert({
      workspace_id: connection.workspace_id,
      user_id: conversation.assigned_to || null,
      lead_id: lead.id,
      type: "new_message",
      title: `Nova mensagem de ${senderName}`,
      description: content.length > 100 ? content.substring(0, 100) + "..." : content,
      priority: "high",
    });

    // === AI INTEGRATION ===
    await processAIResponse(supabase, supabaseUrl, supabaseKey, connection, lead, conversation, content, requestId);

  } catch (error: any) {
    log("ERROR", `[${requestId}] Error processing message`, { error: error.message, stack: error.stack });
  }
}

async function processOfficialMessage(supabase: any, supabaseUrl: string, supabaseKey: string, connection: any, msg: any, requestId: string) {
  try {
    const phoneNumber = msg.from;
    const content = msg.text?.body || "";
    
    if (!content) {
      log("DEBUG", `[${requestId}] Non-text Official API message, skipping`, { type: msg.type });
      return;
    }

    log("INFO", `[${requestId}] Processing Official API message`, { 
      phoneNumber, 
      contentLength: content.length,
      messageId: msg.id 
    });

    let lead = await findOrCreateLead(supabase, connection, phoneNumber, phoneNumber, requestId);
    let conversation = await findOrCreateConversation(supabase, connection, lead, requestId);

    const { error: msgError } = await supabase.from("messages").insert({
      workspace_id: connection.workspace_id,
      conversation_id: conversation.id,
      content,
      sender_type: "lead",
      sender_id: null,
      whatsapp_message_id: msg.id,
      whatsapp_connection_id: connection.id,
    });

    if (msgError) {
      log("ERROR", `[${requestId}] Failed to save Official API message`, { error: msgError.message });
    }

    await supabase
      .from("leads")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        messages_count: (lead.messages_count || 0) + 1,
      })
      .eq("id", lead.id);

    await supabase.from("notifications").insert({
      workspace_id: connection.workspace_id,
      user_id: conversation.assigned_to || null,
      lead_id: lead.id,
      type: "new_message",
      title: `Nova mensagem de ${phoneNumber}`,
      description: content.length > 100 ? content.substring(0, 100) + "..." : content,
      priority: "high",
    });

    log("INFO", `[${requestId}] Official API message processed`, { leadId: lead.id });

    // === AI INTEGRATION ===
    await processAIResponse(supabase, supabaseUrl, supabaseKey, connection, lead, conversation, content, requestId);

  } catch (error: any) {
    log("ERROR", `[${requestId}] Error processing official message`, { error: error.message });
  }
}

// === NEW: AI RESPONSE PROCESSING ===
async function processAIResponse(
  supabase: any, 
  supabaseUrl: string, 
  supabaseKey: string, 
  connection: any, 
  lead: any, 
  conversation: any, 
  messageContent: string,
  requestId: string
) {
  try {
    log("INFO", `[${requestId}] Starting AI processing`, { 
      workspace_id: connection.workspace_id,
      lead_id: lead.id,
      conversation_id: conversation.id
    });

    // Call AI Router - pass connection_id to verify WhatsApp link
    const aiRouterUrl = `${supabaseUrl}/functions/v1/ai-router`;
    
    // First, try to get AI chat response
    const chatResponse = await fetch(aiRouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        task: "chat",
        workspace_id: connection.workspace_id,
        connection_id: connection.id, // Pass connection to verify it's linked
        payload: {
          lead_id: lead.id,
          conversation_id: conversation.id,
          message: messageContent,
        },
      }),
    });

    const chatData = await chatResponse.json();
    log("DEBUG", `[${requestId}] AI Router chat response`, { 
      success: chatData.success, 
      reason: chatData.reason,
      provider: chatData.provider
    });

    if (chatData.success && chatData.data?.response) {
      // AI is enabled and generated a response - send it via WhatsApp
      const aiResponse = chatData.data.response;
      
      log("INFO", `[${requestId}] AI generated response`, { 
        responseLength: aiResponse.length,
        provider: chatData.provider
      });

      // Send the AI response via WhatsApp
      const sendUrl = `${supabaseUrl}/functions/v1/whatsapp-send`;
      const sendResponse = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          connection_id: connection.id,
          to: lead.phone,
          message: aiResponse,
          type: "text",
        }),
      });

      const sendData = await sendResponse.json();
      
      if (sendData.success) {
        log("INFO", `[${requestId}] AI response sent via WhatsApp`, { 
          leadPhone: lead.phone,
          messageId: sendData.messageId
        });

        // Create notification about AI auto-response
        await supabase.from("notifications").insert({
          workspace_id: connection.workspace_id,
          type: "ai_response",
          title: `IA respondeu ${lead.name}`,
          description: aiResponse.length > 100 ? aiResponse.substring(0, 100) + "..." : aiResponse,
          priority: "low",
          lead_id: lead.id,
        });
      } else {
        log("ERROR", `[${requestId}] Failed to send AI response`, { error: sendData.error });
      }
    } else if (["ai_disabled", "outside_hours", "transfer_requested", "ai_not_active", "whatsapp_not_linked"].includes(chatData.reason)) {
      // AI is disabled or other reason - just run analysis and qualification in background
      log("INFO", `[${requestId}] AI chat skipped`, { reason: chatData.reason });
    }

    // === ALWAYS RUN AI LEARNING (RAG enrichment) - independent of chatbot activation ===
    // This runs for ALL messages to continuously learn and build the knowledge base
    const aiLearnUrl = `${supabaseUrl}/functions/v1/ai-learn`;
    const learnPromise = fetch(aiLearnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        workspace_id: connection.workspace_id,
        connection_id: connection.id,
        conversation_id: conversation.id,
        message_id: null, // Will be set after message is saved
        content: messageContent,
        sender_type: "lead", // Learning happens for lead messages too (questions to detect FAQs)
      }),
    }).catch(err => log("WARN", `[${requestId}] AI Learning failed`, { error: err.message }));

    // Always run analysis in background (for context extraction)
    const analyzePromise = fetch(aiRouterUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        task: "analyze",
        workspace_id: connection.workspace_id,
        payload: {
          lead_id: lead.id,
          conversation_id: conversation.id,
          messages: [{ content: messageContent, sender_type: "lead" }],
        },
      }),
    }).catch(err => log("WARN", `[${requestId}] Analysis failed`, { error: err.message }));

    // Run lead qualification periodically (every 5 messages)
    if ((lead.messages_count || 0) % 5 === 0) {
      const qualifyPromise = fetch(aiRouterUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          task: "qualify",
          workspace_id: connection.workspace_id,
          payload: {
            lead_id: lead.id,
            conversation_id: conversation.id,
          },
        }),
      }).catch(err => log("WARN", `[${requestId}] Qualification failed`, { error: err.message }));

      // Don't await - run in background
      Promise.all([learnPromise, analyzePromise, qualifyPromise]).catch(() => {});
    } else {
      // Don't await - run in background
      Promise.all([learnPromise, analyzePromise]).catch(() => {});
    }

    log("INFO", `[${requestId}] AI processing completed (learning always active)`);

  } catch (error: any) {
    log("ERROR", `[${requestId}] AI processing error`, { error: error.message, stack: error.stack });
    // Don't throw - AI failure shouldn't break message processing
  }
}

async function findOrCreateLead(supabase: any, connection: any, phoneNumber: string, name: string, requestId: string) {
  const { data: existingLead } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", connection.workspace_id)
    .eq("phone", phoneNumber)
    .maybeSingle();

  if (existingLead) {
    log("DEBUG", `[${requestId}] Existing lead found`, { leadId: existingLead.id });
    return existingLead;
  }

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: connection.workspace_id,
      name,
      phone: phoneNumber,
      source: "direct",
      status: "new",
      temperature: "warm",
    })
    .select()
    .single();

  if (error) {
    log("ERROR", `[${requestId}] Error creating lead`, { error: error.message });
    throw error;
  }

  log("INFO", `[${requestId}] New lead created`, { leadId: newLead.id, phone: phoneNumber });
  return newLead;
}

async function findOrCreateConversation(supabase: any, connection: any, lead: any, requestId: string) {
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", connection.workspace_id)
    .eq("lead_id", lead.id)
    .eq("status", "open")
    .maybeSingle();

  if (existingConv) {
    log("DEBUG", `[${requestId}] Existing conversation found`, { conversationId: existingConv.id });
    return existingConv;
  }

  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      workspace_id: connection.workspace_id,
      lead_id: lead.id,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    log("ERROR", `[${requestId}] Error creating conversation`, { error: error.message });
    throw error;
  }

  log("INFO", `[${requestId}] New conversation created`, { conversationId: newConv.id, leadId: lead.id });
  return newConv;
}
