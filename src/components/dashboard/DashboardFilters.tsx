import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, CalendarRange, Infinity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface DashboardFiltersProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  counts?: {
    today: number;
    week: number;
    month: number;
    all: number;
  };
}

export function DashboardFilters({ value, onChange, counts }: DashboardFiltersProps) {
  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Calendar, count: counts?.today },
    { id: 'week' as const, label: 'This Week', icon: CalendarDays, count: counts?.week },
    { id: 'month' as const, label: 'This Month', icon: CalendarRange, count: counts?.month },
    { id: 'all' as const, label: 'All Time', icon: Infinity, count: counts?.all },
  ];

  return (
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
  );
}
