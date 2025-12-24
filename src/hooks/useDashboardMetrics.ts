import { useQuery } from '@tanstack/react-query';
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
    staleTime: 60 * 1000, // 1 minuto - métricas podem ser atualizadas a cada minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 60 * 1000, // Refetch a cada minuto automaticamente
  });

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
    refetch: () => {}, // TanStack Query gerencia isso automaticamente
  };
};
