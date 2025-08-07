-- Create storage bucket for documents and test reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lab-files', 'lab-files', false);

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can view files from their lab" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lab-files' 
  AND (
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Check if file belongs to user's lab
    EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p1.lab_id = p2.lab_id
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = (storage.foldername(name))[1]::uuid
    )
  )
);

CREATE POLICY "Users can upload files to their lab folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lab-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lab-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lab-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);