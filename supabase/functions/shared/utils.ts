// Utility Functions for Supabase Edge Functions
// Common helper functions and utilities

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}-${timestamp}-${randomPart}` : `${timestamp}-${randomPart}`;
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return generateId('job');
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return generateId('session');
}

/**
 * Generate a unique worker ID
 */
export function generateWorkerId(): string {
  return generateId('worker');
}

/**
 * Estimate processing time based on message length
 */
export function estimateProcessingTime(message: string): number {
  // Base time + time per character
  const baseTime = 2000; // 2 seconds base
  const timePerChar = 10; // 10ms per character
  return baseTime + (message.length * timePerChar);
}

/**
 * Validate message content
 */
export function validateMessage(message: string): { isValid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required and must be a string' };
  }

  if (message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 10000) {
    return { isValid: false, error: 'Message too long (max 10,000 characters)' };
  }

  // Check for potentially harmful content
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(message)) {
      return { isValid: false, error: 'Message contains potentially harmful content' };
    }
  }

  return { isValid: true };
}

/**
 * Sanitize message content
 */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
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

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toISOString();
}

/**
 * Calculate time difference in human-readable format
 */
export function getTimeDifference(startTime: string | Date, endTime: string | Date = new Date()): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 1000) {
    return `${diffMs}ms`;
  } else if (diffMs < 60000) {
    return `${Math.round(diffMs / 1000)}s`;
  } else if (diffMs < 3600000) {
    return `${Math.round(diffMs / 60000)}m`;
  } else {
    return `${Math.round(diffMs / 3600000)}h`;
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmptyOrWhitespace(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  
  return result;
}

/**
 * Create pagination metadata
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Calculate offset for pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash string using simple algorithm (for non-cryptographic purposes)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get environment variable with default value
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = Deno.env.get(key);
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return getEnvVar('ENVIRONMENT', 'development') === 'development';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return getEnvVar('ENVIRONMENT', 'development') === 'production';
}

/**
 * Create a safe JSON string (handles circular references)
 */
export function safeJsonStringify(obj: any, indent?: number): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    // Handle circular references
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, val) => {
      if (val != null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      return val;
    }, indent);
  }
}

/**
 * Parse user agent string
 */
export function parseUserAgent(userAgent: string): {
  browser?: string;
  version?: string;
  os?: string;
  device?: string;
} {
  const result: any = {};
  
  // Basic browser detection
  const browserMatch = userAgent.match(/(chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) ||
                    userAgent.match(/(edge|opr|opera)\/?\s*(\d+)/i);
  
  if (browserMatch) {
    result.browser = browserMatch[1].toLowerCase();
    result.version = browserMatch[2];
  }
  
  // Basic OS detection
  const osMatch = userAgent.match(/(windows|mac|linux|ubuntu|iphone|ipad|android)/i);
  if (osMatch) {
    result.os = osMatch[1].toLowerCase();
  }
  
  return result;
}

/**
 * Create a cache with TTL
 */
export function createCache<T>(ttlMs: number = 300000): {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
  delete: (key: string) => void;
} {
  const cache = new Map<string, { value: T; expiry: number }>();
  
  return {
    get(key: string): T | undefined {
      const item = cache.get(key);
      if (!item) return undefined;
      
      if (Date.now() > item.expiry) {
        cache.delete(key);
        return undefined;
      }
      
      return item.value;
    },
    
    set(key: string, value: T): void {
      cache.set(key, {
        value,
        expiry: Date.now() + ttlMs
      });
    },
    
    clear(): void {
      cache.clear();
    },
    
    delete(key: string): void {
      cache.delete(key);
    }
  };
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay + Math.random() * 1000, maxDelay);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}