-- Migration: Create CV Storage Bucket
-- Description: Creates storage bucket for CV uploads with proper RLS policies

-- Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for CV storage bucket

-- Policy: Users can upload their own CVs
DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
CREATE POLICY "Users can upload own CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own CVs
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
CREATE POLICY "Users can view own CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own CVs
DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;
CREATE POLICY "Users can delete own CVs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Employers can view CVs for jobs they posted
-- Note: This requires a join with jobs table to verify ownership
-- For now, we'll allow authenticated users to view CVs in job application folders
DROP POLICY IF EXISTS "Employers can view CVs for their jobs" ON storage.objects;
CREATE POLICY "Employers can view CVs for their jobs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.cv_url = storage.objects.name
    AND j.created_by = auth.uid()
  )
);
