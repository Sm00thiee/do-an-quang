-- Generated Learning Paths Migration
-- This table stores learning paths that were generated/displayed to users during chat sessions
-- When a user requests to see a learning path, it's automatically saved here

-- Create generated_learning_paths table
CREATE TABLE IF NOT EXISTS generated_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL, -- Denormalized for easier querying
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL, -- Denormalized field name for display
    learning_path_name VARCHAR(200) NOT NULL,
    learning_path_data JSONB NOT NULL, -- Full learning path data (lessons, hours, etc)
    is_read_only BOOLEAN DEFAULT true, -- Always read-only as per requirements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_generated_learning_paths_session_id 
    ON generated_learning_paths(chat_session_id);
    
CREATE INDEX IF NOT EXISTS idx_generated_learning_paths_session_string 
    ON generated_learning_paths(session_id);
    
CREATE INDEX IF NOT EXISTS idx_generated_learning_paths_field_id 
    ON generated_learning_paths(field_id);
    
CREATE INDEX IF NOT EXISTS idx_generated_learning_paths_created 
    ON generated_learning_paths(created_at DESC);

-- Enable RLS
ALTER TABLE generated_learning_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for everyone (no edit/delete from UI)
CREATE POLICY "Generated learning paths are viewable by everyone" 
    ON generated_learning_paths
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert generated learning paths" 
    ON generated_learning_paths
    FOR INSERT WITH CHECK (is_read_only = true);

-- Prevent updates and deletes via RLS (only cascade deletes allowed)
CREATE POLICY "Prevent manual updates to generated learning paths" 
    ON generated_learning_paths
    FOR UPDATE USING (false);

CREATE POLICY "Prevent manual deletes of generated learning paths" 
    ON generated_learning_paths
    FOR DELETE USING (false);

-- Create updated_at trigger
CREATE TRIGGER update_generated_learning_paths_updated_at 
    BEFORE UPDATE ON generated_learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE generated_learning_paths IS 
'Stores learning paths that were automatically generated and displayed to users during chat sessions. These paths are read-only and are automatically deleted when the parent chat session is deleted.';

COMMENT ON COLUMN generated_learning_paths.is_read_only IS 
'Always true. Users cannot edit or manually delete these paths - they are managed automatically.';

COMMENT ON COLUMN generated_learning_paths.learning_path_data IS 
'JSONB containing full learning path structure: {name, lessons: [{title, description, hours, url}], totalHours}';
