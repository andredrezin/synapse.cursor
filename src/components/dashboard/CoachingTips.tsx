import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, MessageCircle, Target, Lightbulb, ArrowRight } from "lucide-react";
import { useAITraining } from "@/hooks/useAITraining";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const CoachingTips = () => {
    const { learnedContent, isLoading } = useAITraining();

    if (isLoading) {
        return <Skeleton className="h-64 w-full rounded-xl" />;
    }

    // Filter approved or highly relevant coaching content
    const tips = learnedContent?.filter(c => c.content_type === 'objection_handling' || c.content_type === 'seller_response').slice(0, 3) || [];

    return (
        <Card className="glass shadow-xl border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-transparent to-chart-purple/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-primary" />
                        </div>
                        Dicas da Treinadora IA
                    </CardTitle>
                    <Badge variant="outline" className="animate-pulse bg-primary/10 border-primary/20 text-primary">
                        Em tempo real
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {tips.length === 0 ? (
                    <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                        <p className="text-sm text-muted-foreground">
                            A Dona Maria está aprendendo com suas conversas...
                            Logo ela terá dicas exclusivas para você!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tips.map((tip) => (
                            <div
                                key={tip.id}
                                className="group p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-chart-yellow/10 flex items-center justify-center flex-shrink-0">
                                        <Lightbulb className="w-4 h-4 text-chart-yellow" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                                            {tip.content_type === 'objection_handling' ? 'Como tratar objeção' : 'Resposta sugerida'}
                                        </p>
                                        <p className="text-sm font-medium mb-1">"{tip.question}"</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                            {tip.answer}
                                        </p>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver detalhe <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Button variant="ghost" className="w-full text-xs gap-2 hover:bg-primary/5" size="sm">
                    <Target className="w-3 h-3" />
                    Ver biblioteca de treinamento completa
                </Button>
            </CardContent>
        </Card>
    );
};
