import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, CalendarRange, Infinity } from "lucide-react";

export type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface DashboardFiltersProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
      <TabsList className="grid w-full grid-cols-4 max-w-md">
        <TabsTrigger value="today" className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Today</span>
        </TabsTrigger>
        <TabsTrigger value="week" className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">This Week</span>
        </TabsTrigger>
        <TabsTrigger value="month" className="flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">This Month</span>
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-1.5">
          <Infinity className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">All Time</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
