import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { env, prisma } from './config/index.js';
import routes, {
  initializeIntegrations,
  initializeEnhancedSync,
  startEnhancedSyncProcessors,
  stopEnhancedSyncProcessors
} from './routes/index.js';
import { initializeSocket } from './services/socket.js';
import { enforceSecurityConfig } from './config/security-validator.js';
import {
  apiLimiter,
  securityHeaders,
  sanitizeBody,
  validatePagination,
  blockSuspiciousRequests,
  getCsrfToken,
} from './middleware/security.js';

// Production services
import { logger, requestLogger, errorLogger } from './services/logger.service.js';
import { initializeRedis, shutdownRedis, getCacheStats } from './services/redis.service.js';
import { initializeSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler, sentryUserMiddleware, flushSentry } from './services/sentry.service.js';
import { metricsMiddleware, metricsHandler, healthCheckHandler, readinessHandler, livenessHandler } from './services/metrics.service.js';
import { initializeEmail } from './services/email.service.js';
import { setupSwagger } from './config/swagger.js';

// Run security configuration check on startup
enforceSecurityConfig();

const app = express();

// Initialize Sentry (must be first)
initializeSentry(app);
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// CORS configuration - Allow multiple origins
const allowedOrigins = env.frontendUrl.split(',').map(url => url.trim());
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight for 10 minutes
};
app.use(helmet());
app.use(cors(corsOptions));

// Compression middleware
app.use(compression({
  level: 6, // Balance between compression and speed
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Security middleware
app.use(securityHeaders);
app.use(apiLimiter);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Structured logging
app.use(requestLogger);

// Legacy Morgan for backward compatibility (development only)
if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input validation and sanitization
app.use(sanitizeBody);
app.use(validatePagination);
app.use(blockSuspiciousRequests);

// Sentry user context middleware (after auth)
app.use(sentryUserMiddleware);

// Setup Swagger documentation
setupSwagger(app);
logger.info('📚 API documentation available at /api/docs');

// Health check endpoints (before auth)
app.get('/api/health', healthCheckHandler);
app.get('/api/health/ready', readinessHandler);
app.get('/api/health/live', livenessHandler);
app.get('/api/metrics', metricsHandler);

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Initialize integrations with prisma client
initializeIntegrations(prisma);

// Initialize enhanced sync system (bi-directional with origin tracking)
initializeEnhancedSync(prisma);
console.log('✅ Enhanced product sync system initialized');

// Initialize background job queue
import { initializeQueue, shutdownQueue } from './services/queue/sync-queue.service.js';
let queueInitialized = false;

// Queue will be initialized after server starts
const initQueue = async () => {
  try {
    if (!env.databaseUrl) {
      console.warn('⚠️ DATABASE_URL not configured - queue will not start');
      return;
    }
    await initializeQueue(env.databaseUrl, prisma);
    queueInitialized = true;
    console.log('✅ Background job queue initialized');
  } catch (error) {
    console.error('❌ Failed to initialize queue:', error);
  }
};

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'No-Limits Platform API', 
    version: '2.0',
    features: [
      'Bi-directional product sync',
      'Origin tracking',
      'Field-level ownership',
      'Async job queue',
      'JTL-FFN integration'
    ]
  });
});

// Sentry error handler (must be before custom error handler)
app.use(sentryErrorHandler());

// Winston error logger
app.use(errorLogger);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Log full error details server-side
  logger.error('Request error', {
    message: err.message,
    statusCode: err.status || 500,
    stack: env.nodeEnv !== 'production' ? err.stack : undefined,
  });

  // Return sanitized error to client
  const statusCode = err.status || 500;
  const response: { error: string; details?: string } = {
    error: statusCode === 500
      ? 'Internal server error'  // Don't expose internal error messages
      : err.message || 'An error occurred',
  };

  // Only include details in development
  if (env.nodeEnv !== 'production' && err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);
console.log('✅ Socket.IO initialized');

// Start server
const PORT = Number(env.port);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

httpServer.listen(PORT, HOST, async () => {
  logger.info(`Server running on port ${PORT} in ${env.nodeEnv} mode`);

  if (env.nodeEnv !== 'production') {
    logger.info(`FRONTEND_URL: ${env.frontendUrl}`);
    logger.info(`DATABASE_URL configured: ${env.databaseUrl ? 'YES' : 'NO'}`);
  }

  // Initialize Redis for caching
  const redisConnected = await initializeRedis();
  if (redisConnected) {
    logger.info('Redis connected - using distributed caching');
  } else {
    logger.warn('Redis not connected - using in-memory cache');
  }

  // Initialize email service
  const emailInitialized = initializeEmail();
  if (emailInitialized) {
    logger.info('Email service initialized');
  } else {
    logger.warn('Email service not configured');
  }

  logger.info('Socket.IO ready for connections');

  // Initialize background job queue
  await initQueue();

  // Start enhanced sync background processors
  startEnhancedSyncProcessors();
  logger.info('Enhanced sync processors started');
  logger.info('   - Sync Queue Processor (batch size: 10, interval: 5s)');
  logger.info('   - JTL Polling Service (interval: 2min)');
  if (queueInitialized) {
    logger.info('   - Background Job Queue (PostgreSQL-based)');
  }

  // Log cache stats
  const cacheStats = await getCacheStats();
  logger.info(`Cache type: ${cacheStats.type}, Connected: ${cacheStats.connected}`);

  logger.info('All systems operational!');
  logger.info(`API Documentation: http://${HOST}:${PORT}/api/docs`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  // Flush Sentry events
  await flushSentry();
  logger.info('Sentry events flushed');

  // Stop background job queue
  if (queueInitialized) {
    await shutdownQueue();
    logger.info('Background queue stopped');
  }

  // Stop sync processors
  stopEnhancedSyncProcessors();
  logger.info('Sync processors stopped');

  // Close Redis connection
  await shutdownRedis();
  logger.info('Redis connection closed');

  // Close database connection
  await prisma.$disconnect();
  logger.info('Database connection closed');

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
