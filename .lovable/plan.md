## Apply pending Supabase migrations

Apply the two uploaded migration files (already present in your local `supabase/migrations/`) to the connected Supabase project so the online pathology library goes live.

### Migration 1 — `20260710000100_test_library_metadata.sql` (17 lines)
Adds desktop catalog metadata columns:
- `public.test_types`: `short_name`, `library_group` (default `'Custom'`), `is_default_library`, `is_user_modified`
- `public.desktop_test_templates`: `is_user_modified`
- Two partial indexes on `test_types` (by `library_group` and `short_name`, scoped to `source = 'desktop'`)

Risk: this migration references `public.desktop_test_templates`. If that table doesn't exist yet in this project, the `ALTER TABLE` will fail. I'll pre-check via `supabase--read_query` before submitting the migration, and if missing I'll either skip that single line or ask you first.

### Migration 2 — `20260710000200_online_pathology_report_library.sql` (559 lines)
Online pathology catalog + branch overrides + PDF plumbing:
- `global_test_types`: add `short_name`, `library_group`, `default_price`, `sort_order`, `is_default_library`
- `test_reports`: add `report_number`, `pdf_url`, `finalized_at`, `finalized_by`
- New tables (with RLS + triggers):
  - `global_test_parameters` — parameter catalog per global test
  - `branch_test_library_settings` — per-branch enable/disable + price + display name
  - `branch_test_parameter_overrides` — per-branch unit/range/default overrides
- Storage: creates public bucket `pathology-reports`
- Seeds ~100 pathology tests + parameters into `global_test_types` / `global_test_parameters`
- Enables the 13 default library tests on every existing branch in `branch_test_library_settings`

Risk: the RLS policies call `public.get_user_lab(auth.uid())`, but this project's helper is `public.get_current_lab_id()` (per current schema). I will verify with `supabase--read_query` and, if `get_user_lab` doesn't exist, replace those calls with `public.get_current_lab_id()` in the migration body before submitting. This is a mechanical rename inside the policy `USING`/`WITH CHECK` clauses only.

### Steps

1. Read-only checks via `supabase--read_query`:
   - Does `public.desktop_test_templates` exist?
   - Does function `public.get_user_lab(uuid)` exist? (fall back to `get_current_lab_id`)
2. Submit Migration 1 (adjusted if `desktop_test_templates` is absent) via `supabase--migration`.
3. After approval, submit Migration 2 (with `get_user_lab` → `get_current_lab_id` swap if needed) via `supabase--migration`.
4. Run `supabase--linter` and report any security warnings introduced.
5. Confirm the `pathology-reports` storage bucket is created and public.

### Not included
- No frontend/edge-function changes. You confirmed the latest git is already online, so the app already ships `generate-pathology-report-pdf`, `PathologyReportEditor`, `pathologyFormulaRegistry`, and the Branch Settings library manager. Edge functions auto-deploy on push; nothing for me to redeploy here.
- No data changes beyond the seed inserts contained in the migration.

### After migrations run
You publish the frontend via the Publish dialog when ready (custom domain `labflow.mywebz.in` picks up the new build automatically).
