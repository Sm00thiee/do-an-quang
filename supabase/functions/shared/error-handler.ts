// Error Handling Utilities for Supabase Edge Functions
// Centralized error handling and logging

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ErrorContext {
  functionName: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  jobId?: string;
  additionalData?: any;
}

export class ErrorHandler {
  private static readonly ERROR_CODES = {
    // Authentication errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    FORBIDDEN: 'FORBIDDEN',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_INPUT: 'INVALID_INPUT',
    
    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
    DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
    
    // System errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Job queue errors
    JOB_NOT_FOUND: 'JOB_NOT_FOUND',
    JOB_FAILED: 'JOB_FAILED',
    QUEUE_FULL: 'QUEUE_FULL',
    WORKER_UNAVAILABLE: 'WORKER_UNAVAILABLE'
  };

  private static readonly ERROR_MESSAGES = {
    [ErrorHandler.ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
    [ErrorHandler.ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token',
    [ErrorHandler.ERROR_CODES.SESSION_EXPIRED]: 'Session has expired',
    [ErrorHandler.ERROR_CODES.FORBIDDEN]: 'Access forbidden',
    
    [ErrorHandler.ERROR_CODES.VALIDATION_ERROR]: 'Input validation failed',
    [ErrorHandler.ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ErrorHandler.ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
    
    [ErrorHandler.ERROR_CODES.NOT_FOUND]: 'Resource not found',
    [ErrorHandler.ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: 'Resource limit exceeded',
    [ErrorHandler.ERROR_CODES.DUPLICATE_RESOURCE]: 'Resource already exists',
    
    [ErrorHandler.ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
    [ErrorHandler.ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
    [ErrorHandler.ERROR_CODES.EXTERNAL_API_ERROR]: 'External API error',
    [ErrorHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    
    [ErrorHandler.ERROR_CODES.JOB_NOT_FOUND]: 'Job not found',
    [ErrorHandler.ERROR_CODES.JOB_FAILED]: 'Job processing failed',
    [ErrorHandler.ERROR_CODES.QUEUE_FULL]: 'Job queue is full',
    [ErrorHandler.ERROR_CODES.WORKER_UNAVAILABLE]: 'No workers available'
  };

  private static readonly HTTP_STATUS_CODES = {
    [ErrorHandler.ERROR_CODES.UNAUTHORIZED]: 401,
    [ErrorHandler.ERROR_CODES.INVALID_TOKEN]: 401,
    [ErrorHandler.ERROR_CODES.SESSION_EXPIRED]: 401,
    [ErrorHandler.ERROR_CODES.FORBIDDEN]: 403,
    
    [ErrorHandler.ERROR_CODES.VALIDATION_ERROR]: 400,
    [ErrorHandler.ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
    [ErrorHandler.ERROR_CODES.INVALID_INPUT]: 400,
    
    [ErrorHandler.ERROR_CODES.NOT_FOUND]: 404,
    [ErrorHandler.ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: 429,
    [ErrorHandler.ERROR_CODES.DUPLICATE_RESOURCE]: 409,
    
    [ErrorHandler.ERROR_CODES.INTERNAL_ERROR]: 500,
    [ErrorHandler.ERROR_CODES.DATABASE_ERROR]: 500,
    [ErrorHandler.ERROR_CODES.EXTERNAL_API_ERROR]: 502,
    [ErrorHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    
    [ErrorHandler.ERROR_CODES.JOB_NOT_FOUND]: 404,
    [ErrorHandler.ERROR_CODES.JOB_FAILED]: 500,
    [ErrorHandler.ERROR_CODES.QUEUE_FULL]: 503,
    [ErrorHandler.ERROR_CODES.WORKER_UNAVAILABLE]: 503
  };

  /**
   * Create a standardized API error
   */
  static createError(
    code: string,
    message?: string,
    details?: any
  ): ApiError {
    return {
      code,
      message: message || this.ERROR_MESSAGES[code] || 'Unknown error',
      statusCode: this.HTTP_STATUS_CODES[code] || 500,
      details
    };
  }

  /**
   * Handle and log errors
   */
  static handleError(
    error: any,
    context: ErrorContext,
    supabase?: any
  ): ApiResponse {
    const apiError = this.normalizeError(error);
    
    // Log error for debugging
    this.logError(apiError, context, supabase);
    
    return {
      success: false,
      error: apiError,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize different error types
   */
  static normalizeError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error?.code && this.ERROR_CODES[error.code]) {
      return this.createError(error.code, error.message, error.details);
    }

    // Supabase errors
    if (error?.message?.includes('JWT')) {
      return this.createError(this.ERROR_CODES.INVALID_TOKEN, error.message);
    }

    if (error?.message?.includes('permission denied')) {
      return this.createError(this.ERROR_CODES.FORBIDDEN, error.message);
    }

    if (error?.message?.includes('not found')) {
      return this.createError(this.ERROR_CODES.NOT_FOUND, error.message);
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError(this.ERROR_CODES.EXTERNAL_API_ERROR, 'Network error occurred');
    }

    // Default error
    return this.createError(
      this.ERROR_CODES.INTERNAL_ERROR,
      error?.message || 'An unexpected error occurred'
    );
  }

  /**
   * Log error to console and optionally to database
   */
  static async logError(
    error: ApiError,
    context: ErrorContext,
    supabase?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error_code: error.code,
      error_message: error.message,
      error_details: error.details,
      function_name: context.functionName,
      request_id: context.requestId,
      user_id: context.userId,
      session_id: context.sessionId,
      job_id: context.jobId,
      additional_data: context.additionalData,
      user_agent: context.additionalData?.userAgent,
      ip_address: context.additionalData?.clientIP
    };

    // Always log to console
    console.error('Error logged:', JSON.stringify(logEntry, null, 2));

    // Optionally log to database if supabase client is provided
    if (supabase) {
      try {
        await supabase
          .from('error_logs')
          .insert(logEntry);
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }
    }
  }

  /**
   * Create success response
   */
  static createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create HTTP response object
   */
  static createHttpResponse(response: ApiResponse, corsHeaders: Record<string, string>): Response {
    const statusCode = response.error ? response.error.statusCode : 200;
    
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: statusCode
    });
  }

  /**
   * Validation helpers
   */
  static validateRequired(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw this.createError(
        this.ERROR_CODES.MISSING_REQUIRED_FIELD,
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw this.createError(
        this.ERROR_CODES.INVALID_INPUT,
        'Invalid email format'
      );
    }
  }

  static validateMessage(message: string): void {
    if (!message || typeof message !== 'string') {
      throw this.createError(
        this.ERROR_CODES.VALIDATION_ERROR,
        'Message is required and must be a string'
      );
    }

    if (message.trim().length === 0) {
      throw this.createError(
        this.ERROR_CODES.VALIDATION_ERROR,
        'Message cannot be empty'
      );
    }

    if (message.length > 10000) {
      throw this.createError(
        this.ERROR_CODES.VALIDATION_ERROR,
        'Message too long (max 10,000 characters)'
      );
    }

    // Check for potentially harmful content
    const harmfulPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(message)) {
        throw this.createError(
          this.ERROR_CODES.VALIDATION_ERROR,
          'Message contains potentially harmful content'
        );
      }
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (error?.code === this.ERROR_CODES.VALIDATION_ERROR ||
            error?.code === this.ERROR_CODES.NOT_FOUND ||
            error?.code === this.ERROR_CODES.FORBIDDEN) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Circuit breaker pattern for external API calls
   */
  static createCircuitBreaker<T>(
    operation: () => Promise<T>,
    failureThreshold: number = 5,
    timeout: number = 60000
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async (...args: any[]): Promise<T> => {
      const now = Date.now();

      if (state === 'OPEN') {
        if (now - lastFailureTime > timeout) {
          state = 'HALF_OPEN';
        } else {
          throw this.createError(
            this.ERROR_CODES.EXTERNAL_API_ERROR,
            'Circuit breaker is OPEN'
          );
        }
      }

      try {
        const result = await operation(...args);
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= failureThreshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  }

  /**
   * Get error codes for external use
   */
  static get ERROR_CODES() {
    return this.ERROR_CODES;
  }
}

/**
 * Custom error class for API errors
 */
export class ApiErrorClass extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message?: string, details?: any) {
    super(message || ErrorHandler.ERROR_MESSAGES[code] || 'Unknown error');
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ErrorHandler.HTTP_STATUS_CODES[code] || 500;
    this.details = details;
  }
}