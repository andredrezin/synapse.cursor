import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Search, 
  MessageCircle, 
  MoreHorizontal,
  ExternalLink,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const Leads = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const { leads, metrics, isLoading, deleteLead, pagination } = useLeads({ page: currentPage, pageSize });
  const { isAdmin, canDeleteLeads, canExportData } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const getTemperatureBadge = (temperature: string) => {
    switch (temperature) {
      case 'hot':
        return <Badge className="bg-primary/20 text-primary border-none">{t('leads.temperature.hot')}</Badge>;
      case 'warm':
        return <Badge className="bg-chart-orange/20 text-chart-orange border-none">{t('leads.temperature.warm')}</Badge>;
      default:
        return <Badge variant="outline">{t('leads.temperature.cold')}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline">{t('leads.status.new')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-chart-blue/20 text-chart-blue border-none">{t('leads.status.inProgress')}</Badge>;
      case 'converted':
        return <Badge className="bg-chart-green/20 text-chart-green border-none">{t('leads.status.converted')}</Badge>;
      case 'lost':
        return <Badge className="bg-chart-red/20 text-chart-red border-none">{t('leads.status.lost')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary bg-primary/20';
    if (score >= 50) return 'text-chart-orange bg-chart-orange/20';
    return 'text-chart-red bg-chart-red/20';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTemperature = 
      temperatureFilter === 'all' || lead.temperature === temperatureFilter;

    return matchesSearch && matchesTemperature;
  });

  const handleDeleteClick = (leadId: string) => {
    setLeadToDelete(leadId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
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
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? t('leads.title') : t('dashboard.myLeads')}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? t('leads.allLeads')
                : t('leads.allLeads')
              }
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t('leads.addLead')}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.all')}</p>
                  <p className="text-2xl font-bold">{metrics.total}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('leads.temperature.hot')}</p>
                  <p className="text-2xl font-bold text-primary">{metrics.hot}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('leads.status.converted')}</p>
                  <p className="text-2xl font-bold text-chart-green">{metrics.converted}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-chart-green/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('leads.score')}</p>
                  <p className="text-2xl font-bold">{metrics.avgScore}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-chart-blue/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t('common.search')} 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('common.filters')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="hot">{t('leads.temperature.hot')}</SelectItem>
              <SelectItem value="warm">{t('leads.temperature.warm')}</SelectItem>
              <SelectItem value="cold">{t('leads.temperature.cold')}</SelectItem>
            </SelectContent>
          </Select>
          {canExportData && (
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
          )}
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || temperatureFilter !== 'all' 
                    ? t('common.noData') 
                    : t('leads.noLeads')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.name}</span>
                            <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          {lead.email && (
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-4">
                        {getTemperatureBadge(lead.temperature)}
                        {getStatusBadge(lead.status)}
                        {isAdmin && lead.assigned_profile?.full_name && (
                          <span className="text-sm text-muted-foreground">
                            {lead.assigned_profile.full_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatDistanceToNow(new Date(lead.created_at), { 
                            addSuffix: true, 
                            locale: getLocale() 
                          })}
                        </span>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>{t('common.details')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('common.edit')}</DropdownMenuItem>
                            {canDeleteLeads && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteClick(lead.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <Button
                      variant={currentPage === pageNum ? "outline" : "ghost"}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="gap-1"
                >
                  <span>Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Info de paginação */}
        {pagination.total > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} leads
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('errors.generic')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Leads;
