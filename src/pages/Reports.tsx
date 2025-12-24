import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, FileText, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Reports = () => {
  const { metrics, isLoading } = useDashboardMetrics();
  const [period, setPeriod] = useState('7d');
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const reportTypes = [
    {
      title: t('reports.salesReport'),
      description: t('reports.performance'),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: t('reports.leadsReport'),
      description: t('leads.title'),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: t('reports.teamReport'),
      description: t('team.title'),
      icon: DollarSign,
      color: 'text-yellow-500',
    },
    {
      title: t('reports.teamReport'),
      description: t('reports.performance'),
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: t('sources.title'),
      description: t('sources.byChannel'),
      icon: BarChart3,
      color: 'text-orange-500',
    },
    {
      title: t('reports.title'),
      description: t('reports.subtitle'),
      icon: FileText,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('reports.title')}</h1>
            <p className="text-muted-foreground">
              {t('reports.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('reports.weekly')}</SelectItem>
                <SelectItem value="30d">{t('reports.monthly')}</SelectItem>
                <SelectItem value="90d">90 {t('reports.daily')}</SelectItem>
                <SelectItem value="12m">12 {t('reports.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.conversionRate')}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeLeads')}</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.hotLeads')}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.hotLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.salesToday')}</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.salesToday}</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="grid gap-4 md:grid-cols-3">
          {reportTypes.map((report, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${report.color}`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    {t('reports.exportPDF')}
                  </Button>
                  <Button size="sm" className="flex-1">
                    {t('common.details')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
