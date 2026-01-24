/**
 * Data API Client
 * API functions for fetching products, orders, returns, and inbounds
 */

import { api } from './api';

export interface Product {
  id: string;
  productId: string;
  name: string;
  sku: string;
  gtin: string | null;
  available: number;
  reserved: number;
  announced: number;
  weightInKg: number | null;
  imageUrl: string | null;
  client: {
    companyName: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderId: string;
  orderNumber: string | null;
  externalOrderId: string | null;
  orderDate: string;
  status: string;
  totalAmount: number | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  totalWeight: number | null;
  tags: string[];

  // Customer information
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;

  // Shipping address
  shippingFirstName: string | null;
  shippingLastName: string | null;
  shippingCompany: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingCity: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  shippingCountryCode: string | null;

  client: {
    companyName: string;
    name: string;
  };
  channel: {
    name: string;
    type: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    productName: string | null;
    sku: string | null;
    product: {
      name: string;
      sku: string;
      gtin: string | null;
    } | null;
  }>;
}

export interface Return {
  id: string;
  returnId: string;
  externalReturnId: string | null;
  status: string;
  reason: string | null;
  refundAmount: number | null;
  client: {
    companyName: string;
    name: string;
  };
  order: {
    orderId: string;
    orderNumber: string | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    condition: string | null;
    product: {
      name: string;
      sku: string;
    };
  }>;
  createdAt: string;
}

export interface Inbound {
  id: string;
  inboundId: string;
  externalInboundId: string | null;
  status: string;
  deliveryType: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  client: {
    companyName: string;
    name: string;
  };
  items: Array<{
    id: string;
    expectedQuantity: number;
    receivedQuantity: number | null;
    product: {
      name: string;
      sku: string;
    };
  }>;
  createdAt: string;
}

export interface CreateOrderInput {
  orderId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    sku?: string;
    productName?: string;
  }>;
  shippingMethod?: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingCompany?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingCountryCode?: string;
  notes?: string;
  tags?: string[];
  isOnHold?: boolean;
}

export interface CreateProductInput {
  name: string;
  manufacturer?: string;
  sku: string;
  gtin?: string;
  han?: string;
  heightInCm?: string;
  lengthInCm?: string;
  widthInCm?: string;
  weightInKg?: string;
  amazonAsin?: string;
  amazonSku?: string;
  isbn?: string;
  mhd?: string;
  charge?: string;
  zolltarifnummer?: string;
  ursprung?: string;
  nettoVerkaufspreis?: string;
  imageUrl?: string;
}

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'INTERNAL_WAREHOUSE' | 'CLIENT_COMMUNICATION' | 'ORDER_PROCESSING' | 'RETURNS' | 'INVENTORY_CHECK' | 'OTHER';
  dueDate: string | null;
  completedAt: string | null;
  clientId: string | null;
  client: {
    id: string;
    companyName: string;
    name: string;
  } | null;
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type?: 'INTERNAL_WAREHOUSE' | 'CLIENT_COMMUNICATION' | 'ORDER_PROCESSING' | 'RETURNS' | 'INVENTORY_CHECK' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
  dueDate?: string;
  assigneeId?: string;
  clientId?: string;
  notifyCustomer?: boolean;
}

// Update input types
export interface UpdateOrderInput {
  warehouseNotes?: string;
  carrierSelection?: string;
  carrierServiceLevel?: string;
  priorityLevel?: number;
  pickingInstructions?: string;
  packingInstructions?: string;
  isOnHold?: boolean;
  tags?: string[];
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingCompany?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingCountryCode?: string;
  jtlShippingMethodId?: string;
  items?: Array<{
    id?: string;
    productId?: string;
    sku?: string;
    productName?: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

export interface UpdateProductInput {
  name?: string;
  manufacturer?: string;
  sku?: string;
  gtin?: string;
  han?: string;
  heightInCm?: string;
  lengthInCm?: string;
  widthInCm?: string;
  weightInKg?: string;
  amazonAsin?: string;
  amazonSku?: string;
  isbn?: string;
  customsCode?: string;
  countryOfOrigin?: string;
  netSalesPrice?: string;
  warehouseNotes?: string;
  storageLocation?: string;
  minStockLevel?: number;
  reorderPoint?: number;
  imageUrl?: string;
}

export interface UpdateReturnInput {
  inspectionResult?: 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
  notes?: string;
  warehouseNotes?: string;
  restockEligible?: boolean;
  restockQuantity?: number;
  restockReason?: string;
  hasDamage?: boolean;
  damageDescription?: string;
  hasDefect?: boolean;
  defectDescription?: string;
  status?: string;
  items?: Array<{
    returnItemId: string;
    condition?: 'GOOD' | 'ACCEPTABLE' | 'DAMAGED' | 'DEFECTIVE';
    disposition?: 'DISPOSED' | 'BOOKED_IN_AGAIN' | 'PENDING_DECISION';
    restockableQuantity?: number;
    damagedQuantity?: number;
    defectiveQuantity?: number;
    notes?: string;
  }>;
}

export interface CreateReturnInput {
  orderId?: string;
  reason?: string;
  reasonCategory?: string;
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  warehouseNotes?: string;
  items: Array<{
    sku?: string;
    productName?: string;
    quantity: number;
    condition: 'GOOD' | 'ACCEPTABLE' | 'DAMAGED' | 'DEFECTIVE';
  }>;
}

export interface UpdateResponse<T> {
  data: T;
  changedFields: string[];
  jtlSync: {
    success: boolean;
    error?: string;
  } | null;
}

// Dashboard types
export interface ChartDataPoint {
  monthKey: string;
  value: number;
}

export interface DashboardChartData {
  chartData: ChartDataPoint[];
  referenceData: ChartDataPoint[];
  monthOptions: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

export interface DashboardEvent {
  id: string;
  type: 'return' | 'inbound' | 'order_attention';
  entityId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface QuickChatMessage {
  id: string;
  roomId: string;
  sender: string;
  senderRole: string;
  avatar: string | null;
  avatarColor: string;
  timestamp: string;
  content: string;
  clientName: string;
  tasks: string[];
}

export const dataApi = {
  // Products
  async getProducts(): Promise<Product[]> {
    const response = await api.get('/data/products');
    return response.data.data;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/data/products/${id}`);
    return response.data.data;
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const response = await api.post('/data/products', input);
    return response.data.data;
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<UpdateResponse<Product>> {
    const response = await api.patch(`/data/products/${id}`, input);
    return {
      data: response.data.data,
      changedFields: response.data.changedFields || [],
      jtlSync: response.data.jtlSync || null,
    };
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const response = await api.get('/data/orders');
    return response.data.data;
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/data/orders/${id}`);
    return response.data.data;
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await api.post('/data/orders', input);
    return response.data.data;
  },

  async updateOrder(id: string, input: UpdateOrderInput): Promise<UpdateResponse<Order>> {
    const response = await api.patch(`/data/orders/${id}`, input);
    return {
      data: response.data.data,
      changedFields: response.data.changedFields || [],
      jtlSync: response.data.jtlSync || null,
    };
  },

  async createReplacementOrder(orderId: string, data: {
    reason: string;
    returnId?: string;
    items?: Array<{ sku: string; productName: string; quantity: number }>;
    customAddress?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      address1?: string;
      address2?: string;
      city?: string;
      zip?: string;
      country?: string;
      countryCode?: string;
      phone?: string;
    };
    notes?: string;
    expedited?: boolean;
  }): Promise<{ replacementOrderId: string; originalOrderId: string; details: any }> {
    const response = await api.post(`/sync-admin/orders/${orderId}/replacement`, data);
    return response.data.data;
  },

  // Returns
  async getReturns(): Promise<Return[]> {
    const response = await api.get('/data/returns');
    return response.data.data;
  },

  async getReturn(id: string): Promise<Return> {
    const response = await api.get(`/data/returns/${id}`);
    return response.data.data;
  },

  async updateReturn(id: string, input: UpdateReturnInput): Promise<UpdateResponse<Return>> {
    const response = await api.patch(`/data/returns/${id}`, input);
    return {
      data: response.data.data,
      changedFields: response.data.changedFields || [],
      jtlSync: response.data.jtlSync || null,
    };
  },

  async createReturn(input: CreateReturnInput): Promise<Return> {
    const response = await api.post('/data/returns', input);
    return response.data.data;
  },

  async deleteOrder(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/data/orders/${id}`);
    return response.data;
  },

  async deleteProduct(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/data/products/${id}`);
    return response.data;
  },

  async deleteReturn(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/data/returns/${id}`);
    return response.data;
  },

  // Inbounds
  async getInbounds(): Promise<Inbound[]> {
    const response = await api.get('/data/inbounds');
    return response.data.data;
  },

  async getInbound(id: string): Promise<Inbound> {
    const response = await api.get(`/data/inbounds/${id}`);
    return response.data.data;
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    const response = await api.get('/data/tasks');
    return response.data.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/data/tasks/${id}`);
    return response.data.data;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const response = await api.post('/data/tasks', input);
    return response.data.data;
  },

  async updateTask(id: string, input: Partial<CreateTaskInput>): Promise<Task> {
    const response = await api.put(`/data/tasks/${id}`, input);
    return response.data.data;
  },

  // Dashboard
  async getDashboardChart(fromDate?: string, toDate?: string): Promise<DashboardChartData> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const queryString = params.toString();
    const response = await api.get(`/data/dashboard/chart${queryString ? `?${queryString}` : ''}`);
    return response.data.data;
  },

  async getDashboardEvents(limit?: number): Promise<DashboardEvent[]> {
    const response = await api.get(`/data/dashboard/events${limit ? `?limit=${limit}` : ''}`);
    return response.data.data;
  },

  async getRecentChatMessages(limit?: number): Promise<QuickChatMessage[]> {
    const response = await api.get(`/chat/recent${limit ? `?limit=${limit}` : ''}`);
    return response.data.data;
  },
};
