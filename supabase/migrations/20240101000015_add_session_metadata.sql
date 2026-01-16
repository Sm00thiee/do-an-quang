-- Add metadata fields to chat_sessions table for better conversation history tracking

-- Add title and last_message columns to chat_sessions if they don't exist
DO $$
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='chat_sessions' 
    AND column_name='title'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN title VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='chat_sessions' 
    AND column_name='last_message_at'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_sessions' 
    AND indexname = 'idx_chat_sessions_last_message'
  ) THEN
    CREATE INDEX idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_sessions' 
    AND indexname = 'idx_chat_sessions_session_id'
  ) THEN
    CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);
  END IF;
END $$;

-- Create a function to update last_message_at when a new message is added
CREATE OR REPLACE FUNCTION update_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.chat_session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_message_at
DROP TRIGGER IF EXISTS trigger_update_session_last_message ON chat_messages;
CREATE TRIGGER trigger_update_session_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_message();

-- Backfill existing sessions with last_message_at from their latest message
DO $$
BEGIN
  -- Only update if last_message_at is NULL
  UPDATE chat_sessions cs
  SET last_message_at = (
    SELECT MAX(created_at)
    FROM chat_messages cm
    WHERE cm.chat_session_id = cs.id
  )
  WHERE last_message_at IS NULL
  AND EXISTS (
    SELECT 1 FROM chat_messages cm WHERE cm.chat_session_id = cs.id
  );
END $$;

-- Create a function to auto-generate title from first user message
CREATE OR REPLACE FUNCTION auto_generate_session_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set title if it's empty and this is a user message
  IF NEW.role = 'user' AND 
     (SELECT title FROM chat_sessions WHERE id = NEW.chat_session_id) IS NULL THEN
    UPDATE chat_sessions
    SET title = LEFT(NEW.content, 100)
    WHERE id = NEW.chat_session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate title from first message
DROP TRIGGER IF EXISTS trigger_auto_generate_title ON chat_messages;
CREATE TRIGGER trigger_auto_generate_title
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_session_title();