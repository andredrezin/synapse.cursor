import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTeamRanking } from '@/hooks/useTeamRanking';
import { Trophy, Medal, Star, Target, Users, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Ranking = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const monthStr = format(selectedDate, 'yyyy-MM');
    const { ranking, isLoading } = useTeamRanking(monthStr);

    const handlePrevMonth = () => setSelectedDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setSelectedDate(prev => addMonths(prev, 1));

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </DashboardLayout>
        );
    }

    const topThree = ranking?.slice(0, 3) || [];
    const others = ranking?.slice(3) || [];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Ranking de Vendas</h1>
                        <p className="text-muted-foreground">
                            Acompanhe os melhores desempenhos do time
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-secondary/50 p-1 rounded-lg border">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-4 font-medium min-w-[140px] justify-center">
                            <Calendar className="h-4 w-4 text-primary" />
                            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={monthStr === format(new Date(), 'yyyy-MM')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Podium */}
                <div className="grid gap-6 md:grid-cols-3 items-end">
                    {/* 2nd Place */}
                    <div className="order-2 md:order-1 pt-8">
                        {topThree[1] && <PodiumCard entry={topThree[1]} position={2} />}
                    </div>
                    {/* 1st Place */}
                    <div className="order-1 md:order-2">
                        {topThree[0] && <PodiumCard entry={topThree[0]} position={1} />}
                    </div>
                    {/* 3rd Place */}
                    <div className="order-3 md:order-3 pt-12">
                        {topThree[2] && <PodiumCard entry={topThree[2]} position={3} />}
                    </div>
                </div>

                {/* Rest of the List */}
                <Card className="glass">
                    <CardHeader>
                        <CardTitle className="text-lg">Classificação Geral</CardTitle>
                        <CardDescription>
                            Total de {ranking?.length || 0} vendedores ativos este mês
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ranking?.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhum dado disponível para este mês</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-5">Vendedor</div>
                                    <div className="col-span-2 text-center">Leads</div>
                                    <div className="col-span-2 text-center">Vendas</div>
                                    <div className="col-span-2 text-right">Pontos XP</div>
                                </div>
                                {ranking?.map((entry) => (
                                    <div
                                        key={entry.profile_id}
                                        className="grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-lg hover:bg-primary/5 transition-colors"
                                    >
                                        <div className="col-span-1 font-bold text-muted-foreground">
                                            {entry.rank_position}º
                                        </div>
                                        <div className="col-span-5 flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border">
                                                <AvatarImage src={entry.avatar_url || ''} />
                                                <AvatarFallback>{entry.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium truncate">{entry.full_name}</span>
                                        </div>
                                        <div className="col-span-2 text-center text-sm">
                                            {entry.total_leads}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <Badge variant="secondary" className="bg-chart-green/10 text-chart-green hover:bg-chart-green/20 border-0">
                                                {entry.conversions}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-primary">
                                            {entry.points}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

const PodiumCard = ({ entry, position }: { entry: any, position: number }) => {
    const isFirst = position === 1;
    const icons = {
        1: <Trophy className="h-8 w-8 text-yellow-500" />,
        2: <Medal className="h-8 w-8 text-slate-400" />,
        3: <Medal className="h-8 w-8 text-orange-400" />,
    };

    return (
        <Card className={`relative overflow-hidden transition-all hover:scale-105 ${isFirst ? 'border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/10' : 'border-primary/20 shadow-lg'}`}>
            {isFirst && (
                <div className="absolute top-0 right-0 p-2">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
                </div>
            )}
            <CardContent className="pt-8 text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                    <Avatar className={`w-24 h-24 border-4 ${isFirst ? 'border-yellow-500' : 'border-primary/20'}`}>
                        <AvatarImage src={entry.avatar_url || ''} />
                        <AvatarFallback className="text-2xl">{entry.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 border shadow-lg">
                        {icons[position as keyof typeof icons]}
                    </div>
                </div>

                <div>
                    <h3 className={`font-bold ${isFirst ? 'text-xl' : 'text-lg'}`}>{entry.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{entry.points} XP Acumulados</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center">
                        <p className="text-lg font-bold text-chart-green">{entry.conversions}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Vendas</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-primary">{entry.total_leads}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Atendimentos</p>
                    </div>
                </div>
            </CardContent>
            <div className={`h-2 ${isFirst ? 'bg-yellow-500' : 'bg-primary'}`} />
        </Card>
    );
};

export default Ranking;
