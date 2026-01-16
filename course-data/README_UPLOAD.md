# Upload Course Files to Supabase Storage

This repository contains scripts to upload course files from the `course-files` directory to Supabase Storage.

## Prerequisites

1. **Supabase CLI installed** (already installed ✓)
2. **Logged in to Supabase CLI** (already logged in ✓)
3. **Project linked** (already linked to "Course AI Chat" project ✓)

## Option 1: Using Supabase CLI (Recommended for simplicity)

The script `upload_to_supabase.py` uses the Supabase CLI to upload files.

### Steps:

1. **Create the storage bucket** (required first step):
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: "Course AI Chat"
   - Navigate to: **Storage** > **Buckets** > **New bucket**
   - Create a bucket named: `course-files`
   - Set it as **Public** (if you want public access to the files)

2. **Run the upload script**:
   ```bash
   python upload_to_supabase.py
   ```

The script will:
- Check if Supabase CLI is installed
- Verify you're logged in
- Link to the project (if not already linked)
- Check if the bucket exists
- Upload all `.md` files from `course-files/` directory

## Option 2: Using Python Supabase Client (Can create buckets automatically)

The script `upload_to_supabase_python.py` uses the Supabase Python client and can create buckets automatically.

### Steps:

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Get your Supabase credentials**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: "Course AI Chat"
   - Navigate to: **Settings** > **API**
   - Copy:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **Service Role Key** (recommended) or **Anon Key**

3. **Set environment variables**:
   
   **Option A: Create a `.env` file** (recommended):
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   
   **Option B: Set in PowerShell**:
   ```powershell
   $env:SUPABASE_URL="https://your-project-id.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

4. **Run the upload script**:
   ```bash
   python upload_to_supabase_python.py
   ```

The script will:
- Create the bucket automatically if it doesn't exist
- Upload all `.md` files from `course-files/` directory

## Current Status

- ✅ Supabase CLI installed (v2.39.2)
- ✅ Logged in to Supabase
- ✅ Project linked: "Course AI Chat" (ref: hdbgaxifsgrvlfsztvrm)
- ⚠️ Storage bucket `course-files` needs to be created

## Files to Upload

The script will upload all 45 markdown files from the `course-files/` directory:
- Marketing course files (15 files)
- UI/UX Design course files (15 files)
- Graphic Design course files (15 files)

## Troubleshooting

### "Bucket not found" error
- Make sure you've created the bucket in Supabase Dashboard first (Option 1)
- Or use Option 2 which creates the bucket automatically

### "Not logged in" error
- Run: `supabase login`

### "Project not linked" error
- Run: `supabase link --project-ref hdbgaxifsgrvlfsztvrm`

### Permission errors
- Make sure you're using the **Service Role Key** (not Anon Key) for bucket creation
- Check bucket permissions in Supabase Dashboard
