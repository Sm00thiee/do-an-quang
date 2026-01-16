# Course AI Chat Database Schema

This directory contains the database schema and migrations for the Course AI Chat project using Supabase.

## Overview

The database schema is designed to support a course recommendation and chat system without requiring user authentication. It uses session IDs to track user interactions and question counts.

## Database Structure

### Core Tables

#### 1. Fields (`fields`)
Represents categories or domains that users can choose from.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `name` (VARCHAR(100), Unique) - Field name (e.g., "Web Development")
- `description` (TEXT) - Field description
- `is_active` (BOOLEAN) - Whether the field is active
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### 2. Courses (`courses`)
Individual courses that can be combined into learning paths.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `title` (VARCHAR(200)) - Course title
- `description` (TEXT) - Course description
- `field_id` (UUID, Foreign Key) - Reference to fields table
- `is_active` (BOOLEAN) - Whether the course is active
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### 3. Learning Paths (`learning_paths`)
"Lộ trình" - combinations of courses that form a complete learning path.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `name` (VARCHAR(200)) - Learning path name
- `description` (TEXT) - Learning path description
- `is_active` (BOOLEAN) - Whether the learning path is active
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### 4. Learning Path Courses (`learning_path_courses`)
Junction table for many-to-many relationship between learning paths and courses.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `learning_path_id` (UUID, Foreign Key) - Reference to learning_paths table
- `course_id` (UUID, Foreign Key) - Reference to courses table
- `sort_order` (INTEGER) - Order of course in learning path
- `created_at` (TIMESTAMP) - Creation timestamp

#### 5. Chat Sessions (`chat_sessions`)
Tracks user conversations and question counts using session IDs.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `session_id` (VARCHAR(255), Unique) - Session identifier for tracking users
- `field_id` (UUID, Foreign Key, Nullable) - Reference to fields table
- `question_count` (INTEGER) - Number of questions asked in session
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### 6. Chat Messages (`chat_messages`)
Stores individual messages in chat sessions.

**Columns:**
- `id` (UUID, Primary Key) - Unique identifier
- `chat_session_id` (UUID, Foreign Key) - Reference to chat_sessions table
- `role` (VARCHAR(20)) - Message role ('user' or 'assistant')
- `content` (TEXT) - Message content
- `created_at` (TIMESTAMP) - Creation timestamp

## Relationships

```
Fields (1) ←→ (N) Courses
Fields (1) ←→ (N) Chat Sessions

Learning Paths (1) ←→ (N) Learning Path Courses (N) ←→ (1) Courses

Chat Sessions (1) ←→ (N) Chat Messages
```

## Migrations

### Migration Files

1. **`20240101000005_simplified_schema.sql`** - Creates the simplified database schema
2. **`20240101000006_simplified_seed_data.sql`** - Seeds the database with initial data

### Running Migrations

To apply the migrations to your Supabase project:

```bash
# Navigate to your project directory
cd course-ai-chat

# Apply migrations using Supabase CLI
supabase db push
```

## Seed Data

The database is seeded with:

- **5 Fields**: Web Development, Data Science, Mobile Development, Cloud Computing, UI/UX Design
- **9 Courses**: Distributed across different fields
- **3 Learning Paths**: 
  - Full Stack Web Development
  - Data Science Fundamentals
  - Mobile App Development
- **3 Sample Chat Sessions** with messages for testing

## TypeScript Types

TypeScript types are defined in `course-ai-chat/src/types/index.ts` and include:

- Base types for all tables
- Extended types with relationships
- Form types for data entry
- API response types
- Insert and Update types

## Security

The schema uses Row Level Security (RLS) with permissive policies for development. In production, you should:

1. Restrict access based on user roles
2. Implement proper authentication
3. Add data validation policies
4. Set up audit logging

## Testing

A test script is available at `course-ai-chat/src/services/test-schema.ts` to verify the schema implementation:

```typescript
import { testSchema } from './services/test-schema'

// Run tests
const result = await testSchema()
console.log(result)
```

## Usage Examples

### Fetching all active fields
```typescript
const { data: fields } = await supabase
  .from('fields')
  .select('*')
  .eq('is_active', true)
```

### Fetching courses with field information
```typescript
const { data: courses } = await supabase
  .from('courses')
  .select(`
    *,
    field:fields(name, description)
  `)
  .eq('is_active', true)
```

### Fetching learning paths with courses
```typescript
const { data: learningPaths } = await supabase
  .from('learning_paths')
  .select(`
    *,
    learning_path_courses(
      sort_order,
      course:courses(id, title, description)
    )
  `)
  .eq('is_active', true)
```

### Creating a new chat session
```typescript
const { data: session } = await supabase
  .from('chat_sessions')
  .insert({
    session_id: 'unique_session_id',
    field_id: 'field_uuid',
    question_count: 0
  })
  .select()
  .single()
```

### Adding a message to a session
```typescript
const { data: message } = await supabase
  .from('chat_messages')
  .insert({
    chat_session_id: 'session_uuid',
    role: 'user',
    content: 'What courses do you recommend?'
  })
  .select()
  .single()
```

## Indexes

The schema includes indexes for performance optimization:

- Fields: `name`, `is_active`
- Courses: `field_id`, `is_active`, `title`
- Learning Paths: `is_active`, `name`
- Learning Path Courses: `learning_path_id`, `course_id`, `sort_order`
- Chat Sessions: `session_id`, `field_id`, `created_at`
- Chat Messages: `chat_session_id`, `role`, `created_at`

## Triggers

Automatic `updated_at` timestamp triggers are set up for:

- Fields
- Courses
- Learning Paths
- Chat Sessions

## Notes

- The schema is designed to work without authentication, using session IDs
- All tables use UUID primary keys for better performance and security
- The schema supports soft deletes through `is_active` flags
- Junction table allows for flexible course ordering in learning paths
- Chat sessions track question counts for potential usage limits or analytics