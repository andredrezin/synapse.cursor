import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Clock, MessageSquare, Settings2, PlayCircle } from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun?: string;
  runsCount: number;
}

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Boas-vindas automática',
    description: 'Envia mensagem de boas-vindas para novos leads',
    trigger: 'Novo lead criado',
    action: 'Enviar mensagem WhatsApp',
    isActive: true,
    lastRun: '2024-01-15T10:30:00',
    runsCount: 156,
  },
  {
    id: '2',
    name: 'Follow-up 24h',
    description: 'Envia follow-up após 24h sem resposta',
    trigger: 'Sem resposta em 24h',
    action: 'Enviar mensagem de follow-up',
    isActive: true,
    lastRun: '2024-01-15T09:00:00',
    runsCount: 89,
  },
  {
    id: '3',
    name: 'Notificar vendedor',
    description: 'Notifica vendedor quando lead fica quente',
    trigger: 'Lead temperatura = quente',
    action: 'Enviar notificação',
    isActive: false,
    lastRun: '2024-01-14T15:45:00',
    runsCount: 45,
  },
  {
    id: '4',
    name: 'Atribuição automática',
    description: 'Distribui leads entre vendedores disponíveis',
    trigger: 'Novo lead sem atribuição',
    action: 'Atribuir a vendedor',
    isActive: true,
    lastRun: '2024-01-15T11:00:00',
    runsCount: 234,
  },
];

const Automations = () => {
  const { t } = useTranslation();
  const [automations, setAutomations] = useState(mockAutomations);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const activeCount = automations.filter(a => a.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('automations.title')}</h1>
            <p className="text-muted-foreground">
              {t('automations.subtitle')}
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('automations.newAutomation')}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('automations.activeAutomations')}</CardTitle>
              <Zap className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">{t('automations.of')} {automations.length} {t('automations.total')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('automations.executionsToday')}</CardTitle>
              <PlayCircle className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">+12% {t('automations.vsYesterday')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('automations.timeSaved')}</CardTitle>
              <Clock className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5h</div>
              <p className="text-xs text-muted-foreground">{t('automations.thisWeek')}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('automations.yourAutomations')}</CardTitle>
            <CardDescription>{t('automations.manageAutomations')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${automation.isActive ? 'bg-green-500/10' : 'bg-muted'}`}>
                    <Zap className={`w-5 h-5 ${automation.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{automation.name}</p>
                      {automation.isActive && (
                        <Badge variant="secondary" className="text-xs">{t('automations.active')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{automation.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {automation.trigger}
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {automation.action}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="font-medium">{automation.runsCount}</p>
                    <p className="text-xs text-muted-foreground">{t('automations.executions')}</p>
                  </div>
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                  <Button variant="ghost" size="icon">
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Automations;
