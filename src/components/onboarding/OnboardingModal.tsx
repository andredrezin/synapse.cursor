import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OnboardingGuide } from './OnboardingGuide';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingModal = ({ open, onOpenChange }: OnboardingModalProps) => {
  const { profile, workspace, refreshProfile } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (workspace?.id) {
      checkCompletedSteps();
    }
  }, [workspace?.id]);

  const checkCompletedSteps = async () => {
    if (!workspace?.id) return;

    const completed: string[] = [];

    // Check WhatsApp connections
    const { data: whatsapp } = await supabase
      .from('whatsapp_connections')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('status', 'connected')
      .limit(1);
    if (whatsapp && whatsapp.length > 0) completed.push('whatsapp');

    // Check knowledge base
    const { data: knowledge } = await supabase
      .from('knowledge_entries')
      .select('id')
      .eq('workspace_id', workspace.id)
      .limit(1);
    if (knowledge && knowledge.length > 0) completed.push('knowledge');

    // Check AI settings
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('id, is_enabled')
      .eq('workspace_id', workspace.id)
      .single();
    if (aiSettings?.is_enabled) completed.push('ai-training');

    // Check team members
    const { data: team } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id);
    if (team && team.length > 1) completed.push('team');

    // Check leads
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspace.id)
      .limit(1);
    if (leads && leads.length > 0) completed.push('leads');

    setCompletedSteps(completed);
  };

  const handleComplete = async () => {
    try {
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', profile.id);
        
        await refreshProfile();
      }
      onOpenChange(false);
      toast.success('Onboarding concluído! Bem-vindo ao LeadFlux! 🎉');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Guia de Configuração</DialogTitle>
          <DialogDescription>
            Configure sua plataforma LeadFlux passo a passo
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <OnboardingGuide 
            onComplete={handleComplete}
            completedSteps={completedSteps}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
