/**
 * Centralized logging system
 * Replaces console.log/error with proper logging that respects environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // In development, log everything
    if (this.isDevelopment) {
      return true;
    }

    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, data, context } = entry;
    const prefix = context ? `[${context}]` : '';
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        // In production, you might want to send errors to a service like Sentry
        if (this.isProduction && data instanceof Error) {
          // TODO: Integrate with error tracking service (Sentry, etc.)
          // Sentry.captureException(data);
        }
        break;
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.formatMessage('debug', message, data, context);
    this.logToConsole(entry);
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;

    const entry = this.formatMessage('info', message, data, context);
    this.logToConsole(entry);
  }

  warn(message: string, data?: any, context?: string): void {
    const entry = this.formatMessage('warn', message, data, context);
    this.logToConsole(entry);

    // In production, warnings might also be sent to monitoring
    if (this.isProduction) {
      // TODO: Send to monitoring service
    }
  }

  error(message: string, error?: Error | any, context?: string): void {
    const errorData = error instanceof Error
      ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
      : error;

    const entry = this.formatMessage('error', message, errorData, context);
    this.logToConsole(entry);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, data?: any, context?: string) =>
  logger.debug(message, data, context);

export const logInfo = (message: string, data?: any, context?: string) =>
  logger.info(message, data, context);

export const logWarn = (message: string, data?: any, context?: string) =>
  logger.warn(message, data, context);

export const logError = (message: string, error?: Error | any, context?: string) =>
  logger.error(message, error, context);

export const log = (level: string, message: string, data?: any) => {
  // Map legacy log calls to new system
  const context = 'LegacyLog';
  switch (level.toUpperCase()) {
    case 'ERROR':
      logger.error(message, data, context);
      break;
    case 'WARN':
      logger.warn(message, data, context);
      break;
    case 'DEBUG':
      logger.debug(message, data, context);
      break;
    default:
      logger.info(message, data, context);
  }
};


