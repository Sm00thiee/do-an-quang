/**
 * Logging utility for Supabase Edge Functions (Deno environment)
 * Provides structured logging with different levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: any
  error?: Error
  duration?: number
  requestId?: string
  function_name?: string
  job_id?: string
  session_id?: string
  user_id?: string
  [key: string]: any
}

export interface EdgeLoggerConfig {
  level: LogLevel
  enableConsole: boolean
  includeStackTrace: boolean
  enablePerformanceMonitoring: boolean
  contexts: string[]
  excludedContexts: string[]
}

class EdgeLogger {
  private config: EdgeLoggerConfig
  private performanceMarks: Map<string, number> = new Map()

  constructor() {
    // Default configuration for Edge Functions
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: true,
      includeStackTrace: true,
      enablePerformanceMonitoring: true,
      contexts: [],
      excludedContexts: []
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = Deno.env.get('LOG_LEVEL')?.toUpperCase()
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      case 'OFF': return LogLevel.OFF
      default: return LogLevel.INFO
    }
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<EdgeLoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): EdgeLoggerConfig {
    return { ...this.config }
  }

  /**
   * Check if a context should be logged
   */
  private shouldLog(context?: string): boolean {
    if (!context) return true
    
    // Check if context is excluded
    if (this.config.excludedContexts.includes(context)) {
      return false
    }
    
    // Check if specific contexts are configured
    if (this.config.contexts.length > 0) {
      return this.config.contexts.includes(context)
    }
    
    return true
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error,
    duration?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      duration,
      function_name: this.getFunctionName()
    }

    // Add request context if available
    entry.request_id = this.getRequestId()
    entry.job_id = this.getJobId()
    entry.session_id = this.getSessionId()
    entry.user_id = this.getUserId()

    return entry
  }

  /**
   * Get function name from environment or call stack
   */
  private getFunctionName(): string {
    // Try to get from environment first
    const envFunctionName = Deno.env.get('FUNCTION_NAME')
    if (envFunctionName) return envFunctionName

    // Try to get from call stack
    try {
      const stack = new Error().stack
      if (stack) {
        const lines = stack.split('\n')
        for (const line of lines) {
          if (line.includes('functions/') && !line.includes('logger.ts')) {
            const match = line.match(/\/functions\/([^\/]+)/)
            if (match) return match[1]
          }
        }
      }
    } catch (error) {
      // Ignore stack trace errors
    }

    return 'unknown'
  }

  /**
   * Get request ID from headers or context
   */
  private getRequestId(): string | undefined {
    // This would typically be set from request headers or middleware
    return (globalThis as any).__requestId
  }

  /**
   * Get job ID from context
   */
  private getJobId(): string | undefined {
    return (globalThis as any).__jobId
  }

  /**
   * Get session ID from context
   */
  private getSessionId(): string | undefined {
    return (globalThis as any).__sessionId
  }

  /**
   * Get user ID from context
   */
  private getUserId(): string | undefined {
    return (globalThis as any).__userId
  }

  /**
   * Set context variables
   */
  setContext(context: {
    requestId?: string
    jobId?: string
    sessionId?: string
    userId?: string
  }): void {
    if (context.requestId) (globalThis as any).__requestId = context.requestId
    if (context.jobId) (globalThis as any).__jobId = context.jobId
    if (context.sessionId) (globalThis as any).__sessionId = context.sessionId
    if (context.userId) (globalThis as any).__userId = context.userId
  }

  /**
   * Clear context variables
   */
  clearContext(): void {
    delete (globalThis as any).__requestId
    delete (globalThis as any).__jobId
    delete (globalThis as any).__sessionId
    delete (globalThis as any).__userId
  }

  /**
   * Output structured log to console
   */
  private outputLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.context)) return

    const { level, message, context, data, error, duration, timestamp, ...metadata } = entry
    const levelName = LogLevel[level]
    
    const logData = {
      timestamp,
      level: levelName,
      message,
      context,
      duration,
      ...metadata
    }

    // Add data if present
    if (data) {
      logData.data = data
    }

    // Add error details if present
    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined
      }
    }

    // Output as JSON for structured logging
    const jsonOutput = JSON.stringify(logData)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(jsonOutput)
        break
      case LogLevel.INFO:
        console.info(jsonOutput)
        break
      case LogLevel.WARN:
        console.warn(jsonOutput)
        break
      case LogLevel.ERROR:
        console.error(jsonOutput)
        break
    }
  }

  /**
   * Debug level logging
   */
  debug(context: string, message: string, data?: any): void {
    if (this.config.level > LogLevel.DEBUG) return
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data)
    this.outputLog(entry)
  }

  /**
   * Info level logging
   */
  info(context: string, message: string, data?: any): void {
    if (this.config.level > LogLevel.INFO) return
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data)
    this.outputLog(entry)
  }

  /**
   * Warning level logging
   */
  warn(context: string, message: string, data?: any): void {
    if (this.config.level > LogLevel.WARN) return
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data)
    this.outputLog(entry)
  }

  /**
   * Error level logging
   */
  error(context: string, message: string, error?: Error, data?: any): void {
    if (this.config.level > LogLevel.ERROR) return
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, error)
    this.outputLog(entry)
  }

  /**
   * Performance timing start
   */
  timeStart(label: string, context?: string): void {
    if (!this.config.enablePerformanceMonitoring) return
    
    const mark = `${Date.now()}-${Math.random()}`
    this.performanceMarks.set(label, Date.now())
    
    this.debug(context || 'Performance', `Timer started: ${label}`, { label })
  }

  /**
   * Performance timing end
   */
  timeEnd(label: string, context?: string, data?: any): number {
    if (!this.config.enablePerformanceMonitoring) return 0
    
    const startTime = this.performanceMarks.get(label)
    if (!startTime) {
      this.warn(context || 'Performance', `Timer not found: ${label}`, { label })
      return 0
    }
    
    const duration = Date.now() - startTime
    this.performanceMarks.delete(label)
    
    this.debug(context || 'Performance', `Timer ended: ${label}`, {
      ...data,
      label,
      duration
    })
    
    return duration
  }

  /**
   * Log function execution time
   */
  async timeFunction<T>(
    label: string,
    fn: () => Promise<T> | T,
    context?: string,
    data?: any
  ): Promise<T> {
    this.timeStart(label, context)
    
    try {
      const result = await fn()
      this.timeEnd(label, context, { ...data, success: true })
      return result
    } catch (error) {
      this.timeEnd(label, context, { ...data, success: false, error })
      throw error
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    headers?: Record<string, string>,
    body?: any
  ): void {
    this.info('HTTP', `${method} ${url}`, {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      bodySize: body ? JSON.stringify(body).length : 0
    })
  }

  /**
   * Log HTTP response
   */
  logResponse(
    status: number,
    statusText: string,
    responseSize?: number,
    duration?: number
  ): void {
    const level = status >= 400 ? 'warn' : 'info'
    this[level]('HTTP', `Response: ${status} ${statusText}`, {
      status,
      statusText,
      responseSize,
      duration
    })
  }

  /**
   * Log database operation
   */
  logDatabase(
    operation: string,
    table: string,
    data?: any,
    duration?: number
  ): void {
    this.debug('Database', `${operation} on ${table}`, {
      operation,
      table,
      recordCount: Array.isArray(data) ? data.length : 1,
      duration
    })
  }

  /**
   * Log Gemini API call
   */
  logGeminiCall(
    operation: string,
    model?: string,
    tokenCount?: number,
    duration?: number
  ): void {
    this.info('Gemini', `${operation} call`, {
      operation,
      model,
      tokenCount,
      duration
    })
  }

  /**
   * Log queue operation
   */
  logQueue(
    operation: string,
    jobId?: string,
    status?: string,
    data?: any
  ): void {
    this.info('Queue', `${operation}${jobId ? ` for job ${jobId}` : ''}`, {
      operation,
      jobId,
      status,
      data
    })
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined

    const sanitized = { ...headers }
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  /**
   * Create child logger with additional context
   */
  child(context: string, additionalData?: any): EdgeLogger {
    const childLogger = new EdgeLogger()
    childLogger.configure(this.config)
    
    return {
      debug: (message: string, data?: any) => this.debug(context, message, { ...additionalData, ...data }),
      info: (message: string, data?: any) => this.info(context, message, { ...additionalData, ...data }),
      warn: (message: string, data?: any) => this.warn(context, message, { ...additionalData, ...data }),
      error: (message: string, error?: Error, data?: any) => this.error(context, message, error, { ...additionalData, ...data }),
      timeStart: (label: string) => this.timeStart(label, context),
      timeEnd: (label: string, data?: any) => this.timeEnd(label, context, data),
      timeFunction: <T>(label: string, fn: () => Promise<T> | T, data?: any) => 
        this.timeFunction(label, fn, context, { ...additionalData, ...data }),
      logRequest: (method: string, url: string, headers?: Record<string, string>, body?: any) =>
        this.logRequest(method, url, headers, body),
      logResponse: (status: number, statusText: string, responseSize?: number, duration?: number) =>
        this.logResponse(status, statusText, responseSize, duration),
      logDatabase: (operation: string, table: string, data?: any, duration?: number) =>
        this.logDatabase(operation, table, data, duration),
      logGeminiCall: (operation: string, model?: string, tokenCount?: number, duration?: number) =>
        this.logGeminiCall(operation, model, tokenCount, duration),
      logQueue: (operation: string, jobId?: string, status?: string, data?: any) =>
        this.logQueue(operation, jobId, status, data),
      setContext: (ctx: any) => this.setContext(ctx),
      clearContext: () => this.clearContext(),
      configure: (config: any) => childLogger.configure(config),
      getConfig: () => childLogger.getConfig(),
      child: (ctx: string, moreData?: any) => this.child(ctx, { ...additionalData, ...moreData })
    } as EdgeLogger
  }
}

// Create singleton instance
const edgeLogger = new EdgeLogger()

// Export convenience functions
export const debug = (context: string, message: string, data?: any) => edgeLogger.debug(context, message, data)
export const info = (context: string, message: string, data?: any) => edgeLogger.info(context, message, data)
export const warn = (context: string, message: string, data?: any) => edgeLogger.warn(context, message, data)
export const error = (context: string, message: string, err?: Error, data?: any) => edgeLogger.error(context, message, err, data)
export const timeStart = (label: string, context?: string) => edgeLogger.timeStart(label, context)
export const timeEnd = (label: string, context?: string, data?: any) => edgeLogger.timeEnd(label, context, data)
export const timeFunction = <T>(label: string, fn: () => Promise<T> | T, context?: string, data?: any) => 
  edgeLogger.timeFunction(label, fn, context, data)

// Export logger instance and utilities
export { edgeLogger }
export default edgeLogger