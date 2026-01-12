/**
 * Prometheus Metrics Service
 * Provides application metrics for monitoring and alerting
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.service.js';

// Create a custom registry
const register = new Registry();

// Add default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register });

// ============= HTTP METRICS =============

// HTTP request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Active HTTP requests gauge
const httpActiveRequests = new Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['method'],
  registers: [register],
});

// ============= DATABASE METRICS =============

// Database query counter
const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register],
});

// Database query duration
const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Database connection pool
const dbConnectionPool = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['state'],
  registers: [register],
});

// ============= CACHE METRICS =============

// Cache operations counter
const cacheOperationsTotal = new Counter({
  name: 'cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'result'],
  registers: [register],
});

// Cache hit rate
const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  registers: [register],
});

// ============= QUEUE METRICS =============

// Queue jobs counter
const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
  registers: [register],
});

// Queue job duration
const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job duration in seconds',
  labelNames: ['queue', 'job_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

// Queue size gauge
const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue', 'state'],
  registers: [register],
});

// ============= INTEGRATION METRICS =============

// External API calls counter
const externalApiCallsTotal = new Counter({
  name: 'external_api_calls_total',
  help: 'Total number of external API calls',
  labelNames: ['service', 'endpoint', 'status'],
  registers: [register],
});

// External API call duration
const externalApiDuration = new Histogram({
  name: 'external_api_duration_seconds',
  help: 'External API call duration in seconds',
  labelNames: ['service', 'endpoint'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [register],
});

// ============= BUSINESS METRICS =============

// Orders processed counter
const ordersProcessedTotal = new Counter({
  name: 'orders_processed_total',
  help: 'Total number of orders processed',
  labelNames: ['status', 'client'],
  registers: [register],
});

// Products synced counter
const productsSyncedTotal = new Counter({
  name: 'products_synced_total',
  help: 'Total number of products synced',
  labelNames: ['direction', 'platform', 'status'],
  registers: [register],
});

// Active clients gauge
const activeClients = new Gauge({
  name: 'active_clients_total',
  help: 'Number of active clients',
  registers: [register],
});

// WebSocket connections gauge
const websocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// ============= ERROR METRICS =============

// Error counter
const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity', 'component'],
  registers: [register],
});

// ============= MIDDLEWARE =============

/**
 * HTTP metrics middleware
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip metrics endpoint itself
  if (req.path === '/metrics' || req.path === '/api/metrics') {
    return next();
  }

  // Normalize path (remove IDs to prevent cardinality explosion)
  const normalizedPath = normalizePath(req.path);
  const method = req.method;

  // Track active requests
  httpActiveRequests.labels(method).inc();

  // Start timer
  const endTimer = httpRequestDuration.startTimer({ method, path: normalizedPath });

  // On response finish
  res.on('finish', () => {
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestsTotal.labels(method, normalizedPath, statusCode).inc();
    endTimer({ status_code: statusCode });
    httpActiveRequests.labels(method).dec();
  });

  next();
}

/**
 * Normalize URL paths to prevent high cardinality
 */
function normalizePath(path: string): string {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace long hex strings
    .replace(/\/[0-9a-f]{24,}/gi, '/:id');
}

// ============= METRIC HELPERS =============

/**
 * Record database query metric
 */
export function recordDbQuery(
  operation: string,
  table: string,
  duration: number,
  success: boolean
): void {
  dbQueriesTotal.labels(operation, table, success ? 'success' : 'error').inc();
  dbQueryDuration.labels(operation, table).observe(duration / 1000);
}

/**
 * Record cache operation
 */
export function recordCacheOperation(
  operation: 'get' | 'set' | 'delete',
  hit: boolean
): void {
  cacheOperationsTotal.labels(operation, hit ? 'hit' : 'miss').inc();
}

/**
 * Update cache hit rate
 */
let cacheHits = 0;
let cacheTotal = 0;

export function updateCacheHitRate(hit: boolean): void {
  cacheTotal++;
  if (hit) cacheHits++;

  const hitRate = cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0;
  cacheHitRate.set(hitRate);
}

/**
 * Record queue job
 */
export function recordQueueJob(
  queue: string,
  jobType: string,
  duration: number,
  success: boolean
): void {
  queueJobsTotal.labels(queue, success ? 'completed' : 'failed').inc();
  queueJobDuration.labels(queue, jobType).observe(duration / 1000);
}

/**
 * Update queue size
 */
export function updateQueueSize(queue: string, active: number, waiting: number): void {
  queueSize.labels(queue, 'active').set(active);
  queueSize.labels(queue, 'waiting').set(waiting);
}

/**
 * Record external API call
 */
export function recordExternalApiCall(
  service: string,
  endpoint: string,
  duration: number,
  statusCode: number
): void {
  const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'error';
  externalApiCallsTotal.labels(service, endpoint, status).inc();
  externalApiDuration.labels(service, endpoint).observe(duration / 1000);
}

/**
 * Record order processed
 */
export function recordOrderProcessed(status: string, clientId?: string): void {
  ordersProcessedTotal.labels(status, clientId || 'unknown').inc();
}

/**
 * Record product synced
 */
export function recordProductSync(
  direction: 'inbound' | 'outbound',
  platform: string,
  success: boolean
): void {
  productsSyncedTotal.labels(direction, platform, success ? 'success' : 'error').inc();
}

/**
 * Update active clients count
 */
export function updateActiveClients(count: number): void {
  activeClients.set(count);
}

/**
 * Update WebSocket connections
 */
export function updateWebsocketConnections(count: number): void {
  websocketConnections.set(count);
}

/**
 * Record error
 */
export function recordError(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  component: string
): void {
  errorsTotal.labels(type, severity, component).inc();
}

/**
 * Update database connection pool metrics
 */
export function updateDbPoolMetrics(active: number, idle: number, waiting: number): void {
  dbConnectionPool.labels('active').set(active);
  dbConnectionPool.labels('idle').set(idle);
  dbConnectionPool.labels('waiting').set(waiting);
}

// ============= ENDPOINTS =============

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
}

/**
 * Health check endpoint with metrics
 */
export async function healthCheckHandler(_req: Request, res: Response): Promise<void> {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
}

/**
 * Readiness check (for Kubernetes)
 */
export async function readinessHandler(_req: Request, res: Response): Promise<void> {
  // Check if critical services are ready
  const checks = {
    database: true, // Would check actual DB connection
    redis: true,    // Would check Redis connection
  };

  const allReady = Object.values(checks).every(Boolean);

  if (allReady) {
    res.json({ status: 'ready', checks });
  } else {
    res.status(503).json({ status: 'not_ready', checks });
  }
}

/**
 * Liveness check (for Kubernetes)
 */
export function livenessHandler(_req: Request, res: Response): void {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
}

// Export registry for custom metrics
export { register };

export default {
  metricsMiddleware,
  metricsHandler,
  healthCheckHandler,
  readinessHandler,
  livenessHandler,
  recordDbQuery,
  recordCacheOperation,
  updateCacheHitRate,
  recordQueueJob,
  updateQueueSize,
  recordExternalApiCall,
  recordOrderProcessed,
  recordProductSync,
  updateActiveClients,
  updateWebsocketConnections,
  recordError,
  updateDbPoolMetrics,
  register,
};
