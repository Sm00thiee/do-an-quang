// Base Function Class for Supabase Edge Functions
// Common functionality and patterns for all Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ErrorHandler, ApiResponse, ErrorContext } from './error-handler.ts';
import { AuthMiddleware } from './auth-middleware.ts';
import { DatabaseOperations } from './database.ts';

export interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  jobId?: string;
  clientIP: string;
  userAgent?: string;
  isService: boolean;
  user?: any;
}

export abstract class BaseFunction {
  protected supabase: any;
  protected db: DatabaseOperations;
  protected env: Record<string, string>;
  protected corsHeaders: Record<string, string>;

  constructor() {
    this.env = Deno.env.toObject();
    this.corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
  }

  /**
   * Initialize Supabase client and database operations
   */
  protected async initializeSupabase(authHeader?: string): Promise<void> {
    const supabaseUrl = this.env.SUPABASE_URL;
    const serviceRoleKey = this.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }

    this.supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: authHeader ? { Authorization: authHeader } : {}
        }
      }
    );

    this.db = new DatabaseOperations({
      url: supabaseUrl,
      serviceRoleKey
    });
  }

  /**
   * Handle CORS preflight requests
   */
  protected handleCORS(): Response {
    return new Response('ok', { headers: this.corsHeaders });
  }

  /**
   * Handle errors and create standardized response
   */
  protected handleError(
    error: any,
    context: Partial<ErrorContext> = {}
  ): Response {
    const errorContext: ErrorContext = {
      functionName: this.constructor.name,
      requestId: context.requestId || this.generateRequestId(),
      userId: context.userId,
      sessionId: context.sessionId,
      jobId: context.jobId,
      additionalData: context.additionalData
    };

    const response = ErrorHandler.handleError(error, errorContext, this.supabase);
    return ErrorHandler.createHttpResponse(response, this.corsHeaders);
  }

  /**
   * Create success response
   */
  protected successResponse<T>(data: T): Response {
    const response = ErrorHandler.createSuccessResponse(data);
    return ErrorHandler.createHttpResponse(response, this.corsHeaders);
  }

  /**
   * Validate request and extract context
   */
  protected async validateRequest(
    req: Request
  ): Promise<{ context: RequestContext; error?: Response }> {
    const requestId = this.generateRequestId();
    const clientIP = AuthMiddleware.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || undefined;

    try {
      // Validate authentication
      const authResult = await AuthMiddleware.validateRequest(
        req,
        this.env.SUPABASE_URL!,
        this.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      if (authResult.error) {
        return {
          context: {
            requestId,
            clientIP,
            userAgent,
            isService: false
          },
          error: this.handleError(
            ErrorHandler.createError(
              ErrorHandler.ERROR_CODES.UNAUTHORIZED,
              authResult.error
            ),
            { requestId, additionalData: { clientIP, userAgent } }
          )
        };
      }

      const context: RequestContext = {
        requestId,
        userId: authResult.user?.id,
        clientIP,
        userAgent,
        isService: authResult.isService,
        user: authResult.user
      };

      return { context };
    } catch (error) {
      return {
        context: {
          requestId,
          clientIP,
          userAgent,
          isService: false
        },
        error: this.handleError(error, { 
          requestId, 
          additionalData: { clientIP, userAgent } 
        })
      };
    }
  }

  /**
   * Extract session ID from request
   */
  protected extractSessionId(req: Request): string | null {
    // Try query parameters first
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (sessionId) {
      return sessionId;
    }

    // Try from URL path
    const pathParts = url.pathname.split('/');
    const sessionIdIndex = pathParts.indexOf('session') + 1;
    if (sessionIdIndex > 0 && sessionIdIndex < pathParts.length) {
      return pathParts[sessionIdIndex];
    }

    return null;
  }

  /**
   * Extract job ID from request
   */
  protected extractJobId(req: Request): string | null {
    // Try query parameters first
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    
    if (jobId) {
      return jobId;
    }

    // Try from URL path
    const pathParts = url.pathname.split('/');
    const jobIdIndex = pathParts.findIndex(part => part === 'job') + 1;
    if (jobIdIndex > 0 && jobIdIndex < pathParts.length) {
      return pathParts[jobIdIndex];
    }

    return null;
  }

  /**
   * Apply rate limiting
   */
  protected async applyRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60000 // 1 minute
  ): Promise<void> {
    try {
      const result = await AuthMiddleware.checkRateLimit(
        identifier,
        limit,
        windowMs,
        this.supabase
      );

      if (!result.allowed) {
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.RATE_LIMIT_EXCEEDED,
          `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`
        );
      }
    } catch (error) {
      // If rate limiting fails, allow the request but log the error
      console.error('Rate limiting error:', error);
    }
  }

  /**
   * Generate unique request ID
   */
  protected generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Parse request body with error handling
   */
  protected async parseRequestBody<T = any>(req: Request): Promise<T> {
    try {
      return await req.json();
    } catch (error) {
      throw ErrorHandler.createError(
        ErrorHandler.ERROR_CODES.INVALID_INPUT,
        'Invalid JSON in request body'
      );
    }
  }

  /**
   * Validate required fields
   */
  protected validateRequired(data: any, requiredFields: string[]): void {
    ErrorHandler.validateRequired(data, requiredFields);
  }

  /**
   * Validate message content
   */
  protected validateMessage(message: string): void {
    ErrorHandler.validateMessage(message);
  }

  /**
   * Validate email format
   */
  protected validateEmail(email: string): void {
    ErrorHandler.validateEmail(email);
  }

  /**
   * Execute operation with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    return ErrorHandler.withRetry(operation, maxRetries, baseDelay);
  }

  /**
   * Create circuit breaker for external API calls
   */
  protected createCircuitBreaker<T>(
    operation: () => Promise<T>,
    failureThreshold: number = 5,
    timeout: number = 60000
  ) {
    return ErrorHandler.createCircuitBreaker(operation, failureThreshold, timeout);
  }

  /**
   * Log request for debugging
   */
  protected logRequest(
    req: Request,
    context: RequestContext,
    additionalData?: any
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      method: req.method,
      url: req.url,
      clientIP: context.clientIP,
      userAgent: context.userAgent,
      userId: context.userId,
      sessionId: context.sessionId,
      jobId: context.jobId,
      isService: context.isService,
      additionalData
    };

    console.log('Request:', JSON.stringify(logData, null, 2));
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  abstract handleRequest(
    req: Request,
    context: RequestContext
  ): Promise<Response>;

  /**
   * Main request handler
   */
  async main(req: Request): Promise<Response> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return this.handleCORS();
    }

    let context: RequestContext;
    let validationError: Response | undefined;

    // Validate request and extract context
    const validation = await this.validateRequest(req);
    if (validation.error) {
      return validation.error;
    }
    context = validation.context;

    try {
      // Initialize database connection
      await this.initializeSupabase(req.headers.get('Authorization') || undefined);

      // Log request
      this.logRequest(req, context);

      // Apply rate limiting for non-service requests
      if (!context.isService) {
        await this.applyRateLimit(context.clientIP);
      }

      // Handle the request
      return await this.handleRequest(req, context);

    } catch (error) {
      return this.handleError(error, {
        requestId: context.requestId,
        userId: context.userId,
        sessionId: context.sessionId,
        jobId: context.jobId,
        additionalData: {
          clientIP: context.clientIP,
          userAgent: context.userAgent,
          method: req.method,
          url: req.url
        }
      });
    }
  }
}

/**
 * Helper function to create Edge Function handler
 */
export function createEdgeFunctionHandler(
  FunctionClass: new () => BaseFunction
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const functionInstance = new FunctionClass();
    return await functionInstance.main(req);
  };
}