import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';

type WhatsAppConnection = Database['public']['Tables']['whatsapp_connections']['Row'];
type WhatsAppProvider = Database['public']['Enums']['whatsapp_provider'];

interface CreateConnectionParams {
  name: string;
  provider: WhatsAppProvider;
}

interface OAuthPopupState {
  popup: Window | null;
  connectionId: string | null;
  pollingInterval: NodeJS.Timeout | null;
}

export function useWhatsAppConnections() {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // OAuth popup state
  const oauthStateRef = useRef<OAuthPopupState>({
    popup: null,
    connectionId: null,
    pollingInterval: null,
  });

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['whatsapp-connections', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WhatsAppConnection[];
    },
    enabled: !!workspace?.id,
  });

  // Check OAuth connection status
  const checkConnectionStatus = useCallback(async () => {
    const connectionId = oauthStateRef.current.connectionId;
    if (!connectionId) return false;

    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('status, phone_number')
        .eq('id', connectionId)
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
          title: 'Autenticação realizada!',
          description: 'Sua conta do Meta Business não tem número de telefone WhatsApp configurado. Use a opção "Conectar via QR Code" para conectar diretamente.',
          duration: 8000,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  }, [toast]);

  // Stop OAuth polling
  const stopOAuthPolling = useCallback(() => {
    if (oauthStateRef.current.pollingInterval) {
      clearInterval(oauthStateRef.current.pollingInterval);
    }
    oauthStateRef.current = {
      popup: null,
      connectionId: null,
      pollingInterval: null,
    };
  }, []);

  // Start OAuth polling
  const startOAuthPolling = useCallback((connectionId: string, popup: Window) => {
    stopOAuthPolling(); // Clear any existing polling

    oauthStateRef.current.popup = popup;
    oauthStateRef.current.connectionId = connectionId;

    oauthStateRef.current.pollingInterval = setInterval(async () => {
      // Check if popup was closed
      if (oauthStateRef.current.popup?.closed) {
        const wasSuccessful = await checkConnectionStatus();
        
        if (!wasSuccessful) {
          toast({
            title: 'Autenticação cancelada',
            description: 'A janela de autenticação foi fechada. Tente novamente.',
            variant: 'destructive',
          });
        }

        stopOAuthPolling();
        queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
        return;
      }

      // Check if connection was successful while popup is still open
      const isConnected = await checkConnectionStatus();
      if (isConnected) {
        oauthStateRef.current.popup?.close();
        stopOAuthPolling();
        queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
      }
    }, 2000);
  }, [checkConnectionStatus, queryClient, stopOAuthPolling, toast, workspace?.id]);

  // Realtime subscription for connection status updates
  useEffect(() => {
    if (!workspace?.id) return;

    const channel = supabase
      .channel('whatsapp-connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_connections',
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopOAuthPolling(); // Cleanup polling on unmount
    };
  }, [workspace?.id, queryClient, stopOAuthPolling]);

  // Poll status for connections that are connecting or qr_pending
  useEffect(() => {
    if (!connections || connections.length === 0) return;

    const pendingConnections = connections.filter(
      c => c.status === 'connecting' || c.status === 'qr_pending'
    );

    if (pendingConnections.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const conn of pendingConnections) {
        try {
          const { data, error } = await supabase.functions.invoke('whatsapp-status', {
            body: {
              connection_id: conn.id,
              action: 'check_status',
            },
          });

          if (!error && data?.status && data.status !== conn.status) {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
            
            if (data.status === 'connected') {
              toast({
                title: 'WhatsApp Conectado!',
                description: `A conexão "${conn.name}" foi estabelecida com sucesso.`,
              });
            }
          }
        } catch (err) {
          console.error('Error polling connection status:', err);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [connections, queryClient, workspace?.id, toast]);

  const createConnection = useMutation({
    mutationFn: async (params: CreateConnectionParams) => {
      if (!workspace?.id) throw new Error('Workspace não encontrado');

      const { data, error } = await supabase.functions.invoke('whatsapp-connect', {
        body: {
          workspace_id: workspace.id,
          name: params.name,
          provider: params.provider,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
      
      // If official provider, open Facebook OAuth in a new window/tab
      if (data?.oauth_url) {
        // Calculate popup window position (centered)
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.oauth_url,
          'facebook_oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
        
        // Start polling to detect OAuth completion
        if (popup && !popup.closed && data?.connection_id) {
          startOAuthPolling(data.connection_id, popup);
          toast({
            title: 'Autenticação Facebook',
            description: 'Complete a autenticação na janela que foi aberta',
          });
        } else {
          // If popup was blocked, try opening in a new tab
          window.open(data.oauth_url, '_blank');
          toast({
            title: 'Autenticação Facebook',
            description: 'Complete a autenticação na nova aba. Retorne aqui após concluir.',
          });
        }
        return;
      }
      
      toast({
        title: 'Conexão criada',
        description: 'Escaneie o QR Code para conectar',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar conexão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const refreshQRCode = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-status', {
        body: {
          connection_id: connectionId,
          action: 'refresh_qr',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar QR Code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const disconnect = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-status', {
        body: {
          connection_id: connectionId,
          action: 'disconnect',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
      toast({
        title: 'Desconectado',
        description: 'Conexão WhatsApp encerrada',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace?.id] });
      toast({
        title: 'Conexão removida',
        description: 'A conexão foi excluída com sucesso',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover conexão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    connections,
    isLoading,
    error,
    createConnection,
    refreshQRCode,
    disconnect,
    deleteConnection,
  };
}
