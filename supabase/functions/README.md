# Supabase Edge Functions for CourseAiChat

This directory contains the Supabase Edge Functions implementation for the CourseAiChat chat system with job queue management and Gemini API integration.

## Overview

The Edge Functions provide a serverless backend for processing chat messages through a job queue system, ensuring scalability and reliability. The implementation includes:

- **Job Queue System**: Asynchronous processing with retry logic
- **Gemini API Integration**: AI-powered chat responses
- **Authentication & Security**: JWT validation and rate limiting
- **Error Handling**: Comprehensive error management and logging
- **Real-time Updates**: Status tracking and progress monitoring

## Architecture

```
Client → chat-submit → Job Queue → queue-worker → chat-process → Gemini API
                    ↓
                chat-status ← Database Updates ← chat-process
```

## Functions

### 1. chat-submit

Accepts user messages and creates jobs for processing.

**Endpoint**: `POST /functions/v1/chat-submit`

**Request Body**:
```typescript
{
  session_id: string;      // Chat session identifier
  message: string;         // User message content
  field_id?: string;        // Optional field/domain identifier
  priority?: number;        // Optional priority (default: 0)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    job_id: string;              // Generated job ID
    status: 'pending';           // Initial job status
    estimated_duration_ms: number; // Estimated processing time
    queue_position: number;        // Position in queue
  }
}
```

**Features**:
- Message validation and sanitization
- Session verification and age checking
- Question limit enforcement (10 per session)
- Queue position calculation
- Automatic job creation

### 2. chat-process

Processes queued chat jobs and calls Gemini API.

**Endpoint**: `POST /functions/v1/chat-process`

**Request Body**:
```typescript
{
  job_id?: string;        // Optional specific job ID
  batch_size?: number;     // Batch size (default: 5)
  worker_id?: string;      // Optional worker ID
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    jobs_processed: number;      // Number of jobs processed
    jobs_failed: number;         // Number of jobs failed
    processing_time_ms: number;   // Total processing time
    next_job_available: boolean;  // Whether more jobs are available
    worker_id: string;          // Worker identifier
  }
}
```

**Features**:
- Batch job processing
- Gemini API integration with field-specific prompts
- Conversation history context
- Retry logic with exponential backoff
- Worker health monitoring

### 3. chat-status

Returns job status and results.

**Endpoint**: `GET /functions/v1/chat-status` or `POST /functions/v1/chat-status`

**Query Parameters / Request Body**:
```typescript
{
  job_id?: string;      // Optional specific job ID
  session_id?: string;   // Optional session ID for multiple jobs
  limit?: number;        // Limit for session jobs (default: 10)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    job?: {                    // Single job status (if job_id provided)
      job_id: string;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
      progress?: number;        // Progress percentage
      result?: {               // Result for completed jobs
        message_id: string;
        content: string;
        created_at: string;
      };
      error?: string;          // Error message for failed jobs
      estimated_completion?: string; // Estimated completion time
      queue_position?: number;   // Queue position for pending jobs
      processing_time_ms?: number; // Actual processing time
      retry_count?: number;     // Number of retries
      created_at: string;
      updated_at: string;
    };
    jobs?: Array<...>;        // Multiple jobs (if session_id provided)
    session_stats?: {          // Session statistics
      total_jobs: number;
      completed_jobs: number;
      failed_jobs: number;
      average_processing_time_ms: number;
    };
  }
}
```

**Features**:
- Real-time job status tracking
- Progress calculation and estimation
- Session-level statistics
- Queue position information
- Error details and retry tracking

### 4. queue-worker

Background worker for processing jobs from the queue.

**Endpoint**: `POST /functions/v1/queue-worker`

**Request Body**:
```typescript
{
  worker_id?: string;        // Optional worker ID
  batch_size?: number;       // Batch size (default: 5)
  job_types?: string[];      // Job types to process (default: ['chat_completion'])
  continuous?: boolean;       // Continuous mode (default: false)
  max_duration_ms?: number;   // Maximum duration (default: 300000)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    worker_id: string;
    jobs_processed: number;
    jobs_failed: number;
    processing_time_ms: number;
    next_job_available: boolean;
    continuous: boolean;
    iterations: number;       // Number of batches processed
  }
}
```

**Features**:
- Continuous and batch processing modes
- Multiple job type support
- Worker health monitoring
- Automatic cleanup jobs
- Configurable processing limits

## Shared Utilities

### Base Function Class (`shared/base-function.ts`)

Provides common functionality for all Edge Functions:
- Request validation and authentication
- CORS handling
- Error handling and logging
- Rate limiting
- Database client initialization
- Context extraction

### Gemini Client (`shared/gemini-client.ts`)

Handles communication with Google's Gemini API:
- Request/response handling
- Field-specific prompt generation
- Token usage tracking
- Error handling and retry logic
- Model selection and configuration

### Authentication Middleware (`shared/auth-middleware.ts`)

Manages authentication and authorization:
- JWT token validation
- Session management
- Rate limiting
- IP-based identification
- Service-to-service authentication

### Error Handler (`shared/error-handler.ts`)

Centralized error handling:
- Standardized error responses
- Error logging and tracking
- Validation helpers
- Retry logic with exponential backoff
- Circuit breaker pattern

### Database Operations (`shared/database.ts`)

Database abstraction layer:
- Job queue operations
- Chat session management
- Message storage and retrieval
- Worker status tracking
- Statistics and analytics

### Utils (`shared/utils.ts`)

Common utility functions:
- ID generation
- Message validation
- Time calculations
- Pagination helpers
- Data sanitization
- Cache utilities

## Database Schema

The implementation uses the following key tables:

### chat_jobs
Tracks individual chat processing jobs with status, timing, and results.

### job_queue
Manages asynchronous job processing with priority, retry logic, and worker assignment.

### job_dependencies
Handles dependencies between jobs (for future expansion).

### worker_status
Monitors worker health, performance, and load balancing.

## Environment Variables

Required environment variables for all functions:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini_pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048
GEMINI_TOP_P=0.8
GEMINI_TOP_K=40

# Application Configuration
ENVIRONMENT=development|production
```

## Deployment

### Local Development

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Start local development:
```bash
supabase start
supabase functions serve --env-file .env
```

### Production Deployment

1. Deploy all functions:
```bash
supabase functions deploy chat-submit
supabase functions deploy chat-process
supabase functions deploy chat-status
supabase functions deploy queue-worker
```

2. Set environment variables:
```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Monitoring and Debugging

### Logging

All functions include comprehensive logging:
- Request tracking with unique IDs
- Error logging with context
- Performance metrics
- Worker health monitoring

### Health Checks

Monitor system health:
```bash
# Check queue statistics
curl -X POST https://your-project.supabase.co/functions/v1/queue-worker \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{"batch_size": 1}'
```

### Error Tracking

Errors are logged to:
- Console output (for debugging)
- Database error_logs table (if available)
- Structured error responses

## Security Features

### Authentication
- JWT token validation
- Session-based access control
- Service-to-service authentication

### Rate Limiting
- IP-based rate limiting
- Request throttling
- Configurable limits

### Input Validation
- Message sanitization
- Content length limits
- Harmful content detection
- Required field validation

### Data Protection
- Row Level Security (RLS)
- Encrypted API keys
- Secure headers
- CORS configuration

## Performance Optimizations

### Job Processing
- Batch processing for efficiency
- Priority-based queuing
- Worker load balancing
- Automatic retry with backoff

### Database Operations
- Optimized queries with indexes
- Connection pooling
- Efficient pagination
- Bulk operations where possible

### Caching
- Response caching where appropriate
- Worker status caching
- Queue position caching

## Testing

### Unit Testing

Test individual functions:
```bash
# Test chat-submit
curl -X POST https://your-project.supabase.co/functions/v1/chat-submit \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "message": "Hello, world!"
  }'
```

### Integration Testing

Test full workflow:
1. Submit message via chat-submit
2. Monitor status via chat-status
3. Process jobs via queue-worker
4. Verify completion via chat-status

### Load Testing

Test system under load:
```bash
# Submit multiple concurrent requests
for i in {1..10}; do
  curl -X POST https://your-project.supabase.co/functions/v1/chat-submit \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"test-$i\", \"message\": \"Test message $i\"}" &
done
```

## Troubleshooting

### Common Issues

1. **Jobs not processing**
   - Check worker status via queue-worker
   - Verify environment variables
   - Check database connectivity

2. **Authentication errors**
   - Verify JWT tokens
   - Check service role key
   - Ensure proper headers

3. **Gemini API errors**
   - Verify API key
   - Check rate limits
   - Validate request format

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
supabase functions serve
```

## Future Enhancements

### Planned Features
- WebSocket real-time updates
- Advanced job scheduling
- Multi-model AI support
- Enhanced analytics
- Job prioritization algorithms

### Scalability Improvements
- Horizontal worker scaling
- Geographic distribution
- Load-based auto-scaling
- Performance monitoring

## Support

For issues and questions:
1. Check logs and error messages
2. Verify environment configuration
3. Test with minimal example
4. Review this documentation
5. Check Supabase and Gemini API status

## License

This implementation follows the project's license terms and complies with Supabase and Google Cloud Platform usage policies.