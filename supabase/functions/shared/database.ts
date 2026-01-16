// Database Operations Utilities for Supabase Edge Functions
// Common database operations and helpers

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { edgeLogger, timeStart, timeEnd, timeFunction } from './logger.ts';

export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey?: string;
}

export interface JobQueueItem {
  id: string;
  job_id: string;
  job_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  payload: any;
  result?: any;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  worker_id?: string;
  lock_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatJob {
  id: string;
  job_id: string;
  chat_session_id: string;
  user_message_id?: string;
  assistant_message_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  field_id?: string;
  user_message: string;
  ai_response?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  processing_started_at?: string;
  processing_completed_at?: string;
  estimated_duration_ms?: number;
  actual_duration_ms?: number;
  gemini_tokens_used?: number;
  gemini_model?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  session_id: string;
  field_id?: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkerStatus {
  id: string;
  worker_id: string;
  status: 'idle' | 'busy' | 'offline';
  last_heartbeat: string;
  current_job_id?: string;
  jobs_processed: number;
  jobs_failed: number;
  average_processing_time_ms: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export class DatabaseOperations {
  private supabase: any;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.supabase = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    edgeLogger.info('DatabaseOperations', 'Database operations client initialized', {
      url: config.url,
      hasServiceRoleKey: !!config.serviceRoleKey,
      hasAnonKey: !!config.anonKey
    })
  }

  /**
   * Create Supabase client with custom headers
   */
  createClientWithHeaders(headers?: Record<string, string>): any {
    return createClient(this.config.url, this.config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: headers || {}
      }
    });
  }

  /**
   * Job Queue Operations
   */

  /**
   * Add job to queue
   */
  async addJobToQueue(
    jobId: string,
    jobType: string,
    payload: any,
    priority: number = 0,
    scheduledAt?: string
  ): Promise<JobQueueItem> {
    return await timeFunction(`add-job-to-queue-${jobId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Adding job to queue', {
        jobId,
        jobType,
        priority,
        payloadKeys: Object.keys(payload),
        scheduledAt: scheduledAt || new Date().toISOString()
      })

      timeStart('database-insert')
      
      const { data, error } = await this.supabase
        .from('job_queue')
        .insert({
          job_id: jobId,
          job_type: jobType,
          status: 'queued',
          priority,
          payload,
          scheduled_at: scheduledAt || new Date().toISOString()
        })
        .select()
        .single();

      timeEnd('database-insert')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to add job to queue', error, {
          jobId,
          jobType,
          priority,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Job added to queue successfully', {
        jobId,
        jobType,
        priority,
        queueItemId: data.id
      })

      return data;
    }, 'DatabaseOperations')
  }

  /**
   * Get next batch of jobs for processing
   */
  async getNextJobs(
    batchSize: number = 5,
    jobTypes?: string[]
  ): Promise<JobQueueItem[]> {
    return await timeFunction('get-next-jobs', async () => {
      edgeLogger.info('DatabaseOperations', 'Getting next batch of jobs', {
        batchSize,
        jobTypes,
        jobTypesCount: jobTypes?.length || 0
      })

      timeStart('database-query')
      
      let query = this.supabase
        .from('job_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (jobTypes && jobTypes.length > 0) {
        query = query.in('job_type', jobTypes);
      }

      const { data, error } = await query;

      timeEnd('database-query')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to get next jobs', error, {
          batchSize,
          jobTypes,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Retrieved next jobs batch', {
        batchSize,
        jobTypes,
        actualBatchSize: data.length,
        jobIds: data.map(job => job.job_id)
      })

      // Lock jobs for processing
      if (data.length > 0) {
        timeStart('job-locking')
        
        await this.lockJobsForProcessing(data.map(job => job.job_id));
        
        timeEnd('job-locking')
        
        edgeLogger.info('DatabaseOperations', 'Jobs locked for processing', {
          jobIds: data.map(job => job.job_id),
          lockCount: data.length
        })
      }

      return data;
    }, 'DatabaseOperations')
  }
  /**
   * Lock jobs for processing
   */
  private async lockJobsForProcessing(jobIds: string[]): Promise<void> {
    return await timeFunction('lock-jobs-for-processing', async () => {
      const workerId = this.generateWorkerId();
      const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      edgeLogger.info('DatabaseOperations', 'Locking jobs for processing', {
        jobIds,
        workerId,
        lockExpiry: lockExpiry.toISOString()
      })

      timeStart('database-update')
      
      const { error } = await this.supabase
        .from('job_queue')
        .update({
          status: 'processing',
          worker_id: workerId,
          lock_expires_at: lockExpiry.toISOString(),
          started_at: new Date().toISOString()
        })
        .in('job_id', jobIds);

      timeEnd('database-update')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to lock jobs for processing', error, {
          jobIds,
          workerId,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Jobs locked successfully', {
        jobIds,
        workerId,
        lockCount: jobIds.length
      })
    }, 'DatabaseOperations')
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobQueueItem['status'],
    result?: any,
    errorMessage?: string
  ): Promise<void> {
    return await timeFunction(`update-job-status-${jobId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Updating job status', {
        jobId,
        status,
        hasResult: !!result,
        hasErrorMessage: !!errorMessage
      })

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.result = result;
        updateData.worker_id = null;
        updateData.lock_expires_at = null;
        
        edgeLogger.debug('DatabaseOperations', 'Preparing completed status update', {
          jobId,
          resultKeys: result ? Object.keys(result) : [],
          completedAt: updateData.completed_at
        })
      } else if (status === 'failed') {
        updateData.completed_at = new Date().toISOString();
        updateData.error_message = errorMessage;
        updateData.worker_id = null;
        updateData.lock_expires_at = null;
        
        edgeLogger.debug('DatabaseOperations', 'Preparing failed status update', {
          jobId,
          errorMessage,
          completedAt: updateData.completed_at
        })
      }

      timeStart('database-update')
      
      const { error } = await this.supabase
        .from('job_queue')
        .update(updateData)
        .eq('job_id', jobId);

      timeEnd('database-update')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to update job status', error, {
          jobId,
          status,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Job status updated successfully', {
        jobId,
        status,
        hasResult: !!result,
        hasErrorMessage: !!errorMessage
      })
    }, 'DatabaseOperations')
  }

  /**
   * Schedule job retry
   */
  async scheduleJobRetry(
    jobId: string,
    retryCount: number,
    maxRetries: number,
    errorMessage: string
  ): Promise<void> {
    return await timeFunction(`schedule-job-retry-${jobId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Scheduling job retry', {
        jobId,
        retryCount,
        maxRetries,
        errorMessage
      })

      if (retryCount > maxRetries) {
        edgeLogger.warn('DatabaseOperations', 'Max retries exceeded, marking as failed', {
          jobId,
          retryCount,
          maxRetries,
          errorMessage
        })
        
        await this.updateJobStatus(jobId, 'failed', undefined, errorMessage);
        return;
      }

      const retryDelay = Math.pow(2, retryCount) * 1000; // 2^n seconds
      const nextRetryAt = new Date(Date.now() + retryDelay);

      edgeLogger.debug('DatabaseOperations', 'Preparing retry schedule', {
        jobId,
        retryCount,
        retryDelay,
        nextRetryAt: nextRetryAt.toISOString()
      })

      timeStart('database-update')
      
      const { error } = await this.supabase
        .from('job_queue')
        .update({
          status: 'queued',
          retry_count: retryCount,
          next_retry_at: nextRetryAt.toISOString(),
          worker_id: null,
          lock_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId);

      timeEnd('database-update')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to schedule job retry', error, {
          jobId,
          retryCount,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Job retry scheduled successfully', {
        jobId,
        retryCount,
        nextRetryAt: nextRetryAt.toISOString()
      })
    }, 'DatabaseOperations')
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<JobQueueItem | null> {
    const { data, error } = await this.supabase
      .from('job_queue')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics(): Promise<any> {
    const { data, error } = await this.supabase
      .rpc('get_queue_statistics');

    if (error) throw error;
    return data[0];
  }

  /**
   * Chat Job Operations
   */

  /**
   * Create chat job
   */
  async createChatJob(chatJobData: Partial<ChatJob>): Promise<ChatJob> {
    return await timeFunction('create-chat-job', async () => {
      edgeLogger.info('DatabaseOperations', 'Creating chat job', {
        job_id: chatJobData.job_id,
        chat_session_id: chatJobData.chat_session_id,
        chat_session_id_type: typeof chatJobData.chat_session_id,
        status: chatJobData.status,
        priority: chatJobData.priority,
        field_id: chatJobData.field_id,
        messageLength: chatJobData.user_message?.length
      })

      // TEMPORARILY DISABLED: Validate chat_session_id is a valid UUID format
      // if (chatJobData.chat_session_id && typeof chatJobData.chat_session_id === 'string') {
      //   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      //   if (!uuidRegex.test(chatJobData.chat_session_id)) {
      //     edgeLogger.error('DatabaseOperations', 'Invalid chat_session_id format', new Error('Invalid UUID format'), {
      //       chat_session_id: chatJobData.chat_session_id,
      //       job_id: chatJobData.job_id,
      //       chat_session_id_length: chatJobData.chat_session_id.length,
      //       chat_session_id_type: typeof chatJobData.chat_session_id
      //     })
      //     throw new Error(`Invalid chat_session_id format: ${chatJobData.chat_session_id}`);
      //   }
      // }

      timeStart('database-insert')
      
      // Use RPC function with explicit UUID casting to handle PostgreSQL type conversion
      const { data, error } = await this.supabase
        .rpc('create_chat_job_with_uuid', {
          job_id: chatJobData.job_id,
          chat_session_id: chatJobData.chat_session_id,  // Pass as string, let PostgreSQL cast it
          user_message_id: chatJobData.user_message_id,
          status: chatJobData.status,
          priority: chatJobData.priority,
          field_id: chatJobData.field_id,
          user_message: chatJobData.user_message,
          estimated_duration_ms: chatJobData.estimated_duration_ms,
          metadata: chatJobData.metadata || {}
        });

      timeEnd('database-insert')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to create chat job', error, {
          job_id: chatJobData.job_id,
          chat_session_id: chatJobData.chat_session_id,
          chat_session_id_type: typeof chatJobData.chat_session_id,
          errorCode: error.code,
          errorDetails: error.details,
          errorMessage: error.message
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Chat job created successfully', {
        job_id: chatJobData.job_id,
        chat_job_id: data.id,
        chat_session_id: chatJobData.chat_session_id
      })

      return data;
    }, 'DatabaseOperations')
  }

  /**
   * Update chat job
   */
  async updateChatJob(
    jobId: string,
    updateData: Partial<ChatJob>
  ): Promise<ChatJob> {
    return await timeFunction(`update-chat-job-${jobId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Updating chat job', {
        job_id: jobId,
        updateKeys: Object.keys(updateData),
        hasAiResponse: !!updateData.ai_response,
        hasErrorMessage: !!updateData.error_message
      })

      timeStart('database-update')
      
      const { data, error } = await this.supabase
        .from('chat_jobs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId)
        .select()
        .single();

      timeEnd('database-update')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to update chat job', error, {
          job_id: jobId,
          updateKeys: Object.keys(updateData),
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Chat job updated successfully', {
        job_id: jobId,
        chat_job_id: data.id,
        updateKeys: Object.keys(updateData)
      })

      return data;
    }, 'DatabaseOperations')
  }

  /**
   * Get chat job by ID
   */
  async getChatJob(jobId: string): Promise<ChatJob | null> {
    const { data, error } = await this.supabase
      .from('chat_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get chat jobs for session
   */
  async getChatJobsForSession(
    sessionId: string,
    limit: number = 50
  ): Promise<ChatJob[]> {
    const { data, error } = await this.supabase
      .from('chat_jobs')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Chat Session Operations
   */

  /**
   * Get chat session by session_id
   */
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    return await timeFunction(`get-chat-session-${sessionId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Looking up chat session', {
        session_id: sessionId,
        session_id_type: typeof sessionId
      });

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to lookup chat session', error, {
          session_id: sessionId,
          errorCode: error.code,
          errorDetails: error.details
        });
        return null;
      }

      if (data) {
        edgeLogger.info('DatabaseOperations', 'Chat session found', {
          session_id: sessionId,
          session_uuid: data.id,
          session_uuid_type: typeof data.id,
          session_session_id: data.session_id
        });
      }

      return data;
    }, 'DatabaseOperations')
  }

  /**
   * Create chat session
   */
  async createChatSession(
    sessionId: string,
    fieldId?: string
  ): Promise<ChatSession> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .insert({
        session_id: sessionId,
        field_id: fieldId,
        question_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment question count
   */
  async incrementQuestionCount(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .update({
        question_count: this.supabase.rpc('increment', { column_name: 'question_count' }),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) throw error;
  }

  /**
   * Chat Message Operations
   */

  /**
   * Create chat message
   */
  async createChatMessage(
    chatSessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage> {
    return await timeFunction('create-chat-message', async () => {
      edgeLogger.info('DatabaseOperations', 'Creating chat message', {
        chat_session_id: chatSessionId,
        chat_session_id_type: typeof chatSessionId,
        role,
        contentLength: content?.length
      })

      // TEMPORARILY DISABLED: Validate chat_session_id is a valid UUID format
      // if (chatSessionId && typeof chatSessionId === 'string') {
      //   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      //   if (!uuidRegex.test(chatSessionId)) {
      //     edgeLogger.error('DatabaseOperations', 'Invalid chat_session_id format for message', new Error('Invalid UUID format'), {
      //       chat_session_id: chatSessionId,
      //       role,
      //       chat_session_id_length: chatSessionId.length,
      //       chat_session_id_type: typeof chatSessionId
      //     })
      //     throw new Error(`Invalid chat_session_id format for message: ${chatSessionId}`);
      //   }
      // }

      timeStart('database-insert')
      
      // Use RPC function with explicit UUID casting to handle PostgreSQL type conversion
      const { data, error } = await this.supabase
        .rpc('create_chat_message_with_uuid', {
          chat_session_id: chatSessionId,  // Pass as string, let PostgreSQL cast it
          role,
          content
        });

      timeEnd('database-insert')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to create chat message', error, {
          chat_session_id: chatSessionId,
          role,
          errorCode: error.code,
          errorDetails: error.details,
          errorMessage: error.message
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Chat message created successfully', {
        chat_session_id: chatSessionId,
        message_id: data.id,
        role,
        contentLength: content?.length
      })

      return data;
    }, 'DatabaseOperations')
  }

  /**
   * Get messages for session
   */
  async getChatMessages(
    sessionId: string,
    limit: number = 100
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Worker Status Operations
   */

  /**
   * Register worker
   */
  async registerWorker(workerId: string): Promise<void> {
    return await timeFunction(`register-worker-${workerId}`, async () => {
      edgeLogger.info('DatabaseOperations', 'Registering worker', {
        worker_id: workerId
      })

      timeStart('database-upsert')
      
      const { error } = await this.supabase
        .from('worker_status')
        .upsert({
          worker_id: workerId,
          status: 'busy',
          last_heartbeat: new Date().toISOString()
        });

      timeEnd('database-upsert')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to register worker', error, {
          worker_id: workerId,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }

      edgeLogger.info('DatabaseOperations', 'Worker registered successfully', {
        worker_id: workerId
      })
    }, 'DatabaseOperations')
  }

  /**
   * Update worker heartbeat
   */
  async updateWorkerHeartbeat(workerId: string): Promise<void> {
    return await timeFunction(`update-worker-heartbeat-${workerId}`, async () => {
      edgeLogger.debug('DatabaseOperations', 'Updating worker heartbeat', {
        worker_id: workerId
      })

      timeStart('database-update')
      
      const { error } = await this.supabase
        .from('worker_status')
        .update({
          last_heartbeat: new Date().toISOString()
        })
        .eq('worker_id', workerId);

      timeEnd('database-update')

      if (error) {
        edgeLogger.error('DatabaseOperations', 'Failed to update worker heartbeat', error, {
          worker_id: workerId,
          errorCode: error.code,
          errorDetails: error.details
        })
        throw error;
      }
    }, 'DatabaseOperations')
  }

  /**
   * Update worker stats
   */
  async updateWorkerStats(
    workerId: string,
    jobsProcessed: number,
    jobsFailed: number,
    processingTime: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('worker_status')
      .update({
        status: 'idle',
        jobs_processed: this.supabase.rpc('increment', { 
          column_name: 'jobs_processed', 
          increment: jobsProcessed 
        }),
        jobs_failed: this.supabase.rpc('increment', { 
          column_name: 'jobs_failed', 
          increment: jobsFailed 
        }),
        average_processing_time_ms: processingTime,
        last_heartbeat: new Date().toISOString()
      })
      .eq('worker_id', workerId);

    if (error) throw error;
  }

  /**
   * Unregister worker
   */
  async unregisterWorker(workerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('worker_status')
      .update({
        status: 'offline',
        last_heartbeat: new Date().toISOString()
      })
      .eq('worker_id', workerId);

    if (error) throw error;
  }

  /**
   * Utility Functions
   */

  /**
   * Generate unique worker ID
   */
  generateWorkerId(): string {
    return `worker-${crypto.randomUUID()}`;
  }

  /**
   * Generate unique job ID
   */
  generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Estimate processing time based on message length
   */
  estimateProcessingTime(message: string): number {
    // Base time + time per character
    const baseTime = 2000; // 2 seconds base
    const timePerChar = 10; // 10ms per character
    return baseTime + (message.length * timePerChar);
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(): Promise<void> {
    const { error } = await this.supabase
      .rpc('cleanup_old_jobs');

    if (error) throw error;
  }

  /**
   * Get active workers count
   */
  async getActiveWorkersCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('worker_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'busy');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Check if more jobs are available
   */
  async hasMoreJobs(): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('job_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    return (count || 0) > 0;
  }
}

/**
 * Create database operations instance
 */
export function createDatabaseOperations(): DatabaseOperations {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  return new DatabaseOperations({
    url,
    serviceRoleKey,
    anonKey
  });
}