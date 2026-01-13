/**
 * Security Middleware
 * Provides rate limiting, CSRF protection, and security headers
 * Supports both in-memory and Redis backends for rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============= RATE LIMITING =============

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Rate limit store interface
interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  cleanup(): void;
  size: number;
}

// In-memory rate limit store (default)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  get size(): number {
    return this.store.size;
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (v.resetTime < now) {
        this.store.delete(k);
      }
    }
  }
}

// Redis rate limit store (optional, for production)
let redisClient: any = null;
let useRedis = false;

// Initialize Redis if REDIS_URL is set
if (process.env.REDIS_URL) {
  import('ioredis')
    .then((RedisModule) => {
      const RedisClass = (RedisModule.default || RedisModule) as unknown as new (url: string) => any;
      redisClient = new RedisClass(process.env.REDIS_URL as string);
      redisClient.on('connect', () => {
        console.log('[Security] Redis rate limiter connected');
        useRedis = true;
      });
      redisClient.on('error', (err: Error) => {
        console.error('[Security] Redis error:', err.message);
        useRedis = false;
      });
    })
    .catch(() => {
      console.log('[Security] ioredis not installed, using in-memory rate limiting');
    });
} else if (process.env.NODE_ENV === 'production') {
  console.warn('[Security] REDIS_URL not set - using in-memory rate limiting (not recommended for production)');
}

// In-memory fallback store
const memoryStore = new MemoryRateLimitStore();

interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Rate limiting middleware
 * Protects against brute force and DDoS attacks
 * Uses Redis if available, falls back to in-memory store
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60 * 1000,  // 1 minute default
    maxRequests = 100,
    keyGenerator = (req) => req.ip || 'unknown',
    message = 'Too many requests, please try again later.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ratelimit:${keyGenerator(req)}`;
    const now = Date.now();

    try {
      let count: number;
      let resetTime: number;

      if (useRedis && redisClient) {
        // Use Redis for distributed rate limiting
        const multi = redisClient.multi();
        multi.incr(key);
        multi.pttl(key);

        const results = await multi.exec();
        count = results[0][1];
        const ttl = results[1][1];

        if (ttl === -1) {
          // Key exists but has no expiry, set it
          await redisClient.pexpire(key, windowMs);
          resetTime = now + windowMs;
        } else if (ttl === -2) {
          // Key doesn't exist, this is the first request
          await redisClient.pexpire(key, windowMs);
          resetTime = now + windowMs;
        } else {
          resetTime = now + ttl;
        }
      } else {
        // Use in-memory store
        let entry = memoryStore.get(key);

        // Clean up periodically
        if (memoryStore.size > 10000) {
          memoryStore.cleanup();
        }

        if (!entry || entry.resetTime < now) {
          entry = {
            count: 1,
            resetTime: now + windowMs,
          };
          memoryStore.set(key, entry);
        } else {
          entry.count++;
        }

        count = entry.count;
        resetTime = entry.resetTime;
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toString());

      if (count > maxRequests) {
        res.setHeader('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
        res.status(429).json({ error: message });
        return;
      }

      next();
    } catch (error) {
      // On error, allow request through but log warning
      console.error('[Security] Rate limit error:', error);
      next();
    }
  };
}

// Pre-configured rate limiters
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 100,         // 100 requests per minute
  message: 'Too many API requests. Please slow down.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 10,            // 10 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 200,          // Higher limit for webhooks
  message: 'Too many webhook requests.',
});

// ============= SECURITY HEADERS =============

/**
 * Security headers middleware
 * Sets various HTTP security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust for your needs)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  next();
}

// ============= CSRF PROTECTION =============

const csrfTokenStore = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for API requests with Bearer token (API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return next();
  }

  // Skip for webhooks (they use their own signature verification)
  if (req.path.includes('/webhooks/')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionId = req.headers['x-session-id'] as string || req.ip || 'unknown';

  if (!csrfToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }

  const stored = csrfTokenStore.get(sessionId);
  if (!stored || stored.token !== csrfToken || stored.expires < Date.now()) {
    res.status(403).json({ error: 'Invalid or expired CSRF token' });
    return;
  }

  next();
}

/**
 * CSRF token endpoint handler
 */
export function getCsrfToken(req: Request, res: Response): void {
  const sessionId = req.headers['x-session-id'] as string || req.ip || 'unknown';
  const token = generateCsrfToken();

  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + 3600000, // 1 hour
  });

  // Clean up expired tokens
  if (csrfTokenStore.size > 10000) {
    const now = Date.now();
    for (const [k, v] of csrfTokenStore) {
      if (v.expires < now) {
        csrfTokenStore.delete(k);
      }
    }
  }

  res.json({ csrfToken: token });
}

// ============= INPUT SANITIZATION =============

/**
 * Basic HTML sanitization to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Request body sanitization middleware
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

// ============= REQUEST VALIDATION =============

/**
 * Validate and limit pagination parameters
 */
export function validatePagination(req: Request, _res: Response, next: NextFunction): void {
  const MAX_LIMIT = 100;
  const DEFAULT_LIMIT = 20;

  if (req.query.limit) {
    const limit = parseInt(req.query.limit as string, 10);
    req.query.limit = String(Math.min(Math.max(1, limit || DEFAULT_LIMIT), MAX_LIMIT));
  }

  if (req.query.page) {
    const page = parseInt(req.query.page as string, 10);
    req.query.page = String(Math.max(1, page || 1));
  }

  if (req.query.offset) {
    const offset = parseInt(req.query.offset as string, 10);
    req.query.offset = String(Math.max(0, offset || 0));
  }

  next();
}

// ============= IP VALIDATION =============

/**
 * Get client IP address
 */
export function getClientIp(req: Request): string {
  // Trust X-Forwarded-For only if behind a trusted proxy
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// ============= SUSPICIOUS ACTIVITY DETECTION =============

const suspiciousPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,           // SQL injection
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,     // XSS
  /javascript:/gi,                               // JavaScript protocol
  /on\w+\s*=/gi,                                 // Event handlers
  /\.\.\//g,                                     // Path traversal
  /\$\{.*\}/g,                                   // Template injection
];

/**
 * Check for suspicious input patterns
 */
export function detectSuspiciousInput(value: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(value));
}

/**
 * Middleware to block suspicious requests
 */
export function blockSuspiciousRequests(req: Request, res: Response, next: NextFunction): void {
  const checkValue = (value: unknown): boolean => {
    if (typeof value === 'string') {
      return detectSuspiciousInput(value);
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check query params, body, and params
  if (checkValue(req.query) || checkValue(req.body) || checkValue(req.params)) {
    console.warn(`[Security] Suspicious request blocked from ${getClientIp(req)}: ${req.path}`);
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  next();
}

export default {
  rateLimit,
  apiLimiter,
  authLimiter,
  webhookLimiter,
  securityHeaders,
  csrfProtection,
  getCsrfToken,
  sanitizeBody,
  validatePagination,
  blockSuspiciousRequests,
  getClientIp,
};
