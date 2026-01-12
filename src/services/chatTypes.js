// Shared chat-related "types" (JS objects/shapes) inspired by CourseAiChat/src/types/index.ts
// NOTE: This is plain JS, not TypeScript. JSDoc is used for editor intellisense.

/**
 * @typedef {Object} ChatSession
 * @property {string} id
 * @property {string} session_id
 * @property {string|null} [user_id]
 * @property {string|null} [field_id]
 * @property {string|null} [status] - 'active' | 'archived'
 * @property {number} [question_count]
 * @property {string|null} [title]
 * @property {string|null} [last_message_at]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} chat_session_id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {string} created_at
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
 * @property {Object.<string, any>} [metadata]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {'job_status_update'|'new_message'|'job_created'|'job_failed'|'connection_status'} RealtimeEventType
 */

/**
 * @typedef {Object} JobStatusUpdateEvent
 * @property {'job_status_update'} type
 * @property {{ job_id:string, chat_session_id:string, old_status:string, new_status:string, job:ChatJob }} data
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} NewMessageEvent
 * @property {'new_message'} type
 * @property {{ message:ChatMessage, chat_session_id:string }} data
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} JobCreatedEvent
 * @property {'job_created'} type
 * @property {{ job:ChatJob }} data
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} JobFailedEvent
 * @property {'job_failed'} type
 * @property {{ job_id:string, chat_session_id:string, error_message:string, retry_count:number, max_retries:number }} data
 * @property {string} timestamp
 * @property {string} sessionId
 */

/**
 * @typedef {Object} ConnectionStatusEvent
 * @property {'connection_status'} type
 * @property {{ status:'connected'|'disconnected'|'reconnecting'|'error', message?:string }} data
 * @property {string} timestamp
 */

/**
 * @typedef {Object} RealtimeSubscriptionState
 * @property {boolean} isConnected
 * @property {boolean} isConnecting
 * @property {string|null} error
 * @property {{ chatJobs:boolean, chatMessages:boolean }} subscriptions
 * @property {JobStatusUpdateEvent|NewMessageEvent|JobCreatedEvent|JobFailedEvent|ConnectionStatusEvent|null} lastEvent
 */

/**
 * @typedef {Object} RealtimeConfig
 * @property {string} sessionId
 * @property {(event:JobStatusUpdateEvent)=>void} [onJobStatusUpdate]
 * @property {(event:NewMessageEvent)=>void} [onNewMessage]
 * @property {(event:JobCreatedEvent)=>void} [onJobCreated]
 * @property {(event:JobFailedEvent)=>void} [onJobFailed]
 * @property {(event:ConnectionStatusEvent)=>void} [onConnectionStatusChange]
 * @property {(error:Error)=>void} [onError]
 */

/**
 * @typedef {Object} ApiResponse
 * @property {any|null} data
 * @property {string|null} error
 * @property {number} status
 */

module.exports = {
  // Empty export on purpose – this file is used mainly for JSDoc typing.
};

