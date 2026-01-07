import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, BarChart3, HelpCircle } from 'lucide-react';
import { useFollowupReminders } from '@/hooks/useFollowupReminders';
import { DashboardFilters, TimePeriod, Branch } from '@/components/dashboard/DashboardFilters';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { DataTabs } from '@/components/dashboard/DataTabs';
import { useDebounce } from '@/hooks/useDebounce';
import { format, startOfWeek, startOfMonth, subMonths, startOfQuarter, subQuarters, startOfYear, subYears, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  search: string;
}

const defaultPagination: PaginationState = { page: 1, pageSize: 25, totalCount: 0, search: '' };

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'patients');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Pagination states for each table
  const [patientsPag, setPatientsPag] = useState<PaginationState>(defaultPagination);
  const [reportsPag, setReportsPag] = useState<PaginationState>(defaultPagination);
  const [documentsPag, setDocumentsPag] = useState<PaginationState>(defaultPagination);
  const [billsPag, setBillsPag] = useState<PaginationState>(defaultPagination);
  const [followupsPag, setFollowupsPag] = useState<PaginationState>(defaultPagination);
  const [feedbackPag, setFeedbackPag] = useState<PaginationState>(defaultPagination);
  const [paymentsPag, setPaymentsPag] = useState<PaginationState>(defaultPagination);

  // Debounced search values
  const debouncedPatientsSearch = useDebounce(patientsPag.search, 300);
  const debouncedReportsSearch = useDebounce(reportsPag.search, 300);
  const debouncedDocumentsSearch = useDebounce(documentsPag.search, 300);
  const debouncedBillsSearch = useDebounce(billsPag.search, 300);
  const debouncedFollowupsSearch = useDebounce(followupsPag.search, 300);
  const debouncedFeedbackSearch = useDebounce(feedbackPag.search, 300);
  const debouncedPaymentsSearch = useDebounce(paymentsPag.search, 300);

  // Data states
  const [patients, setPatients] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [stats, setStats] = useState({ patients: 0, tests: 0, documents: 0, bills: 0, jpegImages: 0, pending: 0 });

  useFollowupReminders();
  const { resetTour } = useOnboardingTour();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin';

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth');
      else if (profile?.role === 'super_admin') navigate('/super-admin');
    }
  }, [user, profile, loading, navigate]);

  // Fetch branches for admin users
  useEffect(() => {
    const fetchBranches = async () => {
      if (!isAdmin || !profile?.branch_id) return;
      try {
        const { data: userBranch } = await supabase.from('branches').select('organization_id').eq('id', profile.branch_id).single();
        if (userBranch?.organization_id) {
          const { data: orgBranches } = await supabase.from('branches').select('id, name').eq('organization_id', userBranch.organization_id).order('name');
          setBranches(orgBranches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    if (!loading && user && profile) fetchBranches();
  }, [user, profile, loading, isAdmin]);

  const getDateFilter = (period: TimePeriod): { start: string; end?: string } | null => {
    const now = new Date();
    switch (period) {
      case 'today': 
        return { start: format(now, 'yyyy-MM-dd') };
      case 'week': 
        return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
      case 'month': 
        return { start: format(startOfMonth(now), 'yyyy-MM-dd') };
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        return { 
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      }
      case 'lastQuarter': {
        const lastQuarter = subQuarters(now, 1);
        return { 
          start: format(startOfQuarter(lastQuarter), 'yyyy-MM-dd'),
          end: format(endOfQuarter(lastQuarter), 'yyyy-MM-dd')
        };
      }
      case 'lastYear': {
        const lastYear = subYears(now, 1);
        return { 
          start: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          end: format(endOfYear(lastYear), 'yyyy-MM-dd')
        };
      }
      default: 
        return null;
    }
  };

  // Helper to apply date filter to a query
  const applyDateFilter = (query: any, dateFilter: { start: string; end?: string } | null, dateColumn: string) => {
    if (!dateFilter) return query;
    query = query.gte(dateColumn, dateFilter.start);
    if (dateFilter.end) query = query.lte(dateColumn, dateFilter.end);
    return query;
  };

  const getBranchFilter = useCallback(() => {
    if (isAdmin && selectedBranch !== 'all') return [selectedBranch];
    if (isAdmin && selectedBranch === 'all' && branches.length > 0) return branches.map(b => b.id);
    return null;
  }, [isAdmin, selectedBranch, branches]);

  // Fetch patients with pagination
  const fetchPatients = useCallback(async () => {
    if (!profile) return;
    setIsRefreshing(true);
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = patientsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('patients').select('*', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'created_at');
    if (search) query = query.or(`full_name.ilike.%${search}%,patient_id.ilike.%${search}%,phone.ilike.%${search}%`);
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setPatients(data || []);
    setPatientsPag(p => ({ ...p, totalCount: count || 0 }));
    setIsRefreshing(false);
  }, [profile, timePeriod, patientsPag.page, patientsPag.pageSize, debouncedPatientsSearch, getBranchFilter]);

  // Fetch reports with pagination
  const fetchReports = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = reportsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('test_reports').select('*, patients!test_reports_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'test_date');
    if (search) query = query.or(`test_type.ilike.%${search}%`);
    query = query.order('test_date', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setReports(data || []);
    setReportsPag(p => ({ ...p, totalCount: count || 0 }));
  }, [profile, timePeriod, reportsPag.page, reportsPag.pageSize, debouncedReportsSearch, getBranchFilter]);

  // Fetch documents with pagination
  const fetchDocuments = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = documentsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('documents').select('*, patients!documents_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'created_at');
    if (search) query = query.ilike('file_name', `%${search}%`);
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setDocuments(data || []);
    setDocumentsPag(p => ({ ...p, totalCount: count || 0 }));
  }, [profile, timePeriod, documentsPag.page, documentsPag.pageSize, debouncedDocumentsSearch, getBranchFilter]);

  // Fetch bills with pagination
  const fetchBills = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = billsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('bills').select('*, patients!bills_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'bill_date');
    if (search) query = query.or(`bill_number.ilike.%${search}%`);
    query = query.order('bill_date', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setBills(data || []);
    setBillsPag(p => ({ ...p, totalCount: count || 0 }));
  }, [profile, timePeriod, billsPag.page, billsPag.pageSize, debouncedBillsSearch, getBranchFilter]);

  // Fetch followups with pagination
  const fetchFollowups = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = followupsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('patient_followups').select('*, patients!fk_patient_followups_patient(id, full_name, patient_id)', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'due_at');
    if (search) query = query.ilike('title', `%${search}%`);
    query = query.order('due_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setFollowups(data || []);
    setFollowupsPag(p => ({ ...p, totalCount: count || 0 }));
  }, [profile, timePeriod, followupsPag.page, followupsPag.pageSize, debouncedFollowupsSearch, getBranchFilter]);

  // Fetch feedback with pagination
  const fetchFeedback = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = feedbackPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('feedback').select('*, patients!feedback_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'created_at');
    if (search) query = query.or(`message.ilike.%${search}%,feedback_type.ilike.%${search}%`);
    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setFeedback(data || []);
    setFeedbackPag(p => ({ ...p, totalCount: count || 0 }));
  }, [profile, timePeriod, feedbackPag.page, feedbackPag.pageSize, debouncedFeedbackSearch, getBranchFilter]);

  // Fetch payments with pagination
  const fetchPayments = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();
    const { page, pageSize, search } = paymentsPag;
    const offset = (page - 1) * pageSize;

    let query = supabase.from('bill_payments').select('*, bills!bill_payments_bill_id_fkey(id, bill_number, total_amount, patients!bills_patient_id_fkey(id, full_name, patient_id))', { count: 'exact' });
    if (branchFilter) query = query.in('branch_id', branchFilter);
    query = applyDateFilter(query, dateFilter, 'payment_date');
    if (search) query = query.or(`payment_method.ilike.%${search}%,reference_number.ilike.%${search}%`);
    query = query.order('payment_date', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count } = await query;
    setPayments(data || []);
    setPaymentsPag(p => ({ ...p, totalCount: count || 0 }));

    // Get total collected
    let totalQuery = supabase.from('bill_payments').select('payment_amount');
    if (branchFilter) totalQuery = totalQuery.in('branch_id', branchFilter);
    totalQuery = applyDateFilter(totalQuery, dateFilter, 'payment_date');
    const { data: totalData } = await totalQuery;
    setTotalCollected(totalData?.reduce((sum, p) => sum + p.payment_amount, 0) || 0);
    setTotalCollected(totalData?.reduce((sum, p) => sum + p.payment_amount, 0) || 0);
  }, [profile, timePeriod, paymentsPag.page, paymentsPag.pageSize, debouncedPaymentsSearch, getBranchFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!profile) return;
    const dateFilter = getDateFilter(timePeriod);
    const branchFilter = getBranchFilter();

    let pQuery = supabase.from('patients').select('id', { count: 'exact', head: true });
    let rQuery = supabase.from('test_reports').select('id', { count: 'exact', head: true });
    let dQuery = supabase.from('documents').select('id', { count: 'exact', head: true });
    let bQuery = supabase.from('bills').select('due_amount');
    let jpgQuery = supabase.from('documents').select('id', { count: 'exact', head: true }).eq('file_type', 'image/jpeg');

    if (branchFilter) {
      pQuery = pQuery.in('branch_id', branchFilter);
      rQuery = rQuery.in('branch_id', branchFilter);
      dQuery = dQuery.in('branch_id', branchFilter);
      bQuery = bQuery.in('branch_id', branchFilter);
      jpgQuery = jpgQuery.in('branch_id', branchFilter);
    }
    if (dateFilter) {
      pQuery = applyDateFilter(pQuery, dateFilter, 'created_at');
      rQuery = applyDateFilter(rQuery, dateFilter, 'test_date');
      dQuery = applyDateFilter(dQuery, dateFilter, 'created_at');
      bQuery = applyDateFilter(bQuery, dateFilter, 'bill_date');
      jpgQuery = applyDateFilter(jpgQuery, dateFilter, 'created_at');
    }

    const [{ count: pCount }, { count: rCount }, { count: dCount }, { data: billsData }, { count: jpgCount }] = await Promise.all([pQuery, rQuery, dQuery, bQuery, jpgQuery]);
    
    setStats({
      patients: pCount || 0,
      tests: rCount || 0,
      documents: dCount || 0,
      bills: billsData?.length || 0,
      jpegImages: jpgCount || 0,
      pending: billsData?.reduce((sum, b) => sum + (b.due_amount || 0), 0) || 0,
    });
  }, [profile, timePeriod, getBranchFilter]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!loading && user && profile && profile.role !== 'super_admin') {
      await Promise.all([fetchPatients(), fetchReports(), fetchDocuments(), fetchBills(), fetchFollowups(), fetchFeedback(), fetchPayments(), fetchStats()]);
    }
  }, [loading, user, profile, fetchPatients, fetchReports, fetchDocuments, fetchBills, fetchFollowups, fetchFeedback, fetchPayments, fetchStats]);

  useEffect(() => { fetchAll(); }, [timePeriod, selectedBranch, branches]);
  useEffect(() => { fetchPatients(); }, [patientsPag.page, patientsPag.pageSize, debouncedPatientsSearch]);
  useEffect(() => { fetchReports(); }, [reportsPag.page, reportsPag.pageSize, debouncedReportsSearch]);
  useEffect(() => { fetchDocuments(); }, [documentsPag.page, documentsPag.pageSize, debouncedDocumentsSearch]);
  useEffect(() => { fetchBills(); }, [billsPag.page, billsPag.pageSize, debouncedBillsSearch]);
  useEffect(() => { fetchFollowups(); }, [followupsPag.page, followupsPag.pageSize, debouncedFollowupsSearch]);
  useEffect(() => { fetchFeedback(); }, [feedbackPag.page, feedbackPag.pageSize, debouncedFeedbackSearch]);
  useEffect(() => { fetchPayments(); }, [paymentsPag.page, paymentsPag.pageSize, debouncedPaymentsSearch]);

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

  if (!user || !profile) return null;

  const makePaginationProps = (pag: PaginationState, setPag: React.Dispatch<React.SetStateAction<PaginationState>>) => ({
    currentPage: pag.page,
    pageSize: pag.pageSize,
    totalCount: pag.totalCount,
    onPageChange: (page: number) => setPag(p => ({ ...p, page })),
    onPageSizeChange: (size: number) => setPag(p => ({ ...p, pageSize: size, page: 1 })),
    onSearch: (search: string) => setPag(p => ({ ...p, search, page: 1 })),
    isLoading: isRefreshing,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <>
      <OnboardingTour />
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {profile.full_name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={resetTour} title="Restart Tour">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

      <DashboardFilters 
        value={timePeriod} 
        onChange={setTimePeriod}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        showBranchFilter={isAdmin && branches.length > 1}
      />

      <StatsRow stats={stats} />

      <DataTabs
        patients={patients}
        reports={reports}
        documents={documents}
        bills={bills}
        followups={followups}
        feedback={feedback}
        payments={payments}
        totalCollected={totalCollected}
        patientsPagination={makePaginationProps(patientsPag, setPatientsPag)}
        reportsPagination={makePaginationProps(reportsPag, setReportsPag)}
        documentsPagination={makePaginationProps(documentsPag, setDocumentsPag)}
        billsPagination={makePaginationProps(billsPag, setBillsPag)}
        followupsPagination={makePaginationProps(followupsPag, setFollowupsPag)}
        feedbackPagination={makePaginationProps(feedbackPag, setFeedbackPag)}
        paymentsPagination={makePaginationProps(paymentsPag, setPaymentsPag)}
        onRefresh={fetchAll}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      </div>
    </>
  );
};

export default Dashboard;
