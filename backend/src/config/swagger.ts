/**
 * Swagger/OpenAPI Configuration
 * Provides auto-generated API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'No-Limits Platform API',
      version: '1.0.0',
      description: `
## Overview
The No-Limits Platform API provides endpoints for managing e-commerce operations including:
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: CRUD operations for products with multi-platform sync
- **Order Management**: Order processing, fulfillment, and tracking
- **Inventory Management**: Stock levels, alerts, and synchronization
- **Returns & Inbounds**: Return processing and warehouse inbound tracking
- **Integrations**: Shopify, WooCommerce, and JTL FFN connections

## Authentication
Most endpoints require authentication via JWT Bearer token.

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

Obtain tokens via the \`/api/auth/login\` endpoint.

## Rate Limiting
- Standard endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Webhook endpoints: 200 requests per 15 minutes

## Error Responses
All errors follow a consistent format:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`
      `,
      contact: {
        name: 'No-Limits Support',
        email: 'support@nolimits.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token in httpOnly cookie',
        },
      },
      schemas: {
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            accessToken: {
              type: 'string',
              description: 'JWT access token (if not using cookies)',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: {
              type: 'string',
              enum: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CLIENT'],
            },
            clientId: { type: 'string', format: 'uuid', nullable: true },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Product schemas
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            sku: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            compareAtPrice: { type: 'number', format: 'float', nullable: true },
            inventoryQuantity: { type: 'integer' },
            weight: { type: 'number', format: 'float', nullable: true },
            weightUnit: { type: 'string', enum: ['kg', 'g', 'lb', 'oz'] },
            shopifyProductId: { type: 'string', nullable: true },
            shopifyVariantId: { type: 'string', nullable: true },
            woocommerceProductId: { type: 'string', nullable: true },
            jtlProductId: { type: 'string', nullable: true },
            syncStatus: {
              type: 'string',
              enum: ['SYNCED', 'PENDING', 'ERROR', 'NOT_SYNCED'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'ON_HOLD'],
            },
            totalPrice: { type: 'number', format: 'float' },
            currency: { type: 'string', example: 'EUR' },
            customerEmail: { type: 'string', format: 'email' },
            shippingAddress: { $ref: '#/components/schemas/Address' },
            lineItems: {
              type: 'array',
              items: { $ref: '#/components/schemas/LineItem' },
            },
            trackingNumber: { type: 'string', nullable: true },
            trackingUrl: { type: 'string', format: 'uri', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Address: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            address1: { type: 'string' },
            address2: { type: 'string', nullable: true },
            city: { type: 'string' },
            province: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string' },
            phone: { type: 'string', nullable: true },
          },
        },
        LineItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            sku: { type: 'string' },
            title: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number', format: 'float' },
          },
        },
        // Error schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
          },
        },
        // Pagination
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Not authenticated',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Access denied',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: { field: 'error message' },
              },
            },
          },
        },
        RateLimitExceeded: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Users', description: 'User management' },
      { name: 'Clients', description: 'Client/tenant management' },
      { name: 'Products', description: 'Product catalog management' },
      { name: 'Orders', description: 'Order management and fulfillment' },
      { name: 'Returns', description: 'Return processing' },
      { name: 'Inbounds', description: 'Warehouse inbound management' },
      { name: 'Integrations', description: 'Platform integrations (Shopify, WooCommerce, JTL)' },
      { name: 'Sync', description: 'Data synchronization' },
      { name: 'Dashboard', description: 'Dashboard and analytics' },
      { name: 'System', description: 'System health and monitoring' },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 */
export function setupSwagger(app: Express): void {
  // Swagger JSON endpoint
  app.get('/api/docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'No-Limits API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  );
}

export { swaggerSpec };
export default setupSwagger;
