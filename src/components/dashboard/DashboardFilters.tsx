import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, CalendarRange, Infinity, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimePeriod = 'today' | 'week' | 'month' | 'all';

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
  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Calendar, count: counts?.today },
    { id: 'week' as const, label: 'This Week', icon: CalendarDays, count: counts?.week },
    { id: 'month' as const, label: 'This Month', icon: CalendarRange, count: counts?.month },
    { id: 'all' as const, label: 'All Time', icon: Infinity, count: counts?.all },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Branch Filter for Admins */}
      {showBranchFilter && branches.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBranch} onValueChange={onBranchChange}>
            <SelectTrigger className="w-[180px]">
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
      <Tabs value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
        <TabsList className="h-auto p-1 flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 px-3 py-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {counts && tab.count !== undefined && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-[20px] px-1.5 text-xs font-medium ml-1"
                >
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
