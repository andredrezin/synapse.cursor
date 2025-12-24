import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Loader2 } from "lucide-react";

const ConversionChart = () => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const { conversionData, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5 h-80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = conversionData.some(d => d.leads > 0 || d.conversions > 0);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Conversões por Período</h3>
          <p className="text-sm text-muted-foreground">Última semana</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              chartType === 'area' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Área
          </button>
          <button 
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Barras
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Conversões</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-blue" />
          <span className="text-sm text-muted-foreground">Leads</span>
        </div>
      </div>

      <div className="h-64">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>Nenhum dado ainda</p>
              <p className="text-xs mt-1">Os gráficos aparecerão quando você tiver leads</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={conversionData}>
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 90%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(210, 90%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 18%, 10%)', 
                    border: '1px solid hsl(220, 14%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)'
                  }}
                />
                <Area type="monotone" dataKey="leads" stroke="hsl(210, 90%, 55%)" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                <Area type="monotone" dataKey="conversions" stroke="hsl(152, 69%, 45%)" fillOpacity={1} fill="url(#colorConversions)" strokeWidth={2} />
              </AreaChart>
            ) : (
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 18%, 10%)', 
                    border: '1px solid hsl(220, 14%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)'
                  }}
                />
                <Bar dataKey="leads" fill="hsl(210, 90%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="hsl(152, 69%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ConversionChart;
