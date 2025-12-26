import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface AITrainingStatus {
  id: string;
  workspace_id: string;
  status: 'learning' | 'ready' | 'active' | 'paused';
  started_at: string;
  ready_at: string | null;
  activated_at: string | null;
  activated_by: string | null;
  min_days_required: number;
  min_messages_required: number;
  messages_analyzed: number;
  faqs_detected: number;
  seller_patterns_learned: number;
  company_info_extracted: number;
  objections_learned: number;
  confidence_score: number | null;
  linked_whatsapp_id: string | null;
  created_at: string;
  updated_at: string;
}

interface TrainingProgress {
  days_elapsed: number;
  messages_progress: number;
  total_progress: number;
  is_ready: boolean;
}

interface LearnedContent {
  id: string;
  workspace_id: string;
  content_type: 'faq' | 'seller_response' | 'company_info' | 'objection_handling' | 'product_info';
  question: string | null;
  answer: string;
  context: string | null;
  occurrence_count: number;
  effectiveness_score: number | null;
  is_approved: boolean;
  tags: string[];
  keywords: string[];
  created_at: string;
}

export const useAITraining = () => {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const workspaceId = workspace?.id;

  // Fetch training status
  const { data: trainingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['ai-training-status', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('ai_training_status')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as AITrainingStatus | null;
    },
    enabled: !!workspaceId,
  });

  // Fetch training progress
  const { data: progress } = useQuery({
    queryKey: ['ai-training-progress', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .rpc('calculate_training_progress', { ws_id: workspaceId });

      if (error) throw error;
      return (data as TrainingProgress[])?.[0] || null;
    },
    enabled: !!workspaceId && !!trainingStatus,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Fetch learned content
  const { data: learnedContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['ai-learned-content', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('ai_learned_content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('occurrence_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LearnedContent[];
    },
    enabled: !!workspaceId,
  });

  // Start training (creates or updates initial status)
  const startTraining = useMutation({
    mutationFn: async (linkedWhatsappId: string) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('ai_training_status')
        .upsert({
          workspace_id: workspaceId,
          linked_whatsapp_id: linkedWhatsappId,
          status: 'learning',
        }, { onConflict: 'workspace_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-status', workspaceId] });
      toast({ title: 'Treinamento da IA iniciado!', description: 'A IA começará a aprender com as conversas.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao iniciar treinamento', description: error.message, variant: 'destructive' });
    },
  });

  // Initialize status if missing
  const initializeStatus = useMutation({
    mutationFn: async () => {
      if (!workspaceId) return;

      console.log('Autocreating training status for workspace:', workspaceId);

      const { data, error } = await supabase
        .from('ai_training_status')
        .insert({
          workspace_id: workspaceId,
          status: 'learning',
          messages_analyzed: 0,
          faqs_detected: 0,
          company_info_extracted: 0,
          seller_patterns_learned: 0,
          objections_learned: 0,
          confidence_score: 0,
          min_days_required: 7,
          min_messages_required: 100,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // If conflict (already exists), just ignore
        if (error.code === '23505') return;
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-status', workspaceId] });
    }
  });

  // Auto-initialize
  useEffect(() => {
    if (workspaceId && !isLoadingStatus && !trainingStatus) {
      initializeStatus.mutate();
    }
  }, [workspaceId, isLoadingStatus, trainingStatus]);

  // Activate AI (admin approval)
  const activateAI = useMutation({
    mutationFn: async () => {
      // If we are activating but status object is missing in cache (rare with auto-init), fetch it or use what we partially know
      if (!workspaceId) throw new Error('No workspace');

      let statusId = trainingStatus?.id;

      // Safety check: if no ID, try to find it first OR create it
      if (!statusId) {
        console.log('Validating AI Status for activation...');
        const { data: existing } = await supabase.from('ai_training_status').select('id').eq('workspace_id', workspaceId).limit(1).maybeSingle();

        if (existing) {
          statusId = existing.id;
        } else {
          console.log('No status found during activation. Creating one...');
          const { data: created, error: createError } = await supabase
            .from('ai_training_status')
            .insert({
              workspace_id: workspaceId,
              status: 'learning',
              messages_analyzed: 0,
              faqs_detected: 0,
              company_info_extracted: 0,
              seller_patterns_learned: 0,
              objections_learned: 0,
              confidence_score: 0,
              min_days_required: 7,
              min_messages_required: 100,
              started_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Auto-create failed:', createError);
            throw new Error('Failed to auto-create AI status: ' + createError.message);
          }
          statusId = created.id;
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('ai_training_status')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          activated_by: profile?.id,
        })
        .eq('id', statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-status', workspaceId] });
      toast({ title: 'IA ativada!', description: 'A IA agora responderá automaticamente.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao ativar IA', description: error.message, variant: 'destructive' });
    },
  });

  // Pause/Resume AI
  const togglePause = useMutation({
    mutationFn: async () => {
      if (!trainingStatus) throw new Error('No training status');

      const newStatus = trainingStatus.status === 'paused' ? 'active' : 'paused';

      const { error } = await supabase
        .from('ai_training_status')
        .update({ status: newStatus })
        .eq('id', trainingStatus.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['ai-training-status', workspaceId] });
      toast({ title: newStatus === 'paused' ? 'IA pausada' : 'IA retomada' });
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  // Approve learned content
  const approveContent = useMutation({
    mutationFn: async (contentId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('ai_learned_content')
        .update({
          is_approved: true,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-learned-content', workspaceId] });
      toast({ title: 'Conteúdo aprovado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
    },
  });

  // Delete learned content
  const deleteContent = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('ai_learned_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-learned-content', workspaceId] });
      toast({ title: 'Conteúdo removido' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });

  // Content stats by type
  const contentStats = learnedContent?.reduce((acc, item) => {
    acc[item.content_type] = (acc[item.content_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    trainingStatus,
    progress,
    learnedContent,
    contentStats,
    isLoading: isLoadingStatus || isLoadingContent,
    startTraining,
    activateAI,
    togglePause,
    approveContent,
    deleteContent,
    isLearning: trainingStatus?.status === 'learning',
    isReady: trainingStatus?.status === 'ready' || (progress?.is_ready && trainingStatus?.status === 'learning'),
    isActive: trainingStatus?.status === 'active',
    isPaused: trainingStatus?.status === 'paused',
  };
};
