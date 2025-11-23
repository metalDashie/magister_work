import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request, Response } from 'express'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const { method, url, body, query, ip } = request
    const userAgent = request.get('user-agent') || '-'
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    // Log request
    const requestLog = {
      requestId,
      type: 'REQUEST',
      method,
      url,
      query: Object.keys(query).length ? query : undefined,
      body: this.sanitizeBody(body),
      ip: ip || request.socket.remoteAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    }

    this.logger.log(this.formatLog(requestLog))

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime
          const statusCode = response.statusCode

          // Log response
          const responseLog = {
            requestId,
            type: 'RESPONSE',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            body: this.sanitizeResponse(data),
            timestamp: new Date().toISOString(),
          }

          this.logger.log(this.formatLog(responseLog))
        },
        error: (error) => {
          const duration = Date.now() - startTime
          const statusCode = error.status || 500

          // Log error response
          const errorLog = {
            requestId,
            type: 'ERROR',
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: {
              name: error.name,
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          }

          this.logger.error(this.formatLog(errorLog))
        },
      }),
    )
  }

  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body

    const sanitized = { ...body }

    // Hide sensitive fields
    const sensitiveFields = ['password', 'token', 'accessToken', 'apiKey', 'secret']
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***'
      }
    }

    // Truncate large webhook payloads for readability
    if (sanitized.entry && Array.isArray(sanitized.entry)) {
      return {
        object: sanitized.object,
        entryCount: sanitized.entry.length,
        preview: this.truncateObject(sanitized.entry[0], 3),
      }
    }

    return this.truncateObject(sanitized, 5)
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data
    return this.truncateObject(data, 5)
  }

  private truncateObject(obj: any, maxDepth: number, currentDepth = 0): any {
    if (currentDepth >= maxDepth) return '[truncated]'
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') {
      if (typeof obj === 'string' && obj.length > 200) {
        return obj.slice(0, 200) + '...'
      }
      return obj
    }
    if (Array.isArray(obj)) {
      if (obj.length > 5) {
        return [...obj.slice(0, 5).map(item => this.truncateObject(item, maxDepth, currentDepth + 1)), `... +${obj.length - 5} more`]
      }
      return obj.map(item => this.truncateObject(item, maxDepth, currentDepth + 1))
    }

    const result: any = {}
    const keys = Object.keys(obj)
    for (const key of keys.slice(0, 20)) {
      result[key] = this.truncateObject(obj[key], maxDepth, currentDepth + 1)
    }
    if (keys.length > 20) {
      result['...'] = `+${keys.length - 20} more fields`
    }
    return result
  }

  private formatLog(log: any): string {
    const { requestId, type, method, url, statusCode, duration } = log

    // Compact one-line summary
    const summary = type === 'REQUEST'
      ? `[${requestId}] --> ${method} ${url}`
      : `[${requestId}] <-- ${method} ${url} ${statusCode} ${duration}`

    // Full JSON for detailed logging
    return `${summary}\n${JSON.stringify(log, null, 2)}`
  }
}
