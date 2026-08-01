import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, RotateCcw } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FilterValues {
  dateFrom: Date | null;
  dateTo: Date | null;
  branch: string;
  status: string;
  search: string;
}

interface ReportFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onApply: () => void;
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
  statusLabel?: string;
  statusAllLabel?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

const datePresets = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'Last 30 Days', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: 'Last Month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

export function ReportFilters({
  filters,
  onFiltersChange,
  onApply,
  showStatus = false,
  statusOptions = [],
  statusLabel = 'Status',
  statusAllLabel = 'All Status',
  showSearch = true,
  searchPlaceholder = 'Search...',
}: ReportFiltersProps) {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // Check if user is admin/lab_admin - only they can see all branches
  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin' || profile?.role === 'super_admin';

  useEffect(() => {
    const fetchBranches = async () => {
      if (!profile?.lab_id) return;
      const { data } = await supabase
        .from('branches')
        .select('id, name')
        .eq('lab_id', profile.lab_id)
        .order('name');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, [profile?.lab_id]);

  // Auto-set branch for non-admin users
  useEffect(() => {
    if (!isAdmin && profile?.branch_id && filters.branch === 'all') {
      onFiltersChange({ ...filters, branch: profile.branch_id });
    }
  }, [isAdmin, profile?.branch_id]);

  const handlePresetClick = (preset: typeof datePresets[0]) => {
    const { from, to } = preset.getValue();
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  };

  const handleReset = () => {
    const defaultBranch = isAdmin ? 'all' : (profile?.branch_id || 'all');
    onFiltersChange({
      dateFrom: subDays(new Date(), 29),
      dateTo: new Date(),
      branch: defaultBranch,
      status: 'all',
      search: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Date Presets */}
      <div className="flex flex-wrap gap-2">
        {datePresets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Date From */}
        <div className="space-y-2">
          <Label className="text-xs">From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.dateFrom && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom || undefined}
                onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date || null })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label className="text-xs">To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !filters.dateTo && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo || undefined}
                onSelect={(date) => onFiltersChange({ ...filters, dateTo: date || null })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Branch Filter - Only show for admins */}
        {isAdmin && branches.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branch}
              onValueChange={(value) => onFiltersChange({ ...filters, branch: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
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

        {/* Status Filter */}
        {showStatus && statusOptions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">{statusLabel}</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={statusAllLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{statusAllLabel}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="space-y-2">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Label className="text-xs invisible">Actions</Label>
          <div className="flex gap-2">
            <Button onClick={onApply} className="flex-1">
              Apply
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title="Reset filters">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
