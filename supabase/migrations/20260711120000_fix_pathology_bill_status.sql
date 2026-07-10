-- Keep deployed pathology saves compatible with the bills status constraint.
-- Older deployments used `partial`; the canonical value is `partially_paid`.
DO $$
DECLARE
  function_definition TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'save_pathology_report'
  ORDER BY p.oid DESC
  LIMIT 1;

  IF function_definition IS NOT NULL THEN
    function_definition := replace(function_definition, '''partial''', '''partially_paid''');
    EXECUTE function_definition;
  END IF;
END;
$$;

-- Accept the legacy value during rollout so an older already-deployed function
-- cannot block a save while migrations are being applied.
ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_status_check;
ALTER TABLE public.bills
  ADD CONSTRAINT bills_status_check
  CHECK (status IN ('pending', 'paid', 'partially_paid', 'partial', 'overdue'));

UPDATE public.bills
SET status = 'partially_paid'
WHERE status = 'partial';
