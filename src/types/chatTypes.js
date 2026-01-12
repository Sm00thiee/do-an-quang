/**
 * Database types for Supabase - Simplified Schema
 * Converted from TypeScript to JavaScript with JSDoc annotations
 */

/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} FieldOfStudy
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {string} field_id
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} LearningPath
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} LearningPathCourse
 * @property {string} id
 * @property {string} learning_path_id
 * @property {string} course_id
 * @property {number} sort_order
 * @property {string} created_at
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id
 * @property {string} session_id
 * @property {string|null} [user_id]
 * @property {string|null} [field_id]
 * @property {string|null} [fieldOfStudyId]
 * @property {'active'|'archived'} [status]
 * @property {number} [question_count]
 * @property {string|null} [title]
 * @property {string|null} [last_message_at]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} [sessionId]
 * @property {string} [chat_session_id]
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {string} [created_at]
 * @property {string} [timestamp]
 */

/**
 * @typedef {Object} GeneratedLearningPath
 * @property {string} id
 * @property {string} chat_session_id
 * @property {string} session_id
 * @property {string} field_id
 * @property {string} field_name
 * @property {string} learning_path_name
 * @property {Object} learning_path_data
 * @property {string} learning_path_data.name
 * @property {Array<{title: string, description: string, hours: number, url: string}>} learning_path_data.lessons
 * @property {number} learning_path_data.totalHours
 * @property {boolean} is_read_only
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} CourseWithField
 * @property {Course} field
 */

/**
 * @typedef {Object} LearningPathWithCourses
 * @property {Array<LearningPathCourse & {course: Course}>} courses
 */

/**
 * @typedef {Object} ChatSessionWithMessages
 * @property {ChatMessage[]} messages
 * @property {Field} [field]
 */

/**
 * @typedef {Object} ChatSessionWithFieldAndMessages
 * @property {ChatMessage[]} messages
 * @property {Field|null} field
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {T|null} data
 * @property {string|null} error
 * @property {number} status
 */

/**
 * @typedef {Object} CreateChatSessionRequest
 * @property {string} session_id
 * @property {string} [field_id]
 */

/**
 * @typedef {Object} CreateChatMessageRequest
 * @property {string} chat_session_id
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @typedef {Object} UserInterest
 * @property {string} topic
 * @property {number} weight
 * @property {number} mentions
 * @property {string} lastMentioned
 */

/**
 * @typedef {Object} RecommendationCriteria
 * @property {string} fieldId
 * @property {UserInterest[]} userInterests
 * @property {ChatMessage[]} chatHistory
 * @property {number} questionCount
 * @property {'beginner'|'intermediate'|'advanced'|'unknown'} skillLevel
 * @property {'beginner'|'intermediate'|'advanced'} [preferredDifficulty]
 * @property {string[]} excludedPaths
 * @property {string[]} previouslyViewed
 */

/**
 * @typedef {Object} RecommendationScore
 * @property {string} learningPathId
 * @property {number} score
 * @property {string[]} reasons
 * @property {number} confidence
 */

/**
 * @typedef {Object} RecommendationResult
 * @property {Array<LearningPathWithCourses & {recommendationScore: number, reasons: string[], confidence: number, matchPercentage: number}>} recommendations
 * @property {Array<LearningPathWithCourses & {recommendationScore: number, reasons: string[], confidence: number, matchPercentage: number}>} [fallbackRecommendations]
 * @property {Object} metadata
 * @property {number} metadata.totalPaths
 * @property {string} metadata.algorithm
 * @property {number} metadata.processingTime
 * @property {number} metadata.userInterestsFound
 */

/**
 * @typedef {Object} ChatJob
 * @property {string} id
 * @property {string} job_id
 * @property {string} chat_session_id
 * @property {string} [user_message_id]
 * @property {string} [assistant_message_id]
 * @property {'pending'|'processing'|'completed'|'failed'|'retrying'} status
 * @property {number} priority
 * @property {string} [field_id]
 * @property {string} user_message
 * @property {string} [ai_response]
 * @property {string} [error_message]
 * @property {number} retry_count
 * @property {number} max_retries
 * @property {string} [processing_started_at]
 * @property {string} [processing_completed_at]
 * @property {number} [estimated_duration_ms]
 * @property {number} [actual_duration_ms]
 * @property {number} [gemini_tokens_used]
 * @property {string} [gemini_model]
 * @property {Record<string, any>} metadata
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} RealtimeEvent
 * @property {'job_status_update'|'new_message'|'job_created'|'job_failed'|'connection_status'} type
 * @property {any} data
 * @property {string} timestamp
 * @property {string} [sessionId]
 */

/**
 * @typedef {Object} JobStatusUpdateEvent
 * @property {'job_status_update'} type
 * @property {Object} data
 * @property {string} data.job_id
 * @property {string} data.chat_session_id
 * @property {string} data.old_status
 * @property {string} data.new_status
 * @property {ChatJob} data.job
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} NewMessageEvent
 * @property {'new_message'} type
 * @property {Object} data
 * @property {ChatMessage} data.message
 * @property {string} data.chat_session_id
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} JobCreatedEvent
 * @property {'job_created'} type
 * @property {Object} data
 * @property {ChatJob} data.job
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} JobFailedEvent
 * @property {'job_failed'} type
 * @property {Object} data
 * @property {string} data.job_id
 * @property {string} data.chat_session_id
 * @property {string} data.error_message
 * @property {number} data.retry_count
 * @property {number} data.max_retries
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} ConnectionStatusEvent
 * @property {'connection_status'} type
 * @property {Object} data
 * @property {'connected'|'disconnected'|'reconnecting'|'error'} data.status
 * @property {string} [data.message]
 * @property {string} timestamp
 */

/**
 * @typedef {Object} RealtimeSubscriptionState
 * @property {boolean} isConnected
 * @property {boolean} isConnecting
 * @property {string|null} error
 * @property {Object} subscriptions
 * @property {boolean} subscriptions.chatJobs
 * @property {boolean} subscriptions.chatMessages
 * @property {RealtimeEvent|null} lastEvent
 */

/**
 * @typedef {Object} RealtimeConfig
 * @property {string} sessionId
 * @property {(event: JobStatusUpdateEvent) => void} [onJobStatusUpdate]
 * @property {(event: NewMessageEvent) => void} [onNewMessage]
 * @property {(event: JobCreatedEvent) => void} [onJobCreated]
 * @property {(event: JobFailedEvent) => void} [onJobFailed]
 * @property {(event: ConnectionStatusEvent) => void} [onConnectionStatusChange]
 * @property {(error: Error) => void} [onError]
 */

// Export types as constants for runtime use (for type checking in development)
export const TYPES = {
  FIELD: 'Field',
  CHAT_SESSION: 'ChatSession',
  CHAT_MESSAGE: 'ChatMessage',
  CHAT_JOB: 'ChatJob',
  REALTIME_EVENT: 'RealtimeEvent'
};

// Export type guards for runtime type checking
export const isChatMessage = (obj) => {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' &&
         (obj.role === 'user' || obj.role === 'assistant') &&
         typeof obj.content === 'string';
};

export const isChatSession = (obj) => {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.session_id === 'string' &&
         typeof obj.created_at === 'string';
};

export const isChatJob = (obj) => {
  return obj && typeof obj === 'object' &&
         typeof obj.job_id === 'string' &&
         typeof obj.chat_session_id === 'string' &&
         ['pending', 'processing', 'completed', 'failed', 'retrying'].includes(obj.status);
};
