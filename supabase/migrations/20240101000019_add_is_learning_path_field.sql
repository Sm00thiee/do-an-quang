-- Add is_learning_path field to chat_jobs table
-- This field tracks whether the response was a learning path from CSV data

ALTER TABLE chat_jobs ADD COLUMN IF NOT EXISTS is_learning_path BOOLEAN DEFAULT false;

-- Create index for efficient querying of learning path jobs
CREATE INDEX IF NOT EXISTS idx_chat_jobs_is_learning_path 
    ON chat_jobs(is_learning_path);

-- Add comment to explain the field
COMMENT ON COLUMN chat_jobs.is_learning_path IS 
'Indicates whether this job resulted in displaying a learning path from CSV data (vs. regular Gemini response)';
