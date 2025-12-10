import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { useFollowupReminders } from '@/hooks/useFollowupReminders';
import { DashboardFilters, TimePeriod, Branch } from '@/components/dashboard/DashboardFilters';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { DataTabs } from '@/components/dashboard/DataTabs';
import { format, startOfWeek, startOfMonth } from 'date-fns';

interface DashboardData {
  patients: any[];
  reports: any[];
  documents: any[];
  bills: any[];
  followups: any[];
  feedback: any[];
  payments: any[];
}

interface PeriodCounts {
  today: number;
  week: number;
  month: number;
  all: number;
}

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    patients: [],
    reports: [],
    documents: [],
    bills: [],
    followups: [],
    feedback: [],
    payments: [],
  });
  const [patientCounts, setPatientCounts] = useState<PeriodCounts>({ today: 0, week: 0, month: 0, all: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  useFollowupReminders();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin';
  const isBranchOperator = profile && ['operator_1', 'operator_2', 'operator_3', 'branch_operator'].includes(profile.role);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile?.role === 'super_admin') {
        navigate('/super-admin');
      }
    }
  }, [user, profile, loading, navigate]);

  // Fetch branches for admin users
  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin || !profile?.branch_id) return;
      
      try {
        // Get organization ID from user's branch
        const { data: userBranch } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', profile.branch_id)
          .single();

        if (userBranch?.organization_id) {
          // Fetch all branches in the organization
          const { data: orgBranches } = await supabase
            .from('branches')
            .select('id, name')
            .eq('organization_id', userBranch.organization_id)
            .order('name');

          setBranches(orgBranches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    if (!loading && user && profile) {
      fetchBranches();
    }
  }, [user, profile, loading, isAdmin]);

  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'super_admin') {
      fetchDashboardData();
    }
  }, [user, profile, loading, timePeriod, selectedBranch]);

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

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      
      if (!profile?.lab_id && !isAdmin) {
        if (!loading) {
          toast({
            title: "Error",
            description: "User is not assigned to any lab",
            variant: "destructive",
          });
        }
        return;
      }

      const dateFilter = getDateFilter(timePeriod);
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      const weekDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const monthDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Build queries - RLS handles branch-level filtering automatically
      // For admins, we add explicit branch filtering for cross-branch visibility
      // For operators, RLS policies already restrict to their branch
      let patientsQuery = supabase.from('patients').select('*').order('created_at', { ascending: false });
      let reportsQuery = supabase.from('test_reports').select('*, patients(id, full_name, patient_id)').order('test_date', { ascending: false });
      let documentsQuery = supabase.from('documents').select('*, patients:patient_id(id, full_name, patient_id)').order('created_at', { ascending: false });
      let billsQuery = supabase.from('bills').select('*, patients(id, full_name, patient_id)').order('bill_date', { ascending: false });
      let followupsQuery = supabase.from('patient_followups').select('*, patients:patient_id(id, full_name, patient_id)').order('due_at', { ascending: false });
      let feedbackQuery = supabase.from('feedback').select('*, patients:patient_id(id, full_name, patient_id)').order('created_at', { ascending: false });
      let paymentsQuery = supabase.from('bill_payments').select('*, bills(id, bill_number, total_amount, patients(id, full_name, patient_id))').order('payment_date', { ascending: false });

      // Only apply explicit branch filtering for admins who want to filter by specific branch
      // For operators, RLS already handles branch-level access - no need for client-side filtering
      if (isAdmin && selectedBranch !== 'all') {
        const branchFilter = [selectedBranch];
        patientsQuery = patientsQuery.in('branch_id', branchFilter);
        reportsQuery = reportsQuery.in('branch_id', branchFilter);
        documentsQuery = documentsQuery.in('branch_id', branchFilter);
        billsQuery = billsQuery.in('branch_id', branchFilter);
        followupsQuery = followupsQuery.in('branch_id', branchFilter);
        feedbackQuery = feedbackQuery.in('branch_id', branchFilter);
        paymentsQuery = paymentsQuery.in('branch_id', branchFilter);
      } else if (isAdmin && selectedBranch === 'all' && branches.length > 0) {
        // Admin viewing all branches - filter by organization branches
        const branchIds = branches.map(b => b.id);
        patientsQuery = patientsQuery.in('branch_id', branchIds);
        reportsQuery = reportsQuery.in('branch_id', branchIds);
        documentsQuery = documentsQuery.in('branch_id', branchIds);
        billsQuery = billsQuery.in('branch_id', branchIds);
        followupsQuery = followupsQuery.in('branch_id', branchIds);
        feedbackQuery = feedbackQuery.in('branch_id', branchIds);
        paymentsQuery = paymentsQuery.in('branch_id', branchIds);
      }
      // For non-admin (operators), don't add .in() filter - let RLS handle it automatically

      const [
        { data: patients },
        { data: reports },
        { data: documents },
        { data: bills },
        { data: followups },
        { data: feedbackData },
        { data: payments }
      ] = await Promise.all([
        patientsQuery,
        reportsQuery,
        documentsQuery,
        billsQuery,
        followupsQuery,
        feedbackQuery,
        paymentsQuery
      ]);

      // Calculate patient counts for each period
      const allPatients = patients || [];
      setPatientCounts({
        today: allPatients.filter(p => p.created_at >= todayDate).length,
        week: allPatients.filter(p => p.created_at >= weekDate).length,
        month: allPatients.filter(p => p.created_at >= monthDate).length,
        all: allPatients.length,
      });

      // Filter data based on time period
      const filterByDate = <T extends { created_at?: string; test_date?: string; bill_date?: string; due_at?: string; payment_date?: string }>(
        dataArr: T[] | null,
        dateField: 'created_at' | 'test_date' | 'bill_date' | 'due_at' | 'payment_date'
      ): T[] => {
        if (!dataArr || !dateFilter) return dataArr || [];
        return dataArr.filter(item => {
          const itemDate = item[dateField];
          if (!itemDate) return false;
          return itemDate >= dateFilter;
        });
      };

      setData({
        patients: filterByDate(patients, 'created_at'),
        reports: filterByDate(reports, 'test_date'),
        documents: filterByDate(documents, 'created_at'),
        bills: filterByDate(bills, 'bill_date'),
        followups: filterByDate(followups, 'due_at'),
        feedback: filterByDate(feedbackData, 'created_at'),
        payments: filterByDate(payments, 'payment_date'),
      });

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

  // Calculate stats from filtered data
  const stats = {
    patients: data.patients.length,
    tests: data.reports.length,
    documents: data.documents.length,
    bills: data.bills.length,
    revenue: data.bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0),
    pending: data.bills.reduce((sum, bill) => sum + (bill.due_amount || 0), 0),
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

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
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

      {/* Time Period Filter with Branch Dropdown for Admins */}
      <DashboardFilters 
        value={timePeriod} 
        onChange={setTimePeriod}
        counts={patientCounts}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        showBranchFilter={isAdmin && branches.length > 1}
      />

      {/* Stats Row */}
      <StatsRow stats={stats} />

      {/* Tabbed Data Sections */}
      <DataTabs
        patients={data.patients}
        reports={data.reports}
        documents={data.documents}
        bills={data.bills}
        followups={data.followups}
        feedback={data.feedback}
        payments={data.payments}
        onRefresh={fetchDashboardData}
      />
    </div>
  );
};

export default Dashboard;
