-- Job Queue System Migration for CourseAiChat
-- This file adds job tracking and queue management tables

-- 1. Chat Jobs Table for tracking chat processing jobs
CREATE TABLE chat_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    assistant_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    priority INTEGER DEFAULT 0,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_ms INTEGER,
    actual_duration_ms INTEGER,
    gemini_tokens_used INTEGER,
    gemini_model VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Job Queue Table for managing asynchronous job processing
CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    job_type VARCHAR(100) NOT NULL DEFAULT 'chat_completion',
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 0,
    payload JSONB NOT NULL,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    worker_id VARCHAR(255),
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Job Dependencies Table for handling job dependencies
CREATE TABLE job_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) NOT NULL REFERENCES job_queue(job_id) ON DELETE CASCADE,
    depends_on_job_id VARCHAR(255) NOT NULL REFERENCES job_queue(job_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, depends_on_job_id)
);

-- 4. Worker Status Table for monitoring worker health
CREATE TABLE worker_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('idle', 'busy', 'offline')),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_job_id VARCHAR(255) REFERENCES job_queue(job_id),
    jobs_processed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    average_processing_time_ms INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance

-- Chat Jobs indexes
CREATE INDEX idx_chat_jobs_session_id ON chat_jobs(chat_session_id);
CREATE INDEX idx_chat_jobs_status ON chat_jobs(status);
CREATE INDEX idx_chat_jobs_created_at ON chat_jobs(created_at);
CREATE INDEX idx_chat_jobs_priority_status ON chat_jobs(priority DESC, status);
CREATE INDEX idx_chat_jobs_retry ON chat_jobs(status, retry_count, max_retries);
CREATE INDEX idx_chat_jobs_job_id ON chat_jobs(job_id);

-- Job Queue indexes
CREATE INDEX idx_job_queue_status_priority ON job_queue(status, priority DESC);
CREATE INDEX idx_job_queue_scheduled_at ON job_queue(scheduled_at);
CREATE INDEX idx_job_queue_worker_id ON job_queue(worker_id);
CREATE INDEX idx_job_queue_next_retry ON job_queue(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX idx_job_queue_job_id ON job_queue(job_id);
CREATE INDEX idx_job_queue_job_type ON job_queue(job_type);

-- Worker Status indexes
CREATE INDEX idx_worker_status_status ON worker_status(status);
CREATE INDEX idx_worker_status_heartbeat ON worker_status(last_heartbeat);
CREATE INDEX idx_worker_status_worker_id ON worker_status(worker_id);

-- Job Dependencies indexes
CREATE INDEX idx_job_dependencies_job_id ON job_dependencies(job_id);
CREATE INDEX idx_job_dependencies_depends_on ON job_dependencies(depends_on_job_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE chat_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_status ENABLE ROW LEVEL SECURITY;

-- Chat Jobs policies
CREATE POLICY "Users can view own chat jobs" ON chat_jobs
    FOR SELECT USING (
        chat_session_id IN (
            SELECT id FROM chat_sessions 
            WHERE session_id = current_setting('app.current_session_id', true)
        )
    );

CREATE POLICY "Service can manage chat jobs" ON chat_jobs
    FOR ALL USING (
        current_setting('app.service_role', true) = 'true'
    );

-- Job Queue policies
CREATE POLICY "Service can manage job queue" ON job_queue
    FOR ALL USING (
        current_setting('app.service_role', true) = 'true'
    );

-- Job Dependencies policies
CREATE POLICY "Service can manage job dependencies" ON job_dependencies
    FOR ALL USING (
        current_setting('app.service_role', true) = 'true'
    );

-- Worker Status policies
CREATE POLICY "Service can manage worker status" ON worker_status
    FOR ALL USING (
        current_setting('app.service_role', true) = 'true'
    );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_chat_jobs_updated_at BEFORE UPDATE ON chat_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_queue_updated_at BEFORE UPDATE ON job_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_status_updated_at BEFORE UPDATE ON worker_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to broadcast job status changes
CREATE OR REPLACE FUNCTION broadcast_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update job_queue status when chat_jobs status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        UPDATE job_queue 
        SET status = CASE NEW.status
            WHEN 'processing' THEN 'processing'
            WHEN 'completed' THEN 'completed'
            WHEN 'failed' THEN 'failed'
            WHEN 'retrying' THEN 'queued'
            ELSE 'queued'
        END,
            updated_at = NOW()
        WHERE job_id = NEW.job_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chat_jobs table
CREATE TRIGGER trigger_broadcast_job_status_change
    AFTER UPDATE ON chat_jobs
    FOR EACH ROW EXECUTE FUNCTION broadcast_job_status_change();

-- Function to clean up old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS void AS $$
BEGIN
    -- Delete completed jobs older than 7 days
    DELETE FROM job_queue 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '7 days';
    
    -- Delete failed jobs older than 30 days
    DELETE FROM job_queue 
    WHERE status = 'failed' 
    AND completed_at < NOW() - INTERVAL '30 days';
    
    -- Delete corresponding chat jobs
    DELETE FROM chat_jobs 
    WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - INTERVAL '30 days'
    AND id NOT IN (
        SELECT DISTINCT chat_session_id 
        FROM chat_sessions 
        WHERE updated_at > NOW() - INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to increment question count in chat_sessions
CREATE OR REPLACE FUNCTION increment_question_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment question count when a user message is added
    IF NEW.role = 'user' AND TG_OP = 'INSERT' THEN
        UPDATE chat_sessions 
        SET question_count = question_count + 1,
            updated_at = NOW()
        WHERE id = NEW.chat_session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment question count
CREATE TRIGGER trigger_increment_question_count
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION increment_question_count();

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_statistics()
RETURNS TABLE(
    queued_jobs BIGINT,
    processing_jobs BIGINT,
    completed_jobs_today BIGINT,
    failed_jobs_today BIGINT,
    active_workers BIGINT,
    average_processing_time_ms INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM job_queue WHERE status = 'queued') AS queued_jobs,
        (SELECT COUNT(*)::BIGINT FROM job_queue WHERE status = 'processing') AS processing_jobs,
        (SELECT COUNT(*)::BIGINT FROM job_queue WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE) AS completed_jobs_today,
        (SELECT COUNT(*)::BIGINT FROM job_queue WHERE status = 'failed' AND DATE(completed_at) = CURRENT_DATE) AS failed_jobs_today,
        (SELECT COUNT(*)::BIGINT FROM worker_status WHERE status = 'busy') AS active_workers,
        (SELECT COALESCE(AVG(actual_duration_ms), 0)::INTEGER FROM chat_jobs WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) AS average_processing_time_ms;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON chat_jobs TO authenticated;
GRANT ALL ON chat_jobs TO service_role;
GRANT ALL ON job_queue TO authenticated;
GRANT ALL ON job_queue TO service_role;
GRANT ALL ON job_dependencies TO authenticated;
GRANT ALL ON job_dependencies TO service_role;
GRANT ALL ON worker_status TO authenticated;
GRANT ALL ON worker_status TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION broadcast_job_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_job_status_change() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION increment_question_count() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_question_count() TO service_role;
GRANT EXECUTE ON FUNCTION get_queue_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_statistics() TO service_role;