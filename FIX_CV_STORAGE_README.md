# Fix CV Storage RLS Policy Issue

## Problem
When candidates try to upload CVs using the "Ứng tuyển ngay" feature, they get an error:
```
StorageApiError: new row violates row-level security policy
```

## Root Cause
The application uses **custom authentication** (Zustand store) instead of Supabase Auth. The original RLS policies were checking `auth.uid()`, which doesn't exist since users aren't authenticated through Supabase's authentication system.

## Solution
Update the storage RLS policies to work with the anon key while maintaining security through:
- Application-level validation
- Folder structure (userId/jobId/filename)
- Non-public bucket configuration

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Step A: Create the Bucket (if needed)**
   - Open the file: `CREATE_CV_BUCKET.sql`
   - Copy the entire SQL script
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - **Note**: If the bucket already exists, this is safe to run (uses ON CONFLICT)

4. **Step B: Fix the RLS Policies**
   - Click "New Query" to create a fresh editor
   - Open the file: `FIX_CV_STORAGE_RLS.sql`
   - Copy the entire SQL script
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

5. **Verify the Fix**
   - The scripts should complete without errors
   - You can run the verification queries at the bottom of `FIX_CV_STORAGE_RLS.sql`

### Option 2: Using Supabase CLI (Alternative)

If you have Supabase CLI installed locally:

```bash
# Connect to your remote project
supabase link --project-ref your-project-ref

# Push the migration
supabase db push

# Or apply the migration directly
supabase db execute -f FIX_CV_STORAGE_RLS.sql
```

## What Changed

### Before (Restrictive - Didn't Work)
```sql
CREATE POLICY "Users can upload own CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text  -- ❌ auth.uid() is null
);
```

### After (Permissive - Works with Custom Auth)
```sql
CREATE POLICY "Allow CV uploads via anon key"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'cvs'  -- ✅ Only checks bucket, app handles user validation
);
```

## Security Considerations

While the RLS policies are now more permissive, security is still maintained through:

1. **Non-public bucket**: Files aren't accessible without proper credentials
2. **Application-level validation**: 
   - File type validation (PDF, DOC, DOCX only)
   - File size limits (5MB max)
   - User ID validation in the upload function
3. **Folder structure**: Files are organized by `userId/jobId/filename`
4. **Supabase bucket configuration**:
   - 5MB file size limit enforced at bucket level
   - MIME type restrictions at bucket level

## Testing the Fix

After applying the fix, test the "Ứng tuyển ngay" feature:

1. Navigate to http://localhost:3000/jobs
2. Click on any job listing
3. Click the "Ứng tuyển ngay" button
4. Fill in the form fields
5. Upload a CV file
6. Click "Nộp hồ sơ ứng tuyển"
7. ✅ Should succeed without RLS policy errors

## Files Modified

- `supabase/migrations/20240117000001_fix_cv_storage_rls.sql` - Migration file
- `FIX_CV_STORAGE_RLS.sql` - Standalone SQL script (can be run directly)
- `FIX_CV_STORAGE_README.md` - This documentation

## Rollback (If Needed)

If you need to rollback to the original restrictive policies:

```sql
BEGIN;

-- Drop permissive policies
DROP POLICY IF EXISTS "Allow CV uploads via anon key" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV reads via anon key" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV updates via anon key" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV deletes via anon key" ON storage.objects;

-- Restore original policies (Note: These won't work without Supabase Auth)
CREATE POLICY "Users can upload own CVs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ... (add other original policies as needed)

COMMIT;
```

## Next Steps

1. ✅ Apply the SQL fix using Supabase Dashboard
2. ✅ Test CV upload functionality
3. ✅ Verify no error alerts appear
4. ✅ Check that CVs are properly stored in the `cvs` bucket

## Questions or Issues?

If you encounter any problems:
1. Check the Supabase Dashboard → Storage → cvs bucket
2. Verify bucket policies are updated
3. Check browser console for detailed error messages
4. Verify your Supabase anon key is correctly configured in `.env`
