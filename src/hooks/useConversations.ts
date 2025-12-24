import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

export const useConversations = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        lead:leads!conversations_lead_id_fkey(id, name, phone, temperature, sentiment),
        assigned_profile:profiles!conversations_assigned_to_fkey(full_name, avatar_url)
      `)
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching conversations:', fetchError);
      setError(fetchError.message);
    } else {
      setConversations(data || []);
    }

    setIsLoading(false);
  };

  const updateConversationStatus = async (id: string, status: 'open' | 'closed' | 'pending') => {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        status,
        ended_at: status === 'closed' ? new Date().toISOString() : null 
      })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar conversa',
        description: error.message,
      });
      return { error };
    }

    await fetchConversations();
    return { error: null };
  };

  useEffect(() => {
    if (!workspace?.id) return;

    fetchConversations();

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
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id]);

  const metrics = {
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    closed: conversations.filter(c => c.status === 'closed').length,
    pending: conversations.filter(c => c.status === 'pending').length,
  };

  return {
    conversations,
    isLoading,
    error,
    metrics,
    fetchConversations,
    updateConversationStatus,
  };
};
