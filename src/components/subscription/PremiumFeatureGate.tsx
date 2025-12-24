import React from 'react';
import { useSubscription, FEATURE_REQUIREMENTS, PLANS, SubscriptionPlan } from '@/hooks/useSubscription';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface PremiumFeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: <Sparkles className="h-5 w-5" />,
  professional: <Crown className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5 text-amber-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  basic: 'from-blue-500 to-cyan-500',
  professional: 'from-purple-500 to-pink-500',
  premium: 'from-amber-500 to-orange-500',
};

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { canAccessFeature, plan, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccess = canAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredPlan = FEATURE_REQUIREMENTS[feature] as SubscriptionPlan;
  const planInfo = requiredPlan ? PLANS[requiredPlan] : null;

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardHeader className="text-center pb-2">
        <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-br ${PLAN_COLORS[requiredPlan || 'basic']} flex items-center justify-center mb-3`}>
          <Lock className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-lg">Recurso Premium</CardTitle>
        <CardDescription>
          Esta funcionalidade está disponível no plano{' '}
          <span className="font-semibold text-foreground">{planInfo?.name}</span> ou superior
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button 
          onClick={() => navigate('/dashboard/pricing')}
          className={`bg-gradient-to-r ${PLAN_COLORS[requiredPlan || 'basic']} hover:opacity-90`}
        >
          {PLAN_ICONS[requiredPlan || 'basic']}
          <span className="ml-2">Fazer Upgrade</span>
        </Button>
        {plan && (
          <p className="text-xs text-muted-foreground mt-3">
            Seu plano atual: <span className="font-medium">{PLANS[plan]?.name || 'Gratuito'}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Higher-order component for protecting entire pages
export const withPremiumFeature = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string
) => {
  return function PremiumProtectedComponent(props: P) {
    return (
      <PremiumFeatureGate feature={feature}>
        <WrappedComponent {...props} />
      </PremiumFeatureGate>
    );
  };
};
