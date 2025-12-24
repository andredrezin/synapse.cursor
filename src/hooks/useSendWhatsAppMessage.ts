import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendMessageParams {
  connectionId: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

export function useSendWhatsAppMessage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          connection_id: params.connectionId,
          to: params.to,
          message: params.message,
          type: params.type || 'text',
          media_url: params.mediaUrl,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
