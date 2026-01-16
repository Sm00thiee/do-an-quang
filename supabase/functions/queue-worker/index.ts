// Queue Worker Edge Function
// Background worker for job processing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { BaseFunction, createEdgeFunctionHandler } from '../shared/base-function.ts';
import { ErrorHandler } from '../shared/error-handler.ts';
import { generateWorkerId } from '../shared/utils.ts';
import { edgeLogger, timeStart, timeEnd, timeFunction } from '../shared/logger.ts';

interface QueueWorkerRequest {
  worker_id?: string;
  batch_size?: number;
  job_types?: string[];
  continuous?: boolean;
  max_duration_ms?: number;
}

interface QueueWorkerResponse {
  worker_id: string;
  jobs_processed: number;
  jobs_failed: number;
  processing_time_ms: number;
  next_job_available: boolean;
  continuous: boolean;
  iterations: number;
}

class QueueWorkerFunction extends BaseFunction {
  private workerId: string;
  private isRunning: boolean = false;
  private logger = edgeLogger.child('QueueWorker');

  constructor() {
    super();
    this.workerId = generateWorkerId();
    
    this.logger.info('Queue worker initialized', {
      worker_id: this.workerId
    });
  }

  async handleRequest(
    req: Request,
    context: RequestContext
  ): Promise<Response> {
    const requestId = crypto.randomUUID();
    edgeLogger.setContext({ requestId });
    
    this.logger.info('Worker request started', {
      method: req.method,
      url: req.url,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      is_running: this.isRunning
    });

    return await timeFunction('queue-worker-request', async () => {
      // Only allow POST requests
      if (req.method !== 'POST') {
        this.logger.warn('Invalid method attempted', { method: req.method });
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_INPUT,
          'Phương thức không được phép. Sử dụng POST.'
        );
      }

      // Parse request body
      const {
        worker_id,
        batch_size = 5,
        job_types = ['chat_completion'],
        continuous = false,
        max_duration_ms = 300000 // 5 minutes default
      } = await this.parseRequestBody<QueueWorkerRequest>(req);

      // Use provided worker_id or generate new one
      const currentWorkerId = worker_id || this.workerId;
      
      edgeLogger.setContext({
        requestId,
        workerId: currentWorkerId
      });

      this.logger.debug('Request parameters parsed', {
        worker_id: currentWorkerId,
        batch_size,
        job_types,
        continuous,
        max_duration_ms
      });

      try {
        // Check if worker is already running
        if (this.isRunning && continuous) {
          this.logger.warn('Worker already running', {
            worker_id: currentWorkerId,
            continuous
          });
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.INVALID_INPUT,
            'Worker đang chạy'
          );
        }

        this.isRunning = true;
        
        this.logger.info('Worker started', {
          worker_id: currentWorkerId,
          batch_size,
          job_types,
          continuous,
          max_duration_ms
        });

        // Run worker
        const result = continuous
          ? await this.runContinuousWorker(currentWorkerId, batch_size, job_types, max_duration_ms)
          : await this.runSingleBatch(currentWorkerId, batch_size, job_types);

        this.logger.info('Worker completed successfully', {
          worker_id: currentWorkerId,
          jobs_processed: result.jobs_processed,
          jobs_failed: result.jobs_failed,
          processing_time_ms: result.processing_time_ms,
          iterations: result.iterations
        });

        return this.successResponse(result);

      } finally {
        this.isRunning = false;
        
        this.logger.info('Worker stopped', {
          worker_id: currentWorkerId
        });
      }
    }, 'QueueWorker');
  }

  /**
   * Run worker in continuous mode
   */
  private async runContinuousWorker(
    workerId: string,
    batchSize: number,
    jobTypes: string[],
    maxDurationMs: number
  ): Promise<QueueWorkerResponse> {
    return await timeFunction(`continuous-worker-${workerId}`, async () => {
      const startTime = Date.now();
      let totalProcessed = 0;
      let totalFailed = 0;
      let iterations = 0;
      let hasMoreJobs = true;

      this.logger.info('Starting continuous worker', {
        worker_id: workerId,
        batch_size: batchSize,
        job_types: jobTypes,
        max_duration_ms: maxDurationMs
      });

      timeStart('worker-registration');
      
      // Register worker
      await this.db.registerWorker(workerId);
      
      this.logger.info('Worker registered for continuous mode', { worker_id: workerId });
      
      timeEnd('worker-registration');

      try {
        while (hasMoreJobs && (Date.now() - startTime) < maxDurationMs) {
          iterations++;
          const iterationStart = Date.now();
          
          this.logger.debug('Starting worker iteration', {
            worker_id: workerId,
            iteration: iterations,
            elapsed_ms: Date.now() - startTime,
            remaining_ms: maxDurationMs - (Date.now() - startTime)
          });

          timeStart('job-retrieval');
          
          // Get next batch of jobs
          const jobs = await this.db.getNextJobs(batchSize, jobTypes);
          
          timeEnd('job-retrieval');

          if (jobs.length === 0) {
            this.logger.debug('No jobs available, waiting', {
              worker_id: workerId,
              iteration: iterations
            });
            
            // No jobs available, wait before checking again
            await this.sleep(5000); // 5 seconds
            
            timeStart('job-availability-check');
            
            hasMoreJobs = await this.db.hasMoreJobs();
            
            timeEnd('job-availability-check');
            
            this.logger.debug('Job availability checked', {
              worker_id: workerId,
              has_more_jobs: hasMoreJobs
            });
            
            continue;
          }

          this.logger.info('Processing job batch', {
            worker_id: workerId,
            iteration: iterations,
            batch_size: jobs.length,
            job_ids: jobs.map(job => job.job_id)
          });

          timeStart('batch-processing');
          
          // Process batch
          const batchResult = await this.processBatch(jobs, workerId);
          
          timeEnd('batch-processing');
          
          totalProcessed += batchResult.processed;
          totalFailed += batchResult.failed;

          this.logger.info('Batch processing completed', {
            worker_id: workerId,
            iteration: iterations,
            batch_processed: batchResult.processed,
            batch_failed: batchResult.failed,
            iteration_time_ms: Date.now() - iterationStart
          });

          timeStart('job-availability-check');
          
          // Check if more jobs are available
          hasMoreJobs = await this.db.hasMoreJobs();
          
          timeEnd('job-availability-check');

          // Small delay between batches
          await this.sleep(1000);
        }

        const totalTime = Date.now() - startTime;

        this.logger.info('Continuous worker completed', {
          worker_id: workerId,
          total_processed: totalProcessed,
          total_failed: totalFailed,
          iterations,
          total_time_ms: totalTime,
          has_more_jobs: hasMoreJobs
        });

        return {
          worker_id: workerId,
          jobs_processed: totalProcessed,
          jobs_failed: totalFailed,
          processing_time_ms: totalTime,
          next_job_available: hasMoreJobs,
          continuous: true,
          iterations
        };

      } finally {
        timeStart('worker-unregistration');
        
        // Unregister worker
        await this.db.unregisterWorker(workerId);
        
        timeEnd('worker-unregistration');
        
        this.logger.info('Worker unregistered', { worker_id: workerId });
      }
    }, 'QueueWorker');
  }

  /**
   * Run worker for single batch
   */
  private async runSingleBatch(
    workerId: string,
    batchSize: number,
    jobTypes: string[]
  ): Promise<QueueWorkerResponse> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalFailed = 0;

    // Register worker
    await this.db.registerWorker(workerId);

    try {
      // Get next batch of jobs
      const jobs = await this.db.getNextJobs(batchSize, jobTypes);

      if (jobs.length === 0) {
        return {
          worker_id: workerId,
          jobs_processed: 0,
          jobs_failed: 0,
          processing_time_ms: Date.now() - startTime,
          next_job_available: false,
          continuous: false,
          iterations: 1
        };
      }

      // Process batch
      const batchResult = await this.processBatch(jobs, workerId);
      totalProcessed = batchResult.processed;
      totalFailed = batchResult.failed;

      return {
        worker_id: workerId,
        jobs_processed: totalProcessed,
        jobs_failed: totalFailed,
        processing_time_ms: Date.now() - startTime,
        next_job_available: await this.db.hasMoreJobs(),
        continuous: false,
        iterations: 1
      };

    } finally {
      // Unregister worker
      await this.db.unregisterWorker(workerId);
    }
  }

  /**
   * Process a batch of jobs
   */
  private async processBatch(
    jobs: any[],
    workerId: string
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.processJob(job, workerId);
        processed++;
      } catch (error) {
        console.error(`Failed to process job ${job.job_id}:`, error);
        await this.handleJobFailure(job, error);
        failed++;
      }
    }

    // Update worker stats
    try {
      const avgTime = jobs.length > 0 
        ? Math.round(
            jobs.reduce((sum: number, job: any) => {
              return sum + (job.actual_duration_ms || 0);
            }, 0) / jobs.length
          )
        : 0;

      await this.db.updateWorkerStats(workerId, processed, failed, avgTime);
    } catch (error) {
      console.error('Failed to update worker stats:', error);
    }

    return { processed, failed };
  }

  /**
   * Process a single job
   */
  private async processJob(job: any, workerId: string): Promise<void> {
    return await timeFunction(`process-job-${job.job_id}`, async () => {
      const { payload } = job;
      const startTime = Date.now();
      
      edgeLogger.setContext({
        workerId,
        jobId: job.job_id
      });

      this.logger.info('Starting job processing', {
        job_id: job.job_id,
        job_type: job.job_type,
        worker_id: workerId
      });

      timeStart('job-status-update');
      
      // Update job status to processing
      await this.db.updateJobStatus(job.job_id, 'processing');
      
      this.logger.logQueue('job-status-changed', job.job_id, 'processing');
      
      timeEnd('job-status-update');

      try {
        timeStart('job-type-processing');
        
        // Process based on job type
        switch (job.job_type) {
          case 'chat_completion':
            this.logger.debug('Processing chat completion job', {
              job_id: job.job_id,
              payload_keys: Object.keys(payload)
            });
            
            await this.processChatCompletion(job, workerId);
            break;
          case 'cleanup':
            this.logger.debug('Processing cleanup job', {
              job_id: job.job_id
            });
            
            await this.processCleanup(job, workerId);
            break;
          default:
            this.logger.error('Unknown job type', undefined, {
              job_id: job.job_id,
              job_type: job.job_type
            });
            
            throw new Error(`Loại công việc không xác định: ${job.job_type}`);
        }
        
        timeEnd('job-type-processing');

        const processingTime = Date.now() - startTime;

        timeStart('job-completion');
        
        // Update job with completion
        await this.db.updateJobStatus(job.job_id, 'completed', {
          processing_time_ms: processingTime,
          completed_at: new Date().toISOString()
        });
        
        this.logger.logQueue('job-status-changed', job.job_id, 'completed', {
          processing_time_ms: processingTime
        });
        
        timeEnd('job-completion');

        this.logger.info('Job processing completed successfully', {
          job_id: job.job_id,
          job_type: job.job_type,
          worker_id: workerId,
          processing_time_ms: processingTime
        });

      } catch (error) {
        this.logger.error('Job processing failed', error instanceof Error ? error : new Error(String(error)), {
          job_id: job.job_id,
          job_type: job.job_type,
          worker_id: workerId,
          processing_time_ms: Date.now() - startTime
        });
        
        throw new Error(`Xử lý công việc thất bại: ${error.message}`);
      }
    }, 'QueueWorker');
  }

  /**
   * Process chat completion job
   */
  private async processChatCompletion(job: any, workerId: string): Promise<void> {
    return await timeFunction(`process-chat-completion-${job.job_id}`, async () => {
      this.logger.info('Processing chat completion job', {
        job_id: job.job_id,
        worker_id: workerId
      });

      // This would typically call the chat-process function
      // For now, we'll trigger it via internal HTTP call
      const processUrl = `${this.env.SUPABASE_URL}/functions/v1/chat-process`;
      
      this.logger.debug('Making internal API call', {
        job_id: job.job_id,
        worker_id: workerId,
        url: processUrl
      });

      const response = await fetch(
        processUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            job_id: job.job_id,
            worker_id: workerId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        this.logger.error('Chat process API call failed', undefined, {
          job_id: job.job_id,
          worker_id: workerId,
          status: response.status,
          status_text: response.statusText,
          error_data: errorData
        });
        
        throw new Error(`Quy trình trò chuyện thất bại: ${errorData.error?.message || response.statusText}`);
      }

      this.logger.info('Chat completion processed successfully', {
        job_id: job.job_id,
        worker_id: workerId,
        response_status: response.status
      });
    }, 'QueueWorker');
  }

  /**
   * Process cleanup job
   */
  private async processCleanup(job: any, workerId: string): Promise<void> {
    try {
      await this.db.cleanupOldJobs();
    } catch (error) {
      console.error('Cleanup job failed:', error);
      throw error;
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(job: any, error: any): Promise<void> {
    const retryCount = job.retry_count + 1;

    try {
      if (retryCount <= job.max_retries) {
        // Schedule retry with exponential backoff
        await this.db.scheduleJobRetry(
          job.job_id,
          retryCount,
          job.max_retries,
          error.message
        );
      } else {
        // Mark as failed
        await this.db.updateJobStatus(job.job_id, 'failed', undefined, error.message);
      }
    } catch (retryError) {
      console.error('Failed to handle job failure:', retryError);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker health status
   */
  private async getWorkerHealth(workerId: string): Promise<{
    status: string;
    jobs_processed: number;
    jobs_failed: number;
    average_processing_time: number;
    last_heartbeat: string;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('worker_status')
        .select('*')
        .eq('worker_id', workerId)
        .single();

      if (error || !data) {
        return {
          status: 'offline',
          jobs_processed: 0,
          jobs_failed: 0,
          average_processing_time: 0,
          last_heartbeat: new Date().toISOString()
        };
      }

      return {
        status: data.status,
        jobs_processed: data.jobs_processed,
        jobs_failed: data.jobs_failed,
        average_processing_time: data.average_processing_time_ms,
        last_heartbeat: data.last_heartbeat
      };

    } catch (error) {
      console.error('Failed to get worker health:', error);
      return {
        status: 'error',
        jobs_processed: 0,
        jobs_failed: 0,
        average_processing_time: 0,
        last_heartbeat: new Date().toISOString()
      };
    }
  }
}

// Create and export handler
const handler = createEdgeFunctionHandler(QueueWorkerFunction);

// Serve the function
serve(handler);