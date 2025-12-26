import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { log } from '@/lib/logger';

interface DashboardMetrics {
  conversionRate: number;
  activeLeads: number;
  newLeadsToday: number;
  conversationsToday: number;
  conversationsChange: number;
  avgResponseTime: number;
  hotLeads: number;
  salesToday: number;
  salesGoalPercent: number;
}

interface ConversionData {
  date: string;
  conversions: number;
  leads: number;
  ads: number;
  organic: number;
}

interface SourceData {
  source: string;
  count: number;
  percentage: number;
}

export const useDashboardMetrics = () => {
  const { workspace, profile } = useAuth();
  const { isAdmin, profileId } = usePermissions();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-metrics', workspace?.id, isAdmin, profileId],
    queryFn: async () => {
      if (!workspace?.id) {
        return {
          metrics: {
            conversionRate: 0,
            activeLeads: 0,
            newLeadsToday: 0,
            conversationsToday: 0,
            conversationsChange: 0,
            avgResponseTime: 0,
            hotLeads: 0,
            salesToday: 0,
            salesGoalPercent: 0,
          },
          conversionData: [],
          sourceData: [],
        };
      }

      try {
        // Buscar métricas do backend (Edge Function)
        const { data: functionData, error: functionError } = await supabase.functions.invoke('dashboard-metrics', {
          body: {
            workspace_id: workspace.id,
            profile_id: profileId,
            is_admin: isAdmin,
          },
        });

        if (functionError) {
          log('ERROR', 'Error fetching dashboard metrics from function', { error: functionError.message });
          throw functionError;
        }

        if (functionData?.success) {
          log('INFO', 'Dashboard Initial Load', {
            metrics: functionData.metrics,
            sourceStats: functionData.sourceData
          });
          return {
            metrics: functionData.metrics as DashboardMetrics,
            conversionData: functionData.conversionData as ConversionData[],
            sourceData: functionData.sourceData as SourceData[],
          };
        }

        throw new Error(functionData?.error || 'Failed to fetch metrics');
      } catch (error) {
        log('ERROR', 'Error in dashboard metrics query', { error: error instanceof Error ? error.message : String(error) });
        // Retornar valores padrão em caso de erro
        return {
          metrics: {
            conversionRate: 0,
            activeLeads: 0,
            newLeadsToday: 0,
            conversationsToday: 0,
            conversationsChange: 0,
            avgResponseTime: 0,
            hotLeads: 0,
            salesToday: 0,
            salesGoalPercent: 0,
          },
          conversionData: [],
          sourceData: [],
        };
      }
    },
    enabled: !!workspace?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes (data is considered fresh for longer now that we have realtime invalidation)
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Realtime Subscription
  // Expert Note: Instead of polling every second, we listen to the database changes.
  // This reduces server load to near zero when idle and gives instant updates when active.
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspace?.id) return;

    log('INFO', 'Setting up Realtime subscription for Dashboard Metrics');

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          log('INFO', 'Realtime update received: leads table', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            errors: payload.errors
          });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        (payload) => {
          log('INFO', 'Realtime update received: conversations table', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id, queryClient]);

  // MOCK DATA REMOVED

  return {
    metrics: data?.metrics || {
      conversionRate: 0,
      activeLeads: 0,
      newLeadsToday: 0,
      conversationsToday: 0,
      conversationsChange: 0,
      avgResponseTime: 0,
      hotLeads: 0,
      salesToday: 0,
      salesGoalPercent: 0,
    },
    conversionData: data?.conversionData || [],
    sourceData: data?.sourceData || [],
    isLoading,
    error,
    refetch: () => { },
  };
};
