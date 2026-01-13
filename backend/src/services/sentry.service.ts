/**
 * Sentry Error Tracking Service
 * Provides error tracking, performance monitoring, and alerting
 */

import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction, Express, ErrorRequestHandler } from 'express';
import { logger } from './logger.service.js';

// Track if Sentry is initialized
let isInitialized = false;
let expressApp: Express | null = null;

/**
 * Initialize Sentry
 */
export function initializeSentry(app: Express): boolean {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('SENTRY_DSN not configured - error tracking disabled');
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || '1.0.0',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session tracking
      autoSessionTracking: true,

      // Integrations
      integrations: [
        // HTTP integration for tracing requests
        Sentry.httpIntegration(),
        // Express integration (no arguments in v8)
        Sentry.expressIntegration(),
      ],

      // Before send hook to filter sensitive data
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Filter request body for sensitive fields
        if (event.request?.data) {
          const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          for (const field of sensitiveFields) {
            if (data[field]) {
              data[field] = '[REDACTED]';
            }
          }

          event.request.data = JSON.stringify(data);
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Ignore client-side errors
        'Network Error',
        'Request aborted',
        // Ignore expected errors
        'TokenExpiredError',
        'Not authenticated',
        'Invalid credentials',
      ],
    });

    expressApp = app;
    isInitialized = true;
    logger.info('Sentry initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
    return false;
  }
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return isInitialized;
}

/**
 * Sentry request handler middleware
 * In Sentry v8, request handling is automatic through integrations
 * This returns a no-op middleware for backward compatibility
 */
export function sentryRequestHandler(): (req: Request, res: Response, next: NextFunction) => void {
  // In Sentry v8, this is handled automatically by expressIntegration()
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Sentry tracing middleware
 * In Sentry v8, tracing is automatic through integrations
 * This returns a no-op middleware for backward compatibility
 */
export function sentryTracingHandler(): (req: Request, res: Response, next: NextFunction) => void {
  // In Sentry v8, this is handled automatically by expressIntegration()
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Sentry error handler middleware
 * Must be before any other error handlers
 */
export function sentryErrorHandler(): ErrorRequestHandler {
  if (!isInitialized || !expressApp) {
    return ((_err: Error, _req: Request, _res: Response, next: NextFunction) => next(_err)) as ErrorRequestHandler;
  }

  // In Sentry v8, use setupExpressErrorHandler
  // Return a middleware that captures errors
  return ((err: Error, req: Request, res: Response, next: NextFunction) => {
    // Report all 4xx and 5xx errors
    const status = (err as any).status || (err as any).statusCode || 500;
    if (status >= 400) {
      Sentry.captureException(err);
    }
    next(err);
  }) as ErrorRequestHandler;
}

/**
 * Capture an exception
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string | undefined {
  if (!isInitialized) {
    logger.error('Sentry not initialized - exception not captured', { error: error.message });
    return undefined;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string | undefined {
  if (!isInitialized) {
    logger.info('Sentry not initialized - message not captured', { message });
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  role?: string;
} | null): void {
  if (!isInitialized) return;

  Sentry.setUser(user);
}

/**
 * Set additional context
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (!isInitialized) return;

  Sentry.setContext(name, context);
}

/**
 * Set a tag
 */
export function setTag(key: string, value: string): void {
  if (!isInitialized) return;

  Sentry.setTag(key, value);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  if (!isInitialized) return undefined;

  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Middleware to set user context from authenticated request
 */
export function sentryUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = (req as any).user;

  if (user) {
    setUser({
      id: user.userId,
      email: user.email,
      role: user.role,
    });
  }

  next();
}

/**
 * Wrap an async function with error capturing
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Flush pending events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!isInitialized) return true;

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    logger.error('Error flushing Sentry', { error });
    return false;
  }
}

/**
 * Close Sentry client
 */
export async function closeSentry(): Promise<void> {
  if (!isInitialized) return;

  try {
    await Sentry.close(2000);
    isInitialized = false;
    logger.info('Sentry closed');
  } catch (error) {
    logger.error('Error closing Sentry', { error });
  }
}

export default {
  initializeSentry,
  isSentryInitialized,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  sentryUserMiddleware,
  captureException,
  captureMessage,
  setUser,
  setContext,
  setTag,
  addBreadcrumb,
  startTransaction,
  withSentry,
  flushSentry,
  closeSentry,
};
