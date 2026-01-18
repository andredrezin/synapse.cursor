import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const log = (
  level: string,
  message: string,
  data?: Record<string, unknown>
) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      function: "ai-chat",
      message,
      ...(data && { data }),
    })
  );
};

// Rate limiting helper
const getClientIP = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

const checkRateLimit = async (
  supabase: any,
  identifier: string,
  functionName: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("function_name", functionName)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Fail open if rate limit table doesn't exist or error
      log("WARN", "Rate limit check error, allowing request", {
        error: fetchError.message,
      });
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    if (!existing) {
      // First request
      const resetAt = new Date(now.getTime() + windowMs);
      await supabase.from("rate_limits").insert({
        identifier,
        function_name: functionName,
        request_count: 1,
        window_start: windowStart.toISOString(),
        reset_at: resetAt.toISOString(),
      });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    const resetAt = new Date(existing.reset_at);
    if (now > resetAt) {
      // Window expired - reset
      const newResetAt = new Date(now.getTime() + windowMs);
      await supabase
        .from("rate_limits")
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          reset_at: newResetAt.toISOString(),
        })
        .eq("id", existing.id);
      return { allowed: true, remaining: maxRequests - 1, resetAt: newResetAt };
    }

    if (existing.request_count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      };
    }

    // Increment counter
    await supabase
      .from("rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("id", existing.id);

    return {
      allowed: true,
      remaining: maxRequests - existing.request_count - 1,
      resetAt,
    };
  } catch (error) {
    // Fail open on error
    log("WARN", "Rate limit exception, allowing request", {
      error: String(error),
    });
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
};

interface ChatRequest {
  workspace_id: string;
  lead_id: string;
  conversation_id: string;
  message: string;
  image_url?: string | null; // Added for Vision
  ai_settings?: {
    ai_name: string | null;
    ai_personality: string | null;
    system_prompt: string | null;
    security_prompt: string | null;
    allowed_topics: string[] | null;
    blocked_topics: string[] | null;
    max_context_messages: number | null;
  };
}

import { MARCELA_PROMPT } from "./marcela-prompt.ts";

// Build system prompt from AI settings (Marcela Persona)
const buildSystemPrompt = (
  settings: ChatRequest["ai_settings"],
  knowledgeContext: string
): string => {
  const aiName = settings?.ai_name || "Marcela";
  const companyName = "Synapse Automação"; // Default company name, could be dynamic

  // 1. Inject Identity Variables
  let prompt = MARCELA_PROMPT.replace(/{{ai_name}}/g, aiName).replace(
    /{{company_name}}/g,
    companyName
  );

  // 2. Inject Security/Blocked Topics (Overlay on top of Marcela's rules)
  if (settings?.blocked_topics && settings.blocked_topics.length > 0) {
    prompt += `\n\n<regras_de_bloqueio>\nTÓPICOS ESTRITAMENTE PROIBIDOS: ${settings.blocked_topics.join(
      ", "
    )}.\nSe o usuário insistir nestes assuntos, encerre o tópico educadamente.\n</regras_de_bloqueio>`;
  }

  // 3. Inject Custom Admin Instructions
  const customPrompt = settings?.system_prompt || "";
  if (customPrompt) {
    prompt += `\n\n<instrucoes_extras_admin>\n${customPrompt}\n</instrucoes_extras_admin>`;
  }

  // 4. Inject Knowledge Base (RAG)
  if (knowledgeContext) {
    prompt += `\n\n<contexto_rag>\nUse APENAS as informações abaixo como fonte de verdade factual para responder perguntas específicas sobre a empresa/produtos:\n\n${knowledgeContext}\n\nSe a informação não estiver aqui, use seu bom senso consultivo, mas não invente dados técnicos.\n</contexto_rag>`;
  } else {
    prompt += `\n\n<aviso_rag>Não há conhecimento específico da base carregado para esta interação.</aviso_rag>`;
  }

  return prompt;
};

// Call OpenAI API directly (Project Independence)
const callOpenAI = async (
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  imageUrl?: string | null
): Promise<string> => {
  // Construct the newest user message (Text + optional Image)
  const newUserMessageContent: any = [{ type: "text", text: userMessage }];

  if (imageUrl) {
    newUserMessageContent.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "low", // 'low' is cheaper and usually sufficient for chat apps
      },
    });
  }

  // Final message list
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10), // Context History
    { role: "user", content: newUserMessageContent }, // Current Message
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: apiMessages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("OpenAI Rate limit exceeded. Please check your quota.");
    }
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// --- Tiered Usage Logic ---

const AI_LIMITS = {
  basic: 50,
  professional: 500,
  premium: 999999, // Unlimted
};

async function checkAIUsage(
  supabase: any,
  workspaceId: string
): Promise<{ allowed: boolean; error?: string }> {
  // 1. Get Subscription Plan
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (subError) {
    log("WARN", `Error fetching subscription for ${workspaceId}`, {
      error: subError.message,
    });
    // Fail open or closed? Let's fail open but log it, or default to basic.
    // Defaulting to basic seems safer for business logic.
  }

  const plan = (subscription?.plan || "basic") as keyof typeof AI_LIMITS;
  const limit = AI_LIMITS[plan] || 50;

  // 2. Get Current Usage
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const { data: usage, error: usageError } = await supabase
    .from("ai_usage_tracking")
    .select("message_count")
    .eq("workspace_id", workspaceId)
    .gte("period_start", startOfMonth)
    .maybeSingle();

  if (usageError) {
    log("WARN", `Error fetching usage for ${workspaceId}`, {
      error: usageError.message,
    });
    // Fail open if usage table error
    return { allowed: true };
  }

  const currentUsage = usage?.message_count || 0;

  if (currentUsage >= limit) {
    return {
      allowed: false,
      error: `Limite de mensagens de IA excedido para o plano ${plan} (${currentUsage}/${limit}). Faça upgrade para continuar.`,
    };
  }

  return { allowed: true };
}

async function incrementAIUsage(
  supabase: any,
  workspaceId: string,
  tokens: number = 0
) {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Try to update existing record first
  const { data: existing } = await supabase
    .from("ai_usage_tracking")
    .select("id, message_count, token_count")
    .eq("workspace_id", workspaceId)
    .gte("period_start", startOfMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("ai_usage_tracking")
      .update({
        message_count: existing.message_count + 1,
        token_count: existing.token_count + tokens,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new period record
    await supabase.from("ai_usage_tracking").insert({
      workspace_id: workspaceId,
      period_start: startOfMonth,
      period_end: new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString(),
      message_count: 1,
      token_count: tokens,
    });
  }
}

// --------------------------

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] AI Chat request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header if available (for permission checks)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      try {
        const supabaseClient = createClient(
          supabaseUrl,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          {
            global: { headers: { Authorization: authHeader } },
          }
        );
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        userId = user?.id || null;
      } catch (error) {
        log("WARN", `[${requestId}] Could not get user from auth header`, {
          error: String(error),
        });
      }
    }

    // Rate limiting: 30 requests per minute per workspace
    const body: ChatRequest = await req.json();

    // --- INSERTED: Check Usage Limits ---
    const usageCheck = await checkAIUsage(supabase, body.workspace_id);
    if (!usageCheck.allowed) {
      log("WARN", `[${requestId}] Usage limit exceeded`, {
        error: usageCheck.error,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: usageCheck.error,
        }),
        {
          status: 403, // Forbidden/Payment Required
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    // ------------------------------------

    // Validate workspace access if user is authenticated
    if (userId) {
      const { data: member, error: memberError } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", body.workspace_id)
        .eq("user_id", userId)
        .single();

      if (memberError || !member) {
        log("WARN", `[${requestId}] Workspace access denied`, {
          userId,
          workspace_id: body.workspace_id,
          error: memberError?.message,
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Acesso negado a este workspace",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const rateLimitIdentifier = `workspace:${body.workspace_id}`;
    const rateLimitResult = await checkRateLimit(
      supabase,
      rateLimitIdentifier,
      "ai-chat",
      30,
      60 * 1000
    );

    if (!rateLimitResult.allowed) {
      log("WARN", `[${requestId}] Rate limit exceeded`, {
        identifier: rateLimitIdentifier,
        retryAfter: rateLimitResult.retryAfter,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Too many requests.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    log("INFO", `[${requestId}] Processing chat`, {
      workspace_id: body.workspace_id,
      lead_id: body.lead_id,
      conversation_id: body.conversation_id,
      rateLimitRemaining: rateLimitResult.remaining,
    });

    // Get conversation history
    const maxMessages = body.ai_settings?.max_context_messages || 20;
    const { data: historyMessages, error: historyError } = await supabase
      .from("messages")
      .select("content, sender_type, created_at")
      .eq("conversation_id", body.conversation_id)
      .order("created_at", { ascending: false })
      .limit(maxMessages);

    if (historyError) {
      log("WARN", `[${requestId}] Error fetching history`, {
        error: historyError.message,
      });
    }

    const conversationHistory = (historyMessages || [])
      .reverse()
      .map((msg) => ({
        role: msg.sender_type === "lead" ? "user" : "assistant",
        content: msg.content,
      }));

    log("DEBUG", `[${requestId}] Conversation history loaded`, {
      messagesCount: conversationHistory.length,
    });

    // Search knowledge base for relevant info (RAG)
    let knowledgeContext = "";
    try {
      const { data: knowledge, error: knowledgeError } = await supabase.rpc(
        "search_knowledge",
        {
          p_workspace_id: body.workspace_id,
          p_query: body.message,
          p_limit: 3,
        }
      );

      if (!knowledgeError && knowledge && knowledge.length > 0) {
        knowledgeContext = knowledge
          .map(
            (k: { title: string; content: string }) =>
              `### ${k.title}\n${k.content}`
          )
          .join("\n\n");

        log("DEBUG", `[${requestId}] Knowledge context found`, {
          entriesCount: knowledge.length,
        });
      }
    } catch (error) {
      log("WARN", `[${requestId}] Error searching knowledge`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(body.ai_settings, knowledgeContext);

    // Generate response using OpenAI
    log("INFO", `[${requestId}] Calling OpenAI API`);
    const aiResponse = await callOpenAI(
      openAiApiKey,
      systemPrompt,
      conversationHistory,
      body.message
    );

    log("INFO", `[${requestId}] Response generated`, {
      responseLength: aiResponse.length,
    });

    // --- INSERTED: Increment Usage ---
    // Rough token estimation: 1 char = 0.25 tokens (avg)
    // Input + Output
    const statusTokens = (body.message.length + aiResponse.length) * 0.3; // Approx
    await incrementAIUsage(
      supabase,
      body.workspace_id,
      Math.ceil(statusTokens)
    );
    // ---------------------------------

    // Save AI response to messages table
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: body.conversation_id,
      workspace_id: body.workspace_id,
      content: aiResponse,
      sender_type: "ai",
      sender_id: null,
    });

    if (insertError) {
      log("WARN", `[${requestId}] Error saving message`, {
        error: insertError.message,
      });
    } else {
      log("DEBUG", `[${requestId}] Message saved to database`);
    }

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        messages_count: conversationHistory.length + 2,
      })
      .eq("id", body.conversation_id);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        provider: "openai",
        knowledge_used: !!knowledgeContext,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  } catch (error) {
    log("ERROR", `[${requestId}] Unhandled error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
