import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type DistributionMode = 'connection' | 'round_robin' | 'manual';

interface DistributionSettings {
  id: string;
  workspace_id: string;
  distribution_mode: DistributionMode;
  auto_assign_new_leads: boolean;
}

export const useLeadDistribution = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<DistributionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    if (!workspace?.id) return;

    const { data, error } = await supabase
      .from('lead_distribution_settings')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (data) {
      setSettings(data as DistributionSettings);
    } else if (!error) {
      // Create default settings
      const { data: newSettings } = await supabase
        .from('lead_distribution_settings')
        .insert({
          workspace_id: workspace.id,
          distribution_mode: 'connection',
          auto_assign_new_leads: true,
        })
        .select()
        .single();

      if (newSettings) {
        setSettings(newSettings as DistributionSettings);
      }
    }
    setIsLoading(false);
  };

  const updateSettings = async (updates: Partial<DistributionSettings>) => {
    if (!settings?.id) return;

    const { error } = await supabase
      .from('lead_distribution_settings')
      .update(updates)
      .eq('id', settings.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar configurações',
        description: error.message,
      });
      return { error };
    }

    setSettings(prev => prev ? { ...prev, ...updates } : null);
    toast({
      title: 'Configurações atualizadas!',
    });
    return { error: null };
  };

  const getNextSeller = async () => {
    if (!workspace?.id) return null;

    const { data } = await supabase.rpc('get_next_seller_round_robin', {
      ws_id: workspace.id,
    });

    return data;
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchSettings();
    }
  }, [workspace?.id]);

  return {
    settings,
    isLoading,
    updateSettings,
    getNextSeller,
    refreshSettings: fetchSettings,
  };
};
