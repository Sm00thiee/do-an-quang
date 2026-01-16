-- Cleanup Migration: Truncate data and drop unused tables
-- This migration cleans up the database by removing unused tables and clearing data

-- Truncate all data from existing tables (keeping structure)
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_jobs CASCADE;
TRUNCATE TABLE job_queue CASCADE;
TRUNCATE TABLE worker_status CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE user_recommendation_interactions CASCADE;
TRUNCATE TABLE user_recommendation_feedback CASCADE;
TRUNCATE TABLE recommendation_analytics CASCADE;
TRUNCATE TABLE user_interest_tracking CASCADE;
TRUNCATE TABLE recommendation_triggers CASCADE;
TRUNCATE TABLE learning_paths CASCADE;
TRUNCATE TABLE fields CASCADE;

-- Drop unused tables
DROP TABLE IF EXISTS job_dependencies CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS learning_path_courses CASCADE;

-- Reset sequences to start from 1 (for tables with auto-incrementing IDs if any)
-- Note: Our tables use UUIDs, so no sequences to reset

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Database cleanup completed: All data truncated and unused tables dropped';
END $$;
