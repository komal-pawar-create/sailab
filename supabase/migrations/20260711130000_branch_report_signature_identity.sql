-- Branch-specific report signature identities for professional diagnostic PDFs.
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS consultant_pathologist_name TEXT,
  ADD COLUMN IF NOT EXISTS lab_incharge_name TEXT;

COMMENT ON COLUMN public.branches.consultant_pathologist_name IS 'Name printed below the consultant pathologist signature on reports.';
COMMENT ON COLUMN public.branches.lab_incharge_name IS 'Name printed above the lab incharge title on reports.';
