import { AlertTriangle, X, Settings2, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  metric: string;
  message: string;
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: Date;
}

interface Thresholds {
  conversionRate: number;
  hotLeadsPercent: number;
  negativeSentimentPercent: number;
  aiResponseRate: number;
}

interface MetricAlertsPanelProps {
  alerts: Alert[];
  thresholds: Thresholds;
  onUpdateThresholds: (thresholds: Partial<Thresholds>) => void;
  onDismiss: (id: string) => void;
}

export const MetricAlertsPanel = ({
  alerts,
  thresholds,
  onUpdateThresholds,
  onDismiss,
}: MetricAlertsPanelProps) => {
  if (alerts.length === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Todas as métricas estão saudáveis
              </p>
              <p className="text-sm text-muted-foreground">
                Nenhum alerta ativo no momento
              </p>
            </div>
            <div className="ml-auto">
              <ThresholdSettings thresholds={thresholds} onUpdate={onUpdateThresholds} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Alertas de Métricas</CardTitle>
            <Badge variant="destructive">{alerts.length}</Badge>
          </div>
          <ThresholdSettings thresholds={thresholds} onUpdate={onUpdateThresholds} />
        </div>
        <CardDescription>
          Métricas abaixo dos limites definidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              alert.severity === 'critical' 
                ? "bg-red-500/20 border border-red-500/30" 
                : "bg-yellow-500/20 border border-yellow-500/30"
            )}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn(
                "h-4 w-4",
                alert.severity === 'critical' ? "text-red-500" : "text-yellow-500"
              )} />
              <div>
                <p className="font-medium text-sm">{alert.metric}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDismiss(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const ThresholdSettings = ({
  thresholds,
  onUpdate,
}: {
  thresholds: Thresholds;
  onUpdate: (thresholds: Partial<Thresholds>) => void;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar Limites
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Limites de Alerta</DialogTitle>
          <DialogDescription>
            Defina os limites mínimos/máximos para cada métrica
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="conversionRate">Taxa de Conversão Mínima (%)</Label>
            <Input
              id="conversionRate"
              type="number"
              min={0}
              max={100}
              value={thresholds.conversionRate}
              onChange={(e) => onUpdate({ conversionRate: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Alerta se a conversão cair abaixo deste valor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotLeadsPercent">% Mínimo de Leads Quentes</Label>
            <Input
              id="hotLeadsPercent"
              type="number"
              min={0}
              max={100}
              value={thresholds.hotLeadsPercent}
              onChange={(e) => onUpdate({ hotLeadsPercent: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Alerta se menos leads estiverem quentes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="negativeSentimentPercent">% Máximo de Sentimento Negativo</Label>
            <Input
              id="negativeSentimentPercent"
              type="number"
              min={0}
              max={100}
              value={thresholds.negativeSentimentPercent}
              onChange={(e) => onUpdate({ negativeSentimentPercent: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Alerta se muitas mensagens forem negativas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiResponseRate">Taxa Mínima de Resposta IA (%)</Label>
            <Input
              id="aiResponseRate"
              type="number"
              min={0}
              max={100}
              value={thresholds.aiResponseRate}
              onChange={(e) => onUpdate({ aiResponseRate: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Alerta se a IA responder menos mensagens
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
