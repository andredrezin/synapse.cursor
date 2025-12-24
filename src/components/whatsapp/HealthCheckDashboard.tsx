import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, XCircle, Clock, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface HealthCheck {
  id: string;
  connection_id: string;
  provider: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  response_time_ms: number | null;
  error_message: string | null;
  last_check_at: string;
  connection?: {
    name: string;
    phone_number: string | null;
  };
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
}

export function HealthCheckDashboard() {
  const { profile } = useAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [summary, setSummary] = useState<HealthSummary>({ total: 0, healthy: 0, degraded: 0, down: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealthChecks = async () => {
    if (!profile?.current_workspace_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_health_checks")
        .select(`
          *,
          connection:whatsapp_connections(name, phone_number)
        `)
        .eq("workspace_id", profile.current_workspace_id)
        .order("last_check_at", { ascending: false });

      if (error) throw error;

      // Get unique connections (latest check for each)
      const uniqueChecks = data?.reduce((acc: HealthCheck[], check: any) => {
        if (!acc.find(c => c.connection_id === check.connection_id)) {
          acc.push(check);
        }
        return acc;
      }, []) || [];

      setHealthChecks(uniqueChecks);
      
      setSummary({
        total: uniqueChecks.length,
        healthy: uniqueChecks.filter(c => c.status === "healthy").length,
        degraded: uniqueChecks.filter(c => c.status === "degraded").length,
        down: uniqueChecks.filter(c => c.status === "down").length,
      });
    } catch (error) {
      console.error("Error fetching health checks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-health-check", {
        body: { workspace_id: profile?.current_workspace_id },
      });

      if (error) throw error;

      if (data.success) {
        setLastRefresh(new Date());
        await fetchHealthChecks();
        
        if (data.summary.down > 0) {
          toast.error(`${data.summary.down} API(s) com problemas detectadas`);
        } else if (data.summary.degraded > 0) {
          toast.warning(`${data.summary.degraded} API(s) com performance degradada`);
        } else {
          toast.success("Todas as APIs estão saudáveis");
        }
      } else {
        toast.error(data.error || "Erro ao verificar APIs");
      }
    } catch (error: any) {
      toast.error("Erro ao executar health check");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthChecks();
  }, [profile?.current_workspace_id]);

  // Real-time updates
  useEffect(() => {
    if (!profile?.current_workspace_id) return;

    const channel = supabase
      .channel("health-checks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "api_health_checks",
          filter: `workspace_id=eq.${profile.current_workspace_id}`,
        },
        () => {
          fetchHealthChecks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.current_workspace_id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Saudável</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degradado</Badge>;
      case "down":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Fora do Ar</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "evolution":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Evolution</Badge>;
      case "official":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Oficial</Badge>;
      default:
        return <Badge variant="outline">{provider}</Badge>;
    }
  };

  const overallHealth = summary.total === 0 ? 0 : 
    ((summary.healthy * 100) + (summary.degraded * 50)) / summary.total;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saúde Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={overallHealth} className="h-2" />
              </div>
              <span className="text-2xl font-bold">{Math.round(overallHealth)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Saudáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-green-500">{summary.healthy}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Degradados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-yellow-500">{summary.degraded}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Fora do Ar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-red-500">{summary.down}</span>
          </CardContent>
        </Card>
      </div>

      {/* Health Check Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status das APIs
              </CardTitle>
              <CardDescription>
                {lastRefresh 
                  ? `Última verificação: ${lastRefresh.toLocaleTimeString()}`
                  : "Clique em verificar para atualizar o status"
                }
              </CardDescription>
            </div>
            <Button 
              onClick={runHealthCheck} 
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Verificando..." : "Verificar Agora"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : healthChecks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma verificação de saúde encontrada.</p>
              <p className="text-sm">Clique em "Verificar Agora" para iniciar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {healthChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {check.connection?.name || "Conexão"}
                        </span>
                        {getProviderBadge(check.provider)}
                      </div>
                      {check.connection?.phone_number && (
                        <span className="text-sm text-muted-foreground">
                          {check.connection.phone_number}
                        </span>
                      )}
                      {check.error_message && (
                        <p className="text-sm text-red-500 mt-1">
                          {check.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {check.response_time_ms !== null && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {check.response_time_ms}ms
                      </div>
                    )}
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
