import { MessageCircle, MoreHorizontal, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { useNavigate } from "react-router-dom";
import { 
  getTemperatureColor, 
  getTemperatureLabel, 
  getScoreColor,
  getScoreBg,
  getSentimentIcon,
  formatTimeAgo
} from "@/lib/mock-data";

const LeadsTable = () => {
  const { allLeads, isLoading } = useLeads();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Leads Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas conversas e status</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-secondary text-sm px-3 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-primary/50">
            <option>Todos</option>
            <option>Quentes</option>
            <option>Mornos</option>
            <option>Frios</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/leads')}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver Todos
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Lead</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Temperatura</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Última Mensagem</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Sentimento</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Atendente</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {allLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  Nenhum lead encontrado. Os leads aparecerão aqui quando você receber mensagens.
                </td>
              </tr>
            ) : (
              allLeads.slice(0, 6).map((lead) => (
                <tr 
                  key={lead.id} 
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/dashboard/conversations?lead=${lead.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm ${getScoreBg(lead.score)} ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTemperatureColor(lead.temperature)}`}>
                      {getTemperatureLabel(lead.temperature)}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-sm text-foreground truncate">{lead.last_message || 'Sem mensagens'}</p>
                    {lead.last_message_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo(new Date(lead.last_message_at))} atrás
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xl" title={lead.sentiment || 'neutral'}>
                      {getSentimentIcon(lead.sentiment || 'neutral')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-muted-foreground">
                      {lead.assigned_profile?.full_name || 'Não atribuído'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Mostrando {Math.min(allLeads.length, 6)} de {allLeads.length} leads</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/leads')}>
          Ver Todos
        </Button>
      </div>
    </div>
  );
};

export default LeadsTable;
