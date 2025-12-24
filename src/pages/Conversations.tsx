import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ExternalLink,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Conversations = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const { conversations, metrics, isLoading, pagination } = useConversations({ page: currentPage, pageSize });
  const { isAdmin } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();

  const getLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-chart-green" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-chart-red" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTemperatureBadge = (temperature: string | undefined) => {
    switch (temperature) {
      case 'hot':
        return <Badge className="bg-primary/20 text-primary border-none">{t('leads.temperature.hot')}</Badge>;
      case 'warm':
        return <Badge className="bg-chart-orange/20 text-chart-orange border-none">{t('leads.temperature.warm')}</Badge>;
      default:
        return <Badge variant="outline">{t('leads.temperature.cold')}</Badge>;
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lead?.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChat = (conversationId: string) => {
    navigate(`/dashboard/chat/${conversationId}`);
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
              {isAdmin ? t('conversations.title') : t('dashboard.myConversations')}
            </h1>
            <p className="text-muted-foreground">
              {t('conversations.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('common.search')} 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
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
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('conversations.open')}</p>
                  <p className="text-2xl font-bold">{metrics.open}</p>
                </div>
                <Clock className="w-8 h-8 text-chart-orange/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('conversations.closed')}</p>
                  <p className="text-2xl font-bold">{metrics.closed}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-chart-green/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('conversations.pending')}</p>
                  <p className="text-2xl font-bold">{metrics.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-chart-blue/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('conversations.allConversations')}</CardTitle>
            {isAdmin && (
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('common.export')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.noData') : t('conversations.noConversations')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleOpenChat(conv.id)}
                    className="p-4 rounded-lg border border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{conv.lead?.name || 'Lead'}</span>
                            <Badge variant={conv.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                              {conv.status === 'open' ? t('conversations.open') : conv.status === 'closed' ? t('conversations.closed') : t('conversations.pending')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lead?.phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conv.messages_count || 0} {t('conversations.messages')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { 
                            addSuffix: true, 
                            locale: getLocale() 
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(conv.sentiment)}
                          {getTemperatureBadge(conv.lead?.temperature)}
                        </div>
                        {isAdmin && conv.assigned_profile?.full_name && (
                          <span className="text-xs text-muted-foreground">
                            {conv.assigned_profile.full_name}
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(conv.id);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {t('conversations.startConversation')}
                        </Button>
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
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} conversas
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Conversations;
