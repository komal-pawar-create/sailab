import { Skeleton } from "@/components/ui/skeleton";
import { StatsRowSkeleton } from "@/components/ui/skeletons";

export function PageLoader() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats row skeleton */}
      <StatsRowSkeleton count={6} />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardLoader() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <HeaderSkeleton />
      <FiltersSkeleton />
      <StatsRowSkeleton count={6} />
      <TabsSkeleton tabCount={7} />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function FiltersSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-32" />
      ))}
    </div>
  );
}

export function TabsSkeleton({ tabCount = 5 }: { tabCount?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: tabCount }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

export function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`w-full ${height} flex items-center justify-center`}>
      <div className="space-y-4 w-full max-w-2xl px-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
