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
import { Loader2, Settings2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AdvancedConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedConnectionModal({
  isOpen,
  onClose,
}: AdvancedConnectionModalProps) {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspace?.id || !name || !apiUrl || !apiKey) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para continuar',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique instance name
      const instanceName = `ws_${workspace.id.slice(0, 8)}_${Date.now()}`;
      const webhookSecret = crypto.randomUUID();

      // Create instance in Evolution API
      const evolutionResponse = await fetch(`${apiUrl}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });

      if (!evolutionResponse.ok) {
        const errorText = await evolutionResponse.text();
        throw new Error(`Erro Evolution API: ${evolutionResponse.status} - ${errorText}`);
      }

      const evolutionData = await evolutionResponse.json();

      // Set webhook
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(`${apiUrl}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
        body: JSON.stringify({
          enabled: true,
          url: `${supabaseUrl}/functions/v1/whatsapp-webhook`,
          webhookByEvents: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "CONNECTION_UPDATE",
            "QRCODE_UPDATED",
          ],
        }),
      });

      // Save connection with custom credentials
      const { error: dbError } = await supabase
        .from("whatsapp_connections")
        .insert({
          workspace_id: workspace.id,
          name,
          provider: 'evolution' as const,
          instance_name: instanceName,
          api_url: apiUrl,
          api_key: apiKey,
          webhook_secret: webhookSecret,
          status: 'qr_pending' as const,
          qr_code: evolutionData.qrcode?.base64 || null,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['whatsapp-connections', workspace.id] });
      
      toast({
        title: 'Conexão criada',
        description: 'Escaneie o QR Code para conectar',
      });
      
      handleClose();
    } catch (error: any) {
      console.error('Error creating connection:', error);
      toast({
        title: 'Erro ao criar conexão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setApiUrl('');
    setApiKey('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuração Avançada
          </DialogTitle>
          <DialogDescription>
            Configure sua própria instância Evolution API
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adv-name">Nome da conexão</Label>
            <Input
              id="adv-name"
              placeholder="Ex: Minha Instância"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-apiUrl">URL da Evolution API</Label>
            <Input
              id="adv-apiUrl"
              placeholder="https://evo.suaempresa.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adv-apiKey">Chave da API (Global Key)</Label>
            <Input
              id="adv-apiKey"
              type="password"
              placeholder="Sua chave global"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              Use esta opção se você possui seu próprio servidor Evolution API
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Conexão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
