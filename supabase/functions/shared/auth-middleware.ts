// Authentication Middleware for Supabase Edge Functions
// Handles JWT validation and user authentication

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  isService: boolean;
  user: any | null;
  error?: string;
}

export interface SessionInfo {
  id: string;
  session_id: string;
  field_id?: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export class AuthMiddleware {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Validate request authentication
   */
  static async validateRequest(
    req: Request,
    supabaseUrl: string,
    supabaseServiceKey: string
  ): Promise<AuthResult> {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return {
        isService: false,
        user: null,
        error: 'No authorization header provided'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // For service-to-service calls, use service role key
    if (token === supabaseServiceKey) {
      return {
        isService: true,
        user: null
      };
    }

    // For client calls, validate user token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        isService: false,
        user: null,
        error: 'Invalid authentication token'
      };
    }

    return {
      isService: false,
      user
    };
  }

  /**
   * Validate chat session
   */
  static async validateSession(
    sessionId: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ): Promise<SessionInfo> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      throw new Error('Invalid session');
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) {
      throw new Error('Session expired');
    }

    return session;
  }

  /**
   * Check if user has reached question limit
   */
  static async checkQuestionLimit(
    sessionId: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ): Promise<void> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('question_count')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      throw new Error('Invalid session');
    }

    if (session.question_count >= 10) {
      throw new Error('Question limit reached for this session');
    }
  }

  /**
   * Create a new chat session
   */
  static async createSession(
    fieldId?: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ): Promise<SessionInfo> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const sessionId = this.generateSessionId();

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        session_id: sessionId,
        field_id: fieldId,
        question_count: 0
      })
      .select()
      .single();

    if (error || !session) {
      throw new Error('Failed to create session');
    }

    return session;
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Extract session ID from request
   */
  static extractSessionId(req: Request): string | null {
    // Try to get session_id from query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (sessionId) {
      return sessionId;
    }

    // Try to get session_id from request body (for POST requests)
    // Note: This would need to be handled in the actual function
    return null;
  }

  /**
   * Set session context for RLS policies
   */
  static setSessionContext(sessionId: string): void {
    // This would be used in database operations to set RLS context
    // In PostgreSQL, this would be done with SET LOCAL
    // For Supabase Edge Functions, we use current_setting()
  }

  /**
   * Validate API key for service calls
   */
  static validateServiceKey(req: Request, serviceKey: string): boolean {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === serviceKey;
  }

  /**
   * Rate limiting helper
   */
  static async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    supabase: any
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    await supabase
      .from('rate_limit_entries')
      .delete()
      .lt('timestamp', new Date(windowStart).toISOString());
    
    // Count current requests
    const { count, error } = await supabase
      .from('rate_limit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('timestamp', new Date(windowStart).toISOString());
    
    if (error) throw error;
    
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs
      };
    }
    
    // Record this request
    await supabase
      .from('rate_limit_entries')
      .insert({
        identifier,
        timestamp: new Date().toISOString()
      });
    
    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: now + windowMs
    };
  }

  /**
   * Get user IP address for rate limiting
   */
  static getClientIP(req: Request): string {
    // Try various headers for the real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback to a default (not ideal for production)
    return 'unknown';
  }

  /**
   * Middleware function for Express-style usage
   */
  static createMiddleware(supabaseUrl: string, supabaseServiceKey: string) {
    return async (req: Request): Promise<AuthResult> => {
      try {
        return await this.validateRequest(req, supabaseUrl, supabaseServiceKey);
      } catch (error) {
        return {
          isService: false,
          user: null,
          error: `Authentication error: ${error.message}`
        };
      }
    };
  }
}

/**
 * Create authentication middleware instance
 */
export function createAuthMiddleware(): AuthMiddleware {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }

  return new AuthMiddleware(supabaseUrl, supabaseServiceKey);
}