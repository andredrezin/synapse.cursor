import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, Bell, Shield, Zap, Save, Loader2, MessageCircle, BarChart3, Webhook, Settings2 } from 'lucide-react';
import { AdvancedConnectionModal } from '@/components/whatsapp/AdvancedConnectionModal';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspace, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    dailyReport: true,
    weeklyReport: false,
  });

  const handleSaveWorkspace = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: t('settings.saved'),
      description: t('settings.savedDesc'),
    });
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace">{t('settings.workspace')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('settings.integrations')}</TabsTrigger>
            <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('settings.workspaceInfo')}
                </CardTitle>
                <CardDescription>
                  {t('settings.workspaceInfoDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">{t('settings.workspaceName')}</Label>
                    <Input
                      id="workspace-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder={t('settings.workspaceName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-id">{t('settings.workspaceId')}</Label>
                    <Input
                      id="workspace-id"
                      value={workspace?.id || ''}
                      disabled
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveWorkspace} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('settings.saveChanges')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('settings.notificationPrefs')}
                </CardTitle>
                <CardDescription>
                  {t('settings.notificationPrefsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.emailAlerts')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.emailAlertsDesc')}</p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.pushNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.pushNotificationsDesc')}</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.dailyReport')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.dailyReportDesc')}</p>
                  </div>
                  <Switch
                    checked={notifications.dailyReport}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, dailyReport: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.weeklyReport')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.weeklyReportDesc')}</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReport: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {t('settings.integrations')}
                </CardTitle>
                <CardDescription>
                  {t('settings.connectTools')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#25D366]/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">{t('settings.quickConnection')}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/dashboard/whatsapp')}>
                    {t('settings.connect')}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Settings2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t('settings.evolutionApi')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.evolutionApiDesc')}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsAdvancedModalOpen(true)}>
                    {t('settings.configure')}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t('settings.googleAnalytics')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.googleAnalyticsDesc')}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: t('settings.comingSoon'),
                      description: `${t('settings.googleAnalytics')} ${t('settings.comingSoonDesc')}`,
                    });
                  }}>
                    {t('settings.comingSoon')}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Webhook className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t('settings.webhooks')}</p>
                      <p className="text-sm text-muted-foreground">{t('settings.webhooksDesc')}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: t('settings.comingSoon'),
                      description: `${t('settings.webhooks')} ${t('settings.comingSoonDesc')}`,
                    });
                  }}>
                    {t('settings.comingSoon')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AdvancedConnectionModal
              isOpen={isAdvancedModalOpen}
              onClose={() => setIsAdvancedModalOpen(false)}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t('settings.securityTitle')}
                </CardTitle>
                <CardDescription>
                  {t('settings.securityDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.twoFactor')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.twoFactorDesc')}</p>
                  </div>
                  <Button variant="outline">{t('settings.activate')}</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.activeSessions')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.activeSessionsDesc')}</p>
                  </div>
                  <Button variant="outline">{t('settings.view')}</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.activityLogs')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.activityLogsDesc')}</p>
                  </div>
                  <Button variant="outline">{t('settings.viewLogs')}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;