/**
 * Chat Type Definitions
 * Adapted from CourseAiChat for JavaScript with JSDoc
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
 * @typedef {Object} LearningPathLesson
 * @property {string} title
 * @property {string} description
 * @property {number} hours
 * @property {string} url
 */

/**
 * @typedef {Object} LearningPathData
 * @property {string} name
 * @property {LearningPathLesson[]} lessons
 * @property {number} totalHours
 */

/**
 * @typedef {Object} GeneratedLearningPath
 * @property {string} id
 * @property {string} chat_session_id
 * @property {string} session_id
 * @property {string} field_id
 * @property {string} field_name
 * @property {string} learning_path_name
 * @property {LearningPathData} learning_path_data
 * @property {boolean} is_read_only
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Course & {field: Field}} CourseWithField
 */

/**
 * @typedef {Object} LearningPathCourseWithDetails
 * @property {string} id
 * @property {string} learning_path_id
 * @property {string} course_id
 * @property {number} sort_order
 * @property {string} created_at
 * @property {Course} course
 */

/**
 * @typedef {LearningPath & {courses: LearningPathCourseWithDetails[]}} LearningPathWithCourses
 */

/**
 * @typedef {ChatSession & {messages: ChatMessage[]}} ChatSessionWithMessages
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
 * @typedef {Object} ApiResponse
 * @template T
 * @property {T|null} data
 * @property {string|null} error
 * @property {number} status
 */

/**
 * @typedef {Object} ChatJob
 * @property {string} id
 * @property {string} job_id
 * @property {string} chat_session_id
 * @property {'pending'|'processing'|'completed'|'failed'} status
 * @property {string} user_message
 * @property {string|null} ai_response
 * @property {boolean} is_learning_path
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} JobQueueItem
 * @property {string} id
 * @property {string} job_id
 * @property {string} job_type
 * @property {'queued'|'processing'|'completed'|'failed'} status
 * @property {Object} payload
 * @property {Object|null} result
 * @property {string|null} error_message
 * @property {number} retry_count
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} StreamCallbacks
 * @property {function(string): void} onChunk - Called for each content chunk
 * @property {function(): void} [onComplete] - Called when streaming completes
 * @property {function(Error): void} [onError] - Called on error
 */

export {};
