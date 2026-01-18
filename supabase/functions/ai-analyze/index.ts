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
      function: "ai-analyze",
      message,
      ...(data && { data }),
    })
  );
};

interface AnalyzeRequest {
  workspace_id: string;
  lead_id: string;
  conversation_id: string;
  messages: Array<{ content: string; sender_type: string }>;
  realtime?: boolean; // For real-time sentiment analysis
}

interface AnalysisResult {
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number; // -1 to 1
  intent: string;
  topics: string[];
  summary: string;
  key_points: string[];
  mentioned_products: string[];
  mentioned_services: string[];
  is_resolved: boolean;
  urgency: "low" | "medium" | "high";
  buying_signals: string[];
  objections: string[];
}

const analysisPrompt = `Analise a conversa abaixo e extraia as seguintes informações em formato JSON:

{
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": number entre -1 (muito negativo) e 1 (muito positivo),
  "intent": "string - intenção principal do lead (compra, dúvida, reclamação, suporte, etc)",
  "topics": ["array de tópicos discutidos"],
  "summary": "resumo da conversa em 2-3 frases",
  "key_points": ["pontos chave da conversa"],
  "mentioned_products": ["produtos mencionados"],
  "mentioned_services": ["serviços mencionados"],
  "is_resolved": true | false,
  "urgency": "low" | "medium" | "high",
  "buying_signals": ["sinais de compra detectados"],
  "objections": ["objeções ou preocupações do cliente"]
}

IMPORTANTE:
- Responda APENAS com o JSON, sem texto adicional
- Seja preciso na análise de sentimento e score
- Identifique sinais de compra (interesse, perguntas sobre preço, disponibilidade)
- Identifique objeções (preço alto, dúvidas, comparações)

CONVERSA:
`;

// Quick sentiment analysis for real-time updates
const quickSentimentPrompt = `Analise APENAS o sentimento desta mensagem e retorne JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": number entre -1 e 1,
  "urgency": "low" | "medium" | "high"
}

MENSAGEM:
`;

// Call OpenAI for analysis
const analyzeWithOpenAI = async (
  apiKey: string,
  prompt: string,
  messages: string
): Promise<AnalysisResult | Partial<AnalysisResult>> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Cost-effective model for analysis
      messages: [
        {
          role: "system",
          content:
            "Você é um analisador de conversas de vendas. Responda sempre em JSON válido.",
        },
        { role: "user", content: prompt + messages },
      ],
      max_tokens: 800,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("OpenAI Rate limit exceeded");
    }
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content;
  if (content.includes("```json")) {
    jsonStr = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonStr = content.split("```")[1].split("```")[0].trim();
  }

  return JSON.parse(jsonStr);
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] AI Analyze request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: AnalyzeRequest = await req.json();

    log("INFO", `[${requestId}] Analyzing conversation`, {
      workspace_id: body.workspace_id,
      conversation_id: body.conversation_id,
      messagesCount: body.messages?.length || 0,
      realtime: body.realtime,
    });

    // Format messages for analysis
    const formattedMessages = body.messages
      .map((m) => `[${m.sender_type}]: ${m.content}`)
      .join("\n");

    // Perform analysis (quick for realtime, full otherwise)
    let analysis: AnalysisResult | Partial<AnalysisResult>;

    if (body.realtime) {
      // Quick sentiment analysis for real-time
      const lastMessage = body.messages[body.messages.length - 1];
      analysis = await analyzeWithOpenAI(
        openAiApiKey,
        quickSentimentPrompt,
        `[${lastMessage.sender_type}]: ${lastMessage.content}`
      );
      log("DEBUG", `[${requestId}] Quick sentiment analysis complete`);
    } else {
      // Full analysis
      // Full analysis
      analysis = await analyzeWithOpenAI(
        openAiApiKey,
        analysisPrompt,
        formattedMessages
      );
      log("INFO", `[${requestId}] Full analysis complete`, {
        sentiment: analysis.sentiment,
        intent: (analysis as AnalysisResult).intent,
        urgency: analysis.urgency,
      });
    }

    // Update or insert conversation context (skip for realtime quick analysis)
    if (!body.realtime) {
      const fullAnalysis = analysis as AnalysisResult;

      const { data: existingContext } = await supabase
        .from("conversation_context")
        .select("id")
        .eq("conversation_id", body.conversation_id)
        .single();

      const contextData = {
        conversation_id: body.conversation_id,
        lead_id: body.lead_id,
        workspace_id: body.workspace_id,
        sentiment: fullAnalysis.sentiment,
        intent: fullAnalysis.intent,
        topics: fullAnalysis.topics,
        summary: fullAnalysis.summary,
        key_points: fullAnalysis.key_points,
        mentioned_products: fullAnalysis.mentioned_products,
        mentioned_services: fullAnalysis.mentioned_services,
        is_resolved: fullAnalysis.is_resolved,
        updated_at: new Date().toISOString(),
      };

      if (existingContext) {
        await supabase
          .from("conversation_context")
          .update(contextData)
          .eq("id", existingContext.id);
      } else {
        await supabase.from("conversation_context").insert(contextData);
      }

      // Update lead with objections if found
      if (fullAnalysis.objections && fullAnalysis.objections.length > 0) {
        await supabase
          .from("leads")
          .update({
            objections: fullAnalysis.objections,
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.lead_id);
      }
    }

    // Always update conversation and lead sentiment
    await supabase
      .from("conversations")
      .update({
        sentiment: analysis.sentiment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.conversation_id);

    await supabase
      .from("leads")
      .update({
        sentiment: analysis.sentiment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.lead_id);

    log("INFO", `[${requestId}] Database updated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        realtime: body.realtime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
