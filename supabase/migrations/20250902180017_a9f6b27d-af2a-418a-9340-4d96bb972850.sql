-- Make the lab-files bucket public to allow downloads of processed documents
UPDATE storage.buckets 
SET public = true 
WHERE id = 'lab-files';