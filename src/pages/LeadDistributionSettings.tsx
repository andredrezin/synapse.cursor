import { useState } from 'react';
import { Settings2, Users, Shuffle, Link2, Hand, Save, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadDistribution } from '@/hooks/useLeadDistribution';
import { Skeleton } from '@/components/ui/skeleton';

type DistributionMode = 'connection' | 'round_robin' | 'manual';

const distributionModes = [
  {
    id: 'connection' as DistributionMode,
    name: 'Por Conexão WhatsApp',
    description: 'Leads são atribuídos ao vendedor vinculado à conexão WhatsApp que recebeu a mensagem',
    icon: Link2,
    recommended: true,
  },
  {
    id: 'round_robin' as DistributionMode,
    name: 'Round-Robin Automático',
    description: 'Leads são distribuídos igualmente entre todos os vendedores ativos, de forma rotativa',
    icon: Shuffle,
    recommended: false,
  },
  {
    id: 'manual' as DistributionMode,
    name: 'Atribuição Manual',
    description: 'Leads ficam sem atribuição até que um admin os distribua manualmente',
    icon: Hand,
    recommended: false,
  },
];

const LeadDistributionSettings = () => {
  const { settings, isLoading, updateSettings } = useLeadDistribution();
  const [isSaving, setIsSaving] = useState(false);
  const [localMode, setLocalMode] = useState<DistributionMode | null>(null);
  const [localAutoAssign, setLocalAutoAssign] = useState<boolean | null>(null);

  const currentMode = localMode ?? settings?.distribution_mode ?? 'connection';
  const currentAutoAssign = localAutoAssign ?? settings?.auto_assign_new_leads ?? true;

  const hasChanges = 
    (localMode !== null && localMode !== settings?.distribution_mode) ||
    (localAutoAssign !== null && localAutoAssign !== settings?.auto_assign_new_leads);

  const handleSave = async () => {
    setIsSaving(true);
    const updates: Record<string, unknown> = {};
    
    if (localMode !== null) {
      updates.distribution_mode = localMode;
    }
    if (localAutoAssign !== null) {
      updates.auto_assign_new_leads = localAutoAssign;
    }
    
    await updateSettings(updates);
    setLocalMode(null);
    setLocalAutoAssign(null);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              Distribuição de Leads
            </h1>
            <p className="text-muted-foreground">
              Configure como os novos leads são distribuídos entre os vendedores
            </p>
          </div>
          
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          )}
        </div>

        {/* Distribution Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Modo de Distribuição
            </CardTitle>
            <CardDescription>
              Escolha como os novos leads serão atribuídos aos vendedores da equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={currentMode}
              onValueChange={(value) => setLocalMode(value as DistributionMode)}
              className="grid gap-4"
            >
              {distributionModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = currentMode === mode.id;
                
                return (
                  <label
                    key={mode.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem 
                      value={mode.id} 
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4 w-full">
                      <div className={`rounded-lg p-2 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mode.name}</span>
                          {mode.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mode.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Auto Assign Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-assign">Atribuição automática de novos leads</Label>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, novos leads são atribuídos automaticamente conforme o modo de distribuição selecionado
                </p>
              </div>
              <Switch
                id="auto-assign"
                checked={currentAutoAssign}
                onCheckedChange={setLocalAutoAssign}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 p-2 h-fit">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Como funciona a distribuição?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Por Conexão:</strong> Cada WhatsApp é vinculado a vendedores específicos. Leads vão para esses vendedores.</li>
                  <li><strong>Round-Robin:</strong> Sistema rotativo que distribui leads igualmente entre todos os vendedores.</li>
                  <li><strong>Manual:</strong> Leads ficam na fila geral para o admin distribuir manualmente.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeadDistributionSettings;
