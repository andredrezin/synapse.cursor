
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionContext, AI_LIMITS, SubscriptionPlan } from '@/contexts/SubscriptionContext';

interface AIUsageStats {
    message_count: number;
    limit: number;
    percentage: number;
    is_limit_reached: boolean;
}

export const useAIUsage = () => {
    const { workspace } = useAuth();
    const { plan } = useSubscriptionContext();
    const queryClient = useQueryClient();

    const getLimit = (userPlan: SubscriptionPlan) => {
        if (!userPlan) return 0;
        return AI_LIMITS[userPlan] || 0;
    };

    const { data: usage, isLoading } = useQuery({
        queryKey: ['ai-usage', workspace?.id],
        queryFn: async (): Promise<AIUsageStats> => {
            if (!workspace?.id) return { message_count: 0, limit: 0, percentage: 0, is_limit_reached: true };

            // In a real scenario, we fetch from the DB. 
            // Since migration might not be applied, we'll try to fetch, if fail, assume 0 for now to not break the app.
            try {
                const { data, error } = await supabase
                    .from('ai_usage_tracking')
                    .select('message_count')
                    .eq('workspace_id', workspace.id)
                    .maybeSingle();

                const count = data?.message_count || 0;
                const limit = getLimit(plan);

                return {
                    message_count: count,
                    limit,
                    percentage: limit === Infinity ? 0 : Math.min(100, (count / limit) * 100),
                    is_limit_reached: limit !== Infinity && count >= limit,
                };
            } catch (e) {
                console.warn('AI Usage table not found, defaulting to 0', e);
                const limit = getLimit(plan);
                return {
                    message_count: 0,
                    limit,
                    percentage: 0,
                    is_limit_reached: false
                };
            }
        },
        enabled: !!workspace?.id && !!plan,
    });

    const incrementUsage = useMutation({
        mutationFn: async () => {
            if (!workspace?.id) return;

            // Upsert usage for current month
            // We use direct DB operations since RPC might not be available without migration
            const { data: existing } = await supabase
                .from('ai_usage_tracking')
                .select('id, message_count')
                .eq('workspace_id', workspace.id)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('ai_usage_tracking')
                    .update({ message_count: existing.message_count + 1 })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('ai_usage_tracking')
                    .insert({ workspace_id: workspace.id, message_count: 1 });
            }

        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-usage', workspace?.id] });
        },
    });

    return {
        usage,
        isLoading,
        incrementUsage,
        limit: getLimit(plan),
    };
};
