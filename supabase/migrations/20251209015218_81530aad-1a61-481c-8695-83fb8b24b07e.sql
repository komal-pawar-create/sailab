-- Allow public (anonymous) feedback submissions
-- Make created_by nullable for anonymous submissions
ALTER TABLE public.feedback ALTER COLUMN created_by DROP NOT NULL;

-- Add RLS policy for anonymous INSERT
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Add policy for public to view their own submitted feedback (optional, by session)
-- We'll rely on lab_id being required for staff to see feedback