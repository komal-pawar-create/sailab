import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { samplesTable, SampleWithPatient } from '@/types/samples';
import { format, startOfWeek, startOfMonth, subMonths, startOfQuarter, subQuarters, startOfYear, subYears, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';

export type TimePeriod = 'today' | 'week' | 'month' | 'lastMonth' | 'lastQuarter' | 'lastYear' | 'all';

interface DateFilter {
  start: string;
  end?: string;
}

interface QueryFilters {
  timePeriod: TimePeriod;
  branchIds: string[] | null;
  page: number;
  pageSize: number;
  search: string;
}

// Utility: Get date filter from period
export function getDateFilter(period: TimePeriod): DateFilter | null {
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
}

// Utility: Apply date filter to query
function applyDateFilter<T>(query: T, dateFilter: DateFilter | null, dateColumn: string): T {
  if (!dateFilter) return query;
  let q = (query as any).gte(dateColumn, dateFilter.start);
  if (dateFilter.end) q = q.lte(dateColumn, dateFilter.end);
  return q as T;
}

// Patients query
export function usePatientsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('patients').select('*', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'created_at');
      if (filters.search) query = query.or(`full_name.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      query = query.order('created_at', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

// Reports query
export function useReportsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('test_reports').select('*, patients!test_reports_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'test_date');
      if (filters.search) query = query.or(`test_type.ilike.%${filters.search}%`);
      query = query.order('test_date', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Documents query
export function useDocumentsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('documents').select('*, patients!documents_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'created_at');
      if (filters.search) query = query.ilike('file_name', `%${filters.search}%`);
      query = query.order('created_at', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Bills query
export function useBillsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['bills', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('bills').select('*, patients!bills_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'bill_date');
      if (filters.search) query = query.or(`bill_number.ilike.%${filters.search}%`);
      query = query.order('bill_date', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Followups query
export function useFollowupsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['followups', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('patient_followups').select('*, patients!fk_patient_followups_patient(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'due_at');
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);
      query = query.order('due_at', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Feedback query
export function useFeedbackQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['feedback', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('feedback').select('*, patients!feedback_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'created_at');
      if (filters.search) query = query.or(`message.ilike.%${filters.search}%,feedback_type.ilike.%${filters.search}%`);
      query = query.order('created_at', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Payments query
export function usePaymentsQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = supabase.from('bill_payments').select('*, bills!bill_payments_bill_id_fkey(id, bill_number, total_amount, patients!bills_patient_id_fkey(id, full_name, patient_id))', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'payment_date');
      if (filters.search) query = query.or(`payment_method.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`);
      query = query.order('payment_date', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Samples query
export function useSamplesQuery(filters: QueryFilters) {
  return useQuery({
    queryKey: ['samples', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);
      const offset = (filters.page - 1) * filters.pageSize;

      let query = samplesTable().select('*, patients!samples_patient_id_fkey(id, full_name, patient_id)', { count: 'exact' });
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'collected_at');
      if (filters.search) query = query.or(`sample_id.ilike.%${filters.search}%,test_type.ilike.%${filters.search}%`);
      query = query.order('collected_at', { ascending: false }).range(offset, offset + filters.pageSize - 1);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data: (data || []) as SampleWithPatient[], count: count || 0 };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Total collected amount query
export function useTotalCollectedQuery(filters: Omit<QueryFilters, 'page' | 'pageSize' | 'search'>) {
  return useQuery({
    queryKey: ['totalCollected', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);

      let query = supabase.from('bill_payments').select('payment_amount');
      if (filters.branchIds) query = query.in('branch_id', filters.branchIds);
      query = applyDateFilter(query, dateFilter, 'payment_date');

      const { data, error } = await query;
      if (error) throw error;
      return data?.reduce((sum, p) => sum + p.payment_amount, 0) || 0;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Dashboard stats query
export function useStatsQuery(filters: Omit<QueryFilters, 'page' | 'pageSize' | 'search'>) {
  return useQuery({
    queryKey: ['dashboardStats', filters],
    queryFn: async () => {
      const dateFilter = getDateFilter(filters.timePeriod);

      let pQuery = supabase.from('patients').select('id', { count: 'exact', head: true });
      let rQuery = supabase.from('test_reports').select('id', { count: 'exact', head: true });
      let dQuery = supabase.from('documents').select('id', { count: 'exact', head: true });
      let bQuery = supabase.from('bills').select('due_amount');
      let jpgQuery = supabase.from('documents').select('id', { count: 'exact', head: true }).eq('file_type', 'image/jpeg');
      let commQuery = supabase.from('doctor_commissions' as any).select('commission_amount').eq('status', 'pending');
      let sampQuery = (supabase.from('samples' as any) as any).select('id', { count: 'exact', head: true });
      if (filters.branchIds) {
        pQuery = pQuery.in('branch_id', filters.branchIds);
        rQuery = rQuery.in('branch_id', filters.branchIds);
        dQuery = dQuery.in('branch_id', filters.branchIds);
        bQuery = bQuery.in('branch_id', filters.branchIds);
        jpgQuery = jpgQuery.in('branch_id', filters.branchIds);
        commQuery = commQuery.in('branch_id', filters.branchIds);
        sampQuery = sampQuery.in('branch_id', filters.branchIds);
      }
      if (dateFilter) {
        pQuery = applyDateFilter(pQuery, dateFilter, 'created_at');
        rQuery = applyDateFilter(rQuery, dateFilter, 'test_date');
        dQuery = applyDateFilter(dQuery, dateFilter, 'created_at');
        bQuery = applyDateFilter(bQuery, dateFilter, 'bill_date');
        jpgQuery = applyDateFilter(jpgQuery, dateFilter, 'created_at');
        commQuery = applyDateFilter(commQuery, dateFilter, 'created_at');
        sampQuery = applyDateFilter(sampQuery, dateFilter, 'collected_at');
      }

      const [pResult, rResult, dResult, billsResult, jpgResult, commResult, sampResult] = await Promise.all([pQuery, rQuery, dQuery, bQuery, jpgQuery, commQuery, sampQuery]);
      
      return {
        patients: pResult.count || 0,
        tests: rResult.count || 0,
        documents: dResult.count || 0,
        bills: billsResult.data?.length || 0,
        jpegImages: jpgResult.count || 0,
        pending: billsResult.data?.reduce((sum, b) => sum + (b.due_amount || 0), 0) || 0,
        pendingCommissions: (commResult.data as any[])?.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0) || 0,
        samplesCount: (sampResult as any).count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
    gcTime: 15 * 60 * 1000,
  });
}

// Branches query
export function useBranchesQuery(profileBranchId: string | undefined, isAdmin: boolean) {
  return useQuery({
    queryKey: ['branches', profileBranchId],
    queryFn: async () => {
      if (!profileBranchId) return [];
      
      const { data: userBranch } = await supabase
        .from('branches')
        .select('organization_id')
        .eq('id', profileBranchId)
        .single();
      
      if (!userBranch?.organization_id) return [];
      
      const { data: orgBranches } = await supabase
        .from('branches')
        .select('id, name')
        .eq('organization_id', userBranch.organization_id)
        .order('name');
      
      return orgBranches || [];
    },
    enabled: isAdmin && !!profileBranchId,
    staleTime: 10 * 60 * 1000, // 10 minutes for branches
    gcTime: 30 * 60 * 1000,
  });
}
