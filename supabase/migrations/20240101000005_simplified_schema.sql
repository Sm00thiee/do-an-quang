-- Simplified Schema Migration for CourseAiChat
-- This file creates a simplified database schema without authentication, using session IDs

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS import_errors CASCADE;
DROP TABLE IF EXISTS csv_imports CASCADE;
DROP TABLE IF EXISTS field_analytics CASCADE;
DROP TABLE IF EXISTS course_analytics CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS user_recommendations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS fields CASCADE;

-- Core Tables for Simplified Schema

-- 1. Fields (categories/domains that users can choose from)
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Courses (individual courses that can be combined into learning paths)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Learning Paths (Lộ trình - combinations of courses)
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Junction table for Learning Paths and Courses (many-to-many relationship)
CREATE TABLE learning_path_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(learning_path_id, course_id)
);

-- 5. Chat Sessions (to track user conversations and question counts)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Chat Messages (to store individual messages in sessions)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes

-- Fields indexes
CREATE INDEX idx_fields_name ON fields(name);
CREATE INDEX idx_fields_active ON fields(is_active);

-- Courses indexes
CREATE INDEX idx_courses_field_id ON courses(field_id);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_title ON courses(title);

-- Learning Paths indexes
CREATE INDEX idx_learning_paths_active ON learning_paths(is_active);
CREATE INDEX idx_learning_paths_name ON learning_paths(name);

-- Learning Path Courses indexes
CREATE INDEX idx_learning_path_courses_path_id ON learning_path_courses(learning_path_id);
CREATE INDEX idx_learning_path_courses_course_id ON learning_path_courses(course_id);
CREATE INDEX idx_learning_path_courses_sort_order ON learning_path_courses(sort_order);

-- Chat Sessions indexes
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_field_id ON chat_sessions(field_id);
CREATE INDEX idx_chat_sessions_created ON chat_sessions(created_at);

-- Chat Messages indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(chat_session_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Fields Table RLS Policies
CREATE POLICY "Fields are viewable by everyone" ON fields
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert fields" ON fields
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update fields" ON fields
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete fields" ON fields
    FOR DELETE USING (true);

-- Courses Table RLS Policies
CREATE POLICY "Courses are viewable by everyone" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can manage courses" ON courses
    FOR ALL USING (true);

-- Learning Paths Table RLS Policies
CREATE POLICY "Learning paths are viewable by everyone" ON learning_paths
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can manage learning paths" ON learning_paths
    FOR ALL USING (true);

-- Learning Path Courses Table RLS Policies
CREATE POLICY "Learning path courses are viewable by everyone" ON learning_path_courses
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage learning path courses" ON learning_path_courses
    FOR ALL USING (true);

-- Chat Sessions Table RLS Policies
CREATE POLICY "Chat sessions are viewable by everyone" ON chat_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage chat sessions" ON chat_sessions
    FOR ALL USING (true);

-- Chat Messages Table RLS Policies
CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage chat messages" ON chat_messages
    FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();