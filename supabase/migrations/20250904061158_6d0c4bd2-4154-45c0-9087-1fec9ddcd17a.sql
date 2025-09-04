-- Add additional branding and banking fields to branches table
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS footer_text TEXT,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.branches.signature_url IS 'URL to the authorized signature image for this branch';
COMMENT ON COLUMN public.branches.footer_text IS 'Custom footer text for bills and documents';
COMMENT ON COLUMN public.branches.terms_conditions IS 'Branch-specific terms and conditions';
COMMENT ON COLUMN public.branches.bank_name IS 'Bank name for payments';
COMMENT ON COLUMN public.branches.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN public.branches.bank_ifsc_code IS 'Bank IFSC code';
COMMENT ON COLUMN public.branches.registration_number IS 'Branch registration number';
COMMENT ON COLUMN public.branches.gst_number IS 'GST number for the branch';
COMMENT ON COLUMN public.branches.website IS 'Branch website URL';