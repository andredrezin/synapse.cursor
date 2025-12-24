import React from 'react';
import { useSubscription, PLANS, SubscriptionPlan } from '@/hooks/useSubscription';
import { Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UpgradeBannerProps {
  targetPlan?: SubscriptionPlan;
  message?: string;
  className?: string;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  targetPlan = 'premium',
  message,
  className = '',
}) => {
  const { plan, isSubscribed } = useSubscription();
  const navigate = useNavigate();

  // Don't show if user already has the target plan or higher
  if (plan === targetPlan || (plan === 'premium')) {
    return null;
  }

  const planInfo = targetPlan ? PLANS[targetPlan] : null;
  const defaultMessage = `Desbloqueie todas as funcionalidades com o plano ${planInfo?.name}`;

  return (
    <div className={`bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{message || defaultMessage}</p>
          <p className="text-sm text-muted-foreground">
            {!isSubscribed 
              ? 'Comece sua jornada premium hoje' 
              : `Atualmente no plano ${PLANS[plan!]?.name}`
            }
          </p>
        </div>
      </div>
      <Button 
        variant="default" 
        onClick={() => navigate('/dashboard/pricing')}
        className="shrink-0"
      >
        Ver Planos
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};
