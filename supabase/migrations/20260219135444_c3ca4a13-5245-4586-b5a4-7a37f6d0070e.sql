
-- Make report-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'report-images';

-- Drop existing SELECT policy and create owner-scoped one
DROP POLICY IF EXISTS "Users can view report images" ON storage.objects;

CREATE POLICY "Users can view their own report images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
