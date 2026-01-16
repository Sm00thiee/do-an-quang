// Chat Process Edge Function
// Processes queued chat jobs and calls Gemini API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { BaseFunction, createEdgeFunctionHandler } from '../shared/base-function.ts';
import { ErrorHandler } from '../shared/error-handler.ts';
import { createGeminiClient } from '../shared/gemini-client.ts';
import { generateWorkerId } from '../shared/utils.ts';
import { edgeLogger, timeStart, timeEnd, timeFunction } from '../shared/logger.ts';
import { csvParser, CSVParser, VIETNAMESE_LEARNING_PATH_KEYWORDS } from '../shared/csvParser.ts';

// Deno types for environment detection
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface ChatProcessRequest {
  job_id?: string;
  batch_size?: number;
  worker_id?: string;
}

interface ChatProcessResponse {
  jobs_processed: number;
  jobs_failed: number;
  processing_time_ms: number;
  next_job_available: boolean;
  worker_id: string;
}

class ChatProcessFunction extends BaseFunction {
  private geminiClient: any;
  private workerId: string;
  private logger = edgeLogger.child('ChatProcess');

  constructor() {
    super();
    this.workerId = generateWorkerId();
    this.geminiClient = createGeminiClient();
    
    this.logger.info('Worker initialized', {
      worker_id: this.workerId
    });
  }

  async handleRequest(
    req: Request,
    context: RequestContext
  ): Promise<Response> {
    const requestId = crypto.randomUUID();
    edgeLogger.setContext({ requestId });
    
    this.logger.info('Processing request started', {
      method: req.method,
      url: req.url,
      clientIP: context.clientIP,
      userAgent: context.userAgent
    });

    return await timeFunction('chat-process-request', async () => {
      // Only allow POST requests
      if (req.method !== 'POST') {
        this.logger.warn('Invalid method attempted', { method: req.method });
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_INPUT,
          'Phương thức không được phép. Sử dụng POST.'
        );
      }

      // Parse request body
      const { job_id, batch_size = 5, worker_id } = await this.parseRequestBody<ChatProcessRequest>(req);
      
      // Use provided worker_id or generate new one
      const currentWorkerId = worker_id || this.workerId;
      
      edgeLogger.setContext({
        requestId,
        workerId: currentWorkerId,
        jobId: job_id
      });

      this.logger.debug('Request parsed', {
        job_id,
        batch_size,
        worker_id: currentWorkerId
      });

      try {
        timeStart('worker-registration');
        
        // Register worker
        await this.db.registerWorker(currentWorkerId);
        
        this.logger.info('Worker registered', { worker_id: currentWorkerId });
        
        timeEnd('worker-registration');

        // Process specific job or batch
        if (job_id) {
          this.logger.info('Processing single job', { job_id, worker_id: currentWorkerId });
          return await this.processSingleJob(job_id, currentWorkerId);
        } else {
          this.logger.info('Processing batch jobs', { batch_size, worker_id: currentWorkerId });
          return await this.processBatchJobs(batch_size, currentWorkerId);
        }

      } catch (error) {
        this.logger.error('Request processing failed', error instanceof Error ? error : new Error(String(error)), {
          job_id,
          batch_size,
          worker_id: currentWorkerId
        });
        
        // Unregister worker on error
        await this.unregisterWorker(currentWorkerId);
        throw error;
      }
    }, 'ChatProcess');
  }

  /**
   * Process a single job
   */
  private async processSingleJob(jobId: string, workerId: string): Promise<Response> {
    return await timeFunction(`process-single-job-${jobId}`, async () => {
      const startTime = Date.now();
      let processedCount = 0;
      let failedCount = 0;

      try {
        timeStart('job-retrieval');
        
        const job = await this.db.getJob(jobId);
        if (!job) {
          this.logger.error('Job not found', undefined, { job_id: jobId });
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.JOB_NOT_FOUND,
            `Công việc ${jobId} không được tìm thấy`
          );
        }

        this.logger.debug('Job retrieved', {
          job_id: jobId,
          status: job.status,
          job_type: job.job_type
        });
        
        timeEnd('job-retrieval');

        if (job.status !== 'queued') {
          this.logger.warn('Job not in queued status', {
            job_id: jobId,
            current_status: job.status,
            expected_status: 'queued'
          });
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.INVALID_INPUT,
            `Công việc ${jobId} không ở trạng thái chờ hàng đợi`
          );
        }

        timeStart('job-processing');
        
        await this.processJob(job, workerId);
        processedCount = 1;
        
        timeEnd('job-processing');

        const processingTime = Date.now() - startTime;
        
        timeStart('worker-stats-update');
        
        await this.updateWorkerStats(workerId, processedCount, failedCount, processingTime);
        
        timeEnd('worker-stats-update');

        const response: ChatProcessResponse = {
          jobs_processed: processedCount,
          jobs_failed: failedCount,
          processing_time_ms: processingTime,
          next_job_available: await this.db.hasMoreJobs(),
          worker_id: workerId
        };

        this.logger.info('Single job processing completed', {
          job_id: jobId,
          worker_id: workerId,
          processing_time_ms: processingTime,
          next_job_available: response.next_job_available
        });

        return this.successResponse(response);

      } catch (error) {
        failedCount = 1;
        const processingTime = Date.now() - startTime;
        
        this.logger.error('Single job processing failed', error instanceof Error ? error : new Error(String(error)), {
          job_id: jobId,
          worker_id: workerId,
          processing_time_ms: processingTime,
          processed_count: processedCount,
          failed_count: failedCount
        });
        
        // Try to update worker stats even on error
        try {
          await this.updateWorkerStats(workerId, processedCount, failedCount, processingTime);
        } catch (statsError) {
          this.logger.error('Failed to update worker stats', statsError instanceof Error ? statsError : new Error(String(statsError)), {
            worker_id: workerId
          });
        }

        await this.unregisterWorker(workerId);
        throw error;
      }
    }, 'ChatProcess');
  }

  /**
   * Process a batch of jobs
   */
  private async processBatchJobs(batchSize: number, workerId: string): Promise<Response> {
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;

    try {
      // Get next batch of jobs
      const jobs = await this.db.getNextJobs(batchSize, ['chat_completion']);

      if (jobs.length === 0) {
        const response: ChatProcessResponse = {
          jobs_processed: 0,
          jobs_failed: 0,
          processing_time_ms: Date.now() - startTime,
          next_job_available: false,
          worker_id: workerId
        };
        return this.successResponse(response);
      }

      // Process each job
      for (const job of jobs) {
        try {
          await this.processJob(job, workerId);
          processedCount++;
        } catch (error) {
          console.error(`Failed to process job ${job.job_id}:`, error);
          await this.handleJobFailure(job, error);
          failedCount++;
        }
      }

      const processingTime = Date.now() - startTime;
      await this.updateWorkerStats(workerId, processedCount, failedCount, processingTime);

      const response: ChatProcessResponse = {
        jobs_processed: processedCount,
        jobs_failed: failedCount,
        processing_time_ms: processingTime,
        next_job_available: await this.db.hasMoreJobs(),
        worker_id: workerId
      };

      return this.successResponse(response);

    } catch (error) {
      failedCount = batchSize;
      const processingTime = Date.now() - startTime;
      
      // Try to update worker stats even on error
      try {
        await this.updateWorkerStats(workerId, processedCount, failedCount, processingTime);
      } catch (statsError) {
        console.error('Failed to update worker stats:', statsError);
      }

      await this.unregisterWorker(workerId);
      throw error;
    } finally {
      await this.unregisterWorker(workerId);
    }
  }

  /**
   * Process a single chat job
   */
  private async processJob(job: any, workerId: string): Promise<void> {
    return await timeFunction(`process-chat-job-${job.job_id}`, async () => {
      const { payload } = job;
      const startTime = Date.now();
      
      edgeLogger.setContext({
        jobId: job.job_id,
        sessionId: payload.session_id
      });

      this.logger.info('Starting job processing', {
        job_id: job.job_id,
        job_type: job.job_type,
        session_id: payload.session_id,
        field_id: payload.field_id,
        worker_id: workerId
      });

      timeStart('job-status-update');
      
      // Update chat job status to processing
      await this.db.updateChatJob(job.job_id, {
        status: 'processing',
        processing_started_at: new Date().toISOString()
      });
      
      this.logger.logQueue('job-status-changed', job.job_id, 'processing');
      
      timeEnd('job-status-update');

      try {
        timeStart('conversation-history');
        
        // Get conversation history for context
        const conversationHistory = await this.getConversationHistory(payload.session_id);
        
        this.logger.debug('Conversation history retrieved', {
          session_id: payload.session_id,
          history_length: conversationHistory.length
        });
        
        timeEnd('conversation-history');

        // Check if this is a learning path request
        const isLearningPathRequest = VIETNAMESE_LEARNING_PATH_KEYWORDS.some(keyword =>
          payload.message.toLowerCase().includes(keyword)
        );

        let response: any;
        
        if (isLearningPathRequest) {
          this.logger.info('Learning path request detected in job processing', {
            job_id: job.job_id,
            session_id: payload.session_id,
            message: payload.message
          });

          timeStart('csv-processing');
          
          try {
            // Load CSV data with proper path resolution
            let csvPath: string;
            if (typeof Deno !== 'undefined' && Deno.env.get('DENO_DEPLOYMENT_ID')) {
              // Production environment
              csvPath = './Course/course-list.csv';
            } else {
              // Development environment
              csvPath = '../../Course/course-list.csv';
            }
            
            const csvResponse = await csvParser.loadCSVFromPath(csvPath);
            
            if (csvResponse.success && csvResponse.data) {
              let learningPaths = [];
              
              // Priority: use provided field_id first, then extract from message
              const fieldNameFromMessage = CSVParser.extractFieldNameFromMessage(payload.message);
              const targetField = payload.field_id || fieldNameFromMessage;
              
              if (targetField) {
                learningPaths = csvParser.getLearningPathsByField(csvResponse.data, targetField);
              } else {
                // If no specific field mentioned, return all paths
                learningPaths = csvResponse.data.learningPaths;
              }
              
              // Generate learning path response
              const learningPathResponse = csvParser.generateLearningPathResponse(learningPaths);
              
              response = {
                content: learningPathResponse,
                model: 'csv-learning-path',
                tokensUsed: Math.ceil(learningPathResponse.length / 4),
                duration: Date.now() - startTime,
                isLearningPath: true,
                learningPathsData: learningPaths // Store for saving to database
              };
              
              this.logger.info('CSV learning path response generated', {
                job_id: job.job_id,
                response_length: learningPathResponse.length,
                paths_count: learningPaths.length,
                target_field: targetField
              });
            } else {
              throw new Error(`CSV data loading failed: ${csvResponse.error}`);
            }
            
            timeEnd('csv-processing');
          } catch (csvError) {
            this.logger.error('CSV processing failed', csvError instanceof Error ? csvError : new Error(String(csvError)), {
              job_id: job.job_id,
              session_id: payload.session_id
            });
            
            // Fall back to Gemini response
            timeStart('prompt-generation');
            const prompt = this.geminiClient.generateFieldSpecificPrompt(
              payload.message,
              payload.field_id
            );
            timeEnd('prompt-generation');

            timeStart('gemini-api-call');
            response = await this.geminiClient.generateResponse(
              prompt,
              payload.field_id,
              conversationHistory
            );
            timeEnd('gemini-api-call');
          }
        } else {
          // Normal Gemini processing
          timeStart('prompt-generation');
          
          // Generate field-specific prompt
          const prompt = this.geminiClient.generateFieldSpecificPrompt(
            payload.message,
            payload.field_id
          );
          
          this.logger.debug('Prompt generated', {
            field_id: payload.field_id,
            prompt_length: prompt.length,
            message_length: payload.message.length
          });
          
          timeEnd('prompt-generation');

          timeStart('gemini-api-call');
          
          // Get Gemini response
          response = await this.geminiClient.generateResponse(
            prompt,
            payload.field_id,
            conversationHistory
          );
          
          timeEnd('gemini-api-call');
        }
        
        if (!response.isLearningPath) {
          this.logger.logGeminiCall('generateResponse', response.model, response.tokensUsed, response.duration);
        }
        
        this.logger.info('Response received', {
          job_id: job.job_id,
          model: response.model,
          tokens_used: response.tokensUsed,
          response_length: response.content.length,
          is_learning_path: response.isLearningPath || false
        });

        const processingTime = Date.now() - startTime;

        timeStart('assistant-message-creation');
        
        // Save assistant message
        const assistantMessage = await this.db.createChatMessage(
          payload.chat_job_id,
          'assistant',
          response.content
        );
        
        this.logger.debug('Assistant message created', {
          message_id: assistantMessage.id,
          chat_job_id: payload.chat_job_id,
          content_length: response.content.length
        });
        
        timeEnd('assistant-message-creation');

        // If this was a learning path response, save to generated_learning_paths table
        if (response.isLearningPath && response.learningPathsData && response.learningPathsData.length > 0) {
          try {
            timeStart('save-learning-paths');
            
            // Get chat session and field info
            const { data: chatJob } = await this.supabase
              .from('chat_jobs')
              .select('chat_session_id, field_id')
              .eq('id', payload.chat_job_id)
              .single();

            if (chatJob) {
              const { data: chatSession } = await this.supabase
                .from('chat_sessions')
                .select('id, session_id')
                .eq('id', chatJob.chat_session_id)
                .single();

              const { data: field } = await this.supabase
                .from('fields')
                .select('id, name')
                .eq('id', chatJob.field_id || payload.field_id)
                .single();

              if (chatSession && field) {
                // Save each learning path to the database
                for (const learningPath of response.learningPathsData) {
                  const baseName = learningPath.name || 'Learning Path';
                  
                  // Check for existing learning paths with the same base name for this field
                  const { data: existingPaths } = await this.supabase
                    .from('generated_learning_paths')
                    .select('learning_path_name')
                    .eq('field_id', field.id)
                    .ilike('learning_path_name', `${baseName}%`)
                    .order('created_at', { ascending: true });
                  
                  // Determine the next number for this learning path
                  let learningPathName = baseName;
                  if (existingPaths && existingPaths.length > 0) {
                    // Extract numbers from existing paths and find the next available number
                    const numbers = existingPaths
                      .map((p: any) => {
                        const match = p.learning_path_name.match(/\s+(\d+)$/);
                        return match ? parseInt(match[1]) : 0;
                      })
                      .filter((n: number) => n > 0);
                    
                    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
                    learningPathName = `${baseName} ${nextNumber}`;
                  }
                  
                  await this.supabase
                    .from('generated_learning_paths')
                    .insert({
                      chat_session_id: chatSession.id,
                      session_id: chatSession.session_id,
                      field_id: field.id,
                      field_name: field.name,
                      learning_path_name: learningPathName,
                      learning_path_data: learningPath,
                      is_read_only: true
                    });
                }

                this.logger.info('Learning paths saved to database', {
                  job_id: job.job_id,
                  session_id: chatSession.session_id,
                  field_name: field.name,
                  paths_count: response.learningPathsData.length
                });
              }
            }
            
            timeEnd('save-learning-paths');
          } catch (saveError) {
            this.logger.error('Failed to save learning paths to database', saveError instanceof Error ? saveError : new Error(String(saveError)), {
              job_id: job.job_id,
              session_id: payload.session_id
            });
            // Don't fail the entire job if saving fails
          }
        }

        timeStart('job-completion-update');
        
        // Update chat job with success
        await this.db.updateChatJob(job.job_id, {
          status: 'completed',
          assistant_message_id: assistantMessage.id,
          ai_response: response.content,
          processing_completed_at: new Date().toISOString(),
          actual_duration_ms: processingTime,
          gemini_tokens_used: response.tokensUsed,
          gemini_model: response.model,
          is_learning_path: response.isLearningPath || false
        });
        
        this.logger.logQueue('job-status-changed', job.job_id, 'completed', {
          actual_duration_ms: processingTime,
          gemini_tokens_used: response.tokensUsed,
          gemini_model: response.model,
          is_learning_path: response.isLearningPath || false
        });

        // Update job queue
        await this.db.updateJobStatus(job.job_id, 'completed', {
          message_id: assistantMessage.id,
          content: response.content
        });
        
        timeEnd('job-completion-update');

        timeStart('session-stats-update');
        
        // Increment question count
        await this.db.incrementQuestionCount(payload.session_id);
        
        this.logger.debug('Session stats updated', {
          session_id: payload.session_id
        });
        
        timeEnd('session-stats-update');

        this.logger.info('Job processing completed successfully', {
          job_id: job.job_id,
          processing_time_ms: processingTime,
          tokens_used: response.tokensUsed,
          model: response.model,
          is_learning_path: response.isLearningPath || false
        });

      } catch (error) {
        this.logger.error('Chat job processing failed', error instanceof Error ? error : new Error(String(error)), {
          job_id: job.job_id,
          session_id: payload.session_id,
          field_id: payload.field_id,
          worker_id: workerId,
          processing_time_ms: Date.now() - startTime
        });
        
        throw new Error(`Hoàn tất trò chuyện thất bại: ${error.message}`);
      }
    }, 'ChatProcess');
  }

  /**
   * Get conversation history for context
   */
  private async getConversationHistory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    try {
      const messages = await this.db.getChatMessages(sessionId, 10); // Get last 10 messages
      
      return messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(job: any, error: any): Promise<void> {
    return await timeFunction(`handle-job-failure-${job.job_id}`, async () => {
      const retryCount = job.retry_count + 1;
      
      this.logger.info('Handling job failure', {
        job_id: job.job_id,
        retry_count: retryCount,
        max_retries: job.max_retries,
        error_message: error.message
      });
      
      try {
        if (retryCount <= job.max_retries) {
          this.logger.info('Scheduling job retry', {
            job_id: job.job_id,
            retry_count: retryCount,
            max_retries: job.max_retries
          });
          
          // Schedule retry with exponential backoff
          await this.db.scheduleJobRetry(
            job.job_id,
            retryCount,
            job.max_retries,
            error.message
          );

          // Update chat job status
          await this.db.updateChatJob(job.job_id, {
            status: 'retrying',
            retry_count: retryCount,
            error_message: error.message
          });
          
          this.logger.logQueue('job-status-changed', job.job_id, 'retrying', {
            retry_count: retryCount,
            error_message: error.message
          });

        } else {
          this.logger.warn('Max retries exceeded, marking job as failed', {
            job_id: job.job_id,
            retry_count: retryCount,
            max_retries: job.max_retries,
            final_error: error.message
          });
          
          // Mark as failed
          await this.db.updateJobStatus(job.job_id, 'failed', undefined, error.message);

          // Update chat job
          await this.db.updateChatJob(job.job_id, {
            status: 'failed',
            error_message: error.message,
            processing_completed_at: new Date().toISOString()
          });
          
          this.logger.logQueue('job-status-changed', job.job_id, 'failed', {
            error_message: error.message,
            retry_count: retryCount
          });
        }
      } catch (retryError) {
        this.logger.error('Failed to handle job failure', retryError instanceof Error ? retryError : new Error(String(retryError)), {
          job_id: job.job_id,
          original_error: error.message,
          retry_error: retryError.message
        });
      }
    }, 'ChatProcess');
  }

  /**
   * Update worker statistics
   */
  private async updateWorkerStats(
    workerId: string,
    jobsProcessed: number,
    jobsFailed: number,
    processingTime: number
  ): Promise<void> {
    try {
      const avgTime = jobsProcessed > 0 ? Math.round(processingTime / jobsProcessed) : 0;
      await this.db.updateWorkerStats(workerId, jobsProcessed, jobsFailed, avgTime);
    } catch (error) {
      console.error('Failed to update worker stats:', error);
    }
  }

  /**
   * Unregister worker
   */
  private async unregisterWorker(workerId: string): Promise<void> {
    try {
      await this.db.unregisterWorker(workerId);
    } catch (error) {
      console.error('Failed to unregister worker:', error);
    }
  }
}

// Create and export the handler
const handler = createEdgeFunctionHandler(ChatProcessFunction);

// Serve the function
serve(handler);