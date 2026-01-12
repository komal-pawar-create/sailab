import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, CalendarRange, Infinity, Building2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type TimePeriod = 'today' | 'week' | 'month' | 'lastMonth' | 'lastQuarter' | 'lastYear' | 'all';

export interface Branch {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  counts?: {
    today: number;
    week: number;
    month: number;
    lastMonth: number;
    lastQuarter: number;
    lastYear: number;
    all: number;
  };
  branches?: Branch[];
  selectedBranch?: string;
  onBranchChange?: (branchId: string) => void;
  showBranchFilter?: boolean;
}

export function DashboardFilters({ 
  value, 
  onChange, 
  counts,
  branches = [],
  selectedBranch = 'all',
  onBranchChange,
  showBranchFilter = false,
}: DashboardFiltersProps) {
  const isMobile = useIsMobile();
  
  const tabs = [
    { id: 'today' as const, label: 'Today', shortLabel: 'Today', icon: Calendar, count: counts?.today },
    { id: 'week' as const, label: 'This Week', shortLabel: 'Week', icon: CalendarDays, count: counts?.week },
    { id: 'month' as const, label: 'This Month', shortLabel: 'Month', icon: CalendarRange, count: counts?.month },
    { id: 'lastMonth' as const, label: 'Last Month', shortLabel: 'Last Mo', icon: History, count: counts?.lastMonth },
    { id: 'lastQuarter' as const, label: 'Last Quarter', shortLabel: 'Qtr', icon: History, count: counts?.lastQuarter },
    { id: 'lastYear' as const, label: 'Last Year', shortLabel: 'Year', icon: History, count: counts?.lastYear },
    { id: 'all' as const, label: 'All Time', shortLabel: 'All', icon: Infinity, count: counts?.all },
  ];

  const TabsListContent = (
    <>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className={cn(
            "flex items-center gap-1.5 shrink-0",
            isMobile ? "px-2.5 py-2 min-h-touch" : "px-3 py-1.5"
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          <span className={cn(isMobile ? "text-xs" : "hidden sm:inline")}>
            {isMobile ? tab.shortLabel : tab.label}
          </span>
          {counts && tab.count !== undefined && (
            <Badge 
              variant="secondary" 
              className={cn(
                "font-medium ml-1",
                isMobile ? "h-4 min-w-[16px] px-1 text-[10px]" : "h-5 min-w-[20px] px-1.5 text-xs"
              )}
            >
              {tab.count}
            </Badge>
          )}
        </TabsTrigger>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Branch Filter for Admins */}
      {showBranchFilter && branches.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBranch} onValueChange={onBranchChange}>
            <SelectTrigger className={cn("w-[180px]", isMobile && "h-11")}>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Time Period Filter */}
      <Tabs value={value} onValueChange={(v) => onChange(v as TimePeriod)} data-tour="time-filter">
        {isMobile ? (
          <div className="-mx-4 px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-auto p-1 w-max">
                {TabsListContent}
              </TabsList>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>
        ) : (
          <TabsList className="h-auto p-1 flex-wrap">
            {TabsListContent}
          </TabsList>
        )}
      </Tabs>
    </div>
  );
}
