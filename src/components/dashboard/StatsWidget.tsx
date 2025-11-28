import { DashboardWidget } from "./DashboardWidget";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatsWidget({ title, value, icon: Icon, trend, description }: StatsWidgetProps) {
  return (
    <DashboardWidget title={title} icon={Icon}>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend.value}% from last month
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </DashboardWidget>
  );
}
