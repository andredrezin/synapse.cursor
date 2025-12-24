import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface OAuthPopupHandlerProps {
  connectionId: string | null;
  popup: Window | null;
  onComplete: () => void;
}

export function useOAuthPopupHandler() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);
  const connectionIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnectionStatus = useCallback(async () => {
    if (!connectionIdRef.current) return false;

    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('status, phone_number')
        .eq('id', connectionIdRef.current)
        .single();

      if (error) throw error;

      if (data?.status === 'connected') {
        toast({
          title: 'WhatsApp conectado!',
          description: data.phone_number 
            ? `Número ${data.phone_number} vinculado com sucesso`
            : 'Sua conta foi vinculada com sucesso',
        });
        return true;
      } else if (data?.status === 'connecting') {
        toast({
          title: 'Quase lá!',
          description: 'Configure um número de telefone na sua conta Business',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  }, [toast]);

  const startPolling = useCallback((connectionId: string, popup: Window) => {
    popupRef.current = popup;
    connectionIdRef.current = connectionId;

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      // Check if popup was closed
      if (popupRef.current?.closed) {
        const wasSuccessful = await checkConnectionStatus();
        
        if (!wasSuccessful) {
          toast({
            title: 'Autenticação cancelada',
            description: 'A janela de autenticação foi fechada',
            variant: 'destructive',
          });
        }

        // Cleanup
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
        return;
      }

      // Check if connection was successful while popup is still open
      const isConnected = await checkConnectionStatus();
      if (isConnected) {
        popupRef.current?.close();
        stopPolling();
        queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
      }
    }, 2000);
  }, [checkConnectionStatus, queryClient, toast, workspace?.id]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    popupRef.current = null;
    connectionIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
  };
}
