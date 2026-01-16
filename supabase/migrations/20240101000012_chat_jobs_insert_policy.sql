-- Allow users to insert chat jobs
-- This migration adds an INSERT policy for chat_jobs table to allow users to create jobs

-- Drop all existing policies on chat_jobs
DROP POLICY IF EXISTS "Service can manage chat jobs" ON chat_jobs;
DROP POLICY IF EXISTS "Users can view own chat jobs" ON chat_jobs;
DROP POLICY IF EXISTS "Service role can manage chat jobs" ON chat_jobs;
DROP POLICY IF EXISTS "Anyone can insert chat jobs" ON chat_jobs;
DROP POLICY IF EXISTS "Anyone can update chat jobs" ON chat_jobs;
DROP POLICY IF EXISTS "Users can subscribe to own chat jobs realtime" ON chat_jobs;

-- Allow everyone to insert chat jobs
CREATE POLICY "Enable insert for all users" ON chat_jobs
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow everyone to select chat jobs
CREATE POLICY "Enable select for all users" ON chat_jobs
    FOR SELECT
    TO public
    USING (true);

-- Allow everyone to update chat jobs
CREATE POLICY "Enable update for all users" ON chat_jobs
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Allow service role to do everything
CREATE POLICY "Enable all for service role" ON chat_jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
