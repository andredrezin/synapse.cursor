import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

export const useLeads = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadWithAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('leads')
      .select(`
        *,
        assigned_profile:profiles(full_name, avatar_url)
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      setError(fetchError.message);
    } else {
      // Transform data to match expected interface
      const transformedData: LeadWithAssignee[] = (data || []).map(lead => ({
        ...lead,
        assigned_profile: Array.isArray(lead.assigned_profile) 
          ? lead.assigned_profile[0] || null 
          : lead.assigned_profile || null
      }));
      setLeads(transformedData);
    }

    setIsLoading(false);
  };

  const createLead = async (lead: Omit<LeadInsert, 'workspace_id'>) => {
    if (!workspace?.id) {
      return { error: new Error('No workspace selected') };
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        workspace_id: workspace.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar lead',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Lead criado!',
      description: `${lead.name} foi adicionado com sucesso.`,
    });

    await fetchLeads();
    return { data, error: null };
  };

  const updateLead = async (id: string, updates: LeadUpdate) => {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar lead',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Lead atualizado!',
    });

    await fetchLeads();
    return { data, error: null };
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar lead',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Lead removido!',
    });

    await fetchLeads();
    return { error: null };
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!workspace?.id) return;

    fetchLeads();

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
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id]);

  // Computed metrics
  const metrics = {
    total: leads.length,
    hot: leads.filter(l => l.temperature === 'hot').length,
    warm: leads.filter(l => l.temperature === 'warm').length,
    cold: leads.filter(l => l.temperature === 'cold').length,
    new: leads.filter(l => l.status === 'new').length,
    inProgress: leads.filter(l => l.status === 'in_progress').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
    avgScore: leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
      : 0,
  };

  return {
    leads,
    isLoading,
    error,
    metrics,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
  };
};
