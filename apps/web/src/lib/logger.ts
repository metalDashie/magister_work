type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  data?: any
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private minLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.minLevel = this.isDevelopment ? 'debug' : 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context ? `[${entry.context}]` : ''
    return `${entry.timestamp} [${entry.level.toUpperCase()}]${contextStr} ${entry.message}`
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    }

    const formattedMessage = this.formatMessage(entry)

    switch (level) {
      case 'debug':
        if (data !== undefined) {
          console.debug(formattedMessage, data)
        } else {
          console.debug(formattedMessage)
        }
        break
      case 'info':
        if (data !== undefined) {
          console.info(formattedMessage, data)
        } else {
          console.info(formattedMessage)
        }
        break
      case 'warn':
        if (data !== undefined) {
          console.warn(formattedMessage, data)
        } else {
          console.warn(formattedMessage)
        }
        break
      case 'error':
        if (data !== undefined) {
          console.error(formattedMessage, data)
        } else {
          console.error(formattedMessage)
        }
        break
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data)
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data)
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data)
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data)
  }

  // Create a child logger with a fixed context
  child(context: string): ContextLogger {
    return new ContextLogger(this, context)
  }
}

class ContextLogger {
  constructor(private parent: Logger, private context: string) {}

  debug(message: string, data?: any): void {
    this.parent.debug(message, this.context, data)
  }

  info(message: string, data?: any): void {
    this.parent.info(message, this.context, data)
  }

  warn(message: string, data?: any): void {
    this.parent.warn(message, this.context, data)
  }

  error(message: string, data?: any): void {
    this.parent.error(message, this.context, data)
  }
}

export const logger = new Logger()
export type { LogLevel, LogEntry }
