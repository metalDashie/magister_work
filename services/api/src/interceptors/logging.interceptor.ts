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

    const { method, url, body, query, params } = request
    const userAgent = request.get('user-agent') || ''
    const ip = request.ip || request.socket.remoteAddress

    const now = Date.now()
    const requestId = `${now}-${Math.random().toString(36).substr(2, 9)}`

    // Log request
    this.logger.log(
      `[${requestId}] --> ${method} ${url} - IP: ${ip} - UA: ${userAgent}`
    )

    if (Object.keys(query).length > 0) {
      this.logger.debug(`[${requestId}] Query: ${JSON.stringify(query)}`)
    }

    if (Object.keys(params).length > 0) {
      this.logger.debug(`[${requestId}] Params: ${JSON.stringify(params)}`)
    }

    if (body && Object.keys(body).length > 0) {
      // Sanitize sensitive data
      const sanitizedBody = this.sanitizeBody(body)
      this.logger.debug(`[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`)
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - now
          const statusCode = response.statusCode

          // Truncate response if too large
          const responseLog = this.truncateResponse(data)

          this.logger.log(
            `[${requestId}] <-- ${method} ${url} ${statusCode} - ${duration}ms`
          )
          this.logger.debug(
            `[${requestId}] Response: ${JSON.stringify(responseLog)}`
          )
        },
        error: (error) => {
          const duration = Date.now() - now
          const statusCode = error.status || 500

          this.logger.error(
            `[${requestId}] <-- ${method} ${url} ${statusCode} - ${duration}ms - Error: ${error.message}`
          )
        },
      })
    )
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey']
    const sanitized = { ...body }

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  private truncateResponse(data: any): any {
    if (!data) return data

    const stringified = JSON.stringify(data)
    const maxLength = 1000

    if (stringified.length > maxLength) {
      if (Array.isArray(data)) {
        return {
          _truncated: true,
          _totalItems: data.length,
          _preview: data.slice(0, 3),
        }
      }
      return {
        _truncated: true,
        _length: stringified.length,
        _preview: stringified.substring(0, maxLength) + '...',
      }
    }

    return data
  }
}
