import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down';
  };
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  subtitle
}: MetricCardProps) => {
  return (
    <div className="glass rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              change.trend === 'up' ? 'text-primary' : 'text-chart-red'
            )}>
              {change.trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{change.value}</span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          iconBg
        )}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
