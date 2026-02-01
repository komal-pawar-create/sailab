
# LabFlow Database Production Optimization Plan

## Overview
Optimize the LabFlow database for production scale (100k+ records) by adding strategic indexes, partial indexes for common filters, a materialized view for dashboard statistics, and preparing for future partitioning.

---

## Current State Analysis

### Query Patterns Identified

| Table | Primary Query Patterns | Filters Used |
|-------|----------------------|--------------|
| **patients** | List by lab/branch, search by name/phone/patient_id, date filtering | `lab_id`, `branch_id`, `created_at`, `full_name ILIKE`, `phone ILIKE` |
| **bills** | List by lab/branch, date range, status filtering, join to patients | `lab_id`, `branch_id`, `bill_date`, `status`, `patient_id` |
| **test_reports** | List by lab/branch, date range, status filtering, join to patients | `lab_id`, `branch_id`, `test_date`, `status`, `patient_id` |
| **bill_payments** | List by branch, date range, join to bills | `branch_id`, `payment_date`, `bill_id` |
| **documents** | List by branch, date range, file type filtering | `branch_id`, `created_at`, `file_type` |
| **test_types** | List by branch/lab | `lab_id`, `branch_id` |

### Dashboard Stats Queries (Performance Critical)
The dashboard executes 5+ parallel count queries on every load:
- `patients` count with branch + date filter
- `test_reports` count with branch + date filter  
- `documents` count with branch + date filter
- `bills` sum of due_amount with branch + date filter
- `documents` count where file_type = 'image/jpeg'

---

## Implementation Plan

### Phase 1: B-Tree Indexes for Core Tables

#### patients Table
```sql
-- Primary lookup index (already exists via RLS, but explicit helps)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_lab_id 
  ON public.patients (lab_id);

-- Branch-scoped queries (operators see their branch)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_branch_id 
  ON public.patients (branch_id);

-- Search by name within lab (dashboard search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_lab_full_name 
  ON public.patients (lab_id, full_name);

-- Phone lookup (unique per lab, but also searched)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_lab_phone 
  ON public.patients (lab_id, phone);

-- Date-range queries on dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patients_branch_created 
  ON public.patients (branch_id, created_at DESC);
```

#### bills Table
```sql
-- Status + date queries (most common dashboard filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_lab_status_date 
  ON public.bills (lab_id, status, bill_date DESC);

-- Branch scoped date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_branch_date 
  ON public.bills (branch_id, bill_date DESC);

-- Patient history lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_patient_id 
  ON public.bills (patient_id);

-- Outstanding amount queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_lab_due_amount 
  ON public.bills (lab_id, due_amount) 
  WHERE due_amount > 0;
```

#### test_reports Table
```sql
-- Status filtering (pending, in_progress commonly queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_lab_status 
  ON public.test_reports (lab_id, status);

-- Branch + date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_branch_date 
  ON public.test_reports (branch_id, test_date DESC);

-- Patient history lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_patient_id 
  ON public.test_reports (patient_id);

-- Date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_lab_date 
  ON public.test_reports (lab_id, test_date DESC);
```

#### bill_payments Table
```sql
-- Date range queries for collection reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bill_payments_branch_date 
  ON public.bill_payments (branch_id, payment_date DESC);

-- Bill lookup for payment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bill_payments_bill_id 
  ON public.bill_payments (bill_id);
```

#### documents Table
```sql
-- Branch + date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_branch_created 
  ON public.documents (branch_id, created_at DESC);

-- File type filtering (JPEG count on dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_branch_type 
  ON public.documents (branch_id, file_type);
```

#### test_types Table
```sql
-- Lab + branch scoped queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_types_lab_id 
  ON public.test_types (lab_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_types_branch_id 
  ON public.test_types (branch_id);
```

---

### Phase 2: Partial Indexes for Common Filters

```sql
-- Pending bills (frequently queried for outstanding reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_pending 
  ON public.bills (lab_id, bill_date DESC) 
  WHERE status = 'pending';

-- Partially paid bills (outstanding reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_partially_paid 
  ON public.bills (lab_id, bill_date DESC) 
  WHERE status = 'partially_paid';

-- Outstanding bills (due_amount > 0)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_outstanding 
  ON public.bills (lab_id, due_amount DESC) 
  WHERE due_amount > 0;

-- Active test reports (not delivered yet)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_active 
  ON public.test_reports (lab_id, test_date DESC) 
  WHERE status != 'delivered';

-- Pending test reports only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_reports_pending 
  ON public.test_reports (lab_id, test_date DESC) 
  WHERE status = 'pending';

-- JPEG images for dashboard count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_jpeg 
  ON public.documents (branch_id, created_at DESC) 
  WHERE file_type = 'image/jpeg';

-- Active followups (not completed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followups_active 
  ON public.patient_followups (lab_id, due_at) 
  WHERE status != 'completed';
```

---

### Phase 3: Materialized View for Dashboard Stats

#### Create Materialized View
```sql
-- Daily aggregated stats per lab and branch
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_stats AS
SELECT 
  DATE(p.created_at) as stat_date,
  p.lab_id,
  p.branch_id,
  COUNT(DISTINCT p.id) as patient_count,
  COALESCE(SUM(b.total_amount), 0) as revenue,
  COALESCE(SUM(bp.payment_amount), 0) as collections,
  COUNT(DISTINCT tr.id) FILTER (WHERE tr.status != 'delivered') as pending_reports,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT d.id) FILTER (WHERE d.file_type = 'image/jpeg') as jpeg_count
FROM public.patients p
LEFT JOIN public.bills b ON b.patient_id = p.id AND DATE(b.bill_date) = DATE(p.created_at)
LEFT JOIN public.bill_payments bp ON bp.bill_id = b.id AND DATE(bp.payment_date) = DATE(p.created_at)
LEFT JOIN public.test_reports tr ON tr.patient_id = p.id AND DATE(tr.test_date) = DATE(p.created_at)
LEFT JOIN public.documents d ON d.patient_id = p.id AND DATE(d.created_at) = DATE(p.created_at)
GROUP BY DATE(p.created_at), p.lab_id, p.branch_id
WITH DATA;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_stats_pk 
  ON public.mv_daily_stats (stat_date, lab_id, branch_id);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_lab 
  ON public.mv_daily_stats (lab_id, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_mv_daily_stats_branch 
  ON public.mv_daily_stats (branch_id, stat_date DESC);
```

#### Refresh Function
```sql
CREATE OR REPLACE FUNCTION public.refresh_daily_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_stats;
END;
$$;
```

#### pg_cron Scheduling (5-minute refresh)
```sql
-- Note: pg_cron must be enabled in Supabase Dashboard > Database > Extensions
SELECT cron.schedule(
  'refresh-daily-stats',
  '*/5 * * * *',  -- Every 5 minutes
  $$SELECT public.refresh_daily_stats()$$
);
```

---

### Phase 4: Query Optimization Functions

#### Optimized Dashboard Stats RPC
```sql
-- Fast dashboard stats using materialized view when available
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_lab_id UUID,
  p_branch_ids UUID[] DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'patients', COALESCE(SUM(patient_count), 0),
    'revenue', COALESCE(SUM(revenue), 0),
    'collections', COALESCE(SUM(collections), 0),
    'pending_reports', COALESCE(SUM(pending_reports), 0),
    'documents', COALESCE(SUM(document_count), 0),
    'jpeg_images', COALESCE(SUM(jpeg_count), 0)
  )
  INTO v_result
  FROM public.mv_daily_stats
  WHERE lab_id = p_lab_id
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_date_from IS NULL OR stat_date >= p_date_from)
    AND (p_date_to IS NULL OR stat_date <= p_date_to);
  
  RETURN COALESCE(v_result, '{"patients":0,"revenue":0,"collections":0,"pending_reports":0,"documents":0,"jpeg_images":0}'::jsonb);
END;
$$;
```

---

### Phase 5: Partitioning Strategy (Future - When > 1M Rows)

#### Partition Preparation Function
```sql
-- This creates a partitioned shadow table for bills
-- To be executed when row count exceeds 1M
CREATE OR REPLACE FUNCTION public.prepare_bills_partitioning()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check current row count
  IF (SELECT COUNT(*) FROM public.bills) < 1000000 THEN
    RAISE NOTICE 'Bills table has fewer than 1M rows. Partitioning not needed yet.';
    RETURN;
  END IF;
  
  -- Create partitioned table structure
  CREATE TABLE IF NOT EXISTS public.bills_partitioned (
    LIKE public.bills INCLUDING ALL
  ) PARTITION BY RANGE (bill_date);
  
  -- Create monthly partitions for the last 2 years and next year
  -- (Actual partition creation would be done via a cron job)
  RAISE NOTICE 'Partitioned table created. Run migration to move data.';
END;
$$;
```

---

### Phase 6: EXPLAIN ANALYZE Comments

Add SQL comments documenting expected query plans for complex queries:

```sql
-- EXPLAIN ANALYZE annotation for dashboard patient query
COMMENT ON INDEX idx_patients_branch_created IS 
'Expected plan: Index Scan on idx_patients_branch_created
 Filters: branch_id = $1, created_at >= $2
 Expected rows: ~1000 per day per branch
 Index size estimate: ~50MB per 100k patients';

-- EXPLAIN ANALYZE annotation for pending bills query
COMMENT ON INDEX idx_bills_outstanding IS 
'Expected plan: Index Scan using idx_bills_outstanding
 Filters: lab_id = $1, due_amount > 0
 Should avoid sequential scan on large tables
 Typical selectivity: 10-30% of bills';
```

---

## Migration File Summary

The migration will create:
- **15 B-tree indexes** on frequently queried columns
- **7 partial indexes** for common filter patterns
- **1 materialized view** for dashboard stats aggregation
- **2 RPC functions** (refresh + get_dashboard_stats)
- **1 pg_cron job** for 5-minute refresh
- **Query plan comments** for debugging

---

## Frontend Integration (Optional)

After migration, the dashboard queries can be optimized to use the new RPC:

```typescript
// In useDashboardQueries.ts - optional optimization
export function useStatsQuery(filters) {
  return useQuery({
    queryKey: ['dashboardStats', filters],
    queryFn: async () => {
      // Use the optimized RPC instead of multiple queries
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_lab_id: profile.lab_id,
        p_branch_ids: filters.branchIds,
        p_date_from: getDateFilter(filters.timePeriod)?.start,
        p_date_to: getDateFilter(filters.timePeriod)?.end
      });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## Performance Expectations

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Dashboard load time | 800-1500ms | 100-300ms |
| Patient search | 200-500ms | 50-100ms |
| Bills by status | 300-800ms | 50-150ms |
| Outstanding report | 500-1000ms | 100-200ms |
| Collection report | 400-900ms | 100-250ms |

---

## Rollback Strategy

All indexes use `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, allowing safe rollback:

```sql
-- Rollback script (if needed)
DROP INDEX CONCURRENTLY IF EXISTS idx_patients_lab_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_patients_branch_id;
-- ... (other indexes)
DROP MATERIALIZED VIEW IF EXISTS mv_daily_stats;
DROP FUNCTION IF EXISTS get_dashboard_stats;
DROP FUNCTION IF EXISTS refresh_daily_stats;
SELECT cron.unschedule('refresh-daily-stats');
```

---

## Technical Notes

1. **CONCURRENTLY**: All indexes use `CREATE INDEX CONCURRENTLY` to avoid table locks during creation
2. **IF NOT EXISTS**: Ensures idempotent migration that can be re-run safely
3. **pg_cron**: Requires enabling the extension in Supabase Dashboard before the cron job can be scheduled
4. **Materialized View Refresh**: Uses `REFRESH CONCURRENTLY` which requires a unique index on the view
5. **RLS Compatibility**: All indexes are created on user-facing columns that align with existing RLS policies
