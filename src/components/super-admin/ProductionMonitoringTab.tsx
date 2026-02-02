import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Users, 
  Zap,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface MonitoringMetrics {
  summary: {
    requests_per_minute: number;
    error_rate_percent: number;
    avg_response_time_ms: number;
    active_sessions: number;
    daily_active_users: number;
  };
  errors: {
    total: number;
    by_severity: {
      critical: number;
      error: number;
      warning: number;
      info: number;
    };
    top_endpoints: Array<{ endpoint: string; count: number }>;
  };
  performance: {
    slowest_endpoints: Array<{ endpoint: string; avg_ms: number; count: number }>;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
  };
  storage: {
    total_usage_mb: number;
    by_lab: Array<{ lab_id: string; lab_name: string; usage_mb: number }>;
  };
  meta: {
    time_range: string;
    generated_at: string;
  };
}

type TimeRange = '1h' | '24h' | '7d' | '30d';

const SEVERITY_COLORS = {
  critical: 'hsl(var(--destructive))',
  error: 'hsl(0, 84%, 60%)',
  warning: 'hsl(45, 93%, 47%)',
  info: 'hsl(217, 91%, 60%)',
};

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export function ProductionMonitoringTab() {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('monitoring-dashboard', {
        body: { time_range: timeRange },
      });

      if (error) throw error;
      
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching monitoring metrics:', error);
      toast.error('Failed to fetch monitoring metrics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchMetrics, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const getStatusColor = (errorRate: number, responseTime: number) => {
    if (errorRate > 5 || responseTime > 500) return 'text-destructive';
    if (errorRate > 1 || responseTime > 200) return 'text-amber-500';
    return 'text-green-500';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (value <= thresholds.warning) return <Minus className="h-4 w-4 text-amber-500" />;
    return <TrendingUp className="h-4 w-4 text-destructive" />;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load monitoring data</p>
          <Button onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const errorSeverityData = [
    { name: 'Critical', value: metrics.errors.by_severity.critical, color: SEVERITY_COLORS.critical },
    { name: 'Error', value: metrics.errors.by_severity.error, color: SEVERITY_COLORS.error },
    { name: 'Warning', value: metrics.errors.by_severity.warning, color: SEVERITY_COLORS.warning },
    { name: 'Info', value: metrics.errors.by_severity.info, color: SEVERITY_COLORS.info },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with Time Range and Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (60s)
          </label>
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Requests/min"
          value={metrics.summary.requests_per_minute.toFixed(2)}
          icon={<Zap className="h-4 w-4 text-primary" />}
          subtitle={`${metrics.summary.daily_active_users} daily active users`}
        />
        <StatCard
          title="Error Rate"
          value={`${metrics.summary.error_rate_percent.toFixed(2)}%`}
          icon={getStatusIcon(metrics.summary.error_rate_percent, { good: 1, warning: 5 })}
          className={getStatusColor(metrics.summary.error_rate_percent, 0)}
          subtitle={`${metrics.errors.total} total errors`}
        />
        <StatCard
          title="Avg Response Time"
          value={`${metrics.summary.avg_response_time_ms}ms`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          subtitle={`P95: ${metrics.performance.p95_response_time_ms}ms | P99: ${metrics.performance.p99_response_time_ms}ms`}
        />
        <StatCard
          title="Active Sessions"
          value={metrics.summary.active_sessions.toString()}
          icon={<Users className="h-4 w-4 text-purple-500" />}
          subtitle="Currently connected"
        />
      </div>

      {/* Performance & Errors Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slowest Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Slowest Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.performance.slowest_endpoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Avg (ms)</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.performance.slowest_endpoints.map((ep, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm truncate max-w-[200px]">
                        {ep.endpoint}
                      </TableCell>
                      <TableCell className={`text-right ${ep.avg_ms > 500 ? 'text-destructive' : ep.avg_ms > 200 ? 'text-amber-500' : ''}`}>
                        {ep.avg_ms}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ep.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="No endpoint data available" />
            )}
          </CardContent>
        </Card>

        {/* Error Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Error Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorSeverityData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorSeverityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {errorSeverityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No errors recorded" icon={<Activity className="h-12 w-12 text-green-500" />} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Endpoints & Storage Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Error Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Top Error Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.errors.top_endpoints.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={metrics.errors.top_endpoints}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="endpoint" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No endpoint errors" icon={<Activity className="h-12 w-12 text-green-500" />} />
            )}
          </CardContent>
        </Card>

        {/* Storage by Lab */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage by Lab
              </span>
              <Badge variant="secondary">
                {metrics.storage.total_usage_mb.toFixed(1)} MB total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.storage.by_lab.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={metrics.storage.by_lab.slice(0, 5)}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" unit=" MB" />
                    <YAxis 
                      type="category" 
                      dataKey="lab_name" 
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
                    <Bar dataKey="usage_mb" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="No storage data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meta Info */}
      <div className="text-xs text-muted-foreground text-right">
        Data generated at: {new Date(metrics.meta.generated_at).toLocaleString()} | 
        Time range: {metrics.meta.time_range}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  className = '' 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${className}`}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      {icon || <Activity className="h-12 w-12 mb-2 opacity-50" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
