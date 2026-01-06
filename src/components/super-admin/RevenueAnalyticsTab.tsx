import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, addMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface Subscription {
  id: string;
  lab_id: string;
  plan_name: string;
  amount: number;
  billing_cycle: string | null;
  status: string | null;
  start_date: string;
  end_date: string | null;
  currency: string | null;
}

interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalActiveSubscriptions: number;
  churnRate: number;
  avgRevenuePerLab: number;
  monthlyGrowth: number;
  atRiskRevenue: number;
}

interface MRRDataPoint {
  month: string;
  mrr: number;
  subscriptions: number;
}

interface PlanBreakdown {
  name: string;
  count: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function RevenueAnalyticsTab() {
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    mrr: 0,
    arr: 0,
    totalActiveSubscriptions: 0,
    churnRate: 0,
    avgRevenuePerLab: 0,
    monthlyGrowth: 0,
    atRiskRevenue: 0,
  });
  const [mrrTrend, setMrrTrend] = useState<MRRDataPoint[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([]);
  const [forecast, setForecast] = useState<MRRDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const subs = subscriptions as Subscription[] || [];
      calculateMetrics(subs);
      calculateMRRTrend(subs);
      calculatePlanBreakdown(subs);
      calculateForecast(subs);
    } catch (error: any) {
      toast.error('Failed to fetch revenue data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (subscriptions: Subscription[]) => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    
    // Active subscriptions
    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'active' && 
      (!s.end_date || new Date(s.end_date) > now)
    );
    
    // Calculate MRR based on billing cycle
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      if (sub.billing_cycle === 'yearly' || sub.billing_cycle === 'annual') {
        return sum + (sub.amount / 12);
      }
      return sum + sub.amount;
    }, 0);

    // Previous month's active subscriptions for growth calculation
    const lastMonthActive = subscriptions.filter(s => {
      const startDate = new Date(s.start_date);
      const endDate = s.end_date ? new Date(s.end_date) : null;
      return startDate <= lastMonth && (!endDate || endDate > lastMonth) && s.status === 'active';
    });
    
    const lastMonthMRR = lastMonthActive.reduce((sum, sub) => {
      if (sub.billing_cycle === 'yearly' || sub.billing_cycle === 'annual') {
        return sum + (sub.amount / 12);
      }
      return sum + sub.amount;
    }, 0);

    // Churn rate: subscriptions that ended in the last 30 days / total active last month
    const churned = subscriptions.filter(s => {
      if (!s.end_date || s.status === 'active') return false;
      const endDate = new Date(s.end_date);
      return endDate >= lastMonth && endDate <= now;
    });
    
    const churnRate = lastMonthActive.length > 0 
      ? (churned.length / lastMonthActive.length) * 100 
      : 0;

    // At-risk revenue: subscriptions expiring in next 30 days
    const thirtyDaysFromNow = addMonths(now, 1);
    const atRiskSubs = activeSubscriptions.filter(s => {
      if (!s.end_date) return false;
      const endDate = new Date(s.end_date);
      return endDate <= thirtyDaysFromNow && endDate > now;
    });
    
    const atRiskRevenue = atRiskSubs.reduce((sum, sub) => {
      if (sub.billing_cycle === 'yearly' || sub.billing_cycle === 'annual') {
        return sum + (sub.amount / 12);
      }
      return sum + sub.amount;
    }, 0);

    // Monthly growth
    const monthlyGrowth = lastMonthMRR > 0 
      ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 
      : mrr > 0 ? 100 : 0;

    setMetrics({
      mrr,
      arr: mrr * 12,
      totalActiveSubscriptions: activeSubscriptions.length,
      churnRate,
      avgRevenuePerLab: activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0,
      monthlyGrowth,
      atRiskRevenue,
    });
  };

  const calculateMRRTrend = (subscriptions: Subscription[]) => {
    const trend: MRRDataPoint[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const activeInMonth = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        const endDate = s.end_date ? new Date(s.end_date) : null;
        return startDate <= monthEnd && 
               (!endDate || endDate >= monthStart) && 
               (s.status === 'active' || (s.status === 'cancelled' && endDate && endDate >= monthStart));
      });
      
      const monthMRR = activeInMonth.reduce((sum, sub) => {
        if (sub.billing_cycle === 'yearly' || sub.billing_cycle === 'annual') {
          return sum + (sub.amount / 12);
        }
        return sum + sub.amount;
      }, 0);
      
      trend.push({
        month: format(monthDate, 'MMM yy'),
        mrr: Math.round(monthMRR),
        subscriptions: activeInMonth.length,
      });
    }
    
    setMrrTrend(trend);
  };

  const calculatePlanBreakdown = (subscriptions: Subscription[]) => {
    const now = new Date();
    const activeSubscriptions = subscriptions.filter(s => 
      s.status === 'active' && 
      (!s.end_date || new Date(s.end_date) > now)
    );
    
    const breakdown: Record<string, { count: number; revenue: number }> = {};
    
    activeSubscriptions.forEach(sub => {
      const plan = sub.plan_name || 'Unknown';
      if (!breakdown[plan]) {
        breakdown[plan] = { count: 0, revenue: 0 };
      }
      breakdown[plan].count++;
      breakdown[plan].revenue += sub.billing_cycle === 'yearly' || sub.billing_cycle === 'annual' 
        ? sub.amount / 12 
        : sub.amount;
    });
    
    setPlanBreakdown(
      Object.entries(breakdown).map(([name, data]) => ({
        name,
        count: data.count,
        revenue: Math.round(data.revenue),
      }))
    );
  };

  const calculateForecast = (subscriptions: Subscription[]) => {
    const now = new Date();
    const currentMRR = metrics.mrr || 0;
    const growthRate = metrics.monthlyGrowth / 100 || 0.05; // Default 5% growth
    
    const forecastData: MRRDataPoint[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const futureDate = addMonths(now, i);
      // Simple forecast: current MRR * (1 + growth rate)^months
      const forecastMRR = currentMRR * Math.pow(1 + Math.max(growthRate, 0.02), i);
      
      forecastData.push({
        month: format(futureDate, 'MMM yy'),
        mrr: Math.round(forecastMRR),
        subscriptions: 0, // Not calculated for forecast
      });
    }
    
    setForecast(forecastData);
  };

  // Recalculate forecast when metrics change
  useEffect(() => {
    if (metrics.mrr > 0) {
      const now = new Date();
      const growthRate = metrics.monthlyGrowth / 100 || 0.05;
      
      const forecastData: MRRDataPoint[] = [];
      
      for (let i = 1; i <= 6; i++) {
        const futureDate = addMonths(now, i);
        const forecastMRR = metrics.mrr * Math.pow(1 + Math.max(growthRate, 0.02), i);
        
        forecastData.push({
          month: format(futureDate, 'MMM yy'),
          mrr: Math.round(forecastMRR),
          subscriptions: 0,
        });
      }
      
      setForecast(forecastData);
    }
  }, [metrics.mrr, metrics.monthlyGrowth]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Revenue Analytics
          </h2>
          <p className="text-muted-foreground">
            Track MRR, churn, and subscription trends
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(), 'MMM yyyy')}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</p>
                <div className={`flex items-center text-xs mt-1 ${metrics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.monthlyGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(metrics.monthlyGrowth).toFixed(1)}% vs last month
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.arr)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Annual recurring revenue
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{metrics.totalActiveSubscriptions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg {formatCurrency(metrics.avgRevenuePerLab)}/lab
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 30 days
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metrics.churnRate > 5 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                <TrendingDown className={`h-6 w-6 ${
                  metrics.churnRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Alert */}
      {metrics.atRiskRevenue > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {formatCurrency(metrics.atRiskRevenue)} MRR at risk
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Subscriptions expiring in the next 30 days. Consider reaching out for renewal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR Trend</CardTitle>
            <CardDescription>Monthly recurring revenue over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'MRR']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              6-Month Forecast
            </CardTitle>
            <CardDescription>
              Projected MRR based on current growth rate ({metrics.monthlyGrowth > 0 ? '+' : ''}{metrics.monthlyGrowth.toFixed(1)}% monthly)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Projected MRR']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="mrr" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Plan</CardTitle>
            <CardDescription>Distribution of MRR across subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            {planBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {planBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'MRR']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No active subscriptions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Details</CardTitle>
            <CardDescription>Subscription count and revenue per plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planBreakdown.length > 0 ? planBreakdown.map((plan, index) => (
                <div key={plan.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">{plan.count} subscriptions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(plan.revenue)}</p>
                    <p className="text-xs text-muted-foreground">MRR</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subscription data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Avg Revenue/Lab</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgRevenuePerLab)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lifetime Value Est.</p>
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.avgRevenuePerLab * 24)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projected Q1 Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(forecast.slice(0, 3).reduce((sum, f) => sum + f.mrr, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Revenue Retention</p>
              <p className="text-2xl font-bold">
                {(100 - metrics.churnRate + metrics.monthlyGrowth).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
