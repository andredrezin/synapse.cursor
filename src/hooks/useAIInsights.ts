import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AIInsight {
    type: 'opportunity' | 'alert' | 'insight';
    title: string;
    description: string;
    action: string;
    color: string;
    priority: number; // Para ordenar
}

export const useAIInsights = () => {
    const { workspace } = useAuth();

    return useQuery({
        queryKey: ['ai-insights', workspace?.id],
        queryFn: async () => {
            if (!workspace?.id) return [];
            const workspaceId = workspace.id;

            const insights: AIInsight[] = [];

            // 2. Oportunidade: Leads Quentes (Score > 70) não convertidos
            const { data: hotLeads } = await supabase
                .from('leads')
                .select('name, score')
                .eq('workspace_id', workspaceId)
                .gt('score', 70)
                .neq('status', 'converted') // assumindo status de conversão
                .limit(3);

            if (hotLeads && hotLeads.length > 0) {
                insights.push({
                    type: 'opportunity',
                    title: 'Leads com Alta Intenção',
                    description: `${hotLeads.length} leads (como ${hotLeads[0].name}) estão com score de compra alto. Fale com eles agora!`,
                    action: 'Ver Leads',
                    color: 'text-primary bg-primary/10',
                    priority: 1
                });
            }

            // 3. Alerta: Sentimento Negativo Recente
            const { data: negativeContexts } = await supabase
                .from('conversation_context')
                .select('sentiment, summary')
                .eq('workspace_id', workspaceId)
                .eq('sentiment', 'negative')
                .order('created_at', { ascending: false })
                .limit(1);

            if (negativeContexts && negativeContexts.length > 0) {
                insights.push({
                    type: 'alert',
                    title: 'Atenção Necessária',
                    description: `Conversa recente detectou insatisfação: "${negativeContexts[0].summary?.substring(0, 60)}..."`,
                    action: 'Resolver',
                    color: 'text-chart-orange bg-chart-orange/10',
                    priority: 2
                });
            }

            // 4. Insight: Tópicos Recentes
            // Como não temos agregação fácil, vamos pegar o último tópico interessante
            const { data: recentTopics } = await supabase
                .from('conversation_context')
                .select('topics')
                .eq('workspace_id', workspaceId)
                .not('topics', 'is', null)
                .limit(5);

            // Lógica simples de tópico mais comum ou apenas mostrar o último
            if (recentTopics && recentTopics.length > 0) {
                // Flatten topics e pegar um
                const allTopics = recentTopics.flatMap(r => r.topics || []);
                if (allTopics.length > 0) {
                    insights.push({
                        type: 'insight',
                        title: 'Tópico em Alta',
                        description: `Clientes estão perguntando muito sobre "${allTopics[0]}". Prepare materiais sobre isso.`,
                        action: 'Criar Conteúdo',
                        color: 'text-chart-blue bg-chart-blue/10',
                        priority: 3
                    });
                }
            }

            // Se não tiver nada, retorna insights padrão de "onboarding"
            if (insights.length === 0) {
                insights.push({
                    type: 'insight',
                    title: 'Aguardando Dados',
                    description: 'Conecte seu WhatsApp e comece a conversar para a IA gerar insights personalizados.',
                    action: 'Conectar Agora',
                    color: 'text-muted-foreground bg-secondary/50',
                    priority: 99
                });
            }

            return insights.sort((a, b) => a.priority - b.priority);
        },
        enabled: !!workspace?.id,
    });
};
