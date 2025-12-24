import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, QrCode, Facebook, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WhatsAppProvider = Database['public']['Enums']['whatsapp_provider'];

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    provider: WhatsAppProvider;
  }) => void;
  isLoading?: boolean;
}

export function AddConnectionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddConnectionModalProps) {
  const [name, setName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider | null>(null);
  const [showMetaInfo, setShowMetaInfo] = useState(false);

  const handleConnect = (provider: WhatsAppProvider) => {
    if (!name.trim()) {
      setSelectedProvider(provider);
      return;
    }
    
    setSelectedProvider(provider);
    onSubmit({ name, provider });
  };

  const handleSubmitWithName = () => {
    if (!name.trim() || !selectedProvider) return;
    onSubmit({ name, provider: selectedProvider });
  };

  const handleClose = () => {
    setName('');
    setSelectedProvider(null);
    setShowMetaInfo(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escolha como deseja conectar seu WhatsApp Business
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da conexão</Label>
            <Input
              id="name"
              placeholder="Ex: Vendas Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {selectedProvider && !name.trim() && (
            <p className="text-sm text-destructive">
              Digite um nome para a conexão primeiro
            </p>
          )}

          <div className="grid gap-3 pt-2">
            {/* Meta Business - API Oficial */}
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 px-4 justify-start gap-4 border-[#1877F2]/30 hover:border-[#1877F2] hover:bg-[#1877F2]/5"
              onClick={() => handleConnect('official')}
              disabled={isLoading}
            >
              {isLoading && selectedProvider === 'official' ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-[#1877F2]" />
                </div>
              )}
              <div className="text-left flex-1">
                <div className="font-medium flex items-center gap-2">
                  API Oficial do WhatsApp
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Conecte via Meta Business - sem servidor externo
                </div>
              </div>
            </Button>

            {/* Info sobre Meta Business */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setShowMetaInfo(!showMetaInfo)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showMetaInfo ? 'Ocultar' : 'Ver'} requisitos do Meta Business
            </Button>

            {showMetaInfo && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm space-y-2">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Requisitos:</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Conta no Meta Business Suite
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> Número verificado no WhatsApp Business
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> App Meta com WhatsApp configurado
                    </li>
                  </ul>
                  <div className="pt-2 flex gap-2">
                    <a
                      href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver documentação
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Evolution API - QR Code */}
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 px-4 justify-start gap-4 opacity-60"
              onClick={() => handleConnect('evolution')}
              disabled={isLoading}
            >
              {isLoading && selectedProvider === 'evolution' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  Conectar via QR Code
                  <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                    Requer servidor
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Escaneie com seu celular (requer Evolution API externa)
                </div>
              </div>
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
