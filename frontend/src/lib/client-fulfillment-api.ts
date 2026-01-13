/**
 * Client Fulfillment API Service
 * API functions for client portal fulfillment visibility
 */

import { api } from './api';

// ============= TYPES =============

export interface ClientFulfillmentStats {
  pendingFulfillment: number;
  inProgress: number;
  onHold: number;
  shippedToday: number;
  shippedThisWeek: number;
  delivered: number;
  avgFulfillmentTimeHours: number;
  onTimeRate: number;
  shippedTrend: number;
}

export interface ShipmentSummary {
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

export interface OrderOnHold {
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
  canClientResolve: boolean;
}

export interface FulfillmentTimelineEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  origin: string;
}

export interface CarrierPerformance {
  carrier: string;
  totalShipments: number;
  avgDeliveryDays: number;
  onTimeRate: number;
  lastUsed: string;
}

export interface InventoryAlert {
  productId: string;
  sku: string;
  productName: string;
  availableQuantity: number;
  reservedQuantity: number;
  threshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSOLD';
  daysUntilStockout: number | null;
}

export interface SLAStatus {
  metricName: string;
  target: number;
  actual: number;
  unit: string;
  status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  period: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

export interface DailySummary {
  date: string;
  shipments: number;
  items: number;
}

// ============= API FUNCTIONS =============

export const clientFulfillmentApi = {
  // Dashboard Statistics
  async getStats(): Promise<ClientFulfillmentStats> {
    const response = await api.get('/client/fulfillment/stats');
    return response.data.data;
  },

  // Order Pipeline
  async getPipeline(): Promise<PipelineStage[]> {
    const response = await api.get('/client/fulfillment/pipeline');
    return response.data.data;
  },

  // Daily Shipment Summary
  async getDailySummary(days: number = 7): Promise<DailySummary[]> {
    const response = await api.get('/client/fulfillment/daily-summary', {
      params: { days },
    });
    return response.data.data;
  },

  // Shipments with Tracking
  async getShipments(params?: {
    page?: number;
    limit?: number;
    status?: 'in_transit' | 'delivered';
  }): Promise<{
    shipments: ShipmentSummary[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await api.get('/client/fulfillment/shipments', { params });
    return response.data.data;
  },

  // Orders On Hold
  async getOrdersOnHold(): Promise<OrderOnHold[]> {
    const response = await api.get('/client/fulfillment/on-hold');
    return response.data.data;
  },

  // Order Timeline
  async getOrderTimeline(orderId: string): Promise<FulfillmentTimelineEntry[]> {
    const response = await api.get(`/client/fulfillment/orders/${orderId}/timeline`);
    return response.data.data;
  },

  // Carrier Performance
  async getCarrierPerformance(): Promise<CarrierPerformance[]> {
    const response = await api.get('/client/fulfillment/carrier-performance');
    return response.data.data;
  },

  // SLA Status
  async getSLAStatus(): Promise<SLAStatus[]> {
    const response = await api.get('/client/fulfillment/sla-status');
    return response.data.data;
  },

  // Inventory Alerts
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const response = await api.get('/client/fulfillment/inventory-alerts');
    return response.data.data;
  },
};

export default clientFulfillmentApi;
