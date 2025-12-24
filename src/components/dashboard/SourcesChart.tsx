import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

const SourcesChart = () => {
  const { t } = useTranslation();

  const data = [
    { name: t('sources.facebookAds'), value: 45, color: 'hsl(210, 90%, 55%)' },
    { name: t('sources.instagramAds'), value: 28, color: 'hsl(330, 80%, 60%)' },
    { name: t('sources.googleAds'), value: 15, color: 'hsl(152, 69%, 45%)' },
    { name: t('sources.organic'), value: 12, color: 'hsl(30, 90%, 55%)' },
  ];

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{t('sources.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('sources.byChannel')}</p>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(220, 18%, 10%)', 
                border: '1px solid hsl(220, 14%, 18%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)'
              }}
              formatter={(value: number) => [`${value}%`, t('sources.participation')]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-medium ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcesChart;
