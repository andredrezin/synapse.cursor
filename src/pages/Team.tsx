import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Plus, Mail, MoreVertical, TrendingUp, Clock, UserX } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { usePermissions } from '@/hooks/usePermissions';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Team = () => {
  const { members, invites, isLoading, canManage, inviteMember, removeMember, cancelInvite } = useTeamMembers();
  const { isAdmin } = usePermissions();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('seller');
  const [isInviting, setIsInviting] = useState(false);
  const { t } = useTranslation();

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    await inviteMember(inviteEmail, inviteRole);
    setIsInviting(false);
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const totalConversions = members.reduce((sum, m) => sum + m.stats.conversions, 0);
  const avgResponseTime = members.length > 0 
    ? (members.reduce((sum, m) => sum + m.stats.avgResponseTime, 0) / members.length).toFixed(1)
    : '0';

  const getRoleDisplayName = (role: string) => {
    const roleKey = role as 'owner' | 'admin' | 'seller' | 'member';
    return t(`team.roles.${roleKey}`) || role;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('team.title')}</h1>
            <p className="text-muted-foreground">{t('team.subtitle')}</p>
          </div>
          {canManage && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('team.inviteMember')}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('team.totalMembers')}</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <span className="text-2xl">👥</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('team.totalConversions')}</p>
                  <p className="text-2xl font-bold">{totalConversions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-chart-green/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('team.avgTime')}</p>
                  <p className="text-2xl font-bold">{avgResponseTime}min</p>
                </div>
                <Clock className="w-8 h-8 text-chart-orange/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('team.pendingInvites')}</p>
                  <p className="text-2xl font-bold">{invites.length}</p>
                </div>
                <Mail className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('team.pendingInvites')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">{getRoleDisplayName(invite.role)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => cancelInvite(invite.id)}>
                      <UserX className="w-4 h-4 mr-1" /> {t('team.cancelInvite')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader><CardTitle>{t('team.teamMembers')}</CardTitle></CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('team.noMembers')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member.profile?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.profile?.full_name || 'Sem nome'}</span>
                          <Badge variant={member.role === 'owner' || member.role === 'admin' ? 'default' : 'secondary'}>
                            {getRoleDisplayName(member.role)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.profile?.company}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-chart-green">{member.stats.conversions}</p>
                        <p className="text-xs text-muted-foreground">{t('team.conversions')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{member.stats.avgResponseTime.toFixed(1)}min</p>
                        <p className="text-xs text-muted-foreground">{t('team.respTime')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{member.stats.conversations}</p>
                        <p className="text-xs text-muted-foreground">{t('team.conversations')}</p>
                      </div>
                    </div>
                    {canManage && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => removeMember(member.id)} className="text-destructive">
                            {t('team.remove')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('team.inviteDialog.title')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder={t('team.inviteDialog.emailPlaceholder')} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="seller">{t('team.roles.seller')}</SelectItem>
                <SelectItem value="member">{t('team.roles.member')}</SelectItem>
                <SelectItem value="admin">{t('team.roles.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
              {isInviting ? t('team.inviteDialog.sending') : t('team.inviteDialog.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Team;
