import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionPlan = 'basic' | 'professional' | 'premium' | null;

interface SubscriptionState {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
  planName: string | null;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

// Plan configuration matching the edge function
export const PLANS = {
  basic: {
    product_id: "prod_Tf0tjelJXAdXQq",
    price_id: "price_1ShgrgEK4I7ETzntQGmLIOwj",
    name: "Básico",
    price: 29700, // R$297 in cents
    features: ['leads', 'conversations', 'reports'],
  },
  professional: {
    product_id: "prod_Tf0t19oIyWqfYw",
    price_id: "price_1ShgruEK4I7ETzntNYvbXYnN",
    name: "Profissional",
    price: 49700, // R$497 in cents
    features: ['leads', 'conversations', 'reports', 'ai_insights', 'knowledge_base'],
  },
  premium: {
    product_id: "prod_Tf0tDmMTZeQN1O",
    price_id: "price_1Shgs6EK4I7ETzntLmyS3J71",
    name: "Premium",
    price: 89990, // R$899.90 in cents
    features: ['leads', 'conversations', 'reports', 'ai_insights', 'knowledge_base', 'ai_chatbot', 'audio_transcription', 'image_analysis'],
  },
} as const;

// Helper to get limit based on plan
export const AI_LIMITS = {
  basic: 50,
  professional: 500,
  premium: Infinity,
} as const;

// Feature to minimum plan mapping
export const FEATURE_REQUIREMENTS: Record<string, SubscriptionPlan> = {
  // Basic features (all plans)
  leads: 'basic',
  conversations: 'basic',
  reports: 'basic',

  // Professional features
  ai_insights: 'professional',
  knowledge_base: 'professional',

  // Premium features
  ai_chatbot: 'premium',
  audio_transcription: 'premium',
  image_analysis: 'premium',
};

const PLAN_HIERARCHY: SubscriptionPlan[] = [null, 'basic', 'professional', 'premium'];

export const hasAccessToFeature = (userPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean => {
  const userPlanIndex = PLAN_HIERARCHY.indexOf(userPlan);
  const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userPlanIndex >= requiredPlanIndex;
};

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    plan: null,
    planName: null,
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Developer Bypass Check (Forced for Dev)
      const devKey = 'keySynapse-14'; // Forced enabled
      if (true) { // Always true
        console.log('🔓 Developer Access Unlocked');
        setState({
          isSubscribed: true,
          plan: 'premium',
          planName: 'Premium (Dev)',
          productId: 'dev_override',
          subscriptionEnd: new Date(Date.now() + 31536000000).toISOString(),
          isLoading: false,
          error: null,
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setState({
          isSubscribed: false,
          plan: null,
          planName: null,
          productId: null,
          subscriptionEnd: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking checking subscription:', error);

        // Developer Bypass for testing
        // Se a chamada falhar (ex: sem função local) ou se tivermos a chave mágica
        const devKey = localStorage.getItem('synapse_dev_key');
        if (devKey === 'keySynapse-14') {
          console.log('🔓 Developer Access Unlocked');
          setState({
            isSubscribed: true,
            plan: 'premium',
            planName: 'Premium (Dev)',
            productId: 'dev_override',
            subscriptionEnd: new Date(Date.now() + 31536000000).toISOString(),
            isLoading: false,
            error: null,
          });
          return;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
        return;
      }

      setState({
        isSubscribed: data?.subscribed || false,
        plan: data?.plan || null,
        planName: data?.plan_name || null,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error in checkSubscription:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  }, []);

  const canAccessFeature = useCallback((feature: string): boolean => {
    const requiredPlan = FEATURE_REQUIREMENTS[feature];
    if (!requiredPlan) return true; // Feature not restricted
    return hasAccessToFeature(state.plan, requiredPlan);
  }, [state.plan]);

  const getRequiredPlanForFeature = useCallback((feature: string): SubscriptionPlan => {
    return FEATURE_REQUIREMENTS[feature] || null;
  }, []);

  useEffect(() => {
    checkSubscription();

    // Refresh subscription status periodically (every 60 seconds)
    const interval = setInterval(checkSubscription, 60000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  return {
    ...state,
    checkSubscription,
    canAccessFeature,
    getRequiredPlanForFeature,
  };
};
