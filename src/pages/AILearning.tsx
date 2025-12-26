import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Brain, TrendingUp, MessageSquare, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LearningQueueItem {
    id: string;
    conversation_id: string;
    seller_id: string;
    outcome: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    conversations: {
        id: string;
        lead_name: string;
        messages: any[];
    };
    profiles: {
        full_name: string;
    };
}

export default function AILearning() {
    const { workspace } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    // Fetch learning queue
    const { data: queueItems, isLoading } = useQuery({
        queryKey: ['ai-learning-queue', workspace?.id],
        queryFn: async () => {
            if (!workspace?.id) return [];

            const { data, error } = await supabase
                .from('ai_learning_queue')
                .select(`
          *,
          conversations(id, lead_name, messages),
          profiles(full_name)
        `)
                .eq('workspace_id', workspace.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as LearningQueueItem[];
        },
        enabled: !!workspace?.id,
    });

    // Approve conversation
    const approveMutation = useMutation({
        mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
            const { data, error } = await supabase.functions.invoke('ai-learning', {
                body: {
                    action: 'approve',
                    queue_item_id: itemId,
                    notes,
                },
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-learning-queue'] });
            toast({
                title: 'Conversa aprovada!',
                description: 'A IA aprendeu com esta conversa de sucesso.',
            });
            setSelectedItem(null);
            setNotes('');
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao aprovar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Reject conversation
    const rejectMutation = useMutation({
        mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
            const { error } = await supabase
                .from('ai_learning_queue')
                .update({
                    status: 'rejected',
                    notes,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', itemId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-learning-queue'] });
            toast({
                title: 'Conversa rejeitada',
                description: 'Esta conversa não será usada para aprendizado.',
            });
            setSelectedItem(null);
            setNotes('');
        },
    });

    const pendingItems = queueItems?.filter(item => item.status === 'pending') || [];
    const approvedItems = queueItems?.filter(item => item.status === 'approved') || [];
    const rejectedItems = queueItems?.filter(item => item.status === 'rejected') || [];

    const getOutcomeBadge = (outcome: string) => {
        const variants: Record<string, { color: string; icon: any }> = {
            venda: { color: 'bg-green-500', icon: TrendingUp },
            agendamento: { color: 'bg-blue-500', icon: MessageSquare },
            qualificacao: { color: 'bg-purple-500', icon: User },
            perdido: { color: 'bg-gray-500', icon: XCircle },
        };

        const config = variants[outcome] || variants.perdido;
        const Icon = config.icon;

        return (
            <Badge className={`${config.color} text-white`}>
                <Icon className="w-3 h-3 mr-1" />
                {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
                    <p className="text-muted-foreground">Carregando conversas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Brain className="w-8 h-8 text-primary" />
                    Aprendizado da IA
                </h1>
                <p className="text-muted-foreground mt-2">
                    Revise conversas bem-sucedidas para a IA aprender com seus melhores vendedores
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingItems.length}</div>
                        <p className="text-xs text-muted-foreground">Aguardando revisão</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{approvedItems.length}</div>
                        <p className="text-xs text-muted-foreground">IA aprendeu</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{rejectedItems.length}</div>
                        <p className="text-xs text-muted-foreground">Não utilizadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                        Pendentes ({pendingItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Aprovadas ({approvedItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Rejeitadas ({rejectedItems.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingItems.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    Nenhuma conversa pendente de revisão
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingItems.map((item) => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {item.conversations.lead_name || 'Lead sem nome'}
                                            </CardTitle>
                                            <CardDescription>
                                                Vendedor: {item.profiles.full_name}
                                            </CardDescription>
                                        </div>
                                        {getOutcomeBadge(item.outcome)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                                        <p className="text-sm font-medium mb-2">Prévia da conversa:</p>
                                        {item.conversations.messages?.slice(0, 5).map((msg: any, idx: number) => (
                                            <div key={idx} className="mb-2">
                                                <span className="font-medium text-xs">
                                                    {msg.from_me ? 'Vendedor' : 'Cliente'}:
                                                </span>
                                                <p className="text-sm">{msg.body}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedItem === item.id && (
                                        <div className="space-y-3">
                                            <Textarea
                                                placeholder="Notas sobre esta conversa (opcional)"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => approveMutation.mutate({ itemId: item.id, notes })}
                                                    disabled={approveMutation.isPending}
                                                    className="flex-1"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Aprovar e Ensinar IA
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => rejectMutation.mutate({ itemId: item.id, notes })}
                                                    disabled={rejectMutation.isPending}
                                                    className="flex-1"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Rejeitar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedItem(null);
                                                        setNotes('');
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedItem !== item.id && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedItem(item.id)}
                                            className="w-full"
                                        >
                                            Revisar Conversa
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                    {approvedItems.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {item.conversations.lead_name || 'Lead sem nome'}
                                        </CardTitle>
                                        <CardDescription>
                                            Vendedor: {item.profiles.full_name}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-green-500 text-white">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Aprovada
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                    {rejectedItems.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {item.conversations.lead_name || 'Lead sem nome'}
                                        </CardTitle>
                                        <CardDescription>
                                            Vendedor: {item.profiles.full_name}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Rejeitada
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
