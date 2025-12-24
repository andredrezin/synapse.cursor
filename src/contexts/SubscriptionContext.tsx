import React, { createContext, useContext } from 'react';
import { useSubscription, SubscriptionPlan, PLANS, FEATURE_REQUIREMENTS } from '@/hooks/useSubscription';

interface SubscriptionContextType {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
  planName: string | null;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
  checkSubscription: () => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
  getRequiredPlanForFeature: (feature: string) => SubscriptionPlan;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscription = useSubscription();

  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Re-export for convenience
export { PLANS, FEATURE_REQUIREMENTS, type SubscriptionPlan };
