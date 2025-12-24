import { Bell, Flame, Clock, AlertTriangle, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/lib/mock-data";

const AlertsPanel = () => {
  const { notifications, isLoading, markAsRead } = useNotifications();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'hot_lead': return Flame;
      case 'slow_response': return Clock;
      case 'objection': return AlertTriangle;
      case 'conversion': return CheckCircle;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'hot_lead': return 'text-primary bg-primary/10';
      case 'slow_response': return 'text-chart-red bg-chart-red/10';
      case 'objection': return 'text-chart-orange bg-chart-orange/10';
      case 'conversion': return 'text-primary bg-primary/10';
      default: return 'text-chart-blue bg-chart-blue/10';
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5 h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Alertas em Tempo Real</h3>
        </div>
        {unreadCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-chart-red/20 text-chart-red text-xs font-medium">
            {unreadCount} novos
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum alerta ainda</p>
            <p className="text-xs mt-1">Alertas aparecerão quando houver atividade</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div 
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02]",
                  !alert.is_read ? 'bg-secondary/50' : 'bg-transparent hover:bg-secondary/30'
                )}
                onClick={() => markAsRead(alert.id)}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", getAlertColor(alert.type))}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{alert.title}</p>
                    {!alert.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {formatTimeAgo(new Date(alert.created_at))} atrás
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm text-primary hover:underline">
          Ver todos os alertas →
        </button>
      )}
    </div>
  );
};

export default AlertsPanel;
