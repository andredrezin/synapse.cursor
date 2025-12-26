import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'] & {
  assigned_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type LeadInsert = Database['public']['Tables']['leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type LeadWithAssignee = Lead;

// LeadWithAssignee is now redundant if Lead already includes assigned_profile
// However, to maintain compatibility with existing code that might expect LeadWithAssignee
// to be a distinct type, we can keep it as an alias or remove it if Lead is truly the new source of truth.
// For now, let's assume Lead is the new primary type and LeadWithAssignee is no longer needed.
// If the original intent was to have a base Lead type without assigned_profile and then extend it,
// this change would need to be reverted or adjusted.
// Given the instruction "Add assigned_profile property to Lead interface", this is the direct interpretation.

interface UseLeadsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

export const useLeads = (options: UseLeadsOptions = {}) => {
  const { workspace, profile, workspaceRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, enabled = true } = options;

  const isSeller = workspaceRole === 'seller' || workspaceRole === 'member';

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
      let countQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        countQuery = countQuery.eq('assigned_to', profile.id);
      }

      const { count: total } = await countQuery;

      // Buscar leads paginados
      let query = supabase
        .from('leads')
        .select('*, assigned_profile:profiles(full_name, avatar_url)')
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error: fetchError } = await query
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

      let query = supabase
        .from('leads')
        .select('*, assigned_profile:profiles(full_name, avatar_url)')
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

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
  // Mutations com Optimistic UI
  const createLead = useMutation({
    mutationFn: async (lead: Omit<LeadInsert, 'workspace_id'>) => {
      if (!workspace?.id) throw new Error('No workspace selected');

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
    onMutate: async (newLead) => {
      // Cancelar refetches em andamento
      await queryClient.cancelQueries({ queryKey: ['leads', workspace?.id] });
      await queryClient.cancelQueries({ queryKey: ['leads-all', workspace?.id] });

      // Snapshot do estado anterior
      const previousLeads = queryClient.getQueryData(['leads', workspace?.id, page, pageSize]);
      const previousAllLeads = queryClient.getQueryData(['leads-all', workspace?.id]);

      // Criar lead temporário para UI otimista
      const optimisticLead: LeadWithAssignee = {
        ...newLead,
        id: crypto.randomUUID(), // ID temporário
        workspace_id: workspace?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: newLead.status || 'new',
        temperature: 'warm', // Default
        assigned_to: null,
        assigned_profile: null,
        response_time_avg: null,
        score: 0,
        source: newLead.source || 'organic',
        // Preencher outros campos obrigatórios com defaults se necessário
        budget: null,
        custom_fields: null,
        description: null,
        email: newLead.email || null,
        last_activity_at: new Date().toISOString(),
        last_message: null,
        name: newLead.name,
        notes: null,
        phone: newLead.phone || null,
        position: null,
        priority: null,
        tags: null
      } as unknown as LeadWithAssignee; // Cast inseguro necessário pois nem todos campos estão no LeadInsert

      // Atualizar cache (Optimistic Update)
      if (previousAllLeads) {
        queryClient.setQueryData(['leads-all', workspace?.id], (old: LeadWithAssignee[] = []) => {
          return [optimisticLead, ...old];
        });
      }

      toast({
        title: 'Lead criado!',
        description: `${newLead.name} foi adicionado.`,
      });

      return { previousLeads, previousAllLeads };
    },
    onError: (err, newLead, context) => {
      // Reverter em caso de erro
      log('ERROR', 'Error creating lead (Optimistic Rollback)', { error: err.message });
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', workspace?.id, page, pageSize], context.previousLeads);
      }
      if (context?.previousAllLeads) {
        queryClient.setQueryData(['leads-all', workspace?.id], context.previousAllLeads);
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao criar lead',
        description: err.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
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
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['leads', workspace?.id] });
      await queryClient.cancelQueries({ queryKey: ['leads-all', workspace?.id] });

      const previousLeads = queryClient.getQueryData(['leads', workspace?.id, page, pageSize]);
      const previousAllLeads = queryClient.getQueryData(['leads-all', workspace?.id]);

      // Atualizar Cache All Leads
      queryClient.setQueryData(['leads-all', workspace?.id], (old: LeadWithAssignee[] = []) => {
        return old.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead));
      });

      // Atualizar Cache Leads Paginados (se possível)
      queryClient.setQueryData(['leads', workspace?.id, page, pageSize], (old: any) => {
        if (!old || !old.leads) return old;
        return {
          ...old,
          leads: old.leads.map((lead: LeadWithAssignee) => (lead.id === id ? { ...lead, ...updates } : lead)),
        };
      });

      toast({ title: 'Lead atualizado!' });

      return { previousLeads, previousAllLeads };
    },
    onError: (err, variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', workspace?.id, page, pageSize], context.previousLeads);
      }
      if (context?.previousAllLeads) {
        queryClient.setQueryData(['leads-all', workspace?.id], context.previousAllLeads);
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: err.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['leads', workspace?.id] });
      await queryClient.cancelQueries({ queryKey: ['leads-all', workspace?.id] });

      const previousLeads = queryClient.getQueryData(['leads', workspace?.id, page, pageSize]);
      const previousAllLeads = queryClient.getQueryData(['leads-all', workspace?.id]);

      queryClient.setQueryData(['leads-all', workspace?.id], (old: LeadWithAssignee[] = []) => {
        return old.filter((lead) => lead.id !== id);
      });

      queryClient.setQueryData(['leads', workspace?.id, page, pageSize], (old: any) => {
        if (!old || !old.leads) return old;
        return {
          ...old,
          leads: old.leads.filter((lead: LeadWithAssignee) => lead.id !== id),
        };
      });

      toast({ title: 'Lead removido!' });

      return { previousLeads, previousAllLeads };
    },
    onError: (err, id, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', workspace?.id, page, pageSize], context.previousLeads);
      }
      if (context?.previousAllLeads) {
        queryClient.setQueryData(['leads-all', workspace?.id], context.previousAllLeads);
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar lead',
        description: err.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['leads-all', workspace?.id] });
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
        (payload) => {
          log('INFO', 'Realtime update received: leads', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
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
