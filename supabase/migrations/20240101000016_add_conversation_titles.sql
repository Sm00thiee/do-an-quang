-- Add title column to chat_sessions table (already added in migration 15, but keeping for safety)
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for faster querying using session_id instead of user_id
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id_created 
ON chat_sessions(session_id, created_at DESC);

-- Update existing sessions to have a default title based on field name
UPDATE chat_sessions 
SET title = COALESCE(
  (SELECT name FROM fields WHERE id = chat_sessions.field_id),
  'Untitled Conversation'
)
WHERE title IS NULL;

-- Set default for future inserts
ALTER TABLE chat_sessions 
ALTER COLUMN title SET DEFAULT 'Untitled Conversation';