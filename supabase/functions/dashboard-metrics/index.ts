import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkPermissions } from "../_shared/permissions.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = (level: string, message: string, data?: Record<string, unknown>) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    function: 'dashboard-metrics',
    message,
    ...(data && { data }),
  }));
};

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

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('INFO', `[${requestId}] Dashboard metrics request received`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log('WARN', `[${requestId}] Missing authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      log('ERROR', `[${requestId}] User authentication failed`, { error: userError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('INFO', `[${requestId}] User authenticated`, { userId: user.id });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { workspace_id, profile_id, is_admin } = body;

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'workspace_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permissões
    const permissionCheck = await checkPermissions(supabaseAdmin, user.id, workspace_id, 'seller');
    if (!permissionCheck.allowed) {
      log('WARN', `[${requestId}] Permission denied`, { userId: user.id, workspaceId: workspace_id });
      return new Response(
        JSON.stringify({ success: false, error: permissionCheck.error }),
        { status: permissionCheck.status || 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Build leads query - filter by assigned_to for vendedores
    let leadsQuery = supabaseAdmin
      .from('leads')
      .select('id, status, temperature, source, created_at, updated_at, response_time_avg')
      .eq('workspace_id', workspace_id);
    
    // Vendedor sees only their assigned leads
    if (!is_admin && profile_id) {
      leadsQuery = leadsQuery.eq('assigned_to', profile_id);
    }

    const { data: allLeads, error: leadsError } = await leadsQuery;
    if (leadsError) {
      log('ERROR', `[${requestId}] Error fetching leads`, { error: leadsError.message });
      throw leadsError;
    }

    const leads = allLeads || [];
    
    // Calculate metrics
    const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'converted').length;
    const hotLeads = leads.filter(l => l.temperature === 'hot').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    // Leads created today
    const newLeadsToday = leads.filter(l => new Date(l.created_at) >= today).length;

    // Conversations today - filter by assigned_to for vendedores
    let conversationsQuery = supabaseAdmin
      .from('conversations')
      .select('id, created_at', { count: 'exact', head: false })
      .eq('workspace_id', workspace_id)
      .gte('created_at', todayISO);
    
    if (!is_admin && profile_id) {
      conversationsQuery = conversationsQuery.eq('assigned_to', profile_id);
    }

    const { data: conversationsTodayData, count: conversationsToday } = await conversationsQuery;

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

    let yesterdayConversationsQuery = supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', yesterdayEnd.toISOString());
    
    if (!is_admin && profile_id) {
      yesterdayConversationsQuery = yesterdayConversationsQuery.eq('assigned_to', profile_id);
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

    const metrics: DashboardMetrics = {
      conversionRate,
      activeLeads,
      newLeadsToday,
      conversationsToday: conversationsToday || 0,
      conversationsChange,
      avgResponseTime: avgResponseTime || 0,
      hotLeads,
      salesToday: convertedToday,
      salesGoalPercent,
    };

    log('INFO', `[${requestId}] Metrics calculated successfully`, {
      workspaceId: workspace_id,
      activeLeads,
      hotLeads,
      conversionRate,
    });

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        conversionData: last7Days,
        sourceData: sources,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    log('ERROR', `[${requestId}] Unhandled error`, { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


