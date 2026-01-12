import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 10 || isRefreshing;

  if (!shouldShow) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{
        height: isRefreshing ? 48 : pullDistance,
        opacity: Math.min(progress * 1.5, 1),
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 transition-transform",
          isRefreshing && "animate-spin"
        )}
        style={{
          transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
        }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-primary transition-colors",
            progress >= 1 && "text-primary"
          )}
        />
      </div>
    </div>
  );
}
