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
      function: "ai-qualify",
      message,
      ...(data && { data }),
    })
  );
};

interface QualifyRequest {
  workspace_id: string;
  lead_id: string;
  conversation_id?: string;
  messages?: Array<{ content: string; sender_type: string }>;
}

interface QualificationResult {
  score: number;
  temperature: "cold" | "warm" | "hot";
  buying_intent: "none" | "low" | "medium" | "high";
  objections: string[];
  recommended_actions: string[];
  reasoning: string;
}

const qualificationPrompt = `Analise a conversa e qualifique o lead de 0 a 100.

Retorne em JSON:
{
  "score": número de 0 a 100,
  "temperature": "cold" | "warm" | "hot",
  "buying_intent": "none" | "low" | "medium" | "high",
  "objections": ["lista de objeções identificadas"],
  "recommended_actions": ["ações recomendadas para o vendedor"],
  "reasoning": "explicação breve do score"
}

CRITÉRIOS DE PONTUAÇÃO:
- 0-30 (Cold): Sem interesse claro, apenas curiosidade ou suporte
- 31-60 (Warm): Demonstra interesse, faz perguntas sobre produto/preço
- 61-80 (Hot): Alto interesse, discutindo detalhes de compra
- 81-100 (Hot+): Pronto para comprar, pedindo formas de pagamento

FATORES QUE AUMENTAM SCORE:
+10: Pergunta sobre preços
+15: Pergunta sobre formas de pagamento
+20: Demonstra urgência
+10: Compara com concorrentes
+15: Pede proposta/orçamento

FATORES QUE DIMINUEM SCORE:
-10: Menciona que está apenas pesquisando
-15: Diz que está caro
-20: Menciona que vai pensar
-10: Não responde há muito tempo

CONVERSA:
`;

// Call OpenAI for qualification
const qualifyWithOpenAI = async (
  apiKey: string,
  conversationText: string
): Promise<QualificationResult> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Cost-effective model for classification
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em qualificação de leads de vendas. Analise conversas e atribua scores precisos. Responda em JSON.",
        },
        { role: "user", content: qualificationPrompt + conversationText },
      ],
      max_tokens: 600,
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

  // Parse JSON from response
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
    log("INFO", `[${requestId}] AI Qualify request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: QualifyRequest = await req.json();

    log("INFO", `[${requestId}] Qualifying lead`, {
      workspace_id: body.workspace_id,
      lead_id: body.lead_id,
      conversation_id: body.conversation_id,
    });

    // Get messages from conversation if not provided
    let messages = body.messages;
    if (!messages && body.conversation_id) {
      const { data: dbMessages } = await supabase
        .from("messages")
        .select("content, sender_type")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: true });

      messages = dbMessages || [];
    }

    if (!messages || messages.length === 0) {
      log("WARN", `[${requestId}] No messages to qualify`);
      return new Response(
        JSON.stringify({
          success: true,
          qualification: {
            score: 0,
            temperature: "cold",
            buying_intent: "none",
            objections: [],
            recommended_actions: ["Iniciar conversa para entender interesse"],
            reasoning: "Sem mensagens para analisar",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current lead info
    const { data: lead } = await supabase
      .from("leads")
      .select("name, source, created_at")
      .eq("id", body.lead_id)
      .single();

    // Format conversation
    let conversationText = "";
    if (lead) {
      conversationText += `INFO DO LEAD:
- Nome: ${lead.name}
- Fonte: ${lead.source}
- Data de entrada: ${lead.created_at}

`;
    }

    conversationText += messages
      .map(
        (m) =>
          `[${m.sender_type === "lead" ? "Lead" : "Vendedor"}]: ${m.content}`
      )
      .join("\n");

    // Perform qualification
    log("INFO", `[${requestId}] Calling OpenAI for qualification`);
    const qualification = await qualifyWithOpenAI(
      openAiApiKey,
      conversationText
    );

    log("INFO", `[${requestId}] Qualification complete`, {
      score: qualification.score,
      temperature: qualification.temperature,
      buyingIntent: qualification.buying_intent,
    });

    // Update lead with qualification
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        score: qualification.score,
        temperature: qualification.temperature,
        objections: qualification.objections,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.lead_id);

    if (updateError) {
      log("WARN", `[${requestId}] Error updating lead`, {
        error: updateError.message,
      });
    }

    // Create notification if lead is hot
    if (qualification.temperature === "hot" && qualification.score >= 70) {
      await supabase.from("notifications").insert({
        workspace_id: body.workspace_id,
        title: `🔥 Lead Quente: ${lead?.name || "Lead"}`,
        description: `Score ${qualification.score}/100 - ${qualification.reasoning}`,
        type: "hot_lead",
        priority: "high",
        lead_id: body.lead_id,
      });

      log("INFO", `[${requestId}] Hot lead notification created`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        qualification,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
