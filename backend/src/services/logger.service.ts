/**
 * Structured Logging Service
 * Uses Winston for production-grade logging with multiple transports
 */

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? 'info' : 'debug';
};

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Build structured log entry
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
    };

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Filter out sensitive data
      const sanitizedMeta = sanitizeLogData(meta);
      Object.assign(logEntry, sanitizedMeta);
    }

    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (Object.keys(meta).length > 0) {
      const sanitizedMeta = sanitizeLogData(meta);
      log += ` ${JSON.stringify(sanitizedMeta)}`;
    }
    return log;
  })
);

// Sensitive fields to redact
const sensitiveFields = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'encryptionKey',
];

/**
 * Sanitize log data by redacting sensitive fields
 */
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive field names
    if (sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeLogData(item as Record<string, unknown>)
            : item
        );
      } else {
        sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Create transports based on environment
const transports: winston.transport[] = [];

// Console transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  // Production: JSON format for log aggregation
  transports.push(
    new winston.transports.Console({
      format: structuredFormat,
    })
  );
}

// File transport for production (optional - configure via env)
if (process.env.LOG_FILE_PATH) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH,
      format: structuredFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// ============= REQUEST LOGGING MIDDLEWARE =============

// Store for request correlation
const requestContext = new Map<string, { requestId: string; startTime: number }>();

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Request logging middleware
 * Adds request ID and logs request/response
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  const startTime = Date.now();

  // Store request context
  requestContext.set(requestId, { requestId, startTime });

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  // Extend request object with logging context
  (req as any).requestId = requestId;
  (req as any).log = createChildLogger(requestId);

  // Log incoming request
  logger.http('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.userId,
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      userId: (req as any).user?.userId,
    });

    // Clean up context
    requestContext.delete(requestId);
  });

  next();
}

/**
 * Create a child logger with request context
 */
export function createChildLogger(requestId: string): winston.Logger {
  return logger.child({ requestId });
}

// ============= AUDIT LOGGING =============

export interface AuditLogEntry {
  action: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Log an audit event
 */
export function auditLog(entry: AuditLogEntry): void {
  logger.info('AUDIT', {
    type: 'audit',
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper to create audit log from request
 */
export function createAuditLogFromRequest(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: Record<string, { old: unknown; new: unknown }>
): void {
  const user = (req as any).user;

  auditLog({
    action,
    userId: user?.userId || 'anonymous',
    userEmail: user?.email,
    userRole: user?.role,
    resource,
    resourceId,
    changes,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    requestId: (req as any).requestId,
  });
}

// ============= ERROR LOGGING =============

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error(error.message, {
    errorName: error.name,
    stack: error.stack,
    ...context,
  });
}

/**
 * Error logging middleware
 */
export function errorLogger(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  logError(err, {
    requestId: (req as any).requestId,
    method: req.method,
    url: req.url,
    userId: (req as any).user?.userId,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  next(err);
}

// ============= PERFORMANCE LOGGING =============

/**
 * Log a performance metric
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  logger.debug('Performance metric', {
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
}

/**
 * Create a performance timer
 */
export function createTimer(operation: string): () => void {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    logPerformance(operation, duration);
  };
}

// ============= INTEGRATION LOGGING =============

/**
 * Log external service interactions
 */
export function logIntegration(
  service: string,
  operation: string,
  success: boolean,
  duration?: number,
  metadata?: Record<string, unknown>
): void {
  const logLevel = success ? 'info' : 'error';

  logger.log(logLevel, `Integration: ${service}`, {
    type: 'integration',
    service,
    operation,
    success,
    duration: duration ? `${duration}ms` : undefined,
    ...metadata,
  });
}

// ============= SECURITY LOGGING =============

/**
 * Log security events
 */
export function logSecurity(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>
): void {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn';

  logger.log(logLevel, `Security: ${event}`, {
    type: 'security',
    event,
    severity,
    ...details,
  });
}

export default {
  logger,
  requestLogger,
  errorLogger,
  auditLog,
  createAuditLogFromRequest,
  logError,
  logPerformance,
  createTimer,
  logIntegration,
  logSecurity,
  createChildLogger,
};
