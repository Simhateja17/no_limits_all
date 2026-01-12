/**
 * Fulfillment API Service
 * API functions for Shopify Fulfillment operations
 */

import { api } from './api';

// ============= TYPES =============

export type FulfillmentOrderStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'ON_HOLD'
  | 'CLOSED'
  | 'CANCELLED';

export type FulfillmentRequestStatus =
  | 'UNSUBMITTED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLATION_ACCEPTED'
  | 'CANCELLATION_REJECTED';

export type HoldReason =
  | 'AWAITING_PAYMENT'
  | 'HIGH_RISK_OF_FRAUD'
  | 'INCORRECT_ADDRESS'
  | 'INVENTORY_OUT_OF_STOCK'
  | 'OTHER';

export interface FulfillmentOrder {
  id: string;
  orderId: string;
  orderNumber: string | null;
  externalOrderId: string | null;
  shopifyFulfillmentOrderId: string | null;
  status: FulfillmentOrderStatus;
  requestStatus: FulfillmentRequestStatus;
  holdReason: HoldReason | null;
  holdNotes: string | null;
  assignedLocationId: string | null;
  assignedLocationName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  shippingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    zip: string | null;
    country: string | null;
    countryCode: string | null;
  };
  lineItems: FulfillmentLineItem[];
  trackingInfo: TrackingInfo | null;
  client: {
    id: string;
    companyName: string;
    name: string;
  };
  channel: {
    id: string;
    name: string;
    type: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  fulfillAt: string | null;
}

export interface FulfillmentLineItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  sku: string | null;
  productName: string;
  quantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number;
  requiresShipping: boolean;
}

export interface TrackingInfo {
  trackingNumber: string | null;
  trackingCompany: string | null;
  trackingUrl: string | null;
  notifyCustomer: boolean;
}

export interface FulfillmentDashboardStats {
  totalOrders: number;
  pendingFulfillment: number;
  inProgress: number;
  onHold: number;
  shipped: number;
  delivered: number;
  avgFulfillmentTime: number; // in hours
  todayShipments: number;
}

export interface FulfillmentAuditEntry {
  id: string;
  orderId: string;
  action: string;
  actionType: 'STATUS_CHANGE' | 'HOLD' | 'RELEASE' | 'TRACKING_UPDATE' | 'FULFILLMENT_CREATED' | 'REQUEST_SUBMITTED' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'CANCELLATION' | 'LOCATION_CHANGE';
  previousValue: string | null;
  newValue: string | null;
  notes: string | null;
  performedBy: string;
  performedAt: string;
}

export interface CreateFulfillmentInput {
  orderId: string;
  locationId?: string;
  lineItems?: Array<{
    id: string;
    quantity: number;
  }>;
  trackingNumber?: string;
  trackingCompany?: string;
  trackingUrl?: string;
  notifyCustomer?: boolean;
  message?: string;
}

export interface HoldFulfillmentInput {
  reason: HoldReason;
  notes?: string;
}

export interface UpdateTrackingInput {
  trackingNumber: string;
  trackingCompany?: string;
  trackingUrl?: string;
  notifyCustomer?: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    orderId: string;
    error: string;
  }>;
}

// ============= API FUNCTIONS =============

export const fulfillmentApi = {
  // Dashboard & Stats
  async getDashboardStats(): Promise<FulfillmentDashboardStats> {
    const response = await api.get('/fulfillment/dashboard/stats');
    return response.data.data;
  },

  // Fulfillment Orders
  async getFulfillmentOrders(params?: {
    status?: FulfillmentOrderStatus;
    requestStatus?: FulfillmentRequestStatus;
    clientId?: string;
    channelId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: FulfillmentOrder[]; total: number; page: number; totalPages: number }> {
    const response = await api.get('/fulfillment/orders', { params });
    return response.data.data;
  },

  async getFulfillmentOrder(orderId: string): Promise<FulfillmentOrder> {
    const response = await api.get(`/fulfillment/orders/${orderId}`);
    return response.data.data;
  },

  async getOrderFulfillmentOrders(orderId: string): Promise<FulfillmentOrder[]> {
    const response = await api.get(`/fulfillment/orders/${orderId}/fulfillment-orders`);
    return response.data.data;
  },

  // Fulfillment Operations
  async createFulfillment(input: CreateFulfillmentInput): Promise<{
    fulfillmentId: string;
    status: string;
    trackingNumber: string | null
  }> {
    const response = await api.post('/fulfillment/create', input);
    return response.data.data;
  },

  // Hold/Release Management
  async holdOrder(orderId: string, input: HoldFulfillmentInput): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/hold`, input);
    return response.data;
  },

  async releaseHold(orderId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/release`);
    return response.data;
  },

  // Location Management
  async moveToLocation(orderId: string, locationId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/move`, { locationId });
    return response.data;
  },

  // 3PL Request Handling
  async submitFulfillmentRequest(orderId: string, options?: {
    message?: string;
    notifyMerchant?: boolean
  }): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/submit-request`, options);
    return response.data;
  },

  async acceptFulfillmentRequest(orderId: string, message?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/accept-request`, { message });
    return response.data;
  },

  async rejectFulfillmentRequest(orderId: string, reason: string, message?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/reject-request`, { reason, message });
    return response.data;
  },

  // Cancellation Handling
  async requestCancellation(orderId: string, message?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/request-cancellation`, { message });
    return response.data;
  },

  async acceptCancellation(orderId: string, message?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/accept-cancellation`, { message });
    return response.data;
  },

  async rejectCancellation(orderId: string, message?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/reject-cancellation`, { message });
    return response.data;
  },

  // Tracking Management
  async updateTracking(orderId: string, fulfillmentId: string, input: UpdateTrackingInput): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/fulfillment/orders/${orderId}/tracking/${fulfillmentId}`, input);
    return response.data;
  },

  async addTracking(orderId: string, input: UpdateTrackingInput): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/tracking`, input);
    return response.data;
  },

  // Audit Trail
  async getAuditTrail(orderId: string): Promise<FulfillmentAuditEntry[]> {
    const response = await api.get(`/fulfillment/orders/${orderId}/audit`);
    return response.data.data;
  },

  // Bulk Operations
  async bulkFulfill(orderIds: string[], options?: {
    notifyCustomer?: boolean;
  }): Promise<BulkOperationResult> {
    const response = await api.post('/fulfillment/bulk/fulfill', { orderIds, ...options });
    return response.data.data;
  },

  async bulkHold(orderIds: string[], input: HoldFulfillmentInput): Promise<BulkOperationResult> {
    const response = await api.post('/fulfillment/bulk/hold', { orderIds, ...input });
    return response.data.data;
  },

  async bulkRelease(orderIds: string[]): Promise<BulkOperationResult> {
    const response = await api.post('/fulfillment/bulk/release', { orderIds });
    return response.data.data;
  },

  async bulkUpdateTracking(updates: Array<{
    orderId: string;
    trackingNumber: string;
    trackingCompany?: string;
  }>): Promise<BulkOperationResult> {
    const response = await api.post('/fulfillment/bulk/tracking', { updates });
    return response.data.data;
  },

  // Warehouse Locations
  async getLocations(): Promise<Array<{ id: string; name: string; address: string; isDefault: boolean }>> {
    const response = await api.get('/fulfillment/locations');
    return response.data.data;
  },

  // Shipping Carriers
  async getCarriers(): Promise<Array<{ id: string; name: string; trackingUrlTemplate: string }>> {
    const response = await api.get('/fulfillment/carriers');
    return response.data.data;
  },

  // ============= JTL FFN INTEGRATION =============

  // JTL Connection Status
  async getJTLStatus(clientId?: string): Promise<{ connected: boolean; message: string }> {
    const response = await api.get('/fulfillment/jtl/status', { params: { clientId } });
    return response.data.data;
  },

  // JTL Shipping Methods
  async getJTLShippingMethods(clientId?: string): Promise<Array<{
    shippingMethodId: string;
    fulfillerId: string;
    name: string;
    carrierCode?: string;
    carrierName?: string;
    shippingType: string;
    trackingUrlSchema?: string;
    cutoffTime?: string;
  }>> {
    const response = await api.get('/fulfillment/shipping-methods', { params: { clientId } });
    return response.data.data;
  },

  // JTL Warehouses
  async getJTLWarehouses(clientId?: string): Promise<Array<{
    warehouseId: string;
    name: string;
    fulfillerId: string;
  }>> {
    const response = await api.get('/fulfillment/warehouses', { params: { clientId } });
    return response.data.data;
  },

  // Sync order to JTL FFN
  async syncOrderToJTL(orderId: string): Promise<{ success: boolean; outboundId?: string; error?: string }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/sync-to-jtl`);
    return response.data;
  },

  // Create fulfillment with optional JTL sync
  async createFulfillmentWithJTL(orderId: string, input: {
    trackingNumber?: string;
    carrier?: string;
    notifyCustomer?: boolean;
    syncToJTL?: boolean;
  }): Promise<{
    success: boolean;
    fulfillmentState: string;
    trackingNumber: string | null;
    jtlOutboundId?: string;
  }> {
    const response = await api.post(`/fulfillment/orders/${orderId}/fulfill`, input);
    return response.data.data;
  },
};

export default fulfillmentApi;
