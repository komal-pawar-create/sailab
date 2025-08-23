-- Add new columns to labs table for complete profile
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS footer_text TEXT;
ALTER TABLE public.labs ADD COLUMN IF NOT EXISTS terms_conditions TEXT;

-- Create storage bucket for lab assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lab-assets', 'lab-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for lab-assets bucket
-- Allow lab admins to upload/update their lab's assets
CREATE POLICY "Lab admins can upload lab assets" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'lab-assets' AND 
  (
    is_lab_admin(auth.uid()) OR 
    is_super_admin(auth.uid())
  )
);

CREATE POLICY "Lab admins can update lab assets" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'lab-assets' AND 
  (
    is_lab_admin(auth.uid()) OR 
    is_super_admin(auth.uid())
  )
);

CREATE POLICY "Lab admins can delete lab assets" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'lab-assets' AND 
  (
    is_lab_admin(auth.uid()) OR 
    is_super_admin(auth.uid())
  )
);

-- Allow public to view lab assets (for bill generation)
CREATE POLICY "Public can view lab assets" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'lab-assets');