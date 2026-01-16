-- Fix learning paths relationships and ensure proper constraints
-- This migration ensures that the relationship between learning_paths and learning_path_courses is properly defined

-- Create learning_paths table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    field_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the learning_path_courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_path_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id UUID NOT NULL,
    course_id UUID NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(learning_path_id, course_id)
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_paths_active') THEN
        CREATE INDEX idx_learning_paths_active ON learning_paths(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_paths_name') THEN
        CREATE INDEX idx_learning_paths_name ON learning_paths(name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_courses_active') THEN
        CREATE INDEX idx_courses_active ON courses(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_path_courses_path_id') THEN
        CREATE INDEX idx_learning_path_courses_path_id ON learning_path_courses(learning_path_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_learning_path_courses_course_id') THEN
        CREATE INDEX idx_learning_path_courses_course_id ON learning_path_courses(course_id);
    END IF;
END $$;

-- Now ensure the foreign key constraints exist
DO $$ 
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'learning_path_courses_learning_path_id_fkey' 
               AND table_name = 'learning_path_courses') THEN
        ALTER TABLE learning_path_courses 
        DROP CONSTRAINT learning_path_courses_learning_path_id_fkey;
    END IF;
    
    -- Add the foreign key constraint with proper cascade
    ALTER TABLE learning_path_courses
    ADD CONSTRAINT learning_path_courses_learning_path_id_fkey
    FOREIGN KEY (learning_path_id) 
    REFERENCES learning_paths(id) 
    ON DELETE CASCADE;
    
    -- Drop existing foreign key for course_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'learning_path_courses_course_id_fkey' 
               AND table_name = 'learning_path_courses') THEN
        ALTER TABLE learning_path_courses 
        DROP CONSTRAINT learning_path_courses_course_id_fkey;
    END IF;
    
    -- Add the foreign key constraint for course_id with proper cascade
    ALTER TABLE learning_path_courses
    ADD CONSTRAINT learning_path_courses_course_id_fkey
    FOREIGN KEY (course_id) 
    REFERENCES courses(id) 
    ON DELETE CASCADE;
END $$;

-- Create or replace a view for easy querying of learning paths with courses
CREATE OR REPLACE VIEW learning_paths_with_courses AS
SELECT 
    lp.id,
    lp.name,
    lp.description,
    lp.is_active,
    lp.created_at,
    lp.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'id', c.id,
                'title', c.title,
                'description', c.description,
                'field_id', c.field_id,
                'sort_order', lpc.sort_order
            ) ORDER BY lpc.sort_order
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
    ) as courses
FROM learning_paths lp
LEFT JOIN learning_path_courses lpc ON lp.id = lpc.learning_path_id
LEFT JOIN courses c ON lpc.course_id = c.id
GROUP BY lp.id, lp.name, lp.description, lp.is_active, lp.created_at, lp.updated_at;

-- Grant permissions on the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_paths TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_path_courses TO anon, authenticated;

-- Grant permissions on the view
GRANT SELECT ON learning_paths_with_courses TO anon, authenticated;

-- Add comments
COMMENT ON TABLE learning_paths IS 'Stores learning path definitions';
COMMENT ON TABLE courses IS 'Stores course information';
COMMENT ON TABLE learning_path_courses IS 'Junction table linking learning paths to courses';
COMMENT ON VIEW learning_paths_with_courses IS 'View that combines learning paths with their associated courses';
