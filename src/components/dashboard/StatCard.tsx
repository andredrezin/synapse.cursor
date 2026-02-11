import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  variant?: "default" | "glass" | "gradient";
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  variant = "glass",
  className,
  onClick,
}: StatCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 group hover:scale-[1.02] cursor-default",
        onClick && "cursor-pointer hover:shadow-lg",
        // Default Variant
        variant === "default" && "bg-card border border-border shadow-sm",
        // Glass Variant (Premium)
        variant === "glass" &&
          "bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl",
        // Gradient Variant
        variant === "gradient" &&
          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-xl transition-colors",
              variant === "glass"
                ? "bg-primary/10 text-primary"
                : "bg-primary/10 text-primary",
              "group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          {change && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                change.trend === "up" &&
                  "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
                change.trend === "down" &&
                  "text-rose-600 bg-rose-500/10 dark:text-rose-400",
                change.trend === "neutral" &&
                  "text-muted-foreground bg-secondary",
              )}
            >
              {change.trend === "up" && <TrendingUp className="w-3 h-3" />}
              {change.trend === "down" && <TrendingDown className="w-3 h-3" />}
              {change.trend === "neutral" && <Minus className="w-3 h-3" />}
              <span>{change.value}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </h3>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>

      {/* Decorative Gradient Background for Glass effect */}
      {variant === "glass" && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
      )}
    </div>
  );
};
