import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles, Crown, ArrowRight, PartyPopper } from "lucide-react";
import { useSubscriptionContext, PLANS } from "@/contexts/SubscriptionContext";
import confetti from "canvas-confetti";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, plan, planName, isLoading } = useSubscriptionContext();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Refresh subscription status
    checkSubscription();
    
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Show content with delay for animation
    setTimeout(() => setShowContent(true), 300);
  }, [checkSubscription]);

  const getPlanDetails = () => {
    if (plan === 'premium') {
      return {
        name: PLANS.premium.name,
        icon: Crown,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        features: [
          'Chatbot IA completo',
          'Transcrição de áudio',
          'Análise de imagens',
          'Base de conhecimento',
          'Insights com IA',
          'Relatórios avançados',
        ],
      };
    } else if (plan === 'professional') {
      return {
        name: PLANS.professional.name,
        icon: Sparkles,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        features: [
          'Insights com IA',
          'Base de conhecimento',
          'Relatórios avançados',
          'Gestão de leads',
          'Conversas ilimitadas',
        ],
      };
    }
    return {
      name: PLANS.basic.name,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      features: [
        'Gestão de leads',
        'Conversas',
        'Relatórios básicos',
      ],
    };
  };

  const planDetails = getPlanDetails();
  const PlanIcon = planDetails.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div 
        className={`max-w-lg w-full transition-all duration-700 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Card className={`border-2 ${planDetails.borderColor} shadow-xl`}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 relative">
              <div className={`w-20 h-20 rounded-full ${planDetails.bgColor} flex items-center justify-center animate-pulse`}>
                <PlanIcon className={`w-10 h-10 ${planDetails.color}`} />
              </div>
              <div className="absolute -top-2 -right-2">
                <PartyPopper className="w-8 h-8 text-primary animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Bem-vindo ao {planName || planDetails.name}! 🎉
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos do plano.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features unlocked */}
            <div className={`p-4 rounded-lg ${planDetails.bgColor} border ${planDetails.borderColor}`}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${planDetails.color}`} />
                Recursos desbloqueados:
              </h3>
              <ul className="space-y-2">
                {planDetails.features.map((feature, index) => (
                  <li 
                    key={feature} 
                    className="flex items-center gap-2 text-sm"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: showContent ? 'fadeIn 0.5s ease forwards' : 'none',
                      opacity: 0,
                    }}
                  >
                    <CheckCircle className={`w-4 h-4 ${planDetails.color} flex-shrink-0`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full"
                size="lg"
              >
                Ir para o Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {plan === 'premium' && (
                <Button 
                  onClick={() => navigate('/dashboard/ai-settings')} 
                  variant="outline"
                  className="w-full"
                >
                  Configurar Chatbot IA
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {(plan === 'professional' || plan === 'premium') && (
                <Button 
                  onClick={() => navigate('/dashboard/knowledge')} 
                  variant="outline"
                  className="w-full"
                >
                  Explorar Base de Conhecimento
                </Button>
              )}
            </div>

            {/* Support note */}
            <p className="text-center text-sm text-muted-foreground">
              Precisa de ajuda? Entre em contato com nosso suporte.
            </p>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutSuccess;
