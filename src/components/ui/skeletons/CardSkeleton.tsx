import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  count?: number;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function CardSkeleton({ 
  count = 1, 
  showIcon = true, 
  showDescription = true,
  className 
}: CardSkeletonProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            {showIcon && <Skeleton className="h-10 w-10 rounded-lg" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              {showDescription && <Skeleton className="h-3 w-1/2" />}
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ 
  count = 6, 
  columns = 3 
}: { 
  count?: number; 
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-8 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
