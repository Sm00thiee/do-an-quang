/**
 * Chat Logger Utility
 * Provides structured logging for the chat feature
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  OFF: 4
};

class ChatLogger {
  constructor() {
    this.level = this.getLogLevelFromEnv();
    this.enableConsole = process.env.NODE_ENV === 'development';
    this.logBuffer = [];
    this.maxBufferSize = 1000;
    this.debugContext = { userId: undefined, sessionId: undefined };
  }

  getLogLevelFromEnv() {
    const envLevel = process.env.REACT_APP_LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'OFF': return LogLevel.OFF;
      default: return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  setDebugContext(userId, sessionId) {
    this.debugContext = { userId, sessionId };
  }

  shouldLog(level) {
    return level >= this.level && this.level !== LogLevel.OFF;
  }

  formatMessage(level, context, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'UNKNOWN';
    
    const entry = {
      timestamp,
      level: levelName,
      context,
      message,
      ...this.debugContext,
      ...(data && { data })
    };

    return entry;
  }

  log(level, context, message, data) {
    if (!this.shouldLog(level)) return;

    const entry = this.formatMessage(level, context, message, data);
    
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output
    if (this.enableConsole) {
      const prefix = `[${entry.level}] [${context}]`;
      const fullMessage = data ? `${prefix} ${message}` : `${prefix} ${message}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.log(fullMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(fullMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(fullMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(fullMessage, data || '');
          break;
      }
    }
  }

  debug(context, message, data) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  info(context, message, data) {
    this.log(LogLevel.INFO, context, message, data);
  }

  warn(context, message, data) {
    this.log(LogLevel.WARN, context, message, data);
  }

  error(context, message, data) {
    this.log(LogLevel.ERROR, context, message, data);
  }

  getLogs(filter) {
    let logs = [...this.logBuffer];
    
    if (filter?.level) {
      logs = logs.filter(log => log.level === filter.level);
    }
    
    if (filter?.context) {
      logs = logs.filter(log => log.context === filter.context);
    }
    
    if (filter?.sessionId) {
      logs = logs.filter(log => log.sessionId === filter.sessionId);
    }
    
    return logs;
  }

  clearLogs() {
    this.logBuffer = [];
  }

  exportLogs() {
    const data = JSON.stringify(this.logBuffer, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const logger = new ChatLogger();

export { logger, LogLevel };

/**
 * Time function execution
 * @param {string} label
 * @param {Function} fn
 * @returns {Promise<any>}
 */
export async function timeFunction(label, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.debug('Performance', `${label}: ${duration.toFixed(2)}ms`, { duration });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('Performance', `${label} failed after ${duration.toFixed(2)}ms`, { duration, error });
    throw error;
  }
}
