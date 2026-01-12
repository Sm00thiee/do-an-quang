/**
 * Simplified logging utility for chat feature
 * Provides basic logging interface compatible with CourseAiChat logger
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  OFF: 4
};

class Logger {
  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableStorage: false,
      maxStorageEntries: 1000
    };
    this.logBuffer = [];
    this.performanceMarks = new Map();
  }

  debug(context, message, data) {
    if (this.config.level > LogLevel.DEBUG) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.processLogEntry(entry);
  }

  info(context, message, data) {
    if (this.config.level > LogLevel.INFO) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.processLogEntry(entry);
  }

  warn(context, message, data) {
    if (this.config.level > LogLevel.WARN) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.processLogEntry(entry);
  }

  error(context, message, error, data) {
    if (this.config.level > LogLevel.ERROR) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, error);
    this.processLogEntry(entry);
  }

  createLogEntry(level, message, context, data, error) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      component: context
    };
  }

  processLogEntry(entry) {
    if (this.config.enableStorage) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length > this.config.maxStorageEntries) {
        this.logBuffer.shift();
      }
    }

    if (this.config.enableConsole) {
      const { level, message, context, data, error } = entry;
      const contextStr = context ? `[${context}]` : '';
      const formattedMessage = `${contextStr} ${message}`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '', error || '');
          if (error && error.stack) {
            console.error('Stack trace:', error.stack);
          }
          break;
      }
    }
  }

  timeStart(label, context) {
    this.performanceMarks.set(label, Date.now());
  }

  timeEnd(label, context, data) {
    const startTime = this.performanceMarks.get(label);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.performanceMarks.delete(label);
    
    if (duration > 50) { // Only log if significant
      this.debug(context || 'Performance', `Timer ended: ${label}`, {
        ...data,
        duration
      });
    }
    
    return duration;
  }

  async timeFunction(label, fn, context, data) {
    this.timeStart(label, context);
    
    try {
      const result = await fn();
      this.timeEnd(label, context, { ...data, success: true });
      return result;
    } catch (error) {
      this.timeEnd(label, context, { ...data, success: false, error });
      throw error;
    }
  }

  setDebugContext(userId, sessionId, jobId) {
    if (typeof window !== 'undefined') {
      if (userId) window.__debugUserId = userId;
      if (sessionId) window.__debugSessionId = sessionId;
      if (jobId) window.__debugJobId = jobId;
    }
  }

  clearDebugContext() {
    if (typeof window !== 'undefined') {
      delete window.__debugUserId;
      delete window.__debugSessionId;
      delete window.__debugJobId;
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export convenience functions
export const debug = (context, message, data) => logger.debug(context, message, data);
export const info = (context, message, data) => logger.info(context, message, data);
export const warn = (context, message, data) => logger.warn(context, message, data);
export const error = (context, message, err, data) => logger.error(context, message, err, data);
export const timeStart = (label, context) => logger.timeStart(label, context);
export const timeEnd = (label, context, data) => logger.timeEnd(label, context, data);
export const timeFunction = (label, fn, context, data) => logger.timeFunction(label, fn, context, data);

export { logger, LogLevel };
export default logger;
