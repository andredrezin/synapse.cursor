import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface QRCodeDisplayProps {
  qrCode: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function QRCodeDisplay({ qrCode, isOpen, onToggle }: QRCodeDisplayProps) {
  // Check if qrCode is base64 or a data URL
  const imageSrc = qrCode.startsWith('data:') 
    ? qrCode 
    : `data:image/png;base64,${qrCode}`;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <span>QR Code para conexão</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="flex flex-col items-center gap-4 p-4 bg-background rounded-lg border">
          <img 
            src={imageSrc} 
            alt="QR Code WhatsApp" 
            className="w-64 h-64 object-contain"
          />
          <p className="text-sm text-muted-foreground text-center">
            Escaneie o QR Code com seu WhatsApp para conectar
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
