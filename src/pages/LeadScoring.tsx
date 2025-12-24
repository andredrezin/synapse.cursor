import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Users, Flame, ThermometerSun, Snowflake, Settings2 } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';

const LeadScoring = () => {
  const { leads, isLoading } = useLeads();

  const hotLeads = leads.filter(l => l.temperature === 'hot').length;
  const warmLeads = leads.filter(l => l.temperature === 'warm').length;
  const coldLeads = leads.filter(l => l.temperature === 'cold').length;
  const totalLeads = leads.length;

  const avgScore = totalLeads > 0 
    ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / totalLeads) 
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'warm': return <ThermometerSun className="w-4 h-4 text-yellow-500" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Scoring</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie a pontuação dos seus leads
            </p>
          </div>
          <Button variant="outline">
            <Settings2 className="w-4 h-4 mr-2" />
            Configurar Regras
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
              <Progress value={avgScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads Quentes</CardTitle>
              <Flame className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotLeads}</div>
              <p className="text-xs text-muted-foreground">
                {totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads Mornos</CardTitle>
              <ThermometerSun className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warmLeads}</div>
              <p className="text-xs text-muted-foreground">
                {totalLeads > 0 ? Math.round((warmLeads / totalLeads) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads Frios</CardTitle>
              <Snowflake className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coldLeads}</div>
              <p className="text-xs text-muted-foreground">
                {totalLeads > 0 ? Math.round((coldLeads / totalLeads) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Leads</CardTitle>
            <CardDescription>Leads ordenados por pontuação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((lead, index) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.email || lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getTemperatureIcon(lead.temperature)}
                        <Badge variant={lead.temperature === 'hot' ? 'destructive' : 'secondary'}>
                          {lead.temperature === 'hot' ? 'Quente' : lead.temperature === 'warm' ? 'Morno' : 'Frio'}
                        </Badge>
                      </div>
                      <div className={`text-xl font-bold ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </div>
                    </div>
                  </div>
                ))}
              {leads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum lead encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LeadScoring;
