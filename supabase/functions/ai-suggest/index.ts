import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (level: string, message: string, data?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'ai-suggest',
    message,
    ...(data && { data }),
  }));
};

interface SuggestRequest {
  workspace_id: string;
  lead_id: string;
  conversation_id: string;
  last_message: string;
  conversation_history: Array<{ content: string; sender_type: string }>;
  ai_settings?: {
    ai_name: string | null;
    ai_personality: string | null;
  };
}

interface Suggestion {
  text: string;
  type: 'friendly' | 'professional' | 'closing' | 'objection_handling';
  confidence: number;
  strategy: string;
}

const suggestionPrompt = `Você é um assistente de vendas experiente. Baseado no histórico da conversa e na última mensagem do lead, sugira 3-4 respostas diferentes que o vendedor pode usar.

Para cada sugestão, retorne:
- text: O texto da resposta sugerida
- type: "friendly" (amigável), "professional" (profissional), "closing" (fechamento) ou "objection_handling" (tratamento de objeção)
- confidence: Nível de confiança de 0 a 1
- strategy: Breve explicação da estratégia usada

Responda em JSON:
{
  "suggestions": [
    { "text": "...", "type": "...", "confidence": 0.9, "strategy": "..." }
  ]
}

REGRAS:
1. Sugestões devem ser curtas (máx 2 parágrafos)
2. Adapte o tom baseado na conversa
3. Se detectar objeção, inclua sugestão de tratamento
4. Se o lead está interessado, inclua sugestão de fechamento
5. Sempre mantenha tom profissional e respeitoso

HISTÓRICO DA CONVERSA:
`;

// Call Lovable AI for suggestions
const suggestWithLovableAI = async (
  apiKey: string, 
  conversationText: string
): Promise<Suggestion[]> => {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um assistente de vendas expert que ajuda vendedores a responder leads. Responda sempre em JSON válido.' 
        },
        { role: 'user', content: suggestionPrompt + conversationText },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted');
    }
    const error = await response.text();
    throw new Error(`AI Gateway error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON from response
  let jsonStr = content;
  if (content.includes('```json')) {
    jsonStr = content.split('```json')[1].split('```')[0].trim();
  } else if (content.includes('```')) {
    jsonStr = content.split('```')[1].split('```')[0].trim();
  }
  
  const parsed = JSON.parse(jsonStr);
  return parsed.suggestions;
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('INFO', `[${requestId}] AI Suggest request received`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: SuggestRequest = await req.json();

    log('INFO', `[${requestId}] Generating suggestions`, {
      workspace_id: body.workspace_id,
      conversation_id: body.conversation_id,
      historyLength: body.conversation_history?.length || 0,
    });

    // Get lead info for context
    const { data: lead } = await supabase
      .from('leads')
      .select('name, temperature, score, tags, objections, sentiment')
      .eq('id', body.lead_id)
      .single();

    // Get conversation context if available
    const { data: context } = await supabase
      .from('conversation_context')
      .select('sentiment, intent, topics, summary, mentioned_products, mentioned_services')
      .eq('conversation_id', body.conversation_id)
      .single();

    // Build context text
    let contextInfo = '';
    if (lead) {
      contextInfo += `\n\nINFO DO LEAD:
- Nome: ${lead.name}
- Temperatura: ${lead.temperature}
- Score: ${lead.score}
- Sentimento atual: ${lead.sentiment || 'desconhecido'}
- Tags: ${lead.tags?.join(', ') || 'Nenhuma'}
- Objeções detectadas: ${lead.objections?.join(', ') || 'Nenhuma'}`;
    }

    if (context) {
      contextInfo += `\n\nCONTEXTO DA CONVERSA:
- Sentimento: ${context.sentiment}
- Intenção: ${context.intent}
- Tópicos: ${context.topics?.join(', ')}
- Produtos mencionados: ${context.mentioned_products?.join(', ') || 'Nenhum'}
- Serviços mencionados: ${context.mentioned_services?.join(', ') || 'Nenhum'}
- Resumo: ${context.summary}`;
    }

    // Format conversation history
    const conversationText = body.conversation_history
      .map(m => `[${m.sender_type === 'lead' ? 'Lead' : 'Vendedor'}]: ${m.content}`)
      .join('\n');

    const fullContext = contextInfo + '\n\n' + conversationText + '\n\nÚLTIMA MENSAGEM DO LEAD:\n' + body.last_message;

    // Generate suggestions
    log('INFO', `[${requestId}] Calling Lovable AI for suggestions`);
    const suggestions = await suggestWithLovableAI(lovableApiKey, fullContext);

    log('INFO', `[${requestId}] Suggestions generated`, {
      count: suggestions.length,
      types: suggestions.map(s => s.type),
    });

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        lead_info: lead ? {
          name: lead.name,
          temperature: lead.temperature,
          sentiment: lead.sentiment,
          objections: lead.objections,
        } : null,
        context_used: !!context,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('ERROR', `[${requestId}] Unhandled error`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
