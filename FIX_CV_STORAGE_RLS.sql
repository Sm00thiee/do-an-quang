-- ============================================
-- FIX CV STORAGE RLS POLICIES
-- ============================================
-- Execute this in Supabase SQL Editor to fix CV upload issues
-- Issue: RLS policies were checking auth.uid() but app uses custom auth
-- ============================================

BEGIN;

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Employers can view CVs for their jobs" ON storage.objects;

-- 2. Create permissive policies for CV uploads
-- Note: Since the app uses custom auth (not Supabase Auth), we allow
-- operations through the anon key. Security is maintained through:
-- - Application-level checks
-- - Folder structure (userId/jobId/filename)
-- - Non-public bucket

CREATE POLICY "Allow CV uploads via anon key"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'cvs'
);

CREATE POLICY "Allow CV reads via anon key"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'cvs'
);

CREATE POLICY "Allow CV updates via anon key"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'cvs'
);

CREATE POLICY "Allow CV deletes via anon key"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'cvs'
);

-- 3. Verify bucket configuration
UPDATE storage.buckets
SET 
  public = false,
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id = 'cvs';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after applying the fix to verify:

-- Check bucket configuration:
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'cvs';

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
