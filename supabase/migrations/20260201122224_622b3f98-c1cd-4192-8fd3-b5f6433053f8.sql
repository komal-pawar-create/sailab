-- =====================================================
-- Security Fix: Revoke API access to materialized view
-- The mv_daily_stats should only be accessed via RPC functions
-- =====================================================

-- Revoke direct API access to materialized view
REVOKE ALL ON public.mv_daily_stats FROM anon, authenticated;

-- Grant access only to service role (for RPC functions with SECURITY DEFINER)
GRANT SELECT ON public.mv_daily_stats TO service_role;