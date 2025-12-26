import { useState, useEffect } from 'react';
import { Check, X, Zap, BarChart3, Bot, MessageSquare, Image, Mic, Shield, Users, TrendingUp, Brain, Sparkles, Loader2, ExternalLink, CreditCard, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useSearchParams, Link } from "react-router-dom";
interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  period: string;
  description: string;
  features: PlanFeature[];
  icon: React.ReactNode;
  popular?: boolean;
  cta: string;
  color: string;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: "R$ 297",
    priceId: "price_1ShgrgEK4I7ETzntQGmLIOwj",
    period: "/mês",
    description: "Monitore suas conversas e equipe de vendas com métricas essenciais",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "from-blue-500 to-cyan-500",
    cta: "Assinar Básico",
    features: [
      { name: "Monitoramento de conversas", included: true },
      { name: "Dashboard de métricas", included: true },
      { name: "Gestão de leads", included: true },
      { name: "Múltiplas conexões WhatsApp", included: true },
      { name: "Relatórios básicos", included: true },
      { name: "Suporte por email", included: true },
      { name: "Insights de IA", included: false },
      { name: "Análise de sentimento", included: false },
      { name: "Chatbot automático", included: false },
      { name: "Transcrição de áudio", included: false },
      { name: "Análise de imagens", included: false },
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    price: "R$ 497",
    priceId: "price_1ShgruEK4I7ETzntNYvbXYnN",
    period: "/mês",
    description: "Insights avançados de IA para otimizar suas vendas",
    icon: <Brain className="h-6 w-6" />,
    color: "from-violet-500 to-purple-500",
    cta: "Assinar Profissional",
    features: [
      { name: "Tudo do plano Básico", included: true, highlight: true },
      { name: "Insights do Agente IA", included: true, highlight: true },
      { name: "Análise de sentimento", included: true, highlight: true },
      { name: "Sugestões de resposta", included: true, highlight: true },
      { name: "Qualificação automática de leads", included: true, highlight: true },
      { name: "Relatórios avançados", included: true },
      { name: "Suporte prioritário", included: true },
      { name: "Chatbot automático", included: false },
      { name: "Transcrição de áudio", included: false },
      { name: "Análise de imagens", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 899,90",
    priceId: "price_1Shgs6EK4I7ETzntLmyS3J71",
    period: "/mês",
    description: "Chatbot IA completo com suporte a áudio e imagem",
    icon: <Bot className="h-6 w-6" />,
    color: "from-amber-500 to-orange-500",
    popular: true,
    cta: "Assinar Premium",
    features: [
      { name: "Tudo do plano Profissional", included: true, highlight: true },
      { name: "Chatbot IA automático", included: true, highlight: true },
      { name: "Transcrição de áudio (Whisper)", included: true, highlight: true },
      { name: "Análise de imagens (Vision)", included: true, highlight: true },
      { name: "Aprendizado contínuo (RAG)", included: true, highlight: true },
      { name: "Meta Official API (obrigatório)", included: true, highlight: true },
      { name: "Prompt de segurança anti-alucinação", included: true },
      { name: "Transferência automática para humano", included: true },
      { name: "Horários de atendimento personalizados", included: true },
      { name: "Suporte 24/7 dedicado", included: true },
    ],
  },
];

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string | null;
  plan_name: string | null;
  subscription_end: string | null;
}

const Pricing = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Assinatura realizada!",
        description: "Bem-vindo ao plano! Seu acesso será liberado em instantes.",
      });
      // Refresh subscription status
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    // Auto-refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (priceId: string, planId: string) => {
    setIsLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao iniciar checkout",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: "Erro ao abrir portal",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const isCurrentPlan = (planId: string) => subscription?.plan === planId;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Planos e Preços
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Escolha o plano ideal para seu negócio
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Desde monitoramento básico até automação completa com IA.
              Escale conforme seu negócio cresce.
            </p>

            {/* Current Subscription Status */}
            {subscription?.subscribed && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-chart-green/10 border border-chart-green/30">
                  <Check className="h-5 w-5 text-chart-green" />
                  <span className="text-sm font-medium">
                    Você está no plano <strong>{subscription.plan_name}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={isLoading === 'manage'}
                  >
                    {isLoading === 'manage' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Gerenciar
                      </>
                    )}
                  </Button>
                </div>
                <Link
                  to="/dashboard/subscription-cancel"
                  className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Cancelar assinatura
                </Link>
              </div>
            )}
          </div>



          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);

              return (
                <Card
                  key={plan.name}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                    } ${isCurrent ? 'ring-2 ring-chart-green' : ''}`}
                >
                  {plan.popular && !isCurrent && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-chart-green text-white">
                        Seu Plano
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-[48px]">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          {feature.included ? (
                            <div className={`mt-0.5 rounded-full p-0.5 ${feature.highlight ? 'bg-primary/20' : 'bg-green-500/20'}`}>
                              <Check className={`h-4 w-4 ${feature.highlight ? 'text-primary' : 'text-green-600'}`} />
                            </div>
                          ) : (
                            <div className="mt-0.5 rounded-full p-0.5 bg-muted">
                              <X className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className={`text-sm ${!feature.included ? 'text-muted-foreground' : ''} ${feature.highlight ? 'font-medium' : ''}`}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    {isCurrent ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={isLoading === 'manage'}
                      >
                        {isLoading === 'manage' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Gerenciar Assinatura
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${plan.popular ? '' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => handleSubscribe(plan.priceId, plan.id)}
                        disabled={isLoading === plan.id || isCheckingSubscription}
                      >
                        {isLoading === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        {plan.cta}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Feature Comparison */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center mb-8">Comparação Detalhada</h2>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Funcionalidade</th>
                      <th className="text-center p-4 font-semibold">Básico</th>
                      <th className="text-center p-4 font-semibold">Profissional</th>
                      <th className="text-center p-4 font-semibold bg-primary/5">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Monitoramento de conversas
                      </td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        Dashboard de métricas
                      </td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Gestão de equipe
                      </td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        Insights de IA
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Análise de sentimento
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        Sugestões de resposta
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        Chatbot automático
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-muted-foreground" />
                        Transcrição de áudio
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        Análise de imagens
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Segurança anti-alucinação
                      </td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Dúvidas Frequentes</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto mt-8">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Por que o Premium exige Meta Official API?</h3>
                <p className="text-sm text-muted-foreground">
                  A Meta Official API é a única forma segura de enviar mensagens automáticas sem risco de bloqueio.
                  A Evolution API é ótima para monitoramento, mas não é segura para automação comercial.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">O que é o aprendizado contínuo (RAG)?</h3>
                <p className="text-sm text-muted-foreground">
                  Nossa IA aprende continuamente com as conversas da sua equipe de vendas,
                  criando uma base de conhecimento personalizada para responder como seus melhores vendedores.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Posso mudar de plano a qualquer momento?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade a qualquer momento clicando em "Gerenciar Assinatura".
                  O valor será calculado proporcionalmente ao período restante.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">O que acontece se eu cancelar?</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados ficam armazenados por 30 dias. Você pode voltar a qualquer momento
                  e retomar de onde parou, inclusive com todo o aprendizado da IA.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pricing;
