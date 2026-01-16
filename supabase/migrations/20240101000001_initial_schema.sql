-- Initial Schema Migration for CourseAiChat
-- This file creates the complete database schema with all tables, relationships, indexes, and RLS policies

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE user_interest_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE recommendation_status AS ENUM ('pending', 'viewed', 'enrolled', 'completed');
CREATE TYPE interaction_type AS ENUM ('view', 'click', 'bookmark', 'share', 'enroll', 'complete');
CREATE TYPE target_type AS ENUM ('course', 'learning_path', 'recommendation');
CREATE TYPE message_type AS ENUM ('user', 'assistant', 'system');
CREATE TYPE upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE difficulty_level_type AS ENUM ('beginner', 'intermediate', 'advanced');

-- Core Tables

-- 1. Fields (lĩnh vực)
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Learning Paths (lộ trình)
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_level difficulty_level_type,
    estimated_duration_hours INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Management Tables

-- 3. Users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    country VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    questions_asked INTEGER DEFAULT 0,
    max_questions INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Administrative Tables

-- 5. CSV Imports
CREATE TABLE csv_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    upload_status upload_status DEFAULT 'pending',
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_details JSONB,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Import Errors
CREATE TABLE import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    csv_import_id UUID NOT NULL REFERENCES csv_imports(id) ON DELETE CASCADE,
    row_number INTEGER,
    error_type VARCHAR(50),
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    course_url VARCHAR(500),
    duration_hours INTEGER,
    difficulty_level difficulty_level_type,
    instructor_name VARCHAR(100),
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    csv_import_id UUID REFERENCES csv_imports(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat and Interaction Tables

-- 8. Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    message_type message_type,
    content TEXT NOT NULL,
    metadata JSONB,
    is_bookmarked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. User Recommendations
CREATE TABLE user_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    recommendation_score DECIMAL(3, 2) CHECK (recommendation_score >= 0 AND recommendation_score <= 1),
    recommendation_reason TEXT,
    user_interest_level user_interest_level,
    status recommendation_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. User Interactions
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type interaction_type,
    target_type target_type,
    target_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Tables

-- 11. Field Analytics
CREATE TABLE field_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(field_id, date)
);

-- 12. Course Analytics
CREATE TABLE course_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, date)
);

-- Create Indexes

-- Fields indexes
CREATE INDEX idx_fields_name ON fields(name);
CREATE INDEX idx_fields_active ON fields(is_active);

-- Learning Paths indexes
CREATE INDEX idx_learning_paths_field_id ON learning_paths(field_id);
CREATE INDEX idx_learning_paths_active ON learning_paths(is_active);
CREATE INDEX idx_learning_paths_difficulty ON learning_paths(difficulty_level);

-- Courses indexes
CREATE INDEX idx_courses_learning_path_id ON courses(learning_path_id);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_import_id ON courses(csv_import_id);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- User Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_field_id ON user_sessions(field_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Chat Messages indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(user_session_id);
CREATE INDEX idx_chat_messages_field_id ON chat_messages(field_id);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_bookmarked ON chat_messages(is_bookmarked);

-- User Recommendations indexes
CREATE INDEX idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX idx_user_recommendations_field_id ON user_recommendations(field_id);
CREATE INDEX idx_user_recommendations_path_id ON user_recommendations(learning_path_id);
CREATE INDEX idx_user_recommendations_score ON user_recommendations(recommendation_score);
CREATE INDEX idx_user_recommendations_status ON user_recommendations(status);

-- User Interactions indexes
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_target ON user_interactions(target_type, target_id);
CREATE INDEX idx_user_interactions_created ON user_interactions(created_at);

-- CSV Imports indexes
CREATE INDEX idx_csv_imports_status ON csv_imports(upload_status);
CREATE INDEX idx_csv_imports_uploaded_by ON csv_imports(uploaded_by);
CREATE INDEX idx_csv_imports_created ON csv_imports(created_at);

-- Import Errors indexes
CREATE INDEX idx_import_errors_import_id ON import_errors(csv_import_id);
CREATE INDEX idx_import_errors_type ON import_errors(error_type);

-- Field Analytics indexes
CREATE INDEX idx_field_analytics_field_id ON field_analytics(field_id);
CREATE INDEX idx_field_analytics_date ON field_analytics(date);

-- Course Analytics indexes
CREATE INDEX idx_course_analytics_course_id ON course_analytics(course_id);
CREATE INDEX idx_course_analytics_date ON course_analytics(date);

-- RLS policies and triggers will be added in separate migration files