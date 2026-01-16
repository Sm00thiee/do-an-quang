-- Database Functions and Triggers Migration for CourseAiChat
-- This file creates all necessary functions and triggers for the database

-- Update Timestamp Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at_column trigger to relevant tables
CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_recommendations_updated_at BEFORE UPDATE ON user_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_csv_imports_updated_at BEFORE UPDATE ON csv_imports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment Question Count Function
CREATE OR REPLACE FUNCTION increment_question_count(
    p_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current question count and max allowed
    SELECT questions_asked, max_questions 
    INTO current_count, max_allowed
    FROM user_sessions 
    WHERE id = p_session_id AND is_active = true;
    
    -- Check if session exists and is active
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has reached the limit
    IF current_count >= max_allowed THEN
        RETURN FALSE;
    END IF;
    
    -- Increment the question count
    UPDATE user_sessions 
    SET questions_asked = questions_asked + 1,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create User Recommendation Function
CREATE OR REPLACE FUNCTION create_user_recommendation(
    p_user_id UUID,
    p_field_id UUID,
    p_learning_path_id UUID,
    p_score DECIMAL,
    p_reason TEXT
) RETURNS UUID AS $$
DECLARE
    recommendation_id UUID;
BEGIN
    -- Create the recommendation
    INSERT INTO user_recommendations (
        user_id, field_id, learning_path_id, 
        recommendation_score, recommendation_reason
    ) VALUES (
        p_user_id, p_field_id, p_learning_path_id, 
        p_score, p_reason
    ) RETURNING id INTO recommendation_id;
    
    -- Log the interaction
    INSERT INTO user_interactions (
        user_id, interaction_type, target_type, target_id
    ) VALUES (
        p_user_id, 'view', 'recommendation', recommendation_id
    );
    
    RETURN recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- Analytics Update Function
CREATE OR REPLACE FUNCTION update_field_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert field analytics for the current date
    INSERT INTO field_analytics (
        field_id, date, total_sessions, total_questions, unique_users
    ) VALUES (
        NEW.field_id, CURRENT_DATE, 1, 
        CASE WHEN NEW.message_type = 'user' THEN 1 ELSE 0 END,
        1
    ) ON CONFLICT (field_id, date) DO UPDATE SET
        total_sessions = field_analytics.total_sessions + 1,
        total_questions = field_analytics.total_questions + 
            CASE WHEN NEW.message_type = 'user' THEN 1 ELSE 0 END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply analytics trigger
CREATE TRIGGER update_field_analytics_trigger AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_field_analytics();

-- Course Analytics Update Function
CREATE OR REPLACE FUNCTION update_course_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert course analytics for the current date
    INSERT INTO course_analytics (
        course_id, date, total_views
    ) VALUES (
        NEW.course_id, CURRENT_DATE, 1
    ) ON CONFLICT (course_id, date) DO UPDATE SET
        total_views = course_analytics.total_views + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_field_id UUID,
    p_session_token VARCHAR(255),
    p_max_questions INTEGER DEFAULT 10,
    p_expires_hours INTEGER DEFAULT 24
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Create the session
    INSERT INTO user_sessions (
        user_id, field_id, session_token, max_questions, 
        expires_at
    ) VALUES (
        p_user_id, p_field_id, p_session_token, p_max_questions,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can ask more questions
CREATE OR REPLACE FUNCTION can_ask_more_questions(
    p_session_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    questions_asked INTEGER;
    max_questions INTEGER;
    session_active BOOLEAN;
    session_expired BOOLEAN;
BEGIN
    -- Get session information
    SELECT questions_asked, max_questions, is_active, expires_at > NOW()
    INTO questions_asked, max_questions, session_active, session_expired
    FROM user_sessions 
    WHERE id = p_session_id;
    
    -- Check if session exists and is valid
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if session is active and not expired
    IF NOT session_active OR NOT session_expired THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has reached the question limit
    IF questions_asked >= max_questions THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's active session
CREATE OR REPLACE FUNCTION get_active_user_session(
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Get the most recent active session that hasn't expired
    SELECT id INTO session_id
    FROM user_sessions 
    WHERE user_id = p_user_id 
        AND is_active = true 
        AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log user interaction
CREATE OR REPLACE FUNCTION log_user_interaction(
    p_user_id UUID,
    p_interaction_type interaction_type,
    p_target_type target_type,
    p_target_id UUID,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    interaction_id UUID;
BEGIN
    -- Create the interaction
    INSERT INTO user_interactions (
        user_id, interaction_type, target_type, target_id, metadata
    ) VALUES (
        p_user_id, p_interaction_type, p_target_type, p_target_id, p_metadata
    ) RETURNING id INTO interaction_id;
    
    RETURN interaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get field statistics
CREATE OR REPLACE FUNCTION get_field_statistics(
    p_field_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Build the query with optional date filters
    EXECUTE format('
        SELECT json_build_object(
            ''total_sessions'', COALESCE(SUM(total_sessions), 0),
            ''total_questions'', COALESCE(SUM(total_questions), 0),
            ''unique_users'', COALESCE(SUM(unique_users), 0),
            ''avg_conversion_rate'', COALESCE(AVG(conversion_rate), 0)
        )
        FROM field_analytics 
        WHERE field_id = %L
        %s
        %s
    ', p_field_id, 
        CASE WHEN p_start_date IS NOT NULL THEN format('AND date >= %L', p_start_date) ELSE '' END,
        CASE WHEN p_end_date IS NOT NULL THEN format('AND date <= %L', p_end_date) ELSE '' END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get learning path details with course count
CREATE OR REPLACE FUNCTION get_learning_path_details(
    p_learning_path_id UUID
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', lp.id,
        'name', lp.name,
        'description', lp.description,
        'difficulty_level', lp.difficulty_level,
        'estimated_duration_hours', lp.estimated_duration_hours,
        'course_count', COUNT(c.id),
        'total_duration', COALESCE(SUM(c.duration_hours), 0),
        'field_name', f.name
    ) INTO result
    FROM learning_paths lp
    LEFT JOIN courses c ON lp.id = c.learning_path_id AND c.is_active = true
    JOIN fields f ON lp.field_id = f.id
    WHERE lp.id = p_learning_path_id AND lp.is_active = true
    GROUP BY lp.id, lp.name, lp.description, lp.difficulty_level, lp.estimated_duration_hours, f.name;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Deactivate expired sessions
    UPDATE user_sessions 
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true AND expires_at <= NOW();
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's chat history
CREATE OR REPLACE FUNCTION get_user_chat_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', cm.id,
            'message_type', cm.message_type,
            'content', cm.content,
            'metadata', cm.metadata,
            'created_at', cm.created_at,
            'field_name', f.name
        )
    ) INTO result
    FROM chat_messages cm
    JOIN user_sessions us ON cm.user_session_id = us.id
    LEFT JOIN fields f ON cm.field_id = f.id
    WHERE us.user_id = p_user_id
    ORDER BY cm.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Function to get popular fields
CREATE OR REPLACE FUNCTION get_popular_fields(
    p_limit INTEGER DEFAULT 10
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', f.id,
            'name', f.name,
            'description', f.description,
            'session_count', COUNT(DISTINCT us.id),
            'unique_users', COUNT(DISTINCT us.user_id),
            'avg_questions_per_session', COALESCE(AVG(us.questions_asked), 0)
        )
    ) INTO result
    FROM fields f
    LEFT JOIN user_sessions us ON f.id = us.field_id AND us.is_active = true
    WHERE f.is_active = true
    GROUP BY f.id, f.name, f.description
    ORDER BY COUNT(DISTINCT us.id) DESC, COUNT(DISTINCT us.user_id) DESC
    LIMIT p_limit;
    
    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;