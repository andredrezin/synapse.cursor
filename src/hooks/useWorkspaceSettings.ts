import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type WorkspaceSettings = Database['public']['Tables']['workspace_settings']['Row'];

export const useWorkspaceSettings = () => {
  const { workspace, workspaceRole } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching settings:', fetchError);
      setError(fetchError.message);
    } else if (!data) {
      // Create default settings if none exist
      const { data: newSettings, error: createError } = await supabase
        .from('workspace_settings')
        .insert({ workspace_id: workspace.id })
        .select()
        .single();

      if (createError) {
        // Settings might have been created by another process, try fetching again
        const { data: retryData } = await supabase
          .from('workspace_settings')
          .select('*')
          .eq('workspace_id', workspace.id)
          .single();
        setSettings(retryData);
      } else {
        setSettings(newSettings);
      }
    } else {
      setSettings(data);
    }

    setIsLoading(false);
  };

  const updateSettings = async (updates: Partial<WorkspaceSettings>) => {
    if (!workspace?.id) {
      return { error: new Error('No workspace selected') };
    }

    const { data, error } = await supabase
      .from('workspace_settings')
      .update(updates)
      .eq('workspace_id', workspace.id)
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configurações',
        description: error.message,
      });
      return { error };
    }

    setSettings(data);
    toast({
      title: 'Configurações salvas!',
    });

    return { data, error: null };
  };

  const updateWorkspaceName = async (name: string) => {
    if (!workspace?.id) {
      return { error: new Error('No workspace selected') };
    }

    const { error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', workspace.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar nome',
        description: error.message,
      });
      return { error };
    }

    toast({
      title: 'Nome atualizado!',
    });

    return { error: null };
  };

  useEffect(() => {
    if (!workspace?.id) return;
    fetchSettings();
  }, [workspace?.id]);

  return {
    settings,
    isLoading,
    error,
    canEdit: workspaceRole === 'owner' || workspaceRole === 'admin',
    fetchSettings,
    updateSettings,
    updateWorkspaceName,
  };
};
