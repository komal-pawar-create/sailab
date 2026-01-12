import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, BarChart3, HelpCircle } from 'lucide-react';
import { useFollowupReminders } from '@/hooks/useFollowupReminders';
import { DashboardFilters, TimePeriod, Branch } from '@/components/dashboard/DashboardFilters';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { DataTabs } from '@/components/dashboard/DataTabs';
import { useDebounce } from '@/hooks/useDebounce';
import { OnboardingTour } from '@/components/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePatientsQuery,
  useReportsQuery,
  useDocumentsQuery,
  useBillsQuery,
  useFollowupsQuery,
  useFeedbackQuery,
  usePaymentsQuery,
  useTotalCollectedQuery,
  useStatsQuery,
  useBranchesQuery,
} from '@/hooks/queries/useDashboardQueries';

interface PaginationState {
  page: number;
  pageSize: number;
  search: string;
}

const defaultPagination: PaginationState = { page: 1, pageSize: 25, search: '' };

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'patients');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
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

  useFollowupReminders();
  const { resetTour } = useOnboardingTour();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'lab_admin';

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth');
      else if (profile?.role === 'super_admin') navigate('/super-admin');
    }
  }, [user, profile, loading, navigate]);

  // Fetch branches using TanStack Query
  const { data: branches = [] } = useBranchesQuery(profile?.branch_id, isAdmin);

  // Compute branch filter
  const branchIds = useMemo(() => {
    if (isAdmin && selectedBranch !== 'all') return [selectedBranch];
    if (isAdmin && selectedBranch === 'all' && branches.length > 0) return branches.map(b => b.id);
    return null;
  }, [isAdmin, selectedBranch, branches]);

  // Query filters
  const baseFilters = useMemo(() => ({ timePeriod, branchIds }), [timePeriod, branchIds]);

  // Data queries using TanStack Query hooks
  const patientsQuery = usePatientsQuery({
    ...baseFilters,
    page: patientsPag.page,
    pageSize: patientsPag.pageSize,
    search: debouncedPatientsSearch,
  });

  const reportsQuery = useReportsQuery({
    ...baseFilters,
    page: reportsPag.page,
    pageSize: reportsPag.pageSize,
    search: debouncedReportsSearch,
  });

  const documentsQuery = useDocumentsQuery({
    ...baseFilters,
    page: documentsPag.page,
    pageSize: documentsPag.pageSize,
    search: debouncedDocumentsSearch,
  });

  const billsQuery = useBillsQuery({
    ...baseFilters,
    page: billsPag.page,
    pageSize: billsPag.pageSize,
    search: debouncedBillsSearch,
  });

  const followupsQuery = useFollowupsQuery({
    ...baseFilters,
    page: followupsPag.page,
    pageSize: followupsPag.pageSize,
    search: debouncedFollowupsSearch,
  });

  const feedbackQuery = useFeedbackQuery({
    ...baseFilters,
    page: feedbackPag.page,
    pageSize: feedbackPag.pageSize,
    search: debouncedFeedbackSearch,
  });

  const paymentsQuery = usePaymentsQuery({
    ...baseFilters,
    page: paymentsPag.page,
    pageSize: paymentsPag.pageSize,
    search: debouncedPaymentsSearch,
  });

  const totalCollectedQuery = useTotalCollectedQuery(baseFilters);
  const statsQuery = useStatsQuery(baseFilters);

  // Check if any query is refreshing
  const isRefreshing = patientsQuery.isFetching || reportsQuery.isFetching || 
    documentsQuery.isFetching || billsQuery.isFetching || followupsQuery.isFetching || 
    feedbackQuery.isFetching || paymentsQuery.isFetching || statsQuery.isFetching;

  // Refetch all data
  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['bills'] });
    queryClient.invalidateQueries({ queryKey: ['followups'] });
    queryClient.invalidateQueries({ queryKey: ['feedback'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['totalCollected'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
  }, [queryClient]);

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

  const makePaginationProps = (
    pag: PaginationState, 
    setPag: React.Dispatch<React.SetStateAction<PaginationState>>,
    totalCount: number,
    isLoading: boolean
  ) => ({
    currentPage: pag.page,
    pageSize: pag.pageSize,
    totalCount,
    onPageChange: (page: number) => setPag(p => ({ ...p, page })),
    onPageSizeChange: (size: number) => setPag(p => ({ ...p, pageSize: size, page: 1 })),
    onSearch: (search: string) => setPag(p => ({ ...p, search, page: 1 })),
    isLoading,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <>
      <OnboardingTour />
      <div className="container mx-auto p-4 sm:p-6 space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {profile.full_name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={resetTour} title="Restart Tour">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={refetchAll} disabled={isRefreshing}>
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

        <StatsRow stats={statsQuery.data || { patients: 0, tests: 0, documents: 0, bills: 0, jpegImages: 0, pending: 0 }} />

        <DataTabs
          patients={patientsQuery.data?.data || []}
          reports={reportsQuery.data?.data || []}
          documents={documentsQuery.data?.data || []}
          bills={billsQuery.data?.data || []}
          followups={followupsQuery.data?.data || []}
          feedback={feedbackQuery.data?.data || []}
          payments={paymentsQuery.data?.data || []}
          totalCollected={totalCollectedQuery.data || 0}
          patientsPagination={makePaginationProps(patientsPag, setPatientsPag, patientsQuery.data?.count || 0, patientsQuery.isFetching)}
          reportsPagination={makePaginationProps(reportsPag, setReportsPag, reportsQuery.data?.count || 0, reportsQuery.isFetching)}
          documentsPagination={makePaginationProps(documentsPag, setDocumentsPag, documentsQuery.data?.count || 0, documentsQuery.isFetching)}
          billsPagination={makePaginationProps(billsPag, setBillsPag, billsQuery.data?.count || 0, billsQuery.isFetching)}
          followupsPagination={makePaginationProps(followupsPag, setFollowupsPag, followupsQuery.data?.count || 0, followupsQuery.isFetching)}
          feedbackPagination={makePaginationProps(feedbackPag, setFeedbackPag, feedbackQuery.data?.count || 0, feedbackQuery.isFetching)}
          paymentsPagination={makePaginationProps(paymentsPag, setPaymentsPag, paymentsQuery.data?.count || 0, paymentsQuery.isFetching)}
          onRefresh={refetchAll}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </>
  );
};

export default Dashboard;
