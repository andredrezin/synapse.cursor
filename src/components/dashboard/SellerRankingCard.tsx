import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Star, TrendingUp, Award } from "lucide-react";
import { useTeamRanking } from "@/hooks/useTeamRanking";
import { Skeleton } from "@/components/ui/skeleton";

export const SellerRankingCard = () => {
    const { myRank, isLoading } = useTeamRanking();

    if (isLoading) {
        return <Skeleton className="h-48 w-full rounded-xl" />;
    }

    if (!myRank) {
        return (
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardContent className="pt-6 text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Inicie suas vendas para entrar no ranking!</p>
                </CardContent>
            </Card>
        );
    }

    const getRankIcon = (pos: number) => {
        switch (pos) {
            case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2: return <Medal className="w-6 h-6 text-slate-300" />;
            case 3: return <Medal className="w-6 h-6 text-orange-400" />;
            default: return <Star className="w-6 h-6 text-primary/40" />;
        }
    };

    const getRankColor = (pos: number) => {
        switch (pos) {
            case 1: return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
            case 2: return "bg-slate-300/10 border-slate-300/20 text-slate-500";
            case 3: return "bg-orange-400/10 border-orange-400/20 text-orange-500";
            default: return "bg-primary/10 border-primary/20 text-primary";
        }
    };

    return (
        <Card className="overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Seu Desempenho
                    </div>
                    <Badge className={getRankColor(myRank.rank_position)}>
                        {myRank.rank_position}º Lugar
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankColor(myRank.rank_position)}`}>
                            {getRankIcon(myRank.rank_position)}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{myRank.points}</p>
                            <p className="text-xs text-muted-foreground">Pontos XP</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-chart-green font-medium">
                            <TrendingUp className="w-4 h-4" />
                            {myRank.conversions}
                        </div>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Próximo Nível</span>
                        <span className="font-medium">{myRank.points}/1000 XP</span>
                    </div>
                    <Progress value={(myRank.points / 1000) * 100} className="h-1.5" />
                </div>

                {myRank.rank_position === 1 && (
                    <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-[10px] text-yellow-600 font-medium text-center">
                        Você é o Top 1! Continue assim! 🔥
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
