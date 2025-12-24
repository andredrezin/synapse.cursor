import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import ConversionChart from "@/components/dashboard/ConversionChart";
import LeadsTable from "@/components/dashboard/LeadsTable";
import TeamPerformance from "@/components/dashboard/TeamPerformance";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import SourcesChart from "@/components/dashboard/SourcesChart";
import AIInsights from "@/components/dashboard/AIInsights";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { usePermissions } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Clock, 
  Target,
  DollarSign
} from "lucide-react";

const Dashboard = () => {
  const { metrics, isLoading } = useDashboardMetrics();
  const { isAdmin, currentRole } = usePermissions();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isAdmin ? t('dashboard.title') : t('dashboard.myDashboard')}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? t('dashboard.overview') 
            : `${t('dashboard.yourSalesData')} • ${currentRole}`
          }
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title={t('dashboard.conversionRate')}
          value={`${metrics.conversionRate}%`}
          change={{ value: `+12% ${t('dashboard.vsWeek')}`, trend: 'up' }}
          icon={TrendingUp}
        />
        <MetricCard
          title={isAdmin ? t('dashboard.activeLeads') : t('dashboard.myLeads')}
          value={metrics.activeLeads.toString()}
          change={{ value: `+${metrics.newLeadsToday} ${t('common.today').toLowerCase()}`, trend: 'up' }}
          icon={Users}
          iconColor="text-chart-blue"
          iconBg="bg-chart-blue/10"
        />
        <MetricCard
          title={isAdmin ? t('dashboard.conversationsToday') : t('dashboard.myConversations')}
          value={metrics.conversationsToday.toString()}
          change={{ value: `+${metrics.conversationsChange}% ${t('dashboard.vsYesterday')}`, trend: 'up' }}
          icon={MessageCircle}
          iconColor="text-chart-purple"
          iconBg="bg-chart-purple/10"
        />
        <MetricCard
          title={t('dashboard.responseTime')}
          value={`${metrics.avgResponseTime}min`}
          change={{ value: `-45s ${t('dashboard.vsMeta')}`, trend: 'up' }}
          icon={Clock}
          iconColor="text-chart-orange"
          iconBg="bg-chart-orange/10"
        />
        <MetricCard
          title={t('dashboard.hotLeads')}
          value={metrics.hotLeads.toString()}
          subtitle={t('dashboard.readyToClose')}
          icon={Target}
        />
        <MetricCard
          title={isAdmin ? t('dashboard.salesToday') : t('dashboard.mySales')}
          value={metrics.salesToday.toString()}
          change={{ value: `${metrics.salesGoalPercent}% ${t('dashboard.ofGoal')}`, trend: 'up' }}
          icon={DollarSign}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Charts - Takes 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          <ConversionChart />
          <LeadsTable />
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          <AlertsPanel />
          <AIInsights />
        </div>
      </div>

      {/* Bottom Row - Only show team performance for admins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isAdmin && <TeamPerformance />}
        <SourcesChart />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
