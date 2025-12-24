import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

interface LeadWithAssignee extends Lead {
  assigned_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseLeadsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

export const useLeads = (options: UseLeadsOptions = {}) => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, enabled = true } = options;

  // Query para buscar leads com paginação
  const {
    data: leadsData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['leads', workspace?.id, page, pageSize],
    queryFn: async () => {
      if (!workspace?.id) return { leads: [], total: 0 };

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Buscar total de leads para calcular páginas
      const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      // Buscar leads paginados
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_profile:profiles(full_name, avatar_url)
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        log('ERROR', 'Error fetching leads', { error: fetchError.message, workspaceId: workspace.id });
        throw fetchError;
      }

      // Transform data to match expected interface
      const transformedData: LeadWithAssignee[] = (data || []).map(lead => ({
        ...lead,
        assigned_profile: Array.isArray(lead.assigned_profile) 
          ? lead.assigned_profile[0] || null 
          : lead.assigned_profile || null
      }));

      return {
        leads: transformedData,
        total: total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((total || 0) / pageSize),
      };
    },
    enabled: enabled && !!workspace?.id,
    staleTime: 30 * 1000, // 30 segundos - dados considerados frescos
    gcTime: 5 * 60 * 1000, // 5 minutos - cache mantido em memória
  });

  // Query para buscar TODOS os leads (para métricas) - com cache mais longo
  const { data: allLeadsData } = useQuery({
    queryKey: ['leads-all', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_profile:profiles(full_name, avatar_url)
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        log('ERROR', 'Error fetching all leads', { error: fetchError.message, workspaceId: workspace.id });
        return [];
      }

      const transformedData: LeadWithAssignee[] = (data || []).map(lead => ({
        ...lead,
        assigned_profile: Array.isArray(lead.assigned_profile) 
          ? lead.assigned_profile[0] || null 
          : lead.assigned_profile || null
      }));

      return transformedData;
    },
    enabled: enabled && !!workspace?.id,
    staleTime: 60 * 1000, // 1 minuto - métricas podem ser menos atualizadas
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const leads = leadsData?.leads || [];
  const allLeads = allLeadsData || [];
  const error = queryError ? (queryError as Error).message : null;

  // Mutations
  const createLead = useMutation({
    mutationFn: async (lead: Omit<LeadInsert, 'workspace_id'>) => {
      if (!workspace?.id) {
        throw new Error('No workspace selected');
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
      
      toast({
        title: 'Lead criado!',
        description: `${variables.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error: Error) => {
      log('ERROR', 'Error creating lead', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro ao criar lead',
        description: error.message,
      });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LeadUpdate }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
      
      toast({
        title: 'Lead atualizado!',
      });
    },
    onError: (error: Error) => {
      log('ERROR', 'Error updating lead', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: error.message,
      });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
      
      toast({
        title: 'Lead removido!',
      });
    },
    onError: (error: Error) => {
      log('ERROR', 'Error deleting lead', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar lead',
        description: error.message,
      });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!workspace?.id) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Invalidar queries quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['leads', workspace.id] });
          queryClient.invalidateQueries({ queryKey: ['leads-all', workspace.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id, queryClient]);

  // Computed metrics usando allLeads (todos os leads)
  const metrics = {
    total: allLeads.length,
    hot: allLeads.filter(l => l.temperature === 'hot').length,
    warm: allLeads.filter(l => l.temperature === 'warm').length,
    cold: allLeads.filter(l => l.temperature === 'cold').length,
    new: allLeads.filter(l => l.status === 'new').length,
    inProgress: allLeads.filter(l => l.status === 'in_progress').length,
    converted: allLeads.filter(l => l.status === 'converted').length,
    lost: allLeads.filter(l => l.status === 'lost').length,
    avgScore: allLeads.length > 0 
      ? Math.round(allLeads.reduce((sum, l) => sum + l.score, 0) / allLeads.length)
      : 0,
  };

  return {
    leads,
    allLeads, // Para compatibilidade com código que precisa de todos os leads
    isLoading,
    error,
    metrics,
    pagination: {
      page: leadsData?.page || 1,
      pageSize: leadsData?.pageSize || pageSize,
      total: leadsData?.total || 0,
      totalPages: leadsData?.totalPages || 0,
    },
    createLead: createLead.mutate,
    updateLead: (id: string, updates: LeadUpdate) => updateLead.mutate({ id, updates }),
    deleteLead: deleteLead.mutate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] }),
  };
};
