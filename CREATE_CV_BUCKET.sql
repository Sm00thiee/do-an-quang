-- ============================================
-- CREATE AND CONFIGURE CV STORAGE BUCKET
-- ============================================
-- Run this FIRST if the 'cvs' bucket doesn't exist yet
-- Then run FIX_CV_STORAGE_RLS.sql
-- ============================================

BEGIN;

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,  -- Keep bucket private
  5242880,  -- 5MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

COMMIT;

-- Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'cvs';
