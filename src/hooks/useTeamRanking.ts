import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

export interface SellerRankEntry {
    profile_id: string;
    full_name: string;
    avatar_url: string | null;
    total_leads: number;
    conversions: number;
    avg_response_time: number;
    month_year: string;
    points: number;
    rank_position: number;
}

export const useTeamRanking = (month?: string) => {
    const { workspace } = useAuth();
    const { profileId } = usePermissions();
    const currentMonth = month || format(new Date(), 'yyyy-MM');

    const { data: ranking, isLoading, error } = useQuery({
        queryKey: ['team-ranking', workspace?.id, currentMonth],
        queryFn: async () => {
            if (!workspace?.id) return [];

            const { data, error } = await (supabase as any)
                .from('v_seller_ranking')
                .select('*')
                .eq('workspace_id', workspace.id)
                .eq('month_year', currentMonth)
                .order('rank_position', { ascending: true });

            if (error) throw error;
            return data as SellerRankEntry[];
        },
        enabled: !!workspace?.id,
    });

    const myRank = ranking?.find(r => r.profile_id === profileId);

    return {
        ranking,
        myRank,
        isLoading,
        error,
        currentMonth,
    };
};
