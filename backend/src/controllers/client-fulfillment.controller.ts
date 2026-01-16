/**
 * Client Fulfillment Controller
 * Provides fulfillment data specifically for client portal users
 * All data is automatically filtered by the client's ID
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

// Types
interface ClientFulfillmentStats {
  // Pipeline counts
  pendingFulfillment: number;
  inProgress: number;
  onHold: number;
  shippedToday: number;
  shippedThisWeek: number;
  delivered: number;

  // Performance metrics
  avgFulfillmentTimeHours: number;
  onTimeRate: number; // percentage

  // Trends
  shippedTrend: number; // percentage change from last week
}

interface ShipmentSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  shippedAt: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  status: string;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  itemCount: number;
}

interface OrderOnHold {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  holdReason: string;
  holdNotes: string | null;
  holdPlacedAt: string;
  orderDate: string;
  total: number;
  currency: string;
  itemCount: number;
  canClientResolve: boolean; // e.g., address issues
}

interface FulfillmentTimelineEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  origin: string;
}

interface CarrierPerformance {
  carrier: string;
  totalShipments: number;
  avgDeliveryDays: number;
  onTimeRate: number;
  lastUsed: string;
}

interface InventoryAlert {
  productId: string;
  sku: string;
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
  threshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSOLD';
  daysUntilStockout: number | null;
}

interface SLAStatus {
  metricName: string;
  target: number;
  actual: number;
  unit: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  period: string;
}

// Helper to get client ID from authenticated user
function getClientId(req: Request): string | null {
  const user = (req as any).user;
  if (!user) return null;

  // Client users have their clientId directly
  if (user.role === 'CLIENT') {
    return user.clientId;
  }

  // Admin/Employee can view specific client via query param
  if (['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].includes(user.role)) {
    return req.query.clientId as string || null;
  }

  return null;
}

// Helper to generate tracking URL based on carrier
function generateTrackingUrl(carrier: string, trackingNumber: string): string | null {
  if (!trackingNumber) return null;

  const carrierUrls: Record<string, string> = {
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FEDEX': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'DPD': `https://tracking.dpd.de/parcelstatus?query=${trackingNumber}`,
    'HERMES': `https://www.myhermes.de/empfangen/sendungsverfolgung/?suche=${trackingNumber}`,
    'GLS': `https://gls-group.eu/DE/de/paketverfolgung?match=${trackingNumber}`,
  };

  const upperCarrier = carrier?.toUpperCase() || '';
  return carrierUrls[upperCarrier] || null;
}

/**
 * GET /api/client/fulfillment/stats
 * Get fulfillment statistics for the client's orders
 */
export const getClientFulfillmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Run all queries in parallel
    const [
      pendingFulfillment,
      inProgress,
      onHold,
      shippedToday,
      shippedThisWeek,
      shippedLastWeek,
      delivered,
      fulfillmentTimes,
      totalOrders,
      onTimeOrders,
    ] = await Promise.all([
      // Pending fulfillment
      prisma.order.count({
        where: {
          clientId,
          isCancelled: false,
          fulfillmentState: { in: ['PENDING', 'AWAITING_STOCK'] },
          isOnHold: false,
        },
      }),
      // In progress
      prisma.order.count({
        where: {
          clientId,
          isCancelled: false,
          fulfillmentState: { in: ['READY_FOR_PICKING', 'PICKING', 'PICKED', 'PACKING', 'PACKED'] },
        },
      }),
      // On hold
      prisma.order.count({
        where: {
          clientId,
          isOnHold: true,
          isCancelled: false,
        },
      }),
      // Shipped today
      prisma.order.count({
        where: {
          clientId,
          shippedAt: { gte: todayStart },
        },
      }),
      // Shipped this week
      prisma.order.count({
        where: {
          clientId,
          shippedAt: { gte: weekStart },
        },
      }),
      // Shipped last week (for trend)
      prisma.order.count({
        where: {
          clientId,
          shippedAt: { gte: lastWeekStart, lt: weekStart },
        },
      }),
      // Delivered
      prisma.order.count({
        where: {
          clientId,
          fulfillmentState: 'DELIVERED',
        },
      }),
      // Fulfillment times (last 30 days)
      prisma.order.findMany({
        where: {
          clientId,
          shippedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          NOT: { orderDate: undefined },
        },
        select: { orderDate: true, shippedAt: true },
      }),
      // Total orders for SLA (last 30 days)
      prisma.order.count({
        where: {
          clientId,
          orderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isCancelled: false,
        },
      }),
      // On-time orders (shipped within 24-48h of order)
      prisma.order.count({
        where: {
          clientId,
          orderDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          isCancelled: false,
          shippedAt: { not: null },
          // This is a simplification - in production you'd use raw SQL for date diff
        },
      }),
    ]);

    // Calculate average fulfillment time
    let avgFulfillmentTimeHours = 0;
    if (fulfillmentTimes.length > 0) {
      const totalHours = fulfillmentTimes.reduce((acc, order) => {
        if (order.orderDate && order.shippedAt) {
          const diff = order.shippedAt.getTime() - order.orderDate.getTime();
          return acc + (diff / (1000 * 60 * 60));
        }
        return acc;
      }, 0);
      avgFulfillmentTimeHours = Math.round((totalHours / fulfillmentTimes.length) * 10) / 10;
    }

    // Calculate on-time rate
    const onTimeRate = totalOrders > 0 ? Math.round((onTimeOrders / totalOrders) * 100) : 100;

    // Calculate shipped trend
    const shippedTrend = shippedLastWeek > 0
      ? Math.round(((shippedThisWeek - shippedLastWeek) / shippedLastWeek) * 100)
      : 0;

    const stats: ClientFulfillmentStats = {
      pendingFulfillment,
      inProgress,
      onHold,
      shippedToday,
      shippedThisWeek,
      delivered,
      avgFulfillmentTimeHours,
      onTimeRate,
      shippedTrend,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fulfillment statistics' });
  }
};

/**
 * GET /api/client/fulfillment/shipments
 * Get recent shipments with tracking info
 */
export const getClientShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const { page = '1', limit = '20', status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      clientId,
      shippedAt: { not: null },
    };

    if (status === 'in_transit') {
      where.fulfillmentState = 'SHIPPED';
      where.deliveredAt = null;
    } else if (status === 'delivered') {
      where.fulfillmentState = 'DELIVERED';
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { select: { quantity: true } },
        },
        orderBy: { shippedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    const shipments: ShipmentSummary[] = orders.map(order => ({
      id: order.id,
      orderId: order.orderId,
      orderNumber: order.orderNumber || order.orderId,
      customerName: order.customerName || 'N/A',
      shippedAt: order.shippedAt?.toISOString() || '',
      carrier: order.carrierSelection || 'Unknown',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || generateTrackingUrl(order.carrierSelection || '', order.trackingNumber || ''),
      status: order.fulfillmentState || 'SHIPPED',
      deliveredAt: order.deliveredAt?.toISOString() || null,
      estimatedDelivery: null, // Would need carrier API integration
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    res.json({
      success: true,
      data: {
        shipments,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching shipments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shipments' });
  }
};

/**
 * GET /api/client/fulfillment/on-hold
 * Get orders currently on hold
 */
export const getClientOrdersOnHold = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        clientId,
        isOnHold: true,
        isCancelled: false,
      },
      include: {
        items: { select: { quantity: true } },
      },
      orderBy: { holdPlacedAt: 'desc' },
    });

    // Reasons that clients can potentially resolve
    const clientResolvableReasons = ['INCORRECT_ADDRESS', 'AWAITING_PAYMENT'];

    const ordersOnHold: OrderOnHold[] = orders.map(order => ({
      id: order.id,
      orderId: order.orderId,
      orderNumber: order.orderNumber || order.orderId,
      customerName: order.customerName || 'N/A',
      customerEmail: order.customerEmail || '',
      holdReason: order.holdReason || 'OTHER',
      holdNotes: order.holdNotes,
      holdPlacedAt: order.holdPlacedAt?.toISOString() || new Date().toISOString(),
      orderDate: order.orderDate?.toISOString() || '',
      total: order.total?.toNumber() || 0,
      currency: order.currency || 'EUR',
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      canClientResolve: clientResolvableReasons.includes(order.holdReason || ''),
    }));

    res.json({ success: true, data: ordersOnHold });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching on-hold orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch on-hold orders' });
  }
};

/**
 * GET /api/client/fulfillment/orders/:orderId/timeline
 * Get fulfillment timeline for a specific order
 */
export const getOrderTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);
    const { orderId } = req.params;

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    // Verify order belongs to client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId },
      select: {
        id: true,
        orderId: true,
        orderDate: true,
        fulfillmentState: true,
        shippedAt: true,
        deliveredAt: true,
        isOnHold: true,
        holdPlacedAt: true,
        holdReleasedAt: true,
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Get sync logs for this order
    const syncLogs = await prisma.orderSyncLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Build timeline from order data and sync logs
    const timeline: FulfillmentTimelineEntry[] = [];

    // Add order creation
    if (order.orderDate) {
      timeline.push({
        id: `created-${order.id}`,
        action: 'ORDER_CREATED',
        description: 'Order received',
        timestamp: order.orderDate.toISOString(),
        origin: 'SHOPIFY',
      });
    }

    // Add sync log entries
    syncLogs.forEach(log => {
      let description = '';
      switch (log.action) {
        case 'create':
          description = `Order synced from ${log.origin}`;
          break;
        case 'update':
          description = `Order updated: ${log.changedFields?.join(', ') || 'details changed'}`;
          break;
        case 'hold':
          description = 'Order placed on hold';
          break;
        case 'release_hold':
          description = 'Order released from hold';
          break;
        case 'fulfill':
          description = 'Fulfillment created';
          break;
        case 'update_tracking':
          description = 'Tracking information updated';
          break;
        default:
          description = log.action;
      }

      timeline.push({
        id: log.id,
        action: log.action.toUpperCase(),
        description,
        timestamp: log.createdAt.toISOString(),
        origin: log.origin || 'SYSTEM',
      });
    });

    // Add shipped event if applicable
    if (order.shippedAt) {
      timeline.push({
        id: `shipped-${order.id}`,
        action: 'SHIPPED',
        description: 'Order shipped',
        timestamp: order.shippedAt.toISOString(),
        origin: 'WAREHOUSE',
      });
    }

    // Add delivered event if applicable
    if (order.deliveredAt) {
      timeline.push({
        id: `delivered-${order.id}`,
        action: 'DELIVERED',
        description: 'Order delivered',
        timestamp: order.deliveredAt.toISOString(),
        origin: 'CARRIER',
      });
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching order timeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order timeline' });
  }
};

/**
 * GET /api/client/fulfillment/carrier-performance
 * Get carrier performance metrics
 */
export const getCarrierPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    // Get shipments grouped by carrier from last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        clientId,
        shippedAt: { gte: ninetyDaysAgo },
        carrierSelection: { not: null },
      },
      select: {
        carrierSelection: true,
        shippedAt: true,
        deliveredAt: true,
      },
    });

    // Group by carrier and calculate metrics
    const carrierMap = new Map<string, {
      shipments: number;
      deliveryTimes: number[];
      lastUsed: Date;
    }>();

    orders.forEach(order => {
      const carrier = order.carrierSelection || 'Unknown';
      const existing = carrierMap.get(carrier) || {
        shipments: 0,
        deliveryTimes: [],
        lastUsed: new Date(0),
      };

      existing.shipments++;

      if (order.shippedAt && order.deliveredAt) {
        const days = (order.deliveredAt.getTime() - order.shippedAt.getTime()) / (1000 * 60 * 60 * 24);
        existing.deliveryTimes.push(days);
      }

      if (order.shippedAt && order.shippedAt > existing.lastUsed) {
        existing.lastUsed = order.shippedAt;
      }

      carrierMap.set(carrier, existing);
    });

    // Convert to response format
    const performance: CarrierPerformance[] = Array.from(carrierMap.entries()).map(([carrier, data]) => {
      const avgDeliveryDays = data.deliveryTimes.length > 0
        ? Math.round((data.deliveryTimes.reduce((a, b) => a + b, 0) / data.deliveryTimes.length) * 10) / 10
        : 0;

      // Consider on-time if delivered within 5 days
      const onTimeCount = data.deliveryTimes.filter(d => d <= 5).length;
      const onTimeRate = data.deliveryTimes.length > 0
        ? Math.round((onTimeCount / data.deliveryTimes.length) * 100)
        : 100;

      return {
        carrier,
        totalShipments: data.shipments,
        avgDeliveryDays,
        onTimeRate,
        lastUsed: data.lastUsed.toISOString(),
      };
    });

    // Sort by total shipments
    performance.sort((a, b) => b.totalShipments - a.totalShipments);

    res.json({ success: true, data: performance });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching carrier performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch carrier performance' });
  }
};

/**
 * GET /api/client/fulfillment/inventory-alerts
 * Get inventory alerts (low stock, out of stock)
 */
export const getInventoryAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const LOW_STOCK_THRESHOLD = 10; // Default threshold

    // Get products with low or no stock
    const products = await prisma.product.findMany({
      where: {
        clientId,
        isActive: true,
        OR: [
          { available: { lte: LOW_STOCK_THRESHOLD } },
          { available: { lt: 0 } }, // Oversold
        ],
      },
      select: {
        id: true,
        sku: true,
        name: true,
        available: true,
        reserved: true,
      },
      orderBy: { available: 'asc' },
    });

    // Calculate daily sales rate for stockout prediction
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const alerts: InventoryAlert[] = await Promise.all(
      products.map(async (product) => {
        // Get sales in last 30 days for this product
        const salesData = await prisma.orderItem.aggregate({
          where: {
            productId: product.id,
            order: {
              clientId,
              orderDate: { gte: thirtyDaysAgo },
              isCancelled: false,
            },
          },
          _sum: { quantity: true },
        });

        const totalSold = salesData._sum.quantity || 0;
        const dailySalesRate = totalSold / 30;

        let daysUntilStockout: number | null = null;
        if (dailySalesRate > 0 && product.available > 0) {
          daysUntilStockout = Math.floor(product.available / dailySalesRate);
        }

        let alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSOLD';
        if (product.available < 0) {
          alertType = 'OVERSOLD';
        } else if (product.available === 0) {
          alertType = 'OUT_OF_STOCK';
        } else {
          alertType = 'LOW_STOCK';
        }

        return {
          productId: product.id,
          sku: product.sku,
          productName: product.name || 'Unknown Product',
          availableQuantity: product.available,
          reservedQuantity: product.reserved || 0,
          threshold: LOW_STOCK_THRESHOLD,
          alertType,
          daysUntilStockout,
        };
      })
    );

    // Sort: oversold first, then out of stock, then low stock
    const priorityOrder = { OVERSOLD: 0, OUT_OF_STOCK: 1, LOW_STOCK: 2 };
    alerts.sort((a, b) => priorityOrder[a.alertType] - priorityOrder[b.alertType]);

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching inventory alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory alerts' });
  }
};

/**
 * GET /api/client/fulfillment/sla-status
 * Get SLA monitoring status
 */
export const getSLAStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get orders for SLA calculation
    const orders = await prisma.order.findMany({
      where: {
        clientId,
        orderDate: { gte: thirtyDaysAgo },
        isCancelled: false,
      },
      select: {
        orderDate: true,
        shippedAt: true,
        deliveredAt: true,
        isOnHold: true,
        holdPlacedAt: true,
      },
    });

    // Define SLA targets (these could be configurable per client)
    const SLA_TARGETS = {
      fulfillmentTime: 24, // hours
      shippingTime: 48, // hours
      onTimeRate: 95, // percentage
    };

    // Calculate actual metrics
    let totalFulfillmentTime = 0;
    let fulfillmentCount = 0;
    let onTimeCount = 0;
    let shippedCount = 0;

    orders.forEach(order => {
      if (order.orderDate && order.shippedAt) {
        const fulfillmentHours = (order.shippedAt.getTime() - order.orderDate.getTime()) / (1000 * 60 * 60);
        totalFulfillmentTime += fulfillmentHours;
        fulfillmentCount++;

        // Consider on-time if shipped within 48 hours
        if (fulfillmentHours <= SLA_TARGETS.shippingTime) {
          onTimeCount++;
        }
        shippedCount++;
      }
    });

    const avgFulfillmentTime = fulfillmentCount > 0
      ? Math.round((totalFulfillmentTime / fulfillmentCount) * 10) / 10
      : 0;

    const actualOnTimeRate = shippedCount > 0
      ? Math.round((onTimeCount / shippedCount) * 100)
      : 100;

    // Build SLA status array
    const slaStatus: SLAStatus[] = [
      {
        metricName: 'Average Fulfillment Time',
        target: SLA_TARGETS.fulfillmentTime,
        actual: avgFulfillmentTime,
        unit: 'hours',
        status: avgFulfillmentTime <= SLA_TARGETS.fulfillmentTime
          ? 'ON_TRACK'
          : avgFulfillmentTime <= SLA_TARGETS.fulfillmentTime * 1.5
            ? 'AT_RISK'
            : 'BREACHED',
        period: 'Last 30 days',
      },
      {
        metricName: 'On-Time Shipping Rate',
        target: SLA_TARGETS.onTimeRate,
        actual: actualOnTimeRate,
        unit: '%',
        status: actualOnTimeRate >= SLA_TARGETS.onTimeRate
          ? 'ON_TRACK'
          : actualOnTimeRate >= SLA_TARGETS.onTimeRate - 5
            ? 'AT_RISK'
            : 'BREACHED',
        period: 'Last 30 days',
      },
      {
        metricName: 'Orders Processed',
        target: 0, // No target, just informational
        actual: orders.length,
        unit: 'orders',
        status: 'ON_TRACK',
        period: 'Last 30 days',
      },
      {
        metricName: 'Orders Shipped',
        target: 0,
        actual: shippedCount,
        unit: 'orders',
        status: 'ON_TRACK',
        period: 'Last 30 days',
      },
    ];

    res.json({ success: true, data: slaStatus });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching SLA status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch SLA status' });
  }
};

/**
 * GET /api/client/fulfillment/pipeline
 * Get order pipeline breakdown
 */
export const getOrderPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    // Get counts for each pipeline stage
    const [
      pending,
      awaitingStock,
      readyForPicking,
      picking,
      packing,
      shipped,
      delivered,
      onHold,
    ] = await Promise.all([
      prisma.order.count({ where: { clientId, fulfillmentState: 'PENDING', isOnHold: false, isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'AWAITING_STOCK', isOnHold: false, isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'READY_FOR_PICKING', isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'PICKING', isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'PACKING', isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'SHIPPED', isCancelled: false } }),
      prisma.order.count({ where: { clientId, fulfillmentState: 'DELIVERED', isCancelled: false } }),
      prisma.order.count({ where: { clientId, isOnHold: true, isCancelled: false } }),
    ]);

    const pipeline = [
      { stage: 'Pending', count: pending, color: '#3B82F6' },
      { stage: 'Awaiting Stock', count: awaitingStock, color: '#F59E0B' },
      { stage: 'Ready', count: readyForPicking, color: '#8B5CF6' },
      { stage: 'Picking', count: picking, color: '#EC4899' },
      { stage: 'Packing', count: packing, color: '#06B6D4' },
      { stage: 'Shipped', count: shipped, color: '#10B981' },
      { stage: 'Delivered', count: delivered, color: '#059669' },
      { stage: 'On Hold', count: onHold, color: '#EF4444' },
    ];

    res.json({ success: true, data: pipeline });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching pipeline:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order pipeline' });
  }
};

/**
 * GET /api/client/fulfillment/daily-summary
 * Get daily shipment summary
 */
export const getDailySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = getClientId(req);

    if (!clientId) {
      res.status(400).json({ success: false, error: 'Client ID required' });
      return;
    }

    const { days = '7' } = req.query;
    const numDays = Math.min(parseInt(days as string, 10), 30);

    // Get shipments per day
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        clientId,
        shippedAt: { gte: startDate },
      },
      select: {
        shippedAt: true,
        items: { select: { quantity: true } },
      },
    });

    // Group by date
    const dailyData: Record<string, { shipments: number; items: number }> = {};

    // Initialize all days
    for (let i = 0; i < numDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { shipments: 0, items: 0 };
    }

    // Fill in actual data
    orders.forEach(order => {
      if (order.shippedAt) {
        const dateKey = order.shippedAt.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].shipments++;
          dailyData[dateKey].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
        }
      }
    });

    // Convert to array and sort
    const summary = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        shipments: data.shipments,
        items: data.items,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[ClientFulfillment] Error fetching daily summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily summary' });
  }
};

export default {
  getClientFulfillmentStats,
  getClientShipments,
  getClientOrdersOnHold,
  getOrderTimeline,
  getCarrierPerformance,
  getInventoryAlerts,
  getSLAStatus,
  getOrderPipeline,
  getDailySummary,
};
