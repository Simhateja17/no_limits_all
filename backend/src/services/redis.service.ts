/**
 * Redis Service
 * Provides caching, session management, and pub/sub functionality
 * Falls back gracefully to in-memory storage if Redis is unavailable
 */

import { Redis } from 'ioredis';
import { logger } from './logger.service.js';

// Redis client instance
let redisClient: Redis | null = null;
let isConnected = false;

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

// Cache prefixes for namespacing
export const CachePrefix = {
  SESSION: 'session:',
  USER: 'user:',
  PRODUCT: 'product:',
  ORDER: 'order:',
  RATE_LIMIT: 'ratelimit:',
  API_RESPONSE: 'api:',
  LOCK: 'lock:',
  METRICS: 'metrics:',
} as const;

// Default TTL values (in seconds)
export const CacheTTL = {
  SESSION: 24 * 60 * 60,      // 24 hours
  USER: 5 * 60,               // 5 minutes
  PRODUCT: 10 * 60,           // 10 minutes
  ORDER: 2 * 60,              // 2 minutes
  API_RESPONSE: 60,           // 1 minute
  RATE_LIMIT: 15 * 60,        // 15 minutes
  LOCK: 30,                   // 30 seconds
} as const;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - using in-memory cache fallback');
    return false;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis error:', { error: err.message });
      isConnected = false;
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis:', { error });
    return false;
  }
}

/**
 * Get Redis client (for advanced operations)
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

// ============= BASIC CACHE OPERATIONS =============

/**
 * Set a value in cache
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = CacheTTL.API_RESPONSE
): Promise<boolean> {
  const stringValue = JSON.stringify(value);

  if (isRedisConnected() && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { key, error });
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value: stringValue,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  // Periodic cleanup
  if (memoryCache.size > 10000) {
    cleanupMemoryCache();
  }

  return true;
}

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisConnected() && redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', { key, error });
    }
  }

  // Fallback to memory cache
  const entry = memoryCache.get(key);
  if (entry) {
    if (entry.expiresAt > Date.now()) {
      return JSON.parse(entry.value);
    }
    memoryCache.delete(key);
  }

  return null;
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  if (isRedisConnected() && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', { key, error });
    }
  }

  memoryCache.delete(key);
  return true;
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  let deleted = 0;

  if (isRedisConnected() && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        deleted = await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error('Redis DEL pattern error:', { pattern, error });
    }
  }

  // Also clean memory cache
  for (const key of memoryCache.keys()) {
    if (key.match(pattern.replace(/\*/g, '.*'))) {
      memoryCache.delete(key);
      deleted++;
    }
  }

  return deleted;
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (isRedisConnected() && redisClient) {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error });
    }
  }

  const entry = memoryCache.get(key);
  return entry !== undefined && entry.expiresAt > Date.now();
}

// ============= SESSION MANAGEMENT =============

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  clientId?: string;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new session
 */
export async function createSession(
  sessionId: string,
  data: Omit<SessionData, 'createdAt' | 'lastActivity'>
): Promise<boolean> {
  const session: SessionData = {
    ...data,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  return cacheSet(
    `${CachePrefix.SESSION}${sessionId}`,
    session,
    CacheTTL.SESSION
  );
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  return cacheGet<SessionData>(`${CachePrefix.SESSION}${sessionId}`);
}

/**
 * Update session activity
 */
export async function touchSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;

  session.lastActivity = Date.now();
  return cacheSet(
    `${CachePrefix.SESSION}${sessionId}`,
    session,
    CacheTTL.SESSION
  );
}

/**
 * Destroy a session
 */
export async function destroySession(sessionId: string): Promise<boolean> {
  return cacheDelete(`${CachePrefix.SESSION}${sessionId}`);
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<string[]> {
  if (isRedisConnected() && redisClient) {
    try {
      const keys = await redisClient.keys(`${CachePrefix.SESSION}*`);
      const sessions: string[] = [];

      for (const key of keys) {
        const session = await cacheGet<SessionData>(key);
        if (session?.userId === userId) {
          sessions.push(key.replace(CachePrefix.SESSION, ''));
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Redis getUserSessions error:', { userId, error });
    }
  }

  return [];
}

/**
 * Destroy all sessions for a user
 */
export async function destroyUserSessions(userId: string): Promise<number> {
  const sessions = await getUserSessions(userId);
  let destroyed = 0;

  for (const sessionId of sessions) {
    if (await destroySession(sessionId)) {
      destroyed++;
    }
  }

  return destroyed;
}

// ============= DISTRIBUTED LOCKING =============

/**
 * Acquire a distributed lock
 */
export async function acquireLock(
  lockName: string,
  ttlSeconds: number = CacheTTL.LOCK
): Promise<boolean> {
  const key = `${CachePrefix.LOCK}${lockName}`;

  if (isRedisConnected() && redisClient) {
    try {
      // SET NX (only if not exists) with expiry
      const result = await redisClient.set(key, Date.now().toString(), 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Redis acquireLock error:', { lockName, error });
    }
  }

  // Fallback - simple memory lock (not distributed!)
  if (!memoryCache.has(key) || memoryCache.get(key)!.expiresAt < Date.now()) {
    memoryCache.set(key, {
      value: Date.now().toString(),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  return false;
}

/**
 * Release a distributed lock
 */
export async function releaseLock(lockName: string): Promise<boolean> {
  return cacheDelete(`${CachePrefix.LOCK}${lockName}`);
}

// ============= PUB/SUB =============

type MessageHandler = (channel: string, message: string) => void;
const subscribers = new Map<string, Set<MessageHandler>>();
let subscriberClient: Redis | null = null;

/**
 * Initialize pub/sub subscriber
 */
async function initializeSubscriber(): Promise<void> {
  if (!isRedisConnected() || !redisClient || subscriberClient) return;

  try {
    subscriberClient = redisClient.duplicate();
    await subscriberClient.connect();

    subscriberClient.on('message', (channel: string, message: string) => {
      const handlers = subscribers.get(channel);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(channel, message);
          } catch (error) {
            logger.error('Pub/Sub handler error:', { channel, error });
          }
        });
      }
    });
  } catch (error) {
    logger.error('Failed to initialize subscriber:', { error });
  }
}

/**
 * Publish a message to a channel
 */
export async function publish(channel: string, message: unknown): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) {
    logger.warn('Redis not connected - cannot publish');
    return false;
  }

  try {
    await redisClient.publish(channel, JSON.stringify(message));
    return true;
  } catch (error) {
    logger.error('Redis publish error:', { channel, error });
    return false;
  }
}

/**
 * Subscribe to a channel
 */
export async function subscribe(channel: string, handler: MessageHandler): Promise<boolean> {
  if (!isRedisConnected()) {
    logger.warn('Redis not connected - cannot subscribe');
    return false;
  }

  await initializeSubscriber();

  if (!subscriberClient) return false;

  try {
    if (!subscribers.has(channel)) {
      subscribers.set(channel, new Set());
      await subscriberClient.subscribe(channel);
    }

    subscribers.get(channel)!.add(handler);
    return true;
  } catch (error) {
    logger.error('Redis subscribe error:', { channel, error });
    return false;
  }
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: string, handler?: MessageHandler): Promise<boolean> {
  if (!subscriberClient) return true;

  try {
    if (handler) {
      subscribers.get(channel)?.delete(handler);
      if (subscribers.get(channel)?.size === 0) {
        await subscriberClient.unsubscribe(channel);
        subscribers.delete(channel);
      }
    } else {
      await subscriberClient.unsubscribe(channel);
      subscribers.delete(channel);
    }
    return true;
  } catch (error) {
    logger.error('Redis unsubscribe error:', { channel, error });
    return false;
  }
}

// ============= CACHE UTILITIES =============

/**
 * Cache-aside pattern helper
 * Gets from cache, or fetches from source and caches result
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const value = await fetchFn();

  // Cache the result
  await cacheSet(key, value, ttlSeconds);

  return value;
}

/**
 * Invalidate cache for an entity
 */
export async function invalidateEntity(
  prefix: string,
  entityId: string
): Promise<void> {
  await cacheDelete(`${prefix}${entityId}`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  connected: boolean;
  size?: number;
  memory?: string;
  uptime?: number;
}> {
  if (isRedisConnected() && redisClient) {
    try {
      const info = await redisClient.info('memory');
      const dbSize = await redisClient.dbsize();
      const uptimeMatch = (await redisClient.info('server')).match(/uptime_in_seconds:(\d+)/);

      return {
        type: 'redis',
        connected: true,
        size: dbSize,
        memory: info.match(/used_memory_human:(.+)/)?.[1]?.trim(),
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : undefined,
      };
    } catch (error) {
      logger.error('Redis stats error:', { error });
    }
  }

  return {
    type: 'memory',
    connected: false,
    size: memoryCache.size,
  };
}

// ============= CLEANUP =============

/**
 * Graceful shutdown
 */
export async function shutdownRedis(): Promise<void> {
  if (subscriberClient) {
    await subscriberClient.quit();
    subscriberClient = null;
  }

  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }

  isConnected = false;
  logger.info('Redis connections closed');
}

export default {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  cacheExists,
  cacheAside,
  createSession,
  getSession,
  touchSession,
  destroySession,
  getUserSessions,
  destroyUserSessions,
  acquireLock,
  releaseLock,
  publish,
  subscribe,
  unsubscribe,
  getCacheStats,
  shutdownRedis,
  CachePrefix,
  CacheTTL,
};
