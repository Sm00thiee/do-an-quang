-- Row Level Security (RLS) Policies for CourseAiChat
-- This file defines RLS policies to ensure data security and proper access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_analytics ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can view and update their own profile
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Courses table policies
-- All users can view active courses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Anyone can view active courses') THEN
        CREATE POLICY "Anyone can view active courses" ON courses
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Authenticated users can manage courses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Authenticated users can manage courses') THEN
        CREATE POLICY "Authenticated users can manage courses" ON courses
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- User Recommendations table policies
-- Users can view their own recommendations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_recommendations' AND policyname = 'Users can view own recommendations') THEN
        CREATE POLICY "Users can view own recommendations" ON user_recommendations
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- Users can update their own recommendations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_recommendations' AND policyname = 'Users can update own recommendations') THEN
        CREATE POLICY "Users can update own recommendations" ON user_recommendations
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;

-- User Sessions table policies
-- Users can view their own sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can view own sessions') THEN
        CREATE POLICY "Users can view own sessions" ON user_sessions
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- Users can manage their own sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can manage own sessions') THEN
        CREATE POLICY "Users can manage own sessions" ON user_sessions
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- Chat messages table policies
-- Users can view messages from their own sessions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view own messages') THEN
        CREATE POLICY "Users can view own messages" ON chat_messages
            FOR SELECT USING (
                user_session_id IN (
                    SELECT id FROM user_sessions WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Users can create their own messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can create own messages') THEN
        CREATE POLICY "Users can create own messages" ON chat_messages
            FOR INSERT WITH CHECK (
                user_session_id IN (
                    SELECT id FROM user_sessions WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- User Interactions table policies
-- Users can view their own interactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_interactions' AND policyname = 'Users can view own interactions') THEN
        CREATE POLICY "Users can view own interactions" ON user_interactions
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- Users can create their own interactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_interactions' AND policyname = 'Users can create own interactions') THEN
        CREATE POLICY "Users can create own interactions" ON user_interactions
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Fields Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fields' AND policyname = 'Fields are viewable by everyone') THEN
        CREATE POLICY "Fields are viewable by everyone" ON fields
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fields' AND policyname = 'Only authenticated users can insert fields') THEN
        CREATE POLICY "Only authenticated users can insert fields" ON fields
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fields' AND policyname = 'Only authenticated users can update fields') THEN
        CREATE POLICY "Only authenticated users can update fields" ON fields
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Learning Paths Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_paths' AND policyname = 'Learning paths are viewable by everyone') THEN
        CREATE POLICY "Learning paths are viewable by everyone" ON learning_paths
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learning_paths' AND policyname = 'Only authenticated users can manage learning paths') THEN
        CREATE POLICY "Only authenticated users can manage learning paths" ON learning_paths
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- CSV Imports Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'csv_imports' AND policyname = 'Users can view their own imports') THEN
        CREATE POLICY "Users can view their own imports" ON csv_imports
            FOR SELECT USING (uploaded_by = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'csv_imports' AND policyname = 'Users can manage their own imports') THEN
        CREATE POLICY "Users can manage their own imports" ON csv_imports
            FOR ALL USING (uploaded_by = auth.uid());
    END IF;
END $$;

-- Import Errors Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'import_errors' AND policyname = 'Users can view errors from their own imports') THEN
        CREATE POLICY "Users can view errors from their own imports" ON import_errors
            FOR SELECT USING (
                csv_import_id IN (
                    SELECT id FROM csv_imports WHERE uploaded_by = auth.uid()
                )
            );
    END IF;
END $$;

-- Field Analytics Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_analytics' AND policyname = 'Users can view field analytics') THEN
        CREATE POLICY "Users can view field analytics" ON field_analytics
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Course Analytics Table RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_analytics' AND policyname = 'Users can view course analytics') THEN
        CREATE POLICY "Users can view course analytics" ON course_analytics
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Note: Triggers and indexes are created in the functions/triggers migration file
