-- UUID Fix Functions Migration for CourseAiChat
-- This file adds RPC functions to handle UUID conversion properly

-- Function to create chat job with proper UUID handling
CREATE OR REPLACE FUNCTION create_chat_job_with_uuid(
    p_job_id VARCHAR(255),
    p_chat_session_id UUID,
    p_status VARCHAR(50),
    p_user_message TEXT,
    p_user_message_id UUID DEFAULT NULL,
    p_priority INTEGER DEFAULT 0,
    p_field_id UUID DEFAULT NULL,
    p_estimated_duration_ms INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    id UUID,
    job_id VARCHAR(255),
    chat_session_id UUID,
    user_message_id UUID,
    assistant_message_id UUID,
    status VARCHAR(50),
    priority INTEGER,
    field_id UUID,
    user_message TEXT,
    ai_response TEXT,
    error_message TEXT,
    retry_count INTEGER,
    max_retries INTEGER,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_ms INTEGER,
    actual_duration_ms INTEGER,
    gemini_tokens_used INTEGER,
    gemini_model VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO chat_jobs (
        job_id,
        chat_session_id,
        user_message_id,
        status,
        priority,
        field_id,
        user_message,
        estimated_duration_ms,
        metadata,
        retry_count,
        max_retries
    ) VALUES (
        p_job_id,
        p_chat_session_id,
        p_user_message_id,
        p_status,
        p_priority,
        p_field_id,
        p_user_message,
        p_estimated_duration_ms,
        p_metadata,
        0,
        3
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create chat message with proper UUID handling
CREATE OR REPLACE FUNCTION create_chat_message_with_uuid(
    p_chat_session_id UUID,
    p_role VARCHAR(20),
    p_content TEXT
)
RETURNS TABLE(
    id UUID,
    chat_session_id UUID,
    role VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO chat_messages (
        chat_session_id,
        role,
        content
    ) VALUES (
        p_chat_session_id,
        p_role,
        p_content
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION create_chat_job_with_uuid(
    VARCHAR(255), UUID, VARCHAR(50), TEXT, UUID, INTEGER, UUID, INTEGER, JSONB
) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_job_with_uuid(
    VARCHAR(255), UUID, VARCHAR(50), TEXT, UUID, INTEGER, UUID, INTEGER, JSONB
) TO service_role;
GRANT EXECUTE ON FUNCTION create_chat_message_with_uuid(
    UUID, VARCHAR(20), TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_message_with_uuid(
    UUID, VARCHAR(20), TEXT
) TO service_role;