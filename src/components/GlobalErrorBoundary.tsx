import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>

            <h1 className="text-xl font-bold text-foreground">
              Algo deu errado
            </h1>

            <p className="text-muted-foreground text-sm">
              Ocorreu um erro inesperado que impediu o carregamento da
              aplicação.
            </p>

            {this.state.error && (
              <div className="w-full bg-muted/50 p-3 rounded text-left overflow-auto max-h-48 text-xs font-mono text-muted-foreground border border-border">
                <p className="font-bold text-destructive mb-1">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Ir para Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
