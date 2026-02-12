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
  data?: Record<string, unknown>,
) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      function: "ai-router-multi",
      message,
      ...(data && { data }),
    }),
  );
};

interface AgentConfig {
  name: string;
  model: string;
  specialization: string[];
  temperature: number;
  maxTokens: number;
}

const AGENTS: Record<string, AgentConfig> = {
  vendedor: {
    name: "Agente Vendedor",
    model: "gpt-4o",
    specialization: ["atendimento", "vendas", "multimodal", "chat"],
    temperature: 0.7,
    maxTokens: 2000,
  },
  analista: {
    name: "Agente Analista",
    model: "gpt-4o",
    specialization: ["metricas", "calculos", "dados", "analise"],
    temperature: 0.3,
    maxTokens: 1500,
  },
};

const selectAgent = (message: string, task: string): AgentConfig => {
  const analyticsKeywords = [
    "métrica",
    "relatório",
    "análise",
    "roi",
    "conversão",
    "cálculo",
    "estatística",
    "performance",
    "kpi",
    "dashboard",
  ];

  const lowerMessage = message.toLowerCase();

  if (
    analyticsKeywords.some((kw) => lowerMessage.includes(kw)) ||
    task === "analyze" ||
    task === "qualify"
  ) {
    return AGENTS.analista;
  }

  return AGENTS.vendedor;
};

// Transcribe audio using Whisper
const transcribeAudio = async (audioUrl: string): Promise<string> => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  try {
    // Download audio
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Create form data
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.ogg");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    // Call Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    log("ERROR", "Audio transcription failed", { error: String(error) });
    return "[Áudio não pôde ser transcrito]";
  }
};

// Call OpenAI with text and optional image
const callOpenAI = async (
  message: string,
  systemPrompt: string,
  config: AgentConfig,
  imageUrl?: string,
) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  // Build message content
  const content: any[] = [{ type: "text", text: message }];

  // Add image if provided
  if (imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: imageUrl },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    tokens: data.usage.total_tokens,
  };
};

// Track usage
const trackUsage = async (
  supabase: any,
  workspaceId: string,
  agentType: string,
  tokens: number,
) => {
  try {
    const costPer1kTokens = 0.01; // GPT-4o average
    const costUsd = (tokens / 1000) * costPer1kTokens;

    await supabase.from("ai_agents_usage").upsert(
      {
        workspace_id: workspaceId,
        agent_type: agentType,
        tokens_used: tokens,
        cost_usd: costUsd,
        date: new Date().toISOString().split("T")[0],
      },
      {
        onConflict: "workspace_id,agent_type,date",
      },
    );
  } catch (error) {
    log("WARN", "Failed to track usage", { error: String(error) });
  }
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] Multi-agent request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();

    const { task, workspace_id, payload } = body;

    if (!task || !workspace_id || !payload) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: task, workspace_id, payload",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const systemPrompt = `
Você é um assistente de vendas inteligente e prestativo da Synapse.
Seu objetivo é ajudar clientes com informações sobre produtos e serviços.
Seja cordial, profissional e objetivo nas respostas.
Sempre mantenha um tom amigável e humanizado.
`.trim();

    let userMessage = payload.message || payload.text || "";
    const imageUrl = payload.image_url || payload.imageUrl;
    const audioUrl = payload.audio_url || payload.audioUrl;

    // Handle audio transcription
    if (audioUrl && !userMessage) {
      log("INFO", `[${requestId}] Transcribing audio`);
      userMessage = await transcribeAudio(audioUrl);
      log("INFO", `[${requestId}] Audio transcribed`, {
        text: userMessage.substring(0, 100),
      });
    }

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "Message, audio, or image is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Select agent
    const agent = selectAgent(userMessage, task);

    log("INFO", `[${requestId}] Selected agent`, {
      agent: agent.name,
      model: agent.model,
      hasImage: !!imageUrl,
      hasAudio: !!audioUrl,
    });

    // Call OpenAI
    const result = await callOpenAI(userMessage, systemPrompt, agent, imageUrl);

    // Track usage
    await trackUsage(
      supabase,
      workspace_id,
      agent.name.toLowerCase().split(" ")[1],
      result.tokens,
    );

    log("INFO", `[${requestId}] Response generated`, {
      agent: agent.name,
      tokens: result.tokens,
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: result.text,
        agent: agent.name,
        tokens: result.tokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    log("ERROR", `[${requestId}] Error`, { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
