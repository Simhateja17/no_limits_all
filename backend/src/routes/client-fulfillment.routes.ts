/**
 * Client Fulfillment Routes
 * API endpoints for client portal fulfillment visibility
 * All data is automatically filtered by the authenticated client's ID
 */

import { Router } from 'express';
import {
  getClientFulfillmentStats,
  getClientShipments,
  getClientOrdersOnHold,
  getOrderTimeline,
  getCarrierPerformance,
  getInventoryAlerts,
  getSLAStatus,
  getOrderPipeline,
  getDailySummary,
} from '../controllers/client-fulfillment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All client fulfillment routes require authentication
router.use(authenticate);

// ============= DASHBOARD =============
// GET /api/client/fulfillment/stats - Get fulfillment statistics for client
router.get('/stats', getClientFulfillmentStats);

// GET /api/client/fulfillment/pipeline - Get order pipeline breakdown
router.get('/pipeline', getOrderPipeline);

// GET /api/client/fulfillment/daily-summary - Get daily shipment summary
router.get('/daily-summary', getDailySummary);

// ============= SHIPMENTS =============
// GET /api/client/fulfillment/shipments - Get recent shipments with tracking
router.get('/shipments', getClientShipments);

// ============= ORDERS =============
// GET /api/client/fulfillment/on-hold - Get orders currently on hold
router.get('/on-hold', getClientOrdersOnHold);

// GET /api/client/fulfillment/orders/:orderId/timeline - Get order fulfillment timeline
router.get('/orders/:orderId/timeline', getOrderTimeline);

// ============= ANALYTICS =============
// GET /api/client/fulfillment/carrier-performance - Get carrier performance metrics
router.get('/carrier-performance', getCarrierPerformance);

// GET /api/client/fulfillment/sla-status - Get SLA monitoring status
router.get('/sla-status', getSLAStatus);

// ============= INVENTORY =============
// GET /api/client/fulfillment/inventory-alerts - Get inventory alerts (low stock, etc.)
router.get('/inventory-alerts', getInventoryAlerts);

export default router;
