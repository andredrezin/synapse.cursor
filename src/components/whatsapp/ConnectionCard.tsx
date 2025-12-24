import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  Users,
  QrCode,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { AssignSellersDialog } from './AssignSellersDialog';
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

type WhatsAppConnection = Database['public']['Tables']['whatsapp_connections']['Row'];

interface ConnectionCardProps {
  connection: WhatsAppConnection;
  onRefreshQR: (id: string) => void;
  onDisconnect: (id: string) => void;
  onDelete: (id: string) => void;
  onReconnect?: (id: string, provider: WhatsAppConnection['provider']) => void;
  isRefreshing?: boolean;
  isDisconnecting?: boolean;
  isDeleting?: boolean;
  isReconnecting?: boolean;
}

const statusConfig = {
  connected: {
    label: 'Conectado',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  disconnected: {
    label: 'Desconectado',
    variant: 'secondary' as const,
    icon: WifiOff,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-muted',
  },
  connecting: {
    label: 'Conectando...',
    variant: 'outline' as const,
    icon: Loader2,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    animate: true,
  },
  qr_pending: {
    label: 'Aguardando QR',
    variant: 'outline' as const,
    icon: QrCode,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
};

const providerLabels = {
  evolution: 'Evolution API',
  official: 'API Oficial',
};

export function ConnectionCard({
  connection,
  onRefreshQR,
  onDisconnect,
  onDelete,
  onReconnect,
  isRefreshing,
  isDisconnecting,
  isDeleting,
  isReconnecting,
}: ConnectionCardProps) {
  const [showQR, setShowQR] = useState(
    connection.status === 'qr_pending' && !!connection.qr_code
  );
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  const status = statusConfig[connection.status];
  const StatusIcon = status.icon;
  const shouldAnimate = 'animate' in status && status.animate;
  
  // Auto-open QR when available
  useEffect(() => {
    if (connection.status === 'qr_pending' && connection.qr_code) {
      setShowQR(true);
    }
    if (connection.status === 'connected') {
      setShowQR(false);
    }
  }, [connection.status, connection.qr_code]);
  
  // Check if connection is stuck (connecting for more than 5 minutes)
  const isStuck = connection.status === 'connecting' && 
    new Date().getTime() - new Date(connection.updated_at).getTime() > 5 * 60 * 1000;

  return (
    <>
      <Card className={`transition-all duration-300 ${connection.status === 'connected' ? 'ring-2 ring-green-500/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {connection.name}
              </CardTitle>
              {connection.phone_number && (
                <p className="text-sm text-muted-foreground">
                  {connection.phone_number}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={status.variant} 
                className={`flex items-center gap-1 ${status.bgColor} border`}
              >
                <StatusIcon className={`h-3 w-3 ${status.color} ${shouldAnimate ? 'animate-spin' : ''}`} />
                <span className={status.color}>{status.label}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {providerLabels[connection.provider]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connected status indicator */}
          {connection.status === 'connected' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                WhatsApp conectado e pronto para uso!
              </span>
            </div>
          )}

          {/* Connecting status indicator */}
          {connection.status === 'connecting' && !isStuck && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                Aguardando conexão... Escaneie o QR Code no WhatsApp.
              </span>
            </div>
          )}

          {/* QR Code Section - Show for qr_pending, connecting, or disconnected with QR */}
          {(connection.status === 'qr_pending' || connection.status === 'connecting' || connection.status === 'disconnected') && 
           connection.qr_code && (
            <div className="flex justify-center">
              <QRCodeDisplay 
                qrCode={connection.qr_code} 
                isOpen={showQR}
                onToggle={() => setShowQR(!showQR)}
              />
            </div>
          )}

          {/* Stuck connection warning */}
          {isStuck && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm">
              <p className="text-yellow-600 dark:text-yellow-400">
                Esta conexão está pendente há muito tempo. Você pode tentar reconectar ou excluí-la.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {connection.status === 'connected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisconnect(connection.id)}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <WifiOff className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </Button>
            )}

            {/* Reconnect button for stuck connections */}
            {isStuck && onReconnect && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onReconnect(connection.id, connection.provider)}
                disabled={isReconnecting}
              >
                {isReconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reconectar
              </Button>
            )}

            {(connection.status === 'disconnected' || connection.status === 'qr_pending') && 
             connection.provider === 'evolution' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefreshQR(connection.id)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                {connection.qr_code ? 'Atualizar QR' : 'Gerar QR Code'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignDialog(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Vendedores
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conexão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A conexão "{connection.name}" 
                    será removida permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(connection.id)}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Last sync info */}
          {connection.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Última sincronização: {new Date(connection.last_sync_at).toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>

      <AssignSellersDialog
        connectionId={connection.id}
        connectionName={connection.name}
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
      />
    </>
  );
}
