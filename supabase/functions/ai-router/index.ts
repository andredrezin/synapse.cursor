import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Structured logging helper
const log = (
  level: string,
  message: string,
  data?: Record<string, unknown>
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: "ai-router",
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry));
};

type TaskType = "chat" | "analyze" | "suggest" | "qualify" | "sentiment";

interface RouteRequest {
  task: TaskType;
  workspace_id: string;
  payload: Record<string, unknown>;
  connection_id?: string;
}

interface AISettings {
  is_enabled: boolean;
  ai_name: string | null;
  ai_personality: string | null;
  system_prompt: string | null;
  security_prompt: string | null;
  allowed_topics: string[] | null;
  blocked_topics: string[] | null;
  transfer_keywords: string[] | null;
  active_hours_start: string | null;
  active_hours_end: string | null;
  timezone: string | null;
  max_context_messages: number | null;
}

interface AITrainingStatus {
  id: string;
  workspace_id: string;
  status: "learning" | "ready" | "active" | "paused";
  linked_whatsapp_id: string | null;
}

// Check if AI is within active hours
const isWithinActiveHours = (settings: AISettings): boolean => {
  if (!settings.active_hours_start || !settings.active_hours_end) {
    return true;
  }

  const now = new Date();
  const timezone = settings.timezone || "America/Sao_Paulo";

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const currentTime = formatter.format(now);
    const [currentHour, currentMinute] = currentTime.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = settings.active_hours_start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = settings.active_hours_end
      .split(":")
      .map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch (error) {
    log("WARN", "Error checking active hours", { error: String(error) });
    return true;
  }
};

// Check for transfer keywords
const containsTransferKeyword = (
  message: string,
  keywords: string[] | null
): boolean => {
  if (!keywords || keywords.length === 0) return false;
  const lowerMessage = message.toLowerCase();
  return keywords.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] AI Router request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: RouteRequest = await req.json();

    log("INFO", `[${requestId}] Routing request`, {
      task: body.task,
      workspace_id: body.workspace_id,
    });

    if (!body.task || !body.workspace_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: task, workspace_id",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get AI settings
    const { data: aiSettings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("workspace_id", body.workspace_id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      log("WARN", `[${requestId}] Error fetching AI settings`, {
        error: settingsError.message,
      });
    }

    const settings = aiSettings as AISettings | null;

    // Skip validation for analyze, sentiment, and qualify tasks (always allowed)
    const skipValidationTasks: TaskType[] = ["analyze", "qualify", "sentiment"];

    if (!skipValidationTasks.includes(body.task)) {
      // Check AI Training Status for chat/suggest tasks
      const { data: trainingStatus } = await supabase
        .from("ai_training_status")
        .select("*")
        .eq("workspace_id", body.workspace_id)
        .single();

      const training = trainingStatus as AITrainingStatus | null;

      if (!training || training.status !== "active") {
        log("INFO", `[${requestId}] AI not active`, {
          status: training?.status,
        });
        return new Response(
          JSON.stringify({
            success: false,
            reason: "ai_not_active",
            message:
              training?.status === "learning"
                ? "IA em período de aprendizado"
                : training?.status === "ready"
                ? "IA pronta aguardando ativação"
                : training?.status === "paused"
                ? "IA pausada"
                : "IA não configurada",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check WhatsApp connection linkage
      if (
        body.connection_id &&
        training.linked_whatsapp_id &&
        body.connection_id !== training.linked_whatsapp_id
      ) {
        log("INFO", `[${requestId}] WhatsApp not linked`);
        return new Response(
          JSON.stringify({
            success: false,
            reason: "whatsapp_not_linked",
            message: "WhatsApp não vinculado à IA Premium",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Evolution API is allowed for testing as requested by user
      // No longer restrictive to 'official' only

      // Check is_enabled
      if (settings && settings.is_enabled === false) {
        log("INFO", `[${requestId}] AI disabled`);
        return new Response(
          JSON.stringify({ success: false, reason: "ai_disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check active hours
      if (settings && !isWithinActiveHours(settings)) {
        log("INFO", `[${requestId}] Outside active hours`);
        return new Response(
          JSON.stringify({ success: false, reason: "outside_hours" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check transfer keywords
      const messageContent = body.payload?.message as string | undefined;
      if (
        messageContent &&
        settings &&
        containsTransferKeyword(messageContent, settings.transfer_keywords)
      ) {
        log("INFO", `[${requestId}] Transfer keyword detected`);
        return new Response(
          JSON.stringify({ success: false, reason: "transfer_requested" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Route to appropriate endpoint
    const taskEndpoints: Record<TaskType, string> = {
      chat: "ai-chat",
      analyze: "ai-analyze",
      suggest: "ai-suggest",
      qualify: "ai-qualify",
      sentiment: "ai-analyze", // Sentiment uses analyze with realtime flag
    };

    const endpoint = taskEndpoints[body.task];
    const functionUrl = `${supabaseUrl}/functions/v1/${endpoint}`;

    log("DEBUG", `[${requestId}] Calling ${endpoint}`);

    // Prepare payload - add humanized formatting instructions for chat
    const humanizedInstructions =
      "\n\nIMPORTANTE: Responda em estilo WhatsApp humanizado. Use quebras de linha curtas, emojis moderados e evite textos longos ou robotizados. Não pareça uma IA.";

    const payload = {
      ...body.payload,
      workspace_id: body.workspace_id,
      ai_settings: settings
        ? {
            ...settings,
            system_prompt:
              body.task === "chat"
                ? (settings.system_prompt || "") + humanizedInstructions
                : settings.system_prompt,
          }
        : null,
      ...(body.task === "sentiment" && { realtime: true }),
    };

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    log("INFO", `[${requestId}] Response from ${endpoint}`, {
      status: response.status,
      success: response.ok,
    });

    return new Response(
      JSON.stringify({
        success: response.ok,
        provider: "openai",
        task: body.task,
        data: responseData,
      }),
      {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log("ERROR", `[${requestId}] Unhandled error`, {
      error: error instanceof Error ? error.message : String(error),
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
