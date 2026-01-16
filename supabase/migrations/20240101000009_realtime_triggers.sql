-- Real-time Triggers Migration for CourseAiChat
-- This file adds database triggers to enable real-time subscriptions for chat responses

-- Enable Realtime for chat_jobs and chat_messages tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Function to broadcast job status changes to realtime subscribers
CREATE OR REPLACE FUNCTION broadcast_job_realtime()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger ensures that changes to chat_jobs are broadcast to realtime subscribers
    -- The actual broadcasting is handled by Supabase's realtime system
    
    -- Log the change for debugging (optional, can be removed in production)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE LOG 'Job status changed: % from % to % for session %', 
            NEW.job_id, OLD.status, NEW.status, NEW.chat_session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to broadcast new message notifications
CREATE OR REPLACE FUNCTION broadcast_message_realtime()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger ensures that new messages are broadcast to realtime subscribers
    
    -- Log the new message for debugging (optional, can be removed in production)
    IF TG_OP = 'INSERT' THEN
        RAISE LOG 'New message inserted: role=%, session=%', NEW.role, NEW.chat_session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time broadcasting

-- Trigger for chat_jobs table (all changes)
CREATE TRIGGER trigger_chat_jobs_realtime
    AFTER INSERT OR UPDATE ON chat_jobs
    FOR EACH ROW EXECUTE FUNCTION broadcast_job_realtime();

-- Trigger for chat_messages table (new messages only)
CREATE TRIGGER trigger_chat_messages_realtime
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION broadcast_message_realtime();

-- Enhanced Row Level Security policies for real-time access

-- Ensure users can only subscribe to their own session data
CREATE POLICY "Users can subscribe to own chat jobs realtime" ON chat_jobs
    FOR SELECT USING (
        chat_session_id IN (
            SELECT id FROM chat_sessions 
            WHERE session_id = current_setting('app.current_session_id', true)
        )
    );

CREATE POLICY "Users can subscribe to own chat messages realtime" ON chat_messages
    FOR SELECT USING (
        chat_session_id IN (
            SELECT id FROM chat_sessions 
            WHERE session_id = current_setting('app.current_session_id', true)
        )
    );

-- Function to set session context for RLS
CREATE OR REPLACE FUNCTION set_realtime_session_context(session_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Set the session context for Row Level Security
    PERFORM set_config('app.current_session_id', 
        (SELECT session_id FROM chat_sessions WHERE id = session_uuid), 
        true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active jobs for a session with real-time updates
CREATE OR REPLACE FUNCTION get_active_session_jobs(session_uuid UUID)
RETURNS TABLE(
    job_id VARCHAR,
    status VARCHAR,
    priority INTEGER,
    user_message TEXT,
    ai_response TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Set session context for RLS
    PERFORM set_realtime_session_context(session_uuid);
    
    -- Return active jobs for the session
    RETURN QUERY
    SELECT 
        cj.job_id,
        cj.status,
        cj.priority,
        cj.user_message,
        cj.ai_response,
        cj.error_message,
        cj.created_at,
        cj.updated_at
    FROM chat_jobs cj
    WHERE cj.chat_session_id = session_uuid
    AND cj.status IN ('pending', 'processing', 'retrying')
    ORDER BY cj.priority DESC, cj.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent messages for a session with real-time updates
CREATE OR REPLACE FUNCTION get_recent_session_messages(session_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    role VARCHAR,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Set session context for RLS
    PERFORM set_realtime_session_context(session_uuid);
    
    -- Return recent messages for the session
    RETURN QUERY
    SELECT 
        cm.id,
        cm.role,
        cm.content,
        cm.created_at
    FROM chat_messages cm
    WHERE cm.chat_session_id = session_uuid
    ORDER BY cm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if session has active processing jobs
CREATE OR REPLACE FUNCTION session_has_active_jobs(session_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    active_job_count INTEGER;
BEGIN
    -- Set session context for RLS
    PERFORM set_realtime_session_context(session_uuid);
    
    -- Count active jobs
    SELECT COUNT(*) INTO active_job_count
    FROM chat_jobs
    WHERE chat_session_id = session_uuid
    AND status IN ('pending', 'processing', 'retrying');
    
    RETURN active_job_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better real-time performance

-- Index for faster session-based queries
CREATE INDEX IF NOT EXISTS idx_chat_jobs_session_status ON chat_jobs(chat_session_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(chat_session_id, created_at DESC);

-- Partial index for active jobs only
CREATE INDEX IF NOT EXISTS idx_chat_jobs_active ON chat_jobs(chat_session_id, created_at) 
WHERE status IN ('pending', 'processing', 'retrying');

-- Grant necessary permissions for real-time functions
GRANT EXECUTE ON FUNCTION set_realtime_session_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_session_jobs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_session_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION session_has_active_jobs(UUID) TO authenticated;

-- Grant necessary permissions for realtime publication
GRANT SELECT ON chat_jobs TO authenticated;
GRANT SELECT ON chat_messages TO authenticated;

-- Create a view for real-time session activity
CREATE OR REPLACE VIEW realtime_session_activity AS
SELECT 
    cs.id as session_uuid,
    cs.session_id,
    cs.field_id,
    cs.question_count,
    cs.updated_at as last_activity,
    COUNT(CASE WHEN cj.status IN ('pending', 'processing', 'retrying') THEN 1 END) as active_jobs,
    COUNT(CASE WHEN cj.status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN cj.status = 'failed' THEN 1 END) as failed_jobs,
    MAX(cm.created_at) as last_message_time
FROM chat_sessions cs
LEFT JOIN chat_jobs cj ON cs.id = cj.chat_session_id
LEFT JOIN chat_messages cm ON cs.id = cm.chat_session_id
GROUP BY cs.id, cs.session_id, cs.field_id, cs.question_count, cs.updated_at;

-- Grant permissions on the view
GRANT SELECT ON realtime_session_activity TO authenticated;

-- Function to get session activity summary for real-time dashboard
CREATE OR REPLACE FUNCTION get_session_activity_summary(session_uuid UUID)
RETURNS TABLE(
    session_id VARCHAR,
    field_id UUID,
    question_count INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE,
    active_jobs INTEGER,
    completed_jobs INTEGER,
    failed_jobs INTEGER,
    last_message_time TIMESTAMP WITH TIME ZONE,
    has_recent_activity BOOLEAN
) AS $$
BEGIN
    -- Set session context for RLS
    PERFORM set_realtime_session_context(session_uuid);
    
    -- Return session activity summary
    RETURN QUERY
    SELECT 
        rsa.session_id,
        rsa.field_id,
        rsa.question_count,
        rsa.last_activity,
        rsa.active_jobs,
        rsa.completed_jobs,
        rsa.failed_jobs,
        rsa.last_message_time,
        (rsa.last_activity > NOW() - INTERVAL '1 hour') as has_recent_activity
    FROM realtime_session_activity rsa
    WHERE rsa.session_uuid = session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_session_activity_summary(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON PUBLICATION supabase_realtime IS 'Publication for real-time subscriptions to chat_jobs and chat_messages tables';
COMMENT ON FUNCTION broadcast_job_realtime() IS 'Trigger function to broadcast job changes to realtime subscribers';
COMMENT ON FUNCTION broadcast_message_realtime() IS 'Trigger function to broadcast new messages to realtime subscribers';
COMMENT ON FUNCTION set_realtime_session_context(UUID) IS 'Sets session context for Row Level Security in real-time operations';
COMMENT ON FUNCTION get_active_session_jobs(UUID) IS 'Returns active jobs for a session with RLS applied';
COMMENT ON FUNCTION get_recent_session_messages(UUID, INTEGER) IS 'Returns recent messages for a session with RLS applied';
COMMENT ON FUNCTION session_has_active_jobs(UUID) IS 'Checks if a session has any active processing jobs';
COMMENT ON VIEW realtime_session_activity IS 'View for monitoring real-time session activity';
COMMENT ON FUNCTION get_session_activity_summary(UUID) IS 'Returns comprehensive session activity summary for real-time dashboard';