import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface DashboardMetrics {
  conversionRate: number;
  activeLeads: number;
  newLeadsToday: number;
  conversationsToday: number;
  conversationsChange: number;
  avgResponseTime: number;
  hotLeads: number;
  salesToday: number;
  salesGoalPercent: number;
}

interface ConversionData {
  date: string;
  conversions: number;
  leads: number;
  ads: number;
  organic: number;
}

interface SourceData {
  source: string;
  count: number;
  percentage: number;
}

export const useDashboardMetrics = () => {
  const { workspace, profile } = useAuth();
  const { isAdmin, profileId } = usePermissions();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    conversionRate: 0,
    activeLeads: 0,
    newLeadsToday: 0,
    conversationsToday: 0,
    conversationsChange: 0,
    avgResponseTime: 0,
    hotLeads: 0,
    salesToday: 0,
    salesGoalPercent: 0,
  });
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Build leads query - filter by assigned_to for vendedores
    let leadsQuery = supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', workspace.id);
    
    // Vendedor sees only their assigned leads
    if (!isAdmin && profileId) {
      leadsQuery = leadsQuery.eq('assigned_to', profileId);
    }

    const { data: allLeads } = await leadsQuery;
    const leads = allLeads || [];
    
    // Calculate metrics
    const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'converted').length;
    const hotLeads = leads.filter(l => l.temperature === 'hot').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    // Leads created today
    const newLeadsToday = leads.filter(l => new Date(l.created_at) >= today).length;

    // Conversations today - filter by assigned_to for vendedores
    let conversationsQuery = supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', todayISO);
    
    if (!isAdmin && profileId) {
      conversationsQuery = conversationsQuery.eq('assigned_to', profileId);
    }

    const { count: conversationsToday } = await conversationsQuery;

    // Source distribution
    const sourceCount: Record<string, number> = {};
    leads.forEach(lead => {
      sourceCount[lead.source] = (sourceCount[lead.source] || 0) + 1;
    });

    const sources = Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count,
      percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0,
    }));

    setSourceData(sources);

    // Generate conversion data for last 7 days
    const last7Days: ConversionData[] = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayLeads = leads.filter(l => {
        const created = new Date(l.created_at);
        return created >= date && created < nextDate;
      });

      const dayConversions = dayLeads.filter(l => l.status === 'converted').length;
      const adsLeads = dayLeads.filter(l => l.source === 'ads').length;
      const organicLeads = dayLeads.filter(l => l.source === 'organic').length;

      last7Days.push({
        date: dayNames[date.getDay()],
        leads: dayLeads.length,
        conversions: dayConversions,
        ads: adsLeads,
        organic: organicLeads,
      });
    }

    setConversionData(last7Days);

    // Calculate average response time from leads
    const leadsWithResponseTime = leads.filter(l => l.response_time_avg && l.response_time_avg > 0);
    const avgResponseTime = leadsWithResponseTime.length > 0 
      ? Math.round(leadsWithResponseTime.reduce((acc, l) => acc + (l.response_time_avg || 0), 0) / leadsWithResponseTime.length / 60) 
      : 0;

    // Calculate conversations yesterday for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    let yesterdayConversationsQuery = supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', yesterdayEnd.toISOString());
    
    if (!isAdmin && profileId) {
      yesterdayConversationsQuery = yesterdayConversationsQuery.eq('assigned_to', profileId);
    }

    const { count: conversationsYesterday } = await yesterdayConversationsQuery;
    
    // Calculate percentage change
    const yesterdayCount = conversationsYesterday || 0;
    const todayCount = conversationsToday || 0;
    const conversationsChange = yesterdayCount > 0 
      ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
      : todayCount > 0 ? 100 : 0;

    // Calculate sales goal percentage (considering daily goal of 5 conversions)
    const dailySalesGoal = 5;
    const convertedToday = leads.filter(l => 
      l.status === 'converted' && new Date(l.updated_at) >= today
    ).length;
    const salesGoalPercent = Math.min(100, Math.round((convertedToday / dailySalesGoal) * 100));

    setMetrics({
      conversionRate,
      activeLeads,
      newLeadsToday,
      conversationsToday: conversationsToday || 0,
      conversationsChange,
      avgResponseTime: avgResponseTime || 0,
      hotLeads,
      salesToday: convertedToday,
      salesGoalPercent,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    if (!workspace?.id) return;
    fetchMetrics();

    // Refresh every minute
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [workspace?.id, isAdmin, profileId]);

  return {
    metrics,
    conversionData,
    sourceData,
    isLoading,
    fetchMetrics,
  };
};
