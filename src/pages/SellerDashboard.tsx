import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Target, 
  Users,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useLeads } from '@/hooks/useLeads';
import ConversionChart from '@/components/dashboard/ConversionChart';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
  const { profile } = useAuth();
  const { metrics, isLoading } = useDashboardMetrics();
  const { leads, isLoading: leadsLoading } = useLeads();
  const navigate = useNavigate();

  // Filter leads assigned to this seller
  const myLeads = leads.filter(lead => lead.assigned_to === profile?.id);
  const hotLeads = myLeads.filter(lead => lead.temperature === 'hot');
  const convertedLeads = myLeads.filter(lead => lead.status === 'converted');
  const inProgressLeads = myLeads.filter(lead => lead.status === 'in_progress');
  const newLeads = myLeads.filter(lead => lead.status === 'new');

  // Calculate seller-specific metrics
  const conversionRate = myLeads.length > 0 
    ? Math.round((convertedLeads.length / myLeads.length) * 100) 
    : 0;

  if (isLoading || leadsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {profile?.full_name?.split(' ')[0] || 'Vendedor'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo do seu desempenho
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Meus Leads</p>
                  <p className="text-3xl font-bold">{myLeads.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newLeads.length} novos
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-chart-orange/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Quentes</p>
                  <p className="text-3xl font-bold text-chart-orange">{hotLeads.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prontos para fechar
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-orange/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-chart-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-chart-green/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-3xl font-bold text-chart-green">{convertedLeads.length}</p>
                  <p className="text-xs text-chart-green mt-1">
                    {conversionRate}% taxa
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-green/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-chart-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-chart-blue/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-3xl font-bold text-chart-blue">{inProgressLeads.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando resposta
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-chart-blue/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-chart-blue" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Goals */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Goals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Conversões</span>
                  <span className="font-medium">{convertedLeads.length}/10</span>
                </div>
                <Progress value={(convertedLeads.length / 10) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Leads Atendidos</span>
                  <span className="font-medium">{myLeads.length}/50</span>
                </div>
                <Progress value={(myLeads.length / 50) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Conversão</span>
                  <span className="font-medium">{conversionRate}%/25%</span>
                </div>
                <Progress value={(conversionRate / 25) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Hot Leads Quick View */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-chart-orange" />
                Leads Quentes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/leads')}>
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              {hotLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum lead quente no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotLeads.slice(0, 4).map((lead) => (
                    <div 
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/leads')}
                    >
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                      <Badge variant="destructive" className="bg-chart-orange/20 text-chart-orange border-0">
                        Quente
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <ConversionChart />

        {/* New Leads Alert */}
        {newLeads.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Você tem {newLeads.length} leads novos!</p>
                    <p className="text-sm text-muted-foreground">
                      Responda rapidamente para aumentar suas chances de conversão
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate('/dashboard/leads')}>
                  Ver Leads
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
