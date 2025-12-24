import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Thermometer,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  CalendarDays
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricAlertsPanel } from "@/components/analytics/MetricAlertsPanel";
import { PeriodComparison } from "@/components/analytics/PeriodComparison";
import { useMetricAlerts } from "@/hooks/useMetricAlerts";
import { exportAnalyticsPDF } from "@/utils/exportPDF";
import { toast } from "sonner";

const COLORS = {
  primary: 'hsl(var(--primary))',
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
};

const AIAnalytics = () => {
  const { workspace } = useAuth();

  // Fetch leads data for conversions
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['ai-analytics-leads', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, status, temperature, sentiment, score, created_at')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Fetch conversations data
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['ai-analytics-conversations', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, status, sentiment, messages_count, created_at')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Fetch messages with sentiment
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['ai-analytics-messages', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_type, sentiment, created_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Fetch AI training status
  const { data: trainingStatus } = useQuery({
    queryKey: ['ai-training-status', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      
      const { data, error } = await supabase
        .from('ai_training_status')
        .select('*')
        .eq('workspace_id', workspace.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  // Fetch AI learned content
  const { data: learnedContent } = useQuery({
    queryKey: ['ai-learned-content', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return null;
      
      const { data, error } = await supabase
        .from('ai_learned_content')
        .select('id, content_type, is_approved, created_at')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!workspace?.id,
  });

  const isLoading = leadsLoading || conversationsLoading || messagesLoading;

  // Calculate metrics
  const metrics = useMemo(() => ({
    totalLeads: leadsData?.length || 0,
    convertedLeads: leadsData?.filter(l => l.status === 'converted').length || 0,
    hotLeads: leadsData?.filter(l => l.temperature === 'hot').length || 0,
    warmLeads: leadsData?.filter(l => l.temperature === 'warm').length || 0,
    coldLeads: leadsData?.filter(l => l.temperature === 'cold').length || 0,
    totalConversations: conversationsData?.length || 0,
    totalMessages: messagesData?.length || 0,
    aiMessages: messagesData?.filter(m => m.sender_type === 'ai').length || 0,
    messagesAnalyzed: trainingStatus?.messages_analyzed || 0,
    faqsDetected: trainingStatus?.faqs_detected || 0,
    patternsLearned: trainingStatus?.seller_patterns_learned || 0,
    learnedItems: learnedContent?.length || 0,
    approvedItems: learnedContent?.filter(c => c.is_approved).length || 0,
  }), [leadsData, conversationsData, messagesData, trainingStatus, learnedContent]);

  const conversionRate = metrics.totalLeads > 0 
    ? (metrics.convertedLeads / metrics.totalLeads) * 100 
    : 0;

  // Sentiment counts
  const sentimentCounts = useMemo(() => ({
    positive: messagesData?.filter(m => m.sentiment === 'positive').length || 0,
    neutral: messagesData?.filter(m => m.sentiment === 'neutral').length || 0,
    negative: messagesData?.filter(m => m.sentiment === 'negative').length || 0,
  }), [messagesData]);

  // Calculate period comparison (current week vs previous week)
  const periodComparison = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfDay(subDays(now, 7));
    const previousWeekStart = startOfDay(subWeeks(currentWeekStart, 1));
    const previousWeekEnd = endOfDay(subDays(currentWeekStart, 1));

    const currentWeekLeads = leadsData?.filter(l => 
      new Date(l.created_at) >= currentWeekStart
    ).length || 0;

    const previousWeekLeads = leadsData?.filter(l => {
      const created = new Date(l.created_at);
      return created >= previousWeekStart && created <= previousWeekEnd;
    }).length || 0;

    const currentWeekConversions = leadsData?.filter(l => 
      new Date(l.created_at) >= currentWeekStart && l.status === 'converted'
    ).length || 0;

    const previousWeekConversions = leadsData?.filter(l => {
      const created = new Date(l.created_at);
      return created >= previousWeekStart && created <= previousWeekEnd && l.status === 'converted';
    }).length || 0;

    const currentWeekHotLeads = leadsData?.filter(l => 
      new Date(l.created_at) >= currentWeekStart && l.temperature === 'hot'
    ).length || 0;

    const previousWeekHotLeads = leadsData?.filter(l => {
      const created = new Date(l.created_at);
      return created >= previousWeekStart && created <= previousWeekEnd && l.temperature === 'hot';
    }).length || 0;

    const currentWeekAI = messagesData?.filter(m => 
      new Date(m.created_at) >= currentWeekStart && m.sender_type === 'ai'
    ).length || 0;

    const previousWeekAI = messagesData?.filter(m => {
      const created = new Date(m.created_at);
      return created >= previousWeekStart && created <= previousWeekEnd && m.sender_type === 'ai';
    }).length || 0;

    return {
      leads: { current: currentWeekLeads, previous: previousWeekLeads },
      conversions: { current: currentWeekConversions, previous: previousWeekConversions },
      hotLeads: { current: currentWeekHotLeads, previous: previousWeekHotLeads },
      aiResponses: { current: currentWeekAI, previous: previousWeekAI },
    };
  }, [leadsData, messagesData]);

  // Metrics for alerts
  const alertMetrics = useMemo(() => ({
    conversionRate,
    hotLeadsPercent: metrics.totalLeads > 0 ? (metrics.hotLeads / metrics.totalLeads) * 100 : 0,
    negativeSentimentPercent: metrics.totalMessages > 0 ? (sentimentCounts.negative / metrics.totalMessages) * 100 : 0,
    aiResponseRate: metrics.totalMessages > 0 ? (metrics.aiMessages / metrics.totalMessages) * 100 : 0,
  }), [conversionRate, metrics, sentimentCounts]);

  const { alerts, thresholds, updateThresholds, dismissAlert } = useMetricAlerts(alertMetrics);

  // Temperature distribution chart data
  const temperatureData = [
    { name: 'Quentes', value: metrics.hotLeads, color: COLORS.hot },
    { name: 'Mornos', value: metrics.warmLeads, color: COLORS.warm },
    { name: 'Frios', value: metrics.coldLeads, color: COLORS.cold },
  ];

  const sentimentData = [
    { name: 'Positivo', value: sentimentCounts.positive, color: COLORS.positive },
    { name: 'Neutro', value: sentimentCounts.neutral, color: COLORS.neutral },
    { name: 'Negativo', value: sentimentCounts.negative, color: COLORS.negative },
  ];

  // Lead status distribution
  const statusCounts = {
    new: leadsData?.filter(l => l.status === 'new').length || 0,
    in_progress: leadsData?.filter(l => l.status === 'in_progress').length || 0,
    converted: leadsData?.filter(l => l.status === 'converted').length || 0,
    lost: leadsData?.filter(l => l.status === 'lost').length || 0,
  };

  const statusData = [
    { name: 'Novos', value: statusCounts.new },
    { name: 'Em Progresso', value: statusCounts.in_progress },
    { name: 'Convertidos', value: statusCounts.converted },
    { name: 'Perdidos', value: statusCounts.lost },
  ];

  // Daily leads trend (last 14 days)
  const dailyLeadsTrend = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const leads = leadsData?.filter(l => {
      const created = new Date(l.created_at);
      return created >= dayStart && created <= dayEnd;
    }).length || 0;

    const conversations = conversationsData?.filter(c => {
      const created = new Date(c.created_at);
      return created >= dayStart && created <= dayEnd;
    }).length || 0;

    return {
      date: format(date, 'dd/MM', { locale: ptBR }),
      leads,
      conversations,
    };
  }), [leadsData, conversationsData]);

  // AI Training progress data
  const trainingProgress = [
    { name: 'Mensagens', value: Math.min(100, (metrics.messagesAnalyzed / 500) * 100) },
    { name: 'FAQs', value: Math.min(100, (metrics.faqsDetected / 50) * 100) },
    { name: 'Padrões', value: Math.min(100, (metrics.patternsLearned / 30) * 100) },
    { name: 'Aprovados', value: metrics.learnedItems > 0 ? (metrics.approvedItems / metrics.learnedItems) * 100 : 0 },
  ];

  // Export PDF handler
  const handleExportPDF = () => {
    try {
      exportAnalyticsPDF(
        {
          conversionRate,
          totalLeads: metrics.totalLeads,
          convertedLeads: metrics.convertedLeads,
          hotLeads: metrics.hotLeads,
          warmLeads: metrics.warmLeads,
          coldLeads: metrics.coldLeads,
          totalMessages: metrics.totalMessages,
          aiMessages: metrics.aiMessages,
          positiveMessages: sentimentCounts.positive,
          neutralMessages: sentimentCounts.neutral,
          negativeMessages: sentimentCounts.negative,
          messagesAnalyzed: metrics.messagesAnalyzed,
          faqsDetected: metrics.faqsDetected,
          patternsLearned: metrics.patternsLearned,
        },
        periodComparison,
        workspace?.name || 'LeadFlux'
      );
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics de IA</h1>
            <p className="text-muted-foreground">
              Performance da IA, análise de sentimento e conversões
            </p>
          </div>
          <Button onClick={handleExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Alerts Panel */}
        <MetricAlertsPanel
          alerts={alerts}
          thresholds={thresholds}
          onUpdateThresholds={updateThresholds}
          onDismiss={dismissAlert}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.convertedLeads} de {metrics.totalLeads} leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Respostas da IA</p>
                  <p className="text-3xl font-bold text-foreground">{metrics.aiMessages}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalMessages > 0 
                  ? ((metrics.aiMessages / metrics.totalMessages) * 100).toFixed(1) 
                  : 0}% do total de mensagens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Quentes</p>
                  <p className="text-3xl font-bold text-foreground">{metrics.hotLeads}</p>
                </div>
                <div className="p-3 rounded-full bg-red-500/20">
                  <Thermometer className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.totalLeads > 0 
                  ? ((metrics.hotLeads / metrics.totalLeads) * 100).toFixed(1) 
                  : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Padrões Aprendidos</p>
                  <p className="text-3xl font-bold text-foreground">{metrics.patternsLearned}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/20">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.faqsDetected} FAQs detectadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Period Comparison */}
        <PeriodComparison
          title="Comparação Semanal"
          description="Semana atual vs semana anterior"
          data={[
            { label: 'Leads Capturados', current: periodComparison.leads.current, previous: periodComparison.leads.previous },
            { label: 'Conversões', current: periodComparison.conversions.current, previous: periodComparison.conversions.previous },
            { label: 'Leads Quentes', current: periodComparison.hotLeads.current, previous: periodComparison.hotLeads.previous },
            { label: 'Respostas IA', current: periodComparison.aiResponses.current, previous: periodComparison.aiResponses.previous },
          ]}
        />

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
            <TabsTrigger value="ai-training">Treinamento IA</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Trend */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Tendência Diária</CardTitle>
                  </div>
                  <CardDescription>Leads e conversas nos últimos 14 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyLeadsTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="leads" 
                          name="Leads"
                          stroke={COLORS.primary} 
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="conversations" 
                          name="Conversas"
                          stroke={COLORS.positive} 
                          fill={COLORS.positive}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Temperature Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Temperatura de Leads</CardTitle>
                  <CardDescription>Distribuição por nível de interesse</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={temperatureData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {temperatureData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status dos Leads</CardTitle>
                  <CardDescription>Funil de conversão</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sentiment Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise de Sentimento</CardTitle>
                  <CardDescription>Distribuição de sentimentos nas mensagens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas de Sentimento</CardTitle>
                  <CardDescription>Detalhamento por tipo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Positivo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{sentimentCounts.positive}</p>
                      <p className="text-xs text-muted-foreground">
                        {metrics.totalMessages > 0 
                          ? ((sentimentCounts.positive / metrics.totalMessages) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Neutro</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{sentimentCounts.neutral}</p>
                      <p className="text-xs text-muted-foreground">
                        {metrics.totalMessages > 0 
                          ? ((sentimentCounts.neutral / metrics.totalMessages) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium">Negativo</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{sentimentCounts.negative}</p>
                      <p className="text-xs text-muted-foreground">
                        {metrics.totalMessages > 0 
                          ? ((sentimentCounts.negative / metrics.totalMessages) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-training" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Training Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progresso do Treinamento</CardTitle>
                  <CardDescription>Status de aprendizado da IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trainingProgress}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip 
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Training Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes do Treinamento</CardTitle>
                  <CardDescription>Métricas de aprendizado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-foreground">{metrics.messagesAnalyzed}</p>
                      <p className="text-xs text-muted-foreground mt-1">Mensagens Analisadas</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-foreground">{metrics.faqsDetected}</p>
                      <p className="text-xs text-muted-foreground mt-1">FAQs Detectadas</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-foreground">{metrics.patternsLearned}</p>
                      <p className="text-xs text-muted-foreground mt-1">Padrões Aprendidos</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-foreground">{metrics.approvedItems}</p>
                      <p className="text-xs text-muted-foreground mt-1">Conteúdos Aprovados</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Status do Treinamento</span>
                      <span className={`text-sm font-medium ${
                        trainingStatus?.status === 'active' ? 'text-green-500' :
                        trainingStatus?.status === 'learning' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}>
                        {trainingStatus?.status === 'active' ? 'Ativo' :
                         trainingStatus?.status === 'learning' ? 'Aprendendo' :
                         trainingStatus?.status === 'paused' ? 'Pausado' :
                         'Não iniciado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {trainingStatus?.started_at 
                          ? `Iniciado em ${format(new Date(trainingStatus.started_at), "dd/MM/yyyy", { locale: ptBR })}`
                          : 'Aguardando início'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;
