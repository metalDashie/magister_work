import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { logger } from './logger'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const apiLogger = logger.child('API')

// Generate unique request ID
const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Sanitize sensitive data from logs
const sanitizeData = (data: any): any => {
  if (!data) return data
  const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'apiKey']
  const sanitized = { ...data }

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

// Truncate large responses for logging
const truncateResponse = (data: any, maxLength = 500): any => {
  if (!data) return data
  const stringified = JSON.stringify(data)

  if (stringified.length > maxLength) {
    if (Array.isArray(data)) {
      return { _truncated: true, _totalItems: data.length, _preview: data.slice(0, 2) }
    }
    return { _truncated: true, _length: stringified.length }
  }

  return data
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token and logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request ID for tracking
    const requestId = generateRequestId()
    config.headers['X-Request-ID'] = requestId
    ;(config as any)._requestId = requestId
    ;(config as any)._startTime = Date.now()

    // Log request
    apiLogger.info(`--> ${config.method?.toUpperCase()} ${config.url}`, {
      requestId,
      params: config.params,
      data: sanitizeData(config.data),
    })

    return config
  },
  (error) => {
    apiLogger.error('Request setup error', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response) => {
    const config = response.config as any
    const duration = Date.now() - (config._startTime || Date.now())
    const requestId = config._requestId || 'unknown'

    // Log successful response
    apiLogger.info(`<-- ${response.status} ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`, {
      requestId,
      data: truncateResponse(response.data),
    })

    return response
  },
  (error: AxiosError) => {
    const config = error.config as any
    const duration = Date.now() - (config?._startTime || Date.now())
    const requestId = config?._requestId || 'unknown'

    // Log error response
    apiLogger.error(`<-- ${error.response?.status || 'ERR'} ${config?.method?.toUpperCase()} ${config?.url} (${duration}ms)`, {
      requestId,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })

    if (error.response?.status === 401) {
      // Clear all auth-related storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth-storage')

      // Only redirect if not already on auth pages to prevent infinite loops
      const isAuthPage = window.location.pathname.startsWith('/auth')
      if (!isAuthPage) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)
