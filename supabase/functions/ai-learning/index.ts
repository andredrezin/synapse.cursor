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
        function: 'ai-learning',
        message,
        ...(data && { data }),
    }));
};

// Generate embedding using OpenAI
const generateEmbedding = async (text: string): Promise<number[]> => {
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
        log('WARN', 'OpenAI API key not configured, using fallback');
        // Fallback: generate random embedding (for development)
        return Array.from({ length: 1536 }, () => Math.random());
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI embedding error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
};

// Summarize conversation
const summarizeConversation = (messages: any[]): string => {
    if (!messages || messages.length === 0) return '';

    const summary = messages
        .slice(0, 20) // First 20 messages
        .map(msg => `${msg.from_me ? 'Vendedor' : 'Cliente'}: ${msg.body}`)
        .join('\n');

    return summary;
};

// Calculate success score based on outcome
const calculateSuccessScore = (outcome: string): number => {
    const scores: Record<string, number> = {
        'venda': 1.0,
        'agendamento': 0.8,
        'qualificacao': 0.6,
        'perdido': 0.0,
    };

    return scores[outcome] || 0.5;
};

serve(async (req) => {
    const requestId = crypto.randomUUID().slice(0, 8);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        log('INFO', `[${requestId}] AI Learning request received`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }

        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify user
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();
        const { action, queue_item_id, notes } = body;

        if (!action || !queue_item_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get queue item
        const { data: queueItem, error: queueError } = await supabase
            .from('ai_learning_queue')
            .select(`
        *,
        conversations(
          id,
          lead_name,
          messages,
          workspace_id
        )
      `)
            .eq('id', queue_item_id)
            .single();

        if (queueError || !queueItem) {
            throw new Error('Queue item not found');
        }

        if (action === 'approve') {
            log('INFO', `[${requestId}] Approving conversation for learning`);

            // Get conversation messages
            const messages = queueItem.conversations.messages || [];
            const summary = summarizeConversation(messages);

            // Generate embedding
            log('INFO', `[${requestId}] Generating embedding`);
            const embedding = await generateEmbedding(summary);

            // Calculate success score
            const successScore = calculateSuccessScore(queueItem.outcome);

            // Save learned pattern
            const { error: patternError } = await supabase
                .from('ai_learned_patterns')
                .insert({
                    workspace_id: queueItem.conversations.workspace_id,
                    seller_id: queueItem.seller_id,
                    conversation_id: queueItem.conversation_id,
                    conversation_summary: summary,
                    embedding: JSON.stringify(embedding), // pgvector will handle this
                    outcome: queueItem.outcome,
                    success_score: successScore,
                    approved_by: user.id,
                    approved_at: new Date().toISOString(),
                });

            if (patternError) {
                log('ERROR', `[${requestId}] Error saving pattern`, { error: patternError.message });
                throw patternError;
            }

            // Update queue item
            const { error: updateError } = await supabase
                .from('ai_learning_queue')
                .update({
                    status: 'approved',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    notes,
                })
                .eq('id', queue_item_id);

            if (updateError) throw updateError;

            log('INFO', `[${requestId}] Pattern learned successfully`);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'IA aprendeu com esta conversa',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'reject') {
            // Just update status
            const { error: updateError } = await supabase
                .from('ai_learning_queue')
                .update({
                    status: 'rejected',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    notes,
                })
                .eq('id', queue_item_id);

            if (updateError) throw updateError;

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Conversa rejeitada',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        log('ERROR', `[${requestId}] Error`, { error: error.message });
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
