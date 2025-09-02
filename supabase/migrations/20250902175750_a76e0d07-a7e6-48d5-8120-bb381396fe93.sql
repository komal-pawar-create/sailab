-- Create a storage policy to allow public read access to processed documents
-- This allows anyone to download files from the processed/ folder in lab-files bucket
CREATE POLICY "Allow public read access to processed documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lab-files' 
  AND (storage.foldername(name))[1] = 'processed'
);