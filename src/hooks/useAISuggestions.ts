import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Suggestion {
  text: string;
  type: 'friendly' | 'professional' | 'closing';
  confidence: number;
}

interface UseSuggestionsParams {
  conversationId: string;
  leadId: string;
}

export const useAISuggestions = ({ conversationId, leadId }: UseSuggestionsParams) => {
  const { workspace } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (
    lastMessage: string, 
    conversationHistory: Array<{ content: string; sender_type: string }>
  ) => {
    if (!workspace?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-router', {
        body: {
          task: 'suggest',
          workspace_id: workspace.id,
          payload: {
            lead_id: leadId,
            conversation_id: conversationId,
            last_message: lastMessage,
            conversation_history: conversationHistory,
          },
        },
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data?.suggestions) {
        setSuggestions(data.data.suggestions);
      } else {
        throw new Error(data?.data?.error || 'Failed to get suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspace?.id, conversationId, leadId]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
};
