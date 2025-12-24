import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  max_leads: number;
  max_whatsapp_connections: number;
  max_team_members: number;
  max_conversations_per_month: number;
  has_ai_features: boolean;
  has_advanced_reports: boolean;
  has_api_access: boolean;
  price_monthly: number;
  price_yearly: number;
}

interface WorkspaceSubscription {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}

interface WorkspaceUsage {
  leads_count: number;
  conversations_count: number;
  messages_count: number;
  ai_requests_count: number;
}

export const useSubscriptionPlan = () => {
  const { workspace } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);
  const [usage, setUsage] = useState<WorkspaceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly');
    
    if (data) {
      setPlans(data as SubscriptionPlan[]);
    }
  };

  const fetchSubscription = async () => {
    if (!workspace?.id) return;

    const { data: subData } = await supabase
      .from('workspace_subscriptions')
      .select('*')
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (subData) {
      // Fetch the plan details
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subData.plan_id)
        .single();

      setSubscription({
        ...subData,
        plan: planData as SubscriptionPlan,
      } as WorkspaceSubscription);
    } else {
      // Default to free plan
      const freePlan = plans.find(p => p.slug === 'free');
      if (freePlan) {
        setSubscription({
          id: '',
          workspace_id: workspace.id,
          plan_id: freePlan.id,
          status: 'active',
          current_period_end: null,
          cancel_at_period_end: false,
          plan: freePlan,
        });
      }
    }
  };

  const fetchUsage = async () => {
    if (!workspace?.id) return;

    const monthYear = new Date().toISOString().slice(0, 7);
    
    const { data } = await supabase
      .from('workspace_usage')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('month_year', monthYear)
      .maybeSingle();

    if (data) {
      setUsage(data as WorkspaceUsage);
    } else {
      // Calculate current usage
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      setUsage({
        leads_count: leadsCount || 0,
        conversations_count: conversationsCount || 0,
        messages_count: 0,
        ai_requests_count: 0,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchPlans();
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (workspace?.id && plans.length > 0) {
      fetchSubscription();
      fetchUsage();
    }
  }, [workspace?.id, plans]);

  const currentPlan = subscription?.plan || plans.find(p => p.slug === 'free');

  const getLimitPercentage = (type: 'leads' | 'connections' | 'members' | 'conversations') => {
    if (!currentPlan || !usage) return 0;
    
    switch (type) {
      case 'leads':
        return (usage.leads_count / currentPlan.max_leads) * 100;
      case 'conversations':
        return (usage.conversations_count / currentPlan.max_conversations_per_month) * 100;
      default:
        return 0;
    }
  };

  const isLimitReached = (type: 'leads' | 'connections' | 'members' | 'conversations') => {
    return getLimitPercentage(type) >= 100;
  };

  const isNearLimit = (type: 'leads' | 'connections' | 'members' | 'conversations') => {
    return getLimitPercentage(type) >= 80;
  };

  return {
    plans,
    subscription,
    currentPlan,
    usage,
    isLoading,
    getLimitPercentage,
    isLimitReached,
    isNearLimit,
    refreshSubscription: fetchSubscription,
    refreshUsage: fetchUsage,
  };
};
