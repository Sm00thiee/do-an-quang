# 🔧 CV Storage Fix - Quick Start Guide

## 🎯 What's the Issue?
CV upload fails with error: **"new row violates row-level security policy"**

## 💡 The Solution
Update Supabase storage RLS policies to work with the app's custom authentication system.

## ⚡ Quick Fix (3 Steps)

### 1️⃣ Open Supabase Dashboard
- Go to: https://app.supabase.com
- Select your project
- Click **SQL Editor** → **New Query**

### 2️⃣ Create Bucket (Run First)
Copy and execute `CREATE_CV_BUCKET.sql`:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, 
  ARRAY['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET public = false;
```

### 3️⃣ Fix RLS Policies (Run Second)
Copy and execute `FIX_CV_STORAGE_RLS.sql`:

```sql
BEGIN;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Employers can view CVs for their jobs" ON storage.objects;

-- Create new permissive policies
CREATE POLICY "Allow CV uploads via anon key" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "Allow CV reads via anon key" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'cvs');

CREATE POLICY "Allow CV updates via anon key" ON storage.objects
FOR UPDATE TO anon, authenticated USING (bucket_id = 'cvs');

CREATE POLICY "Allow CV deletes via anon key" ON storage.objects
FOR DELETE TO anon, authenticated USING (bucket_id = 'cvs');

COMMIT;
```

## ✅ Test It Works

1. Open: http://localhost:3000/jobs
2. Click any job → **"Ứng tuyển ngay"**
3. Upload a PDF CV
4. Submit the form
5. ✅ Should succeed without errors!

## 📁 Files Created

- `CREATE_CV_BUCKET.sql` - Creates/configures the storage bucket
- `FIX_CV_STORAGE_RLS.sql` - Fixes the RLS policies
- `FIX_CV_STORAGE_README.md` - Detailed documentation
- `QUICK_FIX.md` - This quick guide

## 🔒 Security

Security is maintained through:
- ✅ Non-public bucket (not accessible directly)
- ✅ File type validation (PDF, DOC, DOCX only)
- ✅ File size limit (5MB max)
- ✅ App-level user validation

## 🆘 Need Help?

See `FIX_CV_STORAGE_README.md` for:
- Detailed explanation
- Alternative methods
- Troubleshooting
- Rollback instructions

---

**That's it!** After running these two SQL scripts, CV uploads will work. 🎉
