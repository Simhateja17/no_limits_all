/**
 * Jest Test Setup
 * Global configuration and mocks for tests
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    return: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inbound: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock Redis
jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    duplicate: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn(),
    info: jest.fn().mockResolvedValue(''),
    dbsize: jest.fn().mockResolvedValue(0),
  }));
  return { default: Redis };
});

// Mock Winston logger
jest.mock('../services/logger.service.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    log: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
  requestLogger: jest.fn((_req, _res, next) => next()),
  errorLogger: jest.fn((err, _req, _res, next) => next(err)),
  auditLog: jest.fn(),
  createAuditLogFromRequest: jest.fn(),
  logError: jest.fn(),
  logPerformance: jest.fn(),
  createTimer: jest.fn(() => jest.fn()),
  logIntegration: jest.fn(),
  logSecurity: jest.fn(),
  createChildLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    tracingHandler: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    errorHandler: jest.fn(() => (err: any, _req: any, _res: any, next: any) => next(err)),
  },
  startInactiveSpan: jest.fn(),
  flush: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(undefined),
}));

// Global test utilities
global.testUtils = {
  // Create a mock request object
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: null,
    ip: '127.0.0.1',
    get: jest.fn(),
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  }),

  // Create a mock response object
  createMockResponse: () => {
    const res: any = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      get: jest.fn(),
      on: jest.fn(),
      end: jest.fn(),
    };
    return res;
  },

  // Create a mock next function
  createMockNext: () => jest.fn(),

  // Wait for async operations
  waitFor: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Generate test data
  generateTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    password: 'hashedpassword',
    clientId: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  generateTestClient: (overrides = {}) => ({
    id: 'test-client-id',
    name: 'Test Client',
    email: 'client@example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  generateTestProduct: (overrides = {}) => ({
    id: 'test-product-id',
    clientId: 'test-client-id',
    sku: 'TEST-SKU-001',
    title: 'Test Product',
    description: 'A test product',
    price: 29.99,
    inventoryQuantity: 100,
    syncStatus: 'SYNCED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  generateTestOrder: (overrides = {}) => ({
    id: 'test-order-id',
    clientId: 'test-client-id',
    orderNumber: 'ORD-001',
    status: 'PENDING',
    totalPrice: 59.99,
    currency: 'EUR',
    customerEmail: 'customer@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

// Extend Jest matchers
declare global {
  var testUtils: {
    createMockRequest: (overrides?: any) => any;
    createMockResponse: () => any;
    createMockNext: () => jest.Mock;
    waitFor: (ms: number) => Promise<void>;
    generateTestUser: (overrides?: any) => any;
    generateTestClient: (overrides?: any) => any;
    generateTestProduct: (overrides?: any) => any;
    generateTestOrder: (overrides?: any) => any;
  };
}

// Cleanup after all tests
afterAll(async () => {
  // Allow time for any pending operations
  await new Promise((resolve) => setTimeout(resolve, 100));
});
