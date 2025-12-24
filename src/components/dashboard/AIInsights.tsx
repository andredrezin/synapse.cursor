import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const insights = [
  {
    type: 'opportunity',
    icon: TrendingUp,
    title: 'Oportunidade de Conversão',
    description: '3 leads quentes não receberam follow-up nas últimas 24h. Potencial de R$ 8.500 em vendas.',
    action: 'Ver leads',
    color: 'text-primary bg-primary/10'
  },
  {
    type: 'alert',
    icon: AlertTriangle,
    title: 'Tempo de Resposta Alto',
    description: 'A média de resposta subiu para 4.2min. Meta é 2min. João e Carlos precisam de suporte.',
    action: 'Ver métricas',
    color: 'text-chart-orange bg-chart-orange/10'
  },
  {
    type: 'insight',
    icon: Lightbulb,
    title: 'Padrão Identificado',
    description: 'Leads que recebem resposta em até 1min têm 3x mais chance de converter. Considere automação.',
    action: 'Configurar',
    color: 'text-chart-blue bg-chart-blue/10'
  }
];

const AIInsights = () => {
  const { canAccessFeature, isLoading } = useSubscription();
  const navigate = useNavigate();
  const hasAccess = canAccessFeature('ai_insights');

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Insights da IA</h3>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/30 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="glass rounded-xl p-5 border-2 border-dashed border-muted-foreground/20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Insights da IA</h3>
            <p className="text-xs text-muted-foreground">Recurso Premium</p>
          </div>
        </div>
        
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h4 className="font-medium mb-2">Plano Profissional ou superior</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Insights inteligentes da IA para otimizar suas vendas
          </p>
          <Button 
            onClick={() => navigate('/dashboard/pricing')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Fazer Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-chart-purple flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Insights da IA</h3>
          <p className="text-xs text-muted-foreground">Recomendações baseadas em dados</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                <button className="flex items-center gap-1 mt-2 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  {insight.action}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4">
        <Sparkles className="w-4 h-4 mr-2" />
        Gerar mais insights
      </Button>
    </div>
  );
};

export default AIInsights;
