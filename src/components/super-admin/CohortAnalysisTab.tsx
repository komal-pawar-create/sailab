import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import { Users, IndianRupee, TrendingUp, Calendar } from 'lucide-react';

interface CohortData {
  cohortMonth: string;
  totalLabs: number;
  activeLabs: number;
  totalRevenue: number;
  averageLTV: number;
  retentionRate: number;
  monthlyRetention: number[];
}

export function CohortAnalysisTab() {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallLTV, setOverallLTV] = useState(0);
  const [averageRetention, setAverageRetention] = useState(0);

  useEffect(() => {
    fetchCohortData();
  }, []);

  const fetchCohortData = async () => {
    try {
      // Fetch labs with their creation dates and subscriptions
      const { data: labs, error: labsError } = await supabase
        .from('labs')
        .select('id, name, created_at')
        .order('created_at');

      if (labsError) throw labsError;

      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('lab_id, amount, billing_cycle, status, start_date, end_date, created_at');

      if (subsError) throw subsError;

      // Group labs by signup month (last 12 months)
      const now = new Date();
      const cohortMap = new Map<string, CohortData>();

      // Initialize cohorts for last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        cohortMap.set(monthKey, {
          cohortMonth: monthKey,
          totalLabs: 0,
          activeLabs: 0,
          totalRevenue: 0,
          averageLTV: 0,
          retentionRate: 0,
          monthlyRetention: Array(12 - i).fill(0),
        });
      }

      // Process labs into cohorts
      labs?.forEach(lab => {
        const signupMonth = format(new Date(lab.created_at), 'yyyy-MM');
        const cohort = cohortMap.get(signupMonth);
        
        if (cohort) {
          cohort.totalLabs++;
          
          // Calculate revenue from this lab's subscriptions
          const labSubs = subscriptions?.filter(s => s.lab_id === lab.id) || [];
          let labRevenue = 0;
          let hasActiveSub = false;
          
          labSubs.forEach(sub => {
            if (sub.status === 'active') hasActiveSub = true;
            
            // Calculate total revenue
            const monthlyAmount = sub.billing_cycle === 'yearly' 
              ? sub.amount / 12 
              : sub.amount;
            
            // Calculate months subscribed
            const startDate = new Date(sub.start_date);
            const endDate = sub.end_date ? new Date(sub.end_date) : now;
            const monthsSubscribed = Math.max(1, differenceInMonths(endDate, startDate) + 1);
            
            labRevenue += monthlyAmount * monthsSubscribed;
          });
          
          cohort.totalRevenue += labRevenue;
          if (hasActiveSub) cohort.activeLabs++;
          
          // Track monthly retention
          const signupDate = new Date(lab.created_at);
          const monthsSinceSignup = differenceInMonths(now, signupDate);
          
          for (let m = 0; m <= Math.min(monthsSinceSignup, cohort.monthlyRetention.length - 1); m++) {
            // Check if lab had active subscription in month m
            const checkMonth = subMonths(now, monthsSinceSignup - m);
            const wasActive = labSubs.some(sub => {
              const start = new Date(sub.start_date);
              const end = sub.end_date ? new Date(sub.end_date) : now;
              return start <= endOfMonth(checkMonth) && end >= startOfMonth(checkMonth);
            });
            
            if (wasActive || m === 0) {
              cohort.monthlyRetention[m] = (cohort.monthlyRetention[m] || 0) + 1;
            }
          }
        }
      });

      // Calculate averages and retention rates
      const cohortsArray = Array.from(cohortMap.values())
        .filter(c => c.totalLabs > 0)
        .map(cohort => ({
          ...cohort,
          averageLTV: cohort.totalLabs > 0 ? cohort.totalRevenue / cohort.totalLabs : 0,
          retentionRate: cohort.totalLabs > 0 ? (cohort.activeLabs / cohort.totalLabs) * 100 : 0,
          monthlyRetention: cohort.monthlyRetention.map(count => 
            cohort.totalLabs > 0 ? (count / cohort.totalLabs) * 100 : 0
          ),
        }));

      setCohorts(cohortsArray);
      
      // Calculate overall metrics
      const totalRevenue = cohortsArray.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalLabs = cohortsArray.reduce((sum, c) => sum + c.totalLabs, 0);
      const totalActive = cohortsArray.reduce((sum, c) => sum + c.activeLabs, 0);
      
      setOverallLTV(totalLabs > 0 ? totalRevenue / totalLabs : 0);
      setAverageRetention(totalLabs > 0 ? (totalActive / totalLabs) * 100 : 0);

    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-yellow-400';
    if (value >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cohort analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overallLTV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Per customer lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Retention</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRetention.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Currently active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cohorts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohorts.length}</div>
            <p className="text-xs text-muted-foreground">Months with signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohorts.reduce((sum, c) => sum + c.totalLabs, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all cohorts</p>
          </CardContent>
        </Card>
      </div>

      {/* LTV by Cohort */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Customer Lifetime Value by Cohort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Cohort</th>
                  <th className="text-right py-2 px-3 font-medium">Customers</th>
                  <th className="text-right py-2 px-3 font-medium">Active</th>
                  <th className="text-right py-2 px-3 font-medium">Total Revenue</th>
                  <th className="text-right py-2 px-3 font-medium">Avg LTV</th>
                  <th className="text-right py-2 px-3 font-medium">Retention</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => (
                  <tr key={cohort.cohortMonth} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">
                      {format(new Date(cohort.cohortMonth + '-01'), 'MMM yyyy')}
                    </td>
                    <td className="text-right py-2 px-3">{cohort.totalLabs}</td>
                    <td className="text-right py-2 px-3">{cohort.activeLabs}</td>
                    <td className="text-right py-2 px-3">
                      ₹{cohort.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right py-2 px-3 font-medium">
                      ₹{cohort.averageLTV.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${
                        cohort.retentionRate >= 70 ? 'bg-green-500' :
                        cohort.retentionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {cohort.retentionRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {cohorts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No cohort data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Retention Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Retention Heatmap
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Percentage of customers retained each month after signup
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium sticky left-0 bg-background">Cohort</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M0</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M1</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M2</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M3</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M4</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M5</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M6</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M7</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M8</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M9</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M10</th>
                  <th className="text-center py-2 px-2 font-medium min-w-[50px]">M11</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => (
                  <tr key={cohort.cohortMonth} className="border-b">
                    <td className="py-2 px-3 font-medium sticky left-0 bg-background">
                      {format(new Date(cohort.cohortMonth + '-01'), 'MMM yyyy')}
                      <span className="text-xs text-muted-foreground ml-2">({cohort.totalLabs})</span>
                    </td>
                    {Array.from({ length: 12 }).map((_, idx) => {
                      const value = cohort.monthlyRetention[idx];
                      const hasData = idx < cohort.monthlyRetention.length && value !== undefined;
                      
                      return (
                        <td key={idx} className="text-center py-2 px-2">
                          {hasData ? (
                            <span 
                              className={`inline-block w-full py-1 rounded text-xs text-white ${getRetentionColor(value)}`}
                              title={`${value.toFixed(1)}% retention`}
                            >
                              {value.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {cohorts.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-muted-foreground">
                      No retention data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs">
            <span className="text-muted-foreground">Retention:</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-500" />
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-400" />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-yellow-400" />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-orange-400" />
              <span>20-39%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-red-400" />
              <span>&lt;20%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
