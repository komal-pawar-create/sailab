import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, TestTube, FileText, Receipt, 
  CreditCard, TrendingUp, DollarSign, Star,
  RefreshCw, BarChart3, Calendar
} from 'lucide-react';
import { useFollowupReminders } from '@/hooks/useFollowupReminders';
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { DashboardFilters, TimePeriod } from '@/components/dashboard/DashboardFilters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { Layout } from 'react-grid-layout';

interface Stats {
  totalPatients: number;
  totalReports: number;
  totalDocuments: number;
  totalBills: number;
  totalRevenue: number;
  pendingAmount: number;
  averageRating: number;
  todayPatients: number;
  todayTests: number;
  pendingTests: number;
  filteredPatients: number;
  filteredTests: number;
  filteredRevenue: number;
  filteredBills: number;
}

interface RecentItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalReports: 0,
    totalDocuments: 0,
    totalBills: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    averageRating: 0,
    todayPatients: 0,
    todayTests: 0,
    pendingTests: 0,
    filteredPatients: 0,
    filteredTests: 0,
    filteredRevenue: 0,
    filteredBills: 0,
  });

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFollowupReminders();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile?.role === 'super_admin') {
        navigate('/super-admin');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'super_admin') {
      fetchDashboardData();
    }
  }, [user, profile, loading, timePeriod]);

  const getDateFilter = (period: TimePeriod): string | null => {
    const now = new Date();
    switch (period) {
      case 'today':
        return format(now, 'yyyy-MM-dd');
      case 'week':
        return format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      case 'month':
        return format(startOfMonth(now), 'yyyy-MM-dd');
      case 'all':
      default:
        return null;
    }
  };

  const getFilterLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'today':
        return "today";
      case 'week':
        return "this week";
      case 'month':
        return "this month";
      case 'all':
      default:
        return "all time";
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
      if (!profile?.lab_id) {
        if (!loading) {
          toast({
            title: "Error",
            description: "User is not assigned to any lab",
            variant: "destructive",
          });
        }
        return;
      }

      const isBranchOperator = profile && ['operator_1', 'operator_2', 'operator_3'].includes(profile.role);
      const today = new Date().toISOString().split('T')[0];
      const dateFilter = getDateFilter(timePeriod);

      // Fetch all data with branch filtering if needed
      let patientsQuery = supabase.from('patients').select('*').eq('lab_id', profile.lab_id);
      let reportsQuery = supabase.from('test_reports').select('*, patients(full_name)').eq('lab_id', profile.lab_id);
      let documentsQuery = supabase.from('documents').select('*').eq('lab_id', profile.lab_id);
      let billsQuery = supabase.from('bills').select('*, patients(full_name, patient_id)').eq('lab_id', profile.lab_id);
      let feedbackQuery = supabase.from('feedback').select('rating').eq('lab_id', profile.lab_id);

      if (isBranchOperator && profile?.branch_id) {
        patientsQuery = patientsQuery.eq('branch_id', profile.branch_id);
        reportsQuery = reportsQuery.eq('branch_id', profile.branch_id);
        documentsQuery = documentsQuery.eq('branch_id', profile.branch_id);
        billsQuery = billsQuery.eq('branch_id', profile.branch_id);
        feedbackQuery = feedbackQuery.eq('branch_id', profile.branch_id);
      }

      const [
        { data: patients },
        { data: reports },
        { data: documents },
        { data: bills },
        { data: feedbacks }
      ] = await Promise.all([
        patientsQuery,
        reportsQuery,
        documentsQuery,
        billsQuery,
        feedbackQuery
      ]);

      // Filter data based on time period
      const filterByDate = <T extends { created_at?: string; test_date?: string; bill_date?: string }>(
        data: T[] | null,
        dateField: 'created_at' | 'test_date' | 'bill_date'
      ): T[] => {
        if (!data || !dateFilter) return data || [];
        return data.filter(item => {
          const itemDate = item[dateField];
          if (!itemDate) return false;
          return itemDate >= dateFilter;
        });
      };

      const filteredPatients = filterByDate(patients, 'created_at');
      const filteredReports = filterByDate(reports, 'test_date');
      const filteredBills = filterByDate(bills, 'bill_date');

      // Calculate stats
      const todayPatients = patients?.filter(p => p.created_at.startsWith(today)).length || 0;
      const todayTests = reports?.filter(r => r.test_date.startsWith(today)).length || 0;
      const pendingTests = reports?.filter(r => r.status === 'pending').length || 0;
      
      const totalRevenue = bills?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const pendingAmount = bills?.reduce((sum, bill) => sum + bill.due_amount, 0) || 0;
      const filteredRevenue = filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0);
      
      const avgRating = feedbacks?.length 
        ? feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length 
        : 0;

      setStats({
        totalPatients: patients?.length || 0,
        totalReports: reports?.length || 0,
        totalDocuments: documents?.length || 0,
        totalBills: bills?.length || 0,
        totalRevenue,
        pendingAmount,
        averageRating: Math.round(avgRating * 10) / 10,
        todayPatients,
        todayTests,
        pendingTests,
        filteredPatients: filteredPatients.length,
        filteredTests: filteredReports.length,
        filteredRevenue,
        filteredBills: filteredBills.length,
      });

      // Prepare recent items (always show recent regardless of filter)
      const recent: RecentItem[] = [];
      
      patients?.slice(0, 5).forEach(p => {
        recent.push({
          id: p.id,
          type: 'patient',
          title: p.full_name,
          subtitle: `Patient ID: ${p.patient_id}`,
          timestamp: p.created_at,
        });
      });

      reports?.slice(0, 5).forEach(r => {
        recent.push({
          id: r.id,
          type: 'test',
          title: r.test_type,
          subtitle: (r.patients as any)?.full_name || 'Unknown',
          timestamp: r.test_date,
          status: r.status,
        });
      });

      recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentItems(recent.slice(0, 10));

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Define role-based layouts
  const getDefaultLayout = (role: string): Layout[] => {
    const commonLayouts = [
      { i: 'quick-actions', x: 0, y: 0, w: 12, h: 3 },
      { i: 'stats-patients', x: 0, y: 3, w: 3, h: 4 },
      { i: 'stats-tests', x: 3, y: 3, w: 3, h: 4 },
      { i: 'stats-revenue', x: 6, y: 3, w: 3, h: 4 },
      { i: 'stats-pending', x: 9, y: 3, w: 3, h: 4 },
    ];

    if (role === 'admin' || role === 'lab_admin') {
      return [
        ...commonLayouts,
        { i: 'activity-feed', x: 0, y: 7, w: 6, h: 14 },
        { i: 'recent-items', x: 6, y: 7, w: 6, h: 14 },
        { i: 'stats-today', x: 0, y: 21, w: 4, h: 4 },
        { i: 'stats-rating', x: 4, y: 21, w: 4, h: 4 },
        { i: 'stats-documents', x: 8, y: 21, w: 4, h: 4 },
      ];
    } else {
      return [
        ...commonLayouts,
        { i: 'activity-feed', x: 0, y: 7, w: 12, h: 14 },
        { i: 'recent-items', x: 0, y: 21, w: 12, h: 10 },
      ];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const filterLabel = getFilterLabel(timePeriod);

  const widgets = [
    <QuickActions key="quick-actions" />,
    <StatsWidget 
      key="stats-patients"
      title="Patients"
      value={stats.filteredPatients}
      icon={Users}
      trend={timePeriod !== 'all' ? { value: Math.round((stats.filteredPatients / Math.max(stats.totalPatients, 1)) * 100), isPositive: true } : undefined}
      description={timePeriod === 'all' ? `${stats.todayPatients} registered today` : `${stats.totalPatients} total`}
    />,
    <StatsWidget 
      key="stats-tests"
      title="Tests"
      value={stats.filteredTests}
      icon={TestTube}
      trend={timePeriod !== 'all' ? { value: Math.round((stats.filteredTests / Math.max(stats.totalReports, 1)) * 100), isPositive: true } : undefined}
      description={timePeriod === 'all' ? `${stats.pendingTests} pending` : `${stats.totalReports} total`}
    />,
    <StatsWidget 
      key="stats-revenue"
      title="Revenue"
      value={`₹${stats.filteredRevenue.toLocaleString()}`}
      icon={DollarSign}
      trend={timePeriod !== 'all' ? { value: Math.round((stats.filteredRevenue / Math.max(stats.totalRevenue, 1)) * 100), isPositive: true } : undefined}
      description={timePeriod === 'all' ? undefined : `₹${stats.totalRevenue.toLocaleString()} total`}
    />,
    <StatsWidget 
      key="stats-pending"
      title="Pending Amount"
      value={`₹${stats.pendingAmount.toLocaleString()}`}
      icon={CreditCard}
      description="Outstanding payments"
    />,
    <ActivityFeed key="activity-feed" />,
    <DashboardWidget key="recent-items" title="Recent Items" icon={Calendar}>
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {recentItems.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No recent items
            </div>
          ) : (
            recentItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {item.status && (
                  <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </DashboardWidget>,
  ];

  // Add admin-specific widgets
  if (profile.role === 'admin' || profile.role === 'lab_admin') {
    widgets.push(
      <StatsWidget 
        key="stats-today"
        title="Today's Activity"
        value={stats.todayTests}
        icon={TrendingUp}
        description={`${stats.todayPatients} new patients`}
      />,
      <StatsWidget 
        key="stats-rating"
        title="Average Rating"
        value={stats.averageRating}
        icon={Star}
        description="Customer satisfaction"
      />,
      <StatsWidget 
        key="stats-documents"
        title="Documents"
        value={stats.totalDocuments}
        icon={FileText}
        description="Total uploaded"
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.full_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex items-center gap-4">
        <DashboardFilters value={timePeriod} onChange={setTimePeriod} />
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Showing stats for {filterLabel}
        </span>
      </div>

      {/* Customizable Dashboard Layout */}
      <DashboardLayout
        defaultLayout={getDefaultLayout(profile.role)}
        storageKey="dashboard-layout"
        role={profile.role}
      >
        {widgets}
      </DashboardLayout>
    </div>
  );
};

export default Dashboard;
