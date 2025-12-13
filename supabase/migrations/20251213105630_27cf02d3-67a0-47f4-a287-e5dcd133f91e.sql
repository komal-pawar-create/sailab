-- Add bill print header setting to branches table
ALTER TABLE public.branches 
ADD COLUMN IF NOT EXISTS bill_print_with_header boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.branches.bill_print_with_header IS 'When true, prints bill with software header. When false, prints without header for pre-printed letterhead paper.';