import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LearnRequest {
  workspace_id: string;
  conversation_id: string;
  message_id: string;
  message_content: string;
  sender_type: string;
  seller_profile_id?: string;
  previous_messages: Array<{
    content: string;
    sender_type: string;
  }>;
}

const log = (
  level: string,
  message: string,
  data?: Record<string, unknown>
) => {
  console.log(
    JSON.stringify({
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      function: "ai-learn",
    })
  );
};

// Call OpenAI for content analysis
const analyzeWithOpenAI = async (
  apiKey: string,
  analysisPrompt: string
): Promise<Record<string, unknown> | null> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // Fast model for classification
      messages: [
        {
          role: "system",
          content:
            "Você é um analisador de conversas de vendas. Extraia conhecimento útil das respostas dos vendedores. Responda sempre em JSON válido.",
        },
        { role: "user", content: analysisPrompt },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      log("warn", "OpenAI Rate limit exceeded");
      return null;
    }
    const error = await response.text();
    log("error", "OpenAI API error", { error });
    return null;
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

  try {
    return JSON.parse(jsonStr);
  } catch {
    log("warn", "Failed to parse AI response as JSON", { content });
    return null;
  }
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("info", `[${requestId}] AI Learn request received`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiApiKey) {
      log("warn", `[${requestId}] OPENAI_API_KEY not configured`);
      return new Response(
        JSON.stringify({ learned: false, reason: "no_api_key" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: LearnRequest = await req.json();
    const {
      workspace_id,
      conversation_id,
      message_id,
      message_content,
      sender_type,
      seller_profile_id,
      previous_messages,
    } = body;

    log("info", `[${requestId}] Processing learning request`, {
      workspace_id,
      sender_type,
    });

    // Verifica se o treinamento está ativo
    const { data: trainingStatus } = await supabase
      .from("ai_training_status")
      .select("*")
      .eq("workspace_id", workspace_id)
      .single();

    if (!trainingStatus || trainingStatus.status === "active") {
      // Já ativo, não precisa mais aprender passivamente
      log("info", `[${requestId}] Training already complete or active`);
      return new Response(
        JSON.stringify({ learned: false, reason: "training_complete" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Incrementa contador de mensagens analisadas
    await supabase
      .from("ai_training_status")
      .update({
        messages_analyzed: trainingStatus.messages_analyzed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trainingStatus.id);

    // Se for mensagem de vendedor, analisar para aprender
    if (sender_type === "agent" && seller_profile_id) {
      // Construir contexto
      const conversationContext = previous_messages
        .slice(-5)
        .map(
          (m) =>
            `${m.sender_type === "lead" ? "Cliente" : "Vendedor"}: ${m.content}`
        )
        .join("\n");

      const analysisPrompt = `Analise esta resposta de um vendedor para identificar conhecimento útil:

Contexto da conversa:
${conversationContext}

Resposta do vendedor que queremos analisar:
${message_content}

Identifique se esta resposta contém:
1. FAQ - Uma resposta a uma dúvida frequente
2. SELLER_RESPONSE - Um padrão de resposta eficaz
3. COMPANY_INFO - Informação sobre a empresa (preços, políticas, horários, etc)
4. OBJECTION_HANDLING - Como lidar com uma objeção do cliente
5. PRODUCT_INFO - Informação sobre produtos/serviços

Responda em JSON:
{
  "has_learning": true/false,
  "content_type": "faq" | "seller_response" | "company_info" | "objection_handling" | "product_info",
  "question": "a pergunta do cliente se houver",
  "answer": "a resposta/informação extraída",
  "context": "contexto relevante",
  "keywords": ["palavras", "chave"],
  "confidence": 0.0-1.0
}

Se não houver nada útil para aprender, retorne {"has_learning": false}`;

      log("info", `[${requestId}] Calling OpenAI for analysis`);
      const analysisResult = await analyzeWithOpenAI(
        openAiApiKey,
        analysisPrompt
      );

      if (
        analysisResult?.has_learning &&
        (analysisResult.confidence as number) > 0.6
      ) {
        // Verificar se já existe conteúdo similar
        const { data: existing } = await supabase
          .from("ai_learned_content")
          .select("id, occurrence_count")
          .eq("workspace_id", workspace_id)
          .eq("content_type", analysisResult.content_type as string)
          .ilike(
            "answer",
            `%${(analysisResult.answer as string).substring(0, 50)}%`
          )
          .limit(1);

        if (existing && existing.length > 0) {
          // Atualizar contagem
          await supabase
            .from("ai_learned_content")
            .update({
              occurrence_count: existing[0].occurrence_count + 1,
              effectiveness_score: Math.min(
                100,
                (existing[0].occurrence_count + 1) * 10
              ),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing[0].id);

          log("info", `[${requestId}] Updated existing learned content`, {
            id: existing[0].id,
          });
        } else {
          // Inserir novo conteúdo aprendido
          const { error: insertError } = await supabase
            .from("ai_learned_content")
            .insert({
              workspace_id,
              content_type: analysisResult.content_type as string,
              source_message_id: message_id,
              source_conversation_id: conversation_id,
              seller_profile_id,
              question: (analysisResult.question as string) || null,
              answer: analysisResult.answer as string,
              context: (analysisResult.context as string) || null,
              keywords: (analysisResult.keywords as string[]) || [],
              effectiveness_score: (analysisResult.confidence as number) * 100,
            });

          if (insertError) {
            log("error", `[${requestId}] Failed to insert learned content`, {
              error: insertError.message,
            });
          } else {
            log("info", `[${requestId}] Inserted new learned content`, {
              type: analysisResult.content_type,
            });

            // Atualizar contadores no training status
            const fieldMap: Record<string, string> = {
              faq: "faqs_detected",
              seller_response: "seller_patterns_learned",
              company_info: "company_info_extracted",
              objection_handling: "objections_learned",
              product_info: "company_info_extracted",
            };

            const updateField = fieldMap[analysisResult.content_type as string];

            if (updateField) {
              const currentValue =
                (trainingStatus[
                  updateField as keyof typeof trainingStatus
                ] as number) || 0;
              await supabase
                .from("ai_training_status")
                .update({
                  [updateField]: currentValue + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", trainingStatus.id);
            }
          }
        }

        // Verificar se atingiu critérios de "ready"
        const { data: updatedStatus } = await supabase
          .from("ai_training_status")
          .select("*")
          .eq("id", trainingStatus.id)
          .single();

        if (updatedStatus) {
          const daysElapsed = Math.floor(
            (Date.now() - new Date(updatedStatus.started_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const meetsTime = daysElapsed >= updatedStatus.min_days_required;
          const meetsMessages =
            updatedStatus.messages_analyzed >=
            updatedStatus.min_messages_required;

          if (
            meetsTime &&
            meetsMessages &&
            updatedStatus.status === "learning"
          ) {
            await supabase
              .from("ai_training_status")
              .update({
                status: "ready",
                ready_at: new Date().toISOString(),
                confidence_score: Math.min(
                  100,
                  updatedStatus.faqs_detected * 5 +
                    updatedStatus.seller_patterns_learned * 3
                ),
                updated_at: new Date().toISOString(),
              })
              .eq("id", updatedStatus.id);

            log("info", `[${requestId}] AI training marked as ready!`, {
              workspace_id,
            });
          }
        }

        return new Response(
          JSON.stringify({
            learned: true,
            content_type: analysisResult.content_type,
            provider: "openai",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ learned: false, reason: "no_learning_detected" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log("error", `[${requestId}] Unhandled error in ai-learn`, {
      error: errorMessage,
    });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
