import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  showActions = true,
  className,
}: TableSkeletonProps) {
  const totalColumns = showActions ? columns + 1 : columns;

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: totalColumns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="animate-pulse">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={cn(
                      "h-4",
                      colIndex === 0 ? "w-32" : "w-20"
                    )} 
                  />
                </TableCell>
              ))}
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TableWithFiltersSkeleton({
  rows = 5,
  columns = 5,
  filterCount = 2,
}: {
  rows?: number;
  columns?: number;
  filterCount?: number;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: filterCount }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
        <Skeleton className="h-10 w-64 ml-auto" /> {/* Search */}
      </div>
      
      {/* Table */}
      <TableSkeleton rows={rows} columns={columns} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
