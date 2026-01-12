/**
 * Edge Function Client for Chat Feature
 * Ported from CourseAiChat/src/services/edgeFunctionClient.ts
 * CRITICAL: Uses CHAT_EDGE_FUNCTIONS_URL and supabaseChat for authentication
 */

import { supabaseChat, CHAT_EDGE_FUNCTIONS_URL } from './supabase';
import { logger, timeFunction } from '../utils/logger';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

// Edge Function names
export const EDGE_FUNCTIONS = {
  CHAT_SUBMIT: 'chat-submit',
  CHAT_STATUS: 'chat-status',
  CHAT_PROCESS: 'chat-process'
};

// Error types
export class EdgeFunctionError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for exponential backoff with jitter
const getRetryDelay = (attempt) => {
  const exponentialDelay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
};

// Main Edge Function client class
export class EdgeFunctionClient {
  constructor(baseUrl, timeout) {
    this.baseUrl = baseUrl || CHAT_EDGE_FUNCTIONS_URL;
    this.timeout = timeout || REQUEST_TIMEOUT;
    
    logger.info('EdgeFunctionClient', 'Client initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    });
  }

  /**
   * Make a request to an Edge Function with authentication and error handling
   */
  async makeRequest(functionName, options = {}) {
    const url = `${this.baseUrl}/${functionName}`;
    const requestId = crypto.randomUUID();
    
    logger.setDebugContext(undefined, undefined, requestId);
    
    logger.info('EdgeFunctionClient', 'Starting request', {
      requestId,
      functionName,
      url,
      method: options.method || 'GET',
      hasBody: !!options.body
    });
    
    return await timeFunction(`edge-function-${functionName}-${requestId}`, async () => {
      try {
        if (!supabaseChat) {
          throw new EdgeFunctionError(
            'Chat Supabase instance is not configured',
            500,
            'CONFIG_ERROR',
            null
          );
        }

        // Get auth session - for anonymous chat, we use the anon key
        const { data: { session }, error: sessionError } = await supabaseChat.auth.getSession();
        
        // For anonymous chat, it's OK to not have a session - we'll use the anon key
        if (sessionError && !sessionError.message?.includes('no session')) {
          logger.error('EdgeFunctionClient', 'Authentication error', sessionError, {
            requestId,
            functionName
          });
        }

        logger.debug('EdgeFunctionClient', 'Auth session retrieved', {
          requestId,
          hasSession: !!session,
          hasAccessToken: !!session?.access_token
        });

        // Get the anon key from env
        const anonKey = process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY || '';

        // Prepare headers - use session token if available, otherwise use anon key
        const authHeader = session?.access_token 
          ? `Bearer ${session.access_token}` 
          : `Bearer ${anonKey}`;

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'apikey': anonKey,  // Always include apikey header for Supabase
          ...options.headers
        };

        logger.debug('EdgeFunctionClient', 'Request prepared', {
          requestId,
          headers: {
            'Content-Type': headers['Content-Type'],
            'Authorization': headers['Authorization'] ? '[REDACTED]' : undefined
          }
        });
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          logger.info('EdgeFunctionClient', 'HTTP response received', {
            requestId,
            functionName,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          // Handle HTTP errors
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            let errorDetails = null;

            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
              errorDetails = errorData;
              
              logger.warn('EdgeFunctionClient', 'HTTP error response parsed', {
                requestId,
                functionName,
                status: response.status,
                errorMessage,
                errorDetails
              });
            } catch (parseError) {
              logger.warn('EdgeFunctionClient', 'Failed to parse error response', {
                requestId,
                functionName,
                status: response.status,
                parseError: parseError instanceof Error ? parseError.message : String(parseError)
              });
            }

            throw new EdgeFunctionError(
              errorMessage,
              response.status,
              `HTTP_${response.status}`,
              errorDetails
            );
          }
          
          // Parse successful response
          const data = await response.json();
          
          logger.info('EdgeFunctionClient', 'Request completed successfully', {
            requestId,
            functionName,
            dataType: typeof data,
            status: response.status
          });

          return {
            data,
            error: null,
            status: response.status
          };
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof EdgeFunctionError) {
            throw error;
          }

          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              logger.error('EdgeFunctionClient', 'Request timeout', error, {
                requestId,
                functionName,
                timeout: this.timeout
              });
              
              throw new EdgeFunctionError(
                'Request timeout',
                408,
                'TIMEOUT',
                { timeout: this.timeout }
              );
            }

            logger.error('EdgeFunctionClient', 'Network error', error, {
              requestId,
              functionName,
              errorMessage: error.message
            });

            throw new EdgeFunctionError(
              error.message,
              0,
              'NETWORK_ERROR',
              error
            );
          }

          logger.error('EdgeFunctionClient', 'Unknown request error', error instanceof Error ? error : new Error(String(error)), {
            requestId,
            functionName
          });

          throw new EdgeFunctionError(
            'Unknown error occurred',
            0,
            'UNKNOWN_ERROR',
            error
          );
        }
      } catch (error) {
        if (error instanceof EdgeFunctionError) {
          logger.error('EdgeFunctionClient', 'EdgeFunctionError caught', error, {
            requestId: error.details?.requestId,
            functionName,
            errorCode: error.code,
            errorStatus: error.status
          });
          
          return {
            data: null,
            error: error.message,
            status: error.status || 500
          };
        }

        logger.error('EdgeFunctionClient', 'Unexpected error in makeRequest', error instanceof Error ? error : new Error(String(error)), {
          functionName
        });

        return {
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 500
        };
      }
    }, 'EdgeFunctionClient');
  }

  /**
   * Make a request with retry logic
   */
  async makeRequestWithRetry(functionName, options = {}, maxRetries = MAX_RETRIES) {
    const requestId = crypto.randomUUID();
    
    logger.info('EdgeFunctionClient', 'Starting request with retry', {
      requestId,
      functionName,
      maxRetries,
      method: options.method || 'GET'
    });

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.debug('EdgeFunctionClient', 'Retry attempt', {
        requestId,
        functionName,
        attempt,
        maxRetries
      });

      try {
        const result = await this.makeRequest(functionName, options);
        
        if (result.data && !result.error) {
          logger.info('EdgeFunctionClient', 'Request succeeded on attempt', {
            requestId,
            functionName,
            attempt,
            status: result.status
          });
          return result;
        }

        // If we got an error response, don't retry
        if (result.status && result.status >= 400 && result.status < 500) {
          logger.warn('EdgeFunctionClient', 'Client error, not retrying', {
            requestId,
            functionName,
            attempt,
            status: result.status,
            error: result.error
          });
          return result;
        }

        lastError = new EdgeFunctionError(
          result.error || 'Request failed',
          result.status,
          'REQUEST_ERROR'
        );
        
        logger.warn('EdgeFunctionClient', 'Request failed, will retry', {
          requestId,
          functionName,
          attempt,
          error: result.error,
          status: result.status
        });
      } catch (error) {
        lastError = error instanceof EdgeFunctionError ? error : new EdgeFunctionError(
          error instanceof Error ? error.message : 'Unknown error',
          0,
          'UNKNOWN_ERROR',
          error
        );
        
        logger.error('EdgeFunctionClient', 'Request attempt failed', error instanceof Error ? error : new Error(String(error)), {
          requestId,
          functionName,
          attempt,
          errorCode: lastError.code
        });
      }

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        const delayMs = getRetryDelay(attempt);
        
        logger.debug('EdgeFunctionClient', 'Waiting before retry', {
          requestId,
          functionName,
          attempt,
          delayMs
        });
        
        await delay(delayMs);
      }
    }

    logger.error('EdgeFunctionClient', 'All retry attempts failed', lastError || new Error('Unknown error'), {
      requestId,
      functionName,
      maxRetries,
      finalErrorCode: lastError?.code,
      finalErrorStatus: lastError?.status
    });

    return {
      data: null,
      error: lastError?.message || 'Request failed after retries',
      status: lastError?.status || 500
    };
  }

  /**
   * Submit a chat message to the queue
   */
  async submitChat(request) {
    const requestId = crypto.randomUUID();
    
    logger.info('EdgeFunctionClient', 'Submitting chat message', {
      requestId,
      sessionId: request.sessionId,
      fieldId: request.fieldId,
      messageLength: request.message?.length,
      priority: request.priority
    });

    return await timeFunction(`submit-chat-${requestId}`, async () => {
      const result = await this.makeRequestWithRetry(
        EDGE_FUNCTIONS.CHAT_SUBMIT,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      if (result.data) {
        logger.info('EdgeFunctionClient', 'Chat message submitted successfully', {
          requestId,
          sessionId: request.sessionId,
          jobId: result.data.jobId,
          status: 'pending',
          estimatedDuration: 0,
          queuePosition: 0
        });
      } else {
        logger.error('EdgeFunctionClient', 'Failed to submit chat message', undefined, {
          requestId,
          sessionId: request.sessionId,
          error: result.error,
          status: result.status
        });
      }

      return result;
    }, 'EdgeFunctionClient');
  }

  /**
   * Get the status of a chat job
   */
  async getChatStatus(request) {
    const requestId = crypto.randomUUID();
    
    logger.info('EdgeFunctionClient', 'Getting chat status', {
      requestId,
      jobId: request.jobId
    });

    return await timeFunction(`get-chat-status-${requestId}`, async () => {
      const result = await this.makeRequestWithRetry(
        EDGE_FUNCTIONS.CHAT_STATUS,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      );

      if (result.data) {
        logger.info('EdgeFunctionClient', 'Chat status retrieved successfully', {
          requestId,
          jobId: request.jobId,
          jobStatus: result.data.job?.status,
          hasResult: false,
          hasError: false
        });
      } else {
        logger.error('EdgeFunctionClient', 'Failed to get chat status', undefined, {
          requestId,
          jobId: request.jobId,
          error: result.error,
          status: result.status
        });
      }

      return result;
    }, 'EdgeFunctionClient');
  }

  /**
   * Process a chat job (admin/worker function)
   */
  async processChat(request) {
    return this.makeRequestWithRetry(
      EDGE_FUNCTIONS.CHAT_PROCESS,
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    );
  }

  /**
   * Poll for job status updates
   */
  async pollJobStatus(jobId, onUpdate, pollInterval = 2000, maxPollTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxPollTime) {
      const response = await this.getChatStatus({ jobId });
      
      if (response.error) {
        throw new EdgeFunctionError(
          response.error,
          response.status,
          'POLLING_ERROR'
        );
      }

      if (!response.data) {
        throw new EdgeFunctionError(
          'No data received from status check',
          500,
          'NO_DATA'
        );
      }

      const job = response.data.job;
      
      // Call the update callback if provided
      if (onUpdate) {
        onUpdate(job);
      }

      // Check if job is complete or failed
      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }

      // Wait before next poll
      await delay(pollInterval);
    }

    throw new EdgeFunctionError(
      'Job polling timed out',
      408,
      'POLLING_TIMEOUT',
      { jobId, maxPollTime }
    );
  }

  /**
   * Health check for Edge Functions
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('health', {
        method: 'GET'
      });
      
      return response.data?.status === 'ok';
    } catch (error) {
      console.error('Edge Function health check failed:', error);
      return false;
    }
  }
}

// Create and export default client instance
export const edgeFunctionClient = new EdgeFunctionClient();

// Export convenience functions
export const submitChat = (request) => edgeFunctionClient.submitChat(request);
export const getChatStatus = (request) => edgeFunctionClient.getChatStatus(request);
export const processChat = (request) => edgeFunctionClient.processChat(request);
export const pollJobStatus = (jobId, onUpdate, pollInterval, maxPollTime) => 
  edgeFunctionClient.pollJobStatus(jobId, onUpdate, pollInterval, maxPollTime);
export const healthCheck = () => edgeFunctionClient.healthCheck();
