import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AISettings {
  id: string;
  workspace_id: string;
  is_enabled: boolean | null;
  ai_name: string | null;
  ai_personality: string | null;
  system_prompt: string | null;
  security_prompt: string | null;
  greeting_message: string | null;
  allowed_topics: string[] | null;
  blocked_topics: string[] | null;
  transfer_keywords: string[] | null;
  active_hours_start: string | null;
  active_hours_end: string | null;
  timezone: string | null;
  max_context_messages: number | null;
  transfer_after_messages: number | null;
  created_at: string;
  updated_at: string;
}

interface UpdateAISettingsData {
  is_enabled?: boolean;
  ai_name?: string;
  ai_personality?: string;
  system_prompt?: string;
  security_prompt?: string;
  greeting_message?: string;
  allowed_topics?: string[];
  blocked_topics?: string[];
  transfer_keywords?: string[];
  active_hours_start?: string;
  active_hours_end?: string;
  timezone?: string;
  max_context_messages?: number;
  transfer_after_messages?: number;
}

export const useAISettings = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // Fetch AI settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['ai-settings', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as AISettings | null;
    },
    enabled: !!workspaceId,
  });

  // Create or update settings
  const updateSettings = useMutation({
    mutationFn: async (data: UpdateAISettingsData) => {
      if (!workspaceId) throw new Error('No workspace');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('ai_settings')
        .select('id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (existing) {
        // Update
        const { data: result, error } = await supabase
          .from('ai_settings')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Create
        const { data: result, error } = await supabase
          .from('ai_settings')
          .insert({
            ...data,
            workspace_id: workspaceId,
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings', workspaceId] });
      toast({ title: 'Configurações de IA salvas!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar configurações', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle AI enabled
  const toggleAI = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data: existing } = await supabase
        .from('ai_settings')
        .select('id')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('ai_settings')
          .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ai_settings')
          .insert({ workspace_id: workspaceId, is_enabled: enabled });

        if (error) throw error;
      }
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings', workspaceId] });
      toast({ title: enabled ? 'IA ativada!' : 'IA desativada' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao alterar status da IA', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    toggleAI,
    isEnabled: settings?.is_enabled ?? false,
  };
};
