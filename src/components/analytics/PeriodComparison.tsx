import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PeriodData {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'percent';
}

interface PeriodComparisonProps {
  title: string;
  description: string;
  data: PeriodData[];
}

export const PeriodComparison = ({ title, description, data }: PeriodComparisonProps) => {
  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatValue = (value: number, format?: 'number' | 'percent') => {
    if (format === 'percent') return `${value.toFixed(1)}%`;
    return value.toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const change = getChange(item.current, item.previous);
            const isPositive = change > 0;
            const isNeutral = change === 0;

            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">
                      {formatValue(item.current, item.format)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      vs {formatValue(item.previous, item.format)}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                  isNeutral ? "bg-muted text-muted-foreground" :
                  isPositive ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                  "bg-red-500/20 text-red-600 dark:text-red-400"
                )}>
                  {isNeutral ? (
                    <Minus className="h-4 w-4" />
                  ) : isPositive ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
