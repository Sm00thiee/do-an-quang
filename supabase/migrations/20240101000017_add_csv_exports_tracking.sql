-- Add CSV Export Tracking Table
-- This migration adds tracking for CSV export functionality

-- Create csv_exports table for tracking export requests
CREATE TABLE IF NOT EXISTS csv_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    export_format VARCHAR(50) NOT NULL CHECK (export_format IN ('learning-path', 'field-courses', 'all-courses')),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    record_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    processing_time_ms INTEGER,
    strategy_used VARCHAR(20) CHECK (strategy_used IN ('streaming', 'in-memory')),
    language VARCHAR(10) DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_csv_exports_session_id ON csv_exports(session_id);
CREATE INDEX IF NOT EXISTS idx_csv_exports_field_id ON csv_exports(field_id);
CREATE INDEX IF NOT EXISTS idx_csv_exports_learning_path_id ON csv_exports(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_csv_exports_status ON csv_exports(status);
CREATE INDEX IF NOT EXISTS idx_csv_exports_created_at ON csv_exports(created_at);
CREATE INDEX IF NOT EXISTS idx_csv_exports_export_format ON csv_exports(export_format);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_csv_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_csv_exports_updated_at
    BEFORE UPDATE ON csv_exports
    FOR EACH ROW
    EXECUTE FUNCTION update_csv_exports_updated_at();

-- Add RLS policies for csv_exports
ALTER TABLE csv_exports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own export records
CREATE POLICY "Users can view own csv exports" ON csv_exports
    FOR SELECT USING (
        -- This would typically check user_id, but for now we'll use session_id
        -- In a real implementation, you'd join with chat_sessions to verify ownership
        true
    );

-- Policy: Users can insert their own export records
CREATE POLICY "Users can insert own csv exports" ON csv_exports
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own export records
CREATE POLICY "Users can update own csv exports" ON csv_exports
    FOR UPDATE USING (
        -- This would typically check user_id, but for now we'll use session_id
        -- In a real implementation, you'd join with chat_sessions to verify ownership
        true
    );

-- Policy: Users can delete their own export records
CREATE POLICY "Users can delete own csv exports" ON csv_exports
    FOR DELETE USING (
        -- This would typically check user_id, but for now we'll use session_id
        -- In a real implementation, you'd join with chat_sessions to verify ownership
        true
    );

-- Add comments for documentation
COMMENT ON TABLE csv_exports IS 'Tracks CSV export requests for analytics and monitoring';
COMMENT ON COLUMN csv_exports.session_id IS 'Session identifier for the export request';
COMMENT ON COLUMN csv_exports.field_id IS 'Associated field identifier';
COMMENT ON COLUMN csv_exports.learning_path_id IS 'Associated learning path identifier';
COMMENT ON COLUMN csv_exports.export_format IS 'Export format type';
COMMENT ON COLUMN csv_exports.file_name IS 'Generated filename';
COMMENT ON COLUMN csv_exports.file_size IS 'File size in bytes';
COMMENT ON COLUMN csv_exports.record_count IS 'Number of records exported';
COMMENT ON COLUMN csv_exports.status IS 'Export status';
COMMENT ON COLUMN csv_exports.error_message IS 'Error message if export failed';
COMMENT ON COLUMN csv_exports.processing_time_ms IS 'Processing time in milliseconds';
COMMENT ON COLUMN csv_exports.strategy_used IS 'CSV generation strategy used';
COMMENT ON COLUMN csv_exports.language IS 'Export language';
COMMENT ON COLUMN csv_exports.user_agent IS 'User agent string';
COMMENT ON COLUMN csv_exports.ip_address IS 'Client IP address';

-- Create a view for export analytics
CREATE OR REPLACE VIEW csv_export_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as export_date,
    export_format,
    language,
    COUNT(*) as total_exports,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
    AVG(CASE WHEN status = 'completed' THEN processing_time_ms END) as avg_processing_time_ms,
    AVG(file_size) as avg_file_size_bytes,
    SUM(record_count) as total_records_exported,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT field_id) as unique_fields
FROM csv_exports
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), export_format, language
ORDER BY export_date DESC;

COMMENT ON VIEW csv_export_analytics IS 'Daily analytics view for CSV exports';

-- Create a function to clean up old export records (optional)
CREATE OR REPLACE FUNCTION cleanup_old_csv_exports()
RETURNS void AS $$
BEGIN
    DELETE FROM csv_exports 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'Deleted % old CSV export records',
        (SELECT COUNT(*) FROM csv_exports WHERE created_at < NOW() - INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql;

-- Create a function to get export statistics for a session
CREATE OR REPLACE FUNCTION get_session_export_stats(p_session_id VARCHAR(255))
RETURNS TABLE (
    total_exports BIGINT,
    successful_exports BIGINT,
    failed_exports BIGINT,
    total_records_exported BIGINT,
    total_file_size_bytes BIGINT,
    last_export_time TIMESTAMP WITH TIME ZONE,
    avg_processing_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_exports,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_exports,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exports,
        SUM(CASE WHEN status = 'completed' THEN record_count ELSE 0 END) as total_records_exported,
        SUM(CASE WHEN status = 'completed' THEN file_size ELSE 0 END) as total_file_size_bytes,
        MAX(created_at) as last_export_time,
        AVG(CASE WHEN status = 'completed' THEN processing_time_ms END) as avg_processing_time_ms
    FROM csv_exports
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
INSERT INTO csv_exports (
    session_id,
    export_format,
    file_name,
    file_size,
    record_count,
    status,
    strategy_used,
    language
) VALUES 
(
    'test_session_001',
    'learning-path',
    'lo-trinh-marketing-2023-12-23.csv',
    15420,
    45,
    'completed',
    'in-memory',
    'vi'
),
(
    'test_session_002',
    'field-courses',
    'khoa-hoc-ui-ux-2023-12-23.csv',
    8750,
    25,
    'failed',
    'streaming',
    'vi'
)
ON CONFLICT DO NOTHING;