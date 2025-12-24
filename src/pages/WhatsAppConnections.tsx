import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MessageCircle, Loader2, HelpCircle, Activity, Trash2 } from 'lucide-react';
import { useWhatsAppConnections } from '@/hooks/useWhatsAppConnections';
import { ConnectionCard } from '@/components/whatsapp/ConnectionCard';
import { AddConnectionModal } from '@/components/whatsapp/AddConnectionModal';
import { MetaBusinessGuide } from '@/components/whatsapp/MetaBusinessGuide';
import { HealthCheckDashboard } from '@/components/whatsapp/HealthCheckDashboard';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Database } from '@/integrations/supabase/types';

type WhatsAppProvider = Database['public']['Enums']['whatsapp_provider'];

export default function WhatsAppConnections() {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const {
    connections,
    isLoading,
    createConnection,
    refreshQRCode,
    disconnect,
    deleteConnection,
  } = useWhatsAppConnections();

  const stuckConnections = connections?.filter(c => 
    c.status === 'connecting' && 
    new Date().getTime() - new Date(c.updated_at).getTime() > 5 * 60 * 1000
  ) || [];

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast({
        title: `✅ ${t('whatsapp.whatsAppConnected')}`,
        description: t('whatsapp.whatsAppConnectedDesc'),
      });
      setSearchParams({});
    } else if (success === 'pending_phone') {
      toast({
        title: `⚠️ ${t('whatsapp.almostThere')}`,
        description: t('whatsapp.almostThereDesc'),
        duration: 10000,
      });
      setSearchParams({});
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: t('whatsapp.oauthDenied'),
        missing_params: t('whatsapp.missingParams'),
        invalid_state: t('whatsapp.invalidState'),
        token_exchange_failed: t('whatsapp.tokenExchangeFailed'),
        business_fetch_failed: t('whatsapp.businessFetchFailed'),
        db_update_failed: t('whatsapp.dbUpdateFailed'),
        oauth_failed: t('whatsapp.oauthFailed'),
      };
      
      toast({
        title: t('whatsapp.connectionError'),
        description: errorMessages[error] || t('whatsapp.connectionFailed'),
        variant: 'destructive',
        duration: 8000,
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, t]);

  const handleAddConnection = (data: {
    name: string;
    provider: 'evolution' | 'official';
  }) => {
    createConnection.mutate(data, {
      onSuccess: (result) => {
        if (!result?.oauth_url) {
          setIsAddModalOpen(false);
        }
      },
    });
  };

  const handleReconnect = async (connectionId: string, provider: WhatsAppProvider) => {
    setReconnectingId(connectionId);
    
    try {
      const connection = connections?.find(c => c.id === connectionId);
      if (!connection) return;

      await deleteConnection.mutateAsync(connectionId);

      createConnection.mutate({
        name: connection.name,
        provider,
      });

      toast({
        title: t('whatsapp.reconnecting'),
        description: provider === 'evolution' 
          ? t('whatsapp.scanQRToReconnect')
          : t('whatsapp.completeFacebookAuth'),
      });
    } catch (error) {
      toast({
        title: t('whatsapp.errorReconnecting'),
        description: t('whatsapp.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setReconnectingId(null);
    }
  };

  const handleCleanupStuck = async () => {
    try {
      for (const conn of stuckConnections) {
        await deleteConnection.mutateAsync(conn.id);
      }
      toast({
        title: t('whatsapp.connectionsCleaned'),
        description: `${stuckConnections.length} ${t('whatsapp.connectionsCleanedDesc')}`,
      });
    } catch (error) {
      toast({
        title: t('whatsapp.errorCleaning'),
        description: t('whatsapp.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              {t('whatsapp.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('whatsapp.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            {stuckConnections.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('whatsapp.cleanPending')} ({stuckConnections.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('whatsapp.cleanPendingTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('whatsapp.cleanPendingDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCleanupStuck}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('whatsapp.clean')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => setIsGuideOpen(!isGuideOpen)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              {t('whatsapp.help')}
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('whatsapp.addWhatsApp')}
            </Button>
          </div>
        </div>

        <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <CollapsibleContent className="space-y-2">
            <MetaBusinessGuide showFullGuide />
          </CollapsibleContent>
        </Collapsible>

        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {t('whatsapp.connections')}
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              {t('whatsapp.healthCheck')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !connections || connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('whatsapp.noConnections')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('whatsapp.noConnectionsDesc')}
                </p>
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('whatsapp.addWhatsApp')}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    onRefreshQR={(id) => refreshQRCode.mutate(id)}
                    onDisconnect={(id) => disconnect.mutate(id)}
                    onDelete={(id) => deleteConnection.mutate(id)}
                    onReconnect={handleReconnect}
                    isRefreshing={refreshQRCode.isPending}
                    isDisconnecting={disconnect.isPending}
                    isDeleting={deleteConnection.isPending}
                    isReconnecting={reconnectingId === connection.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="health">
            <HealthCheckDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddConnection}
        isLoading={createConnection.isPending}
      />
    </DashboardLayout>
  );
}