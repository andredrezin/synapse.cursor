import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { log } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string; // Nome do widget para logs
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class MetricsErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        log('ERROR', `Widget Error Boundary Caught: ${this.props.name || 'Unknown'}`, {
            error: error.message,
            stack: errorInfo.componentStack,
        });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="h-full border-destructive/20 bg-destructive/5 overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                        <div className="p-3 bg-destructive/10 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">Erro ao carregar</h3>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                Não foi possível exibir este widget.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleRetry}
                            className="gap-2 hover:bg-background"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar Novamente
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
