-- Desktop pathology test library metadata for offline-first catalog sync.
ALTER TABLE public.test_types ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE public.test_types ADD COLUMN IF NOT EXISTS library_group TEXT DEFAULT 'Custom';
ALTER TABLE public.test_types ADD COLUMN IF NOT EXISTS is_default_library BOOLEAN DEFAULT false;
ALTER TABLE public.test_types ADD COLUMN IF NOT EXISTS is_user_modified BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_test_types_library_group
ON public.test_types(lab_id, library_group)
WHERE source = 'desktop';

CREATE INDEX IF NOT EXISTS idx_test_types_short_name
ON public.test_types(lab_id, short_name)
WHERE short_name IS NOT NULL;