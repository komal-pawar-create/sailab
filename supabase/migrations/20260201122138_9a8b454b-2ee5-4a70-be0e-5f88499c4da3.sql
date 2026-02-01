-- =====================================================
-- LabFlow Production Optimization - Materialized View & Functions
-- =====================================================

-- Daily aggregated stats per lab and branch using proper CTEs
CREATE MATERIALIZED VIEW public.mv_daily_stats AS
WITH daily_patients AS (
  SELECT 
    DATE(created_at) as stat_date,
    lab_id,
    branch_id,
    COUNT(DISTINCT id) as patient_count
  FROM public.patients
  WHERE lab_id IS NOT NULL AND branch_id IS NOT NULL
  GROUP BY DATE(created_at), lab_id, branch_id
),
daily_bills AS (
  SELECT 
    DATE(bill_date) as stat_date,
    lab_id,
    branch_id,
    SUM(total_amount) as revenue,
    SUM(due_amount) as pending_amount
  FROM public.bills
  WHERE lab_id IS NOT NULL AND branch_id IS NOT NULL
  GROUP BY DATE(bill_date), lab_id, branch_id
),
daily_payments AS (
  SELECT 
    DATE(payment_date) as stat_date,
    branch_id,
    SUM(payment_amount) as collections
  FROM public.bill_payments
  WHERE branch_id IS NOT NULL
  GROUP BY DATE(payment_date), branch_id
),
daily_reports AS (
  SELECT 
    DATE(test_date) as stat_date,
    lab_id,
    branch_id,
    COUNT(DISTINCT id) as total_reports,
    COUNT(DISTINCT id) FILTER (WHERE status != 'delivered') as pending_reports
  FROM public.test_reports
  WHERE lab_id IS NOT NULL AND branch_id IS NOT NULL
  GROUP BY DATE(test_date), lab_id, branch_id
),
daily_documents AS (
  SELECT 
    DATE(created_at) as stat_date,
    lab_id,
    branch_id,
    COUNT(DISTINCT id) as document_count,
    COUNT(DISTINCT id) FILTER (WHERE file_type = 'image/jpeg') as jpeg_count
  FROM public.documents
  WHERE lab_id IS NOT NULL AND branch_id IS NOT NULL
  GROUP BY DATE(created_at), lab_id, branch_id
)
SELECT 
  COALESCE(dp.stat_date, db.stat_date, dr.stat_date, dd.stat_date) as stat_date,
  COALESCE(dp.lab_id, db.lab_id, dr.lab_id, dd.lab_id) as lab_id,
  COALESCE(dp.branch_id, db.branch_id, dr.branch_id, dd.branch_id) as branch_id,
  COALESCE(dp.patient_count, 0)::bigint as patient_count,
  COALESCE(db.revenue, 0)::numeric as revenue,
  COALESCE(dpy.collections, 0)::numeric as collections,
  COALESCE(dr.pending_reports, 0)::bigint as pending_reports,
  COALESCE(dd.document_count, 0)::bigint as document_count,
  COALESCE(dd.jpeg_count, 0)::bigint as jpeg_count
FROM daily_patients dp
FULL OUTER JOIN daily_bills db 
  ON dp.stat_date = db.stat_date AND dp.lab_id = db.lab_id AND dp.branch_id = db.branch_id
LEFT JOIN daily_payments dpy 
  ON dp.stat_date = dpy.stat_date AND dp.branch_id = dpy.branch_id
FULL OUTER JOIN daily_reports dr 
  ON COALESCE(dp.stat_date, db.stat_date) = dr.stat_date 
  AND COALESCE(dp.lab_id, db.lab_id) = dr.lab_id 
  AND COALESCE(dp.branch_id, db.branch_id) = dr.branch_id
FULL OUTER JOIN daily_documents dd 
  ON COALESCE(dp.stat_date, db.stat_date, dr.stat_date) = dd.stat_date 
  AND COALESCE(dp.lab_id, db.lab_id, dr.lab_id) = dd.lab_id 
  AND COALESCE(dp.branch_id, db.branch_id, dr.branch_id) = dd.branch_id
WHERE COALESCE(dp.stat_date, db.stat_date, dr.stat_date, dd.stat_date) IS NOT NULL
  AND COALESCE(dp.lab_id, db.lab_id, dr.lab_id, dd.lab_id) IS NOT NULL
  AND COALESCE(dp.branch_id, db.branch_id, dr.branch_id, dd.branch_id) IS NOT NULL
WITH DATA;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_daily_stats_pk 
  ON public.mv_daily_stats (stat_date, lab_id, branch_id);

-- Lookup indexes for the materialized view
CREATE INDEX idx_mv_daily_stats_lab 
  ON public.mv_daily_stats (lab_id, stat_date DESC);

CREATE INDEX idx_mv_daily_stats_branch 
  ON public.mv_daily_stats (branch_id, stat_date DESC);

-- Function to refresh the materialized view
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

-- Fast dashboard stats using materialized view
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
    'patients', COALESCE(SUM(patient_count)::int, 0),
    'revenue', COALESCE(SUM(revenue), 0),
    'collections', COALESCE(SUM(collections), 0),
    'pending_reports', COALESCE(SUM(pending_reports)::int, 0),
    'documents', COALESCE(SUM(document_count)::int, 0),
    'jpeg_images', COALESCE(SUM(jpeg_count)::int, 0)
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

-- Function to prepare bills partitioning when > 1M rows
CREATE OR REPLACE FUNCTION public.prepare_bills_partitioning()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.bills;
  
  IF v_count < 1000000 THEN
    RETURN 'Bills table has ' || v_count || ' rows. Partitioning not needed until 1M+ rows.';
  END IF;
  
  CREATE TABLE IF NOT EXISTS public.bills_partitioned (
    LIKE public.bills INCLUDING ALL
  ) PARTITION BY RANGE (bill_date);
  
  RETURN 'Partitioned shadow table created. Manual data migration required.';
END;
$$;

-- Add comment on materialized view
COMMENT ON MATERIALIZED VIEW mv_daily_stats IS 
'Pre-aggregated daily statistics for fast dashboard loading. Refresh via SELECT refresh_daily_stats(). For pg_cron auto-refresh: SELECT cron.schedule(refresh-stats, */5 * * * *, SELECT refresh_daily_stats())';