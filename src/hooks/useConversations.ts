import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];

interface ConversationWithDetails extends Conversation {
  lead?: {
    id: string;
    name: string;
    phone: string;
    temperature: string;
    sentiment: string | null;
  } | null;
  assigned_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UseConversationsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

export const useConversations = (options: UseConversationsOptions = {}) => {
  const { workspace, profile, workspaceRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, enabled = true } = options;

  const isSeller = workspaceRole === 'seller' || workspaceRole === 'member';

  // Query para buscar conversas com paginação
  const {
    data: conversationsData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['conversations', workspace?.id, page, pageSize],
    queryFn: async () => {
      if (!workspace?.id) return { conversations: [], total: 0 };

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Buscar total de conversas para calcular páginas
      let countQuery = supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        countQuery = countQuery.eq('assigned_to', profile.id);
      }

      const { count: total } = await countQuery;

      // Buscar conversas paginadas
      let query = supabase
        .from('conversations')
        .select(`
          *,
          lead:leads!conversations_lead_id_fkey(id, name, phone, temperature, sentiment),
          assigned_profile:profiles!conversations_assigned_to_fkey(full_name, avatar_url)
        `)
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error: fetchError } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (fetchError) {
        log('ERROR', 'Error fetching conversations', { error: fetchError.message, workspaceId: workspace.id });
        throw fetchError;
      }

      return {
        conversations: data || [],
        total: total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((total || 0) / pageSize),
      };
    },
    enabled: enabled && !!workspace?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para buscar TODAS as conversas (para métricas) - com cache mais longo
  const { data: allConversationsData } = useQuery({
    queryKey: ['conversations-all', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      let query = supabase
        .from('conversations')
        .select(`
          *,
          lead:leads!conversations_lead_id_fkey(id, name, phone, temperature, sentiment),
          assigned_profile:profiles!conversations_assigned_to_fkey(full_name, avatar_url)
        `)
        .eq('workspace_id', workspace.id);

      if (isSeller && profile?.id) {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error: fetchError } = await query.order('updated_at', { ascending: false });

      if (fetchError) {
        log('ERROR', 'Error fetching all conversations', { error: fetchError.message, workspaceId: workspace.id });
        return [];
      }

      return data || [];
    },
    enabled: enabled && !!workspace?.id,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const conversations = conversationsData?.conversations || [];
  const allConversations = allConversationsData || [];
  const error = queryError ? (queryError as Error).message : null;

  // Mutation para atualizar status
  const updateConversationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'open' | 'closed' | 'pending' }) => {
      const { error } = await supabase
        .from('conversations')
        .update({
          status,
          ended_at: status === 'closed' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations-all', workspace?.id] });
    },
    onError: (error: Error) => {
      log('ERROR', 'Error updating conversation status', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar conversa',
        description: error.message,
      });
    },
  });

  const createConversation = useMutation({
    mutationFn: async (leadId: string) => {
      if (!workspace?.id) throw new Error('No workspace selected');

      // Check for existing conversation (active or recent)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('lead_id', leadId)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) return existing;

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          workspace_id: workspace.id,
          lead_id: leadId,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return newConv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations-all', workspace?.id] });
    },
    onError: (error: Error) => {
      log('ERROR', 'Error creating conversation', { error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar conversa',
        description: error.message,
      });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!workspace?.id) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          // Invalidar queries quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['conversations', workspace.id] });
          queryClient.invalidateQueries({ queryKey: ['conversations-all', workspace.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id, queryClient]);

  // Computed metrics usando allConversations
  const metrics = {
    total: allConversations.length,
    open: allConversations.filter(c => c.status === 'open').length,
    closed: allConversations.filter(c => c.status === 'closed').length,
    pending: allConversations.filter(c => c.status === 'pending').length,
  };

  return {
    conversations,
    allConversations, // Para compatibilidade
    isLoading,
    error,
    metrics,
    pagination: {
      page: conversationsData?.page || 1,
      pageSize: conversationsData?.pageSize || pageSize,
      total: conversationsData?.total || 0,
      totalPages: conversationsData?.totalPages || 0,
    },
    updateConversationStatus: (id: string, status: 'open' | 'closed' | 'pending') =>
      updateConversationStatus.mutate({ id, status }),
    createConversation: createConversation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['conversations', workspace?.id] }),
  };
};
