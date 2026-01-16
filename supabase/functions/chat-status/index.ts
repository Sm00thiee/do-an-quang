// Chat Status Edge Function
// Returns job status and results

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { BaseFunction, createEdgeFunctionHandler } from '../shared/base-function.ts';
import { ErrorHandler } from '../shared/error-handler.ts';
import { edgeLogger, timeStart, timeEnd, timeFunction } from '../shared/logger.ts';

interface ChatStatusRequest {
  job_id?: string;
  session_id?: string;
  limit?: number;
}

interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress?: number;
  result?: {
    message_id: string;
    content: string;
    created_at: string;
  };
  error?: string;
  estimated_completion?: string;
  queue_position?: number;
  processing_time_ms?: number;
  retry_count?: number;
  created_at: string;
  updated_at: string;
}

interface ChatStatusResponse {
  job?: JobStatus;
  jobs?: JobStatus[];
  session_stats?: {
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    average_processing_time_ms: number;
  };
}

class ChatStatusFunction extends BaseFunction {
  private logger = edgeLogger.child('ChatStatus');

  async handleRequest(
    req: Request,
    context: RequestContext
  ): Promise<Response> {
    const requestId = crypto.randomUUID();
    edgeLogger.setContext({ requestId });
    
    this.logger.info('Status request started', {
      method: req.method,
      url: req.url,
      clientIP: context.clientIP,
      userAgent: context.userAgent
    });

    return await timeFunction('chat-status-request', async () => {
      // Allow GET and POST requests
      if (req.method !== 'GET' && req.method !== 'POST') {
        this.logger.warn('Invalid method attempted', { method: req.method });
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_INPUT,
          'Phương thức không được phép. Sử dụng GET hoặc POST.'
        );
      }

      // Extract parameters
      let jobId: string | undefined;
      let sessionId: string | undefined;
      let limit = 10;

      if (req.method === 'GET') {
        // Extract from query parameters
        const url = new URL(req.url);
        jobId = url.searchParams.get('job_id') || undefined;
        sessionId = url.searchParams.get('session_id') || undefined;
        limit = parseInt(url.searchParams.get('limit') || '10');
      } else {
        // Extract from request body
        const body = await this.parseRequestBody<ChatStatusRequest>(req);
        jobId = body.job_id;
        sessionId = body.session_id;
        limit = body.limit || 10;
      }

      this.logger.debug('Request parameters parsed', {
        method: req.method,
        job_id: jobId,
        session_id: sessionId,
        limit
      });

      if (jobId) {
        edgeLogger.setContext({ requestId, jobId });
      } else if (sessionId) {
        edgeLogger.setContext({ requestId, sessionId });
      }

      try {
        if (jobId) {
          this.logger.info('Getting specific job status', { job_id: jobId });
          
          // Get specific job status
          const jobStatus = await this.getJobStatus(jobId);
          if (!jobStatus) {
            this.logger.warn('Job not found', { job_id: jobId });
            throw ErrorHandler.createError(
              ErrorHandler.ERROR_CODES.JOB_NOT_FOUND,
              `Công việc ${jobId} không được tìm thấy`
            );
          }

          this.logger.info('Job status retrieved successfully', {
            job_id: jobId,
            status: jobStatus.status,
            has_result: !!jobStatus.result,
            has_error: !!jobStatus.error
          });

          const response: ChatStatusResponse = { job: jobStatus };
          return this.successResponse(response);

        } else if (sessionId) {
          this.logger.info('Getting session jobs and stats', { session_id: sessionId, limit });
          
          // Get jobs for session
          const jobs = await this.getSessionJobs(sessionId, limit);
          const sessionStats = await this.getSessionStats(sessionId);

          this.logger.info('Session data retrieved successfully', {
            session_id: sessionId,
            jobs_count: jobs.length,
            total_jobs: sessionStats.total_jobs,
            completed_jobs: sessionStats.completed_jobs,
            failed_jobs: sessionStats.failed_jobs,
            average_processing_time_ms: sessionStats.average_processing_time_ms
          });

          const response: ChatStatusResponse = {
            jobs,
            session_stats: sessionStats
          };
          return this.successResponse(response);

        } else {
          this.logger.warn('Missing required parameters', {
            has_job_id: !!jobId,
            has_session_id: !!sessionId
          });
          
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.MISSING_REQUIRED_FIELD,
            'Cần có job_id hoặc session_id'
          );
        }

      } catch (error) {
        this.logger.error('Status request failed', error instanceof Error ? error : new Error(String(error)), {
          job_id: jobId,
          session_id: sessionId,
          limit
        });
        
        // Re-throw known errors
        if (error instanceof Error && (
            error.message.includes('not found') ||
            error.message.includes('Invalid session')
        )) {
          throw error;
        }

        // Handle unexpected errors
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INTERNAL_ERROR,
          `Không thể lấy trạng thái công việc: ${error.message}`
        );
      }
    }, 'ChatStatus');
  }

  /**
   * Get status for a specific job
   */
  private async getJobStatus(jobId: string): Promise<JobStatus | null> {
    return await timeFunction(`get-job-status-${jobId}`, async () => {
      try {
        timeStart('chat-job-retrieval');
        
        // Get chat job
        const chatJob = await this.db.getChatJob(jobId);
        if (!chatJob) {
          this.logger.debug('Chat job not found', { job_id: jobId });
          return null;
        }

        this.logger.debug('Chat job retrieved', {
          job_id: jobId,
          status: chatJob.status,
          created_at: chatJob.created_at,
          updated_at: chatJob.updated_at
        });
        
        timeEnd('chat-job-retrieval');

        timeStart('queue-job-retrieval');
        
        // Get queue job for additional info
        const queueJob = await this.db.getJob(jobId);
        
        timeEnd('queue-job-retrieval');

        // Build response
        const jobStatus: JobStatus = {
          job_id: chatJob.job_id,
          status: chatJob.status,
          created_at: chatJob.created_at,
          updated_at: chatJob.updated_at,
          retry_count: chatJob.retry_count
        };

        // Add progress information
        if (chatJob.status === 'processing') {
          jobStatus.progress = this.calculateProgress(chatJob);
          jobStatus.estimated_completion = this.estimateCompletion(chatJob);
          
          this.logger.debug('Progress calculated', {
            job_id: jobId,
            progress: jobStatus.progress,
            estimated_completion: jobStatus.estimated_completion
          });
        }

        // Add queue position for pending jobs
        if (chatJob.status === 'pending') {
          timeStart('queue-position-calculation');
          
          jobStatus.queue_position = await this.getQueuePosition(chatJob.priority);
          
          timeEnd('queue-position-calculation');
          
          this.logger.debug('Queue position calculated', {
            job_id: jobId,
            priority: chatJob.priority,
            queue_position: jobStatus.queue_position
          });
        }

        // Add result for completed jobs
        if (chatJob.status === 'completed' && chatJob.assistant_message_id) {
          timeStart('assistant-message-retrieval');
          
          const assistantMessage = await this.db.getChatMessage(chatJob.assistant_message_id);
          if (assistantMessage) {
            jobStatus.result = {
              message_id: assistantMessage.id,
              content: assistantMessage.content,
              created_at: assistantMessage.created_at
            };
          }
          
          timeEnd('assistant-message-retrieval');
          
          jobStatus.processing_time_ms = chatJob.actual_duration_ms;
          
          this.logger.debug('Job result retrieved', {
            job_id: jobId,
            has_result: !!jobStatus.result,
            processing_time_ms: jobStatus.processing_time_ms
          });
        }

        // Add error information for failed jobs
        if (chatJob.status === 'failed') {
          jobStatus.error = chatJob.error_message;
          
          this.logger.debug('Job error information', {
            job_id: jobId,
            error_message: chatJob.error_message,
            retry_count: chatJob.retry_count
          });
        }

        return jobStatus;

      } catch (error) {
        this.logger.error('Failed to get job status', error instanceof Error ? error : new Error(String(error)), {
          job_id: jobId
        });
        return null;
      }
    }, 'ChatStatus');
  }

  /**
   * Get jobs for a session
   */
  private async getSessionJobs(sessionId: string, limit: number): Promise<JobStatus[]> {
    try {
      // Get chat jobs for session
      const chatJobs = await this.db.getChatJobsForSession(sessionId, limit);
      
      const jobs: JobStatus[] = [];

      for (const chatJob of chatJobs) {
        const jobStatus: JobStatus = {
          job_id: chatJob.job_id,
          status: chatJob.status,
          created_at: chatJob.created_at,
          updated_at: chatJob.updated_at,
          retry_count: chatJob.retry_count
        };

        // Add progress information
        if (chatJob.status === 'processing') {
          jobStatus.progress = this.calculateProgress(chatJob);
          jobStatus.estimated_completion = this.estimateCompletion(chatJob);
        }

        // Add queue position for pending jobs
        if (chatJob.status === 'pending') {
          jobStatus.queue_position = await this.getQueuePosition(chatJob.priority);
        }

        // Add result for completed jobs
        if (chatJob.status === 'completed' && chatJob.assistant_message_id) {
          const assistantMessage = await this.db.getChatMessage(chatJob.assistant_message_id);
          if (assistantMessage) {
            jobStatus.result = {
              message_id: assistantMessage.id,
              content: assistantMessage.content,
              created_at: assistantMessage.created_at
            };
          }
          jobStatus.processing_time_ms = chatJob.actual_duration_ms;
        }

        // Add error information for failed jobs
        if (chatJob.status === 'failed') {
          jobStatus.error = chatJob.error_message;
        }

        jobs.push(jobStatus);
      }

      return jobs;

    } catch (error) {
      console.error('Failed to get session jobs:', error);
      return [];
    }
  }

  /**
   * Get session statistics
   */
  private async getSessionStats(sessionId: string): Promise<{
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    average_processing_time_ms: number;
  }> {
    try {
      const jobs = await this.db.getChatJobsForSession(sessionId, 1000); // Get all jobs for stats
      
      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(job => job.status === 'completed').length;
      const failedJobs = jobs.filter(job => job.status === 'failed').length;
      
      const completedJobsWithTime = jobs.filter(
        job => job.status === 'completed' && job.actual_duration_ms
      );
      
      const averageProcessingTime = completedJobsWithTime.length > 0
        ? Math.round(
            completedJobsWithTime.reduce((sum, job) => sum + (job.actual_duration_ms || 0), 0) /
            completedJobsWithTime.length
          )
        : 0;

      return {
        total_jobs: totalJobs,
        completed_jobs: completedJobs,
        failed_jobs: failedJobs,
        average_processing_time_ms: averageProcessingTime
      };

    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        total_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        average_processing_time_ms: 0
      };
    }
  }

  /**
   * Calculate job progress percentage
   */
  private calculateProgress(chatJob: any): number {
    if (!chatJob.estimated_duration_ms) {
      return 50; // Default progress for jobs without estimate
    }

    if (!chatJob.processing_started_at) {
      return 0;
    }

    const elapsed = Date.now() - new Date(chatJob.processing_started_at).getTime();
    const progress = Math.min(95, Math.round((elapsed / chatJob.estimated_duration_ms) * 100));
    
    return Math.max(5, progress); // At least 5% once started
  }

  /**
   * Estimate job completion time
   */
  private estimateCompletion(chatJob: any): string {
    if (!chatJob.estimated_duration_ms) {
      return new Date(Date.now() + 30000).toISOString(); // Default 30 seconds
    }

    if (!chatJob.processing_started_at) {
      return new Date(Date.now() + chatJob.estimated_duration_ms).toISOString();
    }

    const elapsed = Date.now() - new Date(chatJob.processing_started_at).getTime();
    const remaining = Math.max(0, chatJob.estimated_duration_ms - elapsed);
    
    return new Date(Date.now() + remaining).toISOString();
  }

  /**
   * Get queue position for a job priority
   */
  private async getQueuePosition(priority: number): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('job_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued')
        .gt('priority', priority);

      if (error) return 0;
      return (count || 0) + 1; // +1 for position (1-based)
    } catch (error) {
      console.error('Failed to get queue position:', error);
      return 0;
    }
  }
}

// Create and export handler
const handler = createEdgeFunctionHandler(ChatStatusFunction);

// Serve the function
serve(handler);