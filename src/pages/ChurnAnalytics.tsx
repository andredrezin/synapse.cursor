import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingDown, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Gift, 
  BarChart3, 
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

interface CancellationFeedback {
  id: string;
  reason: string;
  additional_feedback: string | null;
  plan: string | null;
  accepted_offer: boolean;
  created_at: string;
}

interface ChurnMetrics {
  totalCancellations: number;
  acceptedOffers: number;
  retentionRate: number;
  topReasons: { reason: string; count: number; percentage: number }[];
  monthlyTrend: { month: string; cancellations: number; retained: number }[];
  planDistribution: { plan: string; count: number }[];
}

const REASON_LABELS: Record<string, string> = {
  too_expensive: "Preço alto",
  not_using: "Não uso suficiente",
  missing_features: "Faltam recursos",
  found_alternative: "Alternativa melhor",
  temporary: "Pausa temporária",
  technical_issues: "Problemas técnicos",
  other: "Outro motivo",
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F", "#FFBB28"];

const ChurnAnalytics = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState<CancellationFeedback[]>([]);
  const [metrics, setMetrics] = useState<ChurnMetrics | null>(null);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchFeedbackData();
  }, [profile?.current_workspace_id, dateRange]);

  const fetchFeedbackData = async () => {
    if (!profile?.current_workspace_id) return;
    
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from("cancellation_feedback")
        .select("*")
        .eq("workspace_id", profile.current_workspace_id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFeedbackData(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error("Error fetching feedback data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (data: CancellationFeedback[]) => {
    const totalCancellations = data.length;
    const acceptedOffers = data.filter(f => f.accepted_offer).length;
    const retentionRate = totalCancellations > 0 
      ? Math.round((acceptedOffers / totalCancellations) * 100) 
      : 0;

    // Calculate top reasons
    const reasonCounts: Record<string, number> = {};
    data.forEach(f => {
      reasonCounts[f.reason] = (reasonCounts[f.reason] || 0) + 1;
    });
    
    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason: REASON_LABELS[reason] || reason,
        count,
        percentage: Math.round((count / totalCancellations) * 100) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate monthly trend
    const monthlyData: Record<string, { cancellations: number; retained: number }> = {};
    data.forEach(f => {
      const month = new Date(f.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!monthlyData[month]) {
        monthlyData[month] = { cancellations: 0, retained: 0 };
      }
      if (f.accepted_offer) {
        monthlyData[month].retained++;
      } else {
        monthlyData[month].cancellations++;
      }
    });
    
    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, values]) => ({ month, ...values }))
      .reverse();

    // Calculate plan distribution
    const planCounts: Record<string, number> = {};
    data.forEach(f => {
      const plan = f.plan || "Desconhecido";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });
    
    const planDistribution = Object.entries(planCounts)
      .map(([plan, count]) => ({ plan, count }));

    setMetrics({
      totalCancellations,
      acceptedOffers,
      retentionRate,
      topReasons,
      monthlyTrend,
      planDistribution,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="h-6 w-6 text-destructive" />
              Analytics de Churn
            </h1>
            <p className="text-muted-foreground">
              Analise os motivos de cancelamento e métricas de retenção
            </p>
          </div>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Cancelamentos</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics?.totalCancellations || 0}
                <ArrowDownRight className="h-5 w-5 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ofertas Aceitas</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics?.acceptedOffers || 0}
                <Gift className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Usuários que aceitaram desconto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de Retenção</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {metrics?.retentionRate || 0}%
                <ArrowUpRight className="h-5 w-5 text-chart-green" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Das tentativas de cancelamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Economia Estimada</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                R$ {((metrics?.acceptedOffers || 0) * 297).toLocaleString("pt-BR")}
                <DollarSign className="h-5 w-5 text-chart-green" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em receita retida (estimativa)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="reasons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reasons">
              <PieChart className="h-4 w-4 mr-2" />
              Motivos
            </TabsTrigger>
            <TabsTrigger value="trend">
              <BarChart3 className="h-4 w-4 mr-2" />
              Tendência
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedbacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reasons">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Principais Motivos de Cancelamento</CardTitle>
                  <CardDescription>Distribuição por motivo</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics?.topReasons && metrics.topReasons.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={metrics.topReasons}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ reason, percentage }) => `${reason} (${percentage}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {metrics.topReasons.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Motivos</CardTitle>
                  <CardDescription>Ordenado por frequência</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.topReasons && metrics.topReasons.length > 0 ? (
                      metrics.topReasons.map((reason, index) => (
                        <div key={reason.reason} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{reason.reason}</span>
                              <span className="text-muted-foreground">{reason.count}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${reason.percentage}%`,
                                  backgroundColor: COLORS[index % COLORS.length]
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Nenhum dado disponível
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal</CardTitle>
                <CardDescription>Cancelamentos vs Retenções ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={metrics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cancellations" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Cancelamentos"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="retained" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        name="Retidos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Feedbacks Recentes</CardTitle>
                <CardDescription>Comentários dos usuários ao cancelar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackData.filter(f => f.additional_feedback).length > 0 ? (
                    feedbackData
                      .filter(f => f.additional_feedback)
                      .slice(0, 10)
                      .map((feedback) => (
                        <div 
                          key={feedback.id} 
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={feedback.accepted_offer ? "default" : "destructive"}>
                              {feedback.accepted_offer ? "Retido" : "Cancelou"}
                            </Badge>
                            <Badge variant="outline">
                              {REASON_LABELS[feedback.reason] || feedback.reason}
                            </Badge>
                            {feedback.plan && (
                              <Badge variant="secondary" className="capitalize">
                                {feedback.plan}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(feedback.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            "{feedback.additional_feedback}"
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum feedback com comentários adicional
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ChurnAnalytics;
