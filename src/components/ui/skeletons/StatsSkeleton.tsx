import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsSkeletonProps {
  count?: number;
  variant?: "default" | "compact" | "large";
  className?: string;
}

export function StatsSkeleton({ 
  count = 6, 
  variant = "default",
  className 
}: StatsSkeletonProps) {
  const sizeClasses = {
    default: "h-20",
    compact: "h-16",
    large: "h-28",
  };

  const gridClasses = {
    default: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    compact: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3", gridClasses[variant], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className={cn("p-4 flex flex-col justify-center", sizeClasses[variant])}>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
            {variant === "large" && (
              <Skeleton className="h-3 w-20 mt-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsWidgetSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
