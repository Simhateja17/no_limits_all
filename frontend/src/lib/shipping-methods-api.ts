/**
 * Shipping Methods API Service
 * Handles fetching, syncing, and configuring shipping methods
 */

import { api } from './api';

// ============= TYPES =============

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  carrier: string;
  jtlShippingMethodId: string | null;
  jtlFulfillerId: string | null;
  jtlShippingType: string | null;
  jtlCarrierCode: string | null;
  jtlCarrierName: string | null;
  trackingUrlSchema: string | null;
  cutoffTime: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethodsResponse {
  success: boolean;
  data?: ShippingMethod[];
  error?: string;
}

export interface SyncShippingMethodsResponse {
  success: boolean;
  message?: string;
  synced?: number;
  shippingMethods?: ShippingMethod[];
  error?: string;
}

export interface ChannelDefaultResponse {
  success: boolean;
  data?: {
    channelId: string;
    channelName: string;
    defaultShippingMethodId: string | null;
    shippingMethod: ShippingMethod | null;
  };
  error?: string;
}

export interface ClientDefaultResponse {
  success: boolean;
  data?: {
    clientId: string;
    defaultShippingMethodId: string | null;
    shippingMethod: ShippingMethod | null;
  };
  error?: string;
}

// ============= API FUNCTIONS =============

export const shippingMethodsApi = {
  /**
   * Get all shipping methods
   */
  getAll: async (activeOnly = true): Promise<ShippingMethodsResponse> => {
    const response = await api.get<ShippingMethodsResponse>(
      '/shipping-methods',
      { params: { activeOnly } }
    );
    return response.data;
  },

  /**
   * Sync shipping methods from JTL FFN for the authenticated client
   */
  syncFromJTL: async (): Promise<SyncShippingMethodsResponse> => {
    const response = await api.post<SyncShippingMethodsResponse>(
      '/shipping-methods/jtl/sync'
    );
    return response.data;
  },

  /**
   * Get a channel's default shipping method
   */
  getChannelDefault: async (channelId: string): Promise<ChannelDefaultResponse> => {
    const response = await api.get<ChannelDefaultResponse>(
      `/shipping-methods/channel/${channelId}/default`
    );
    return response.data;
  },

  /**
   * Set a channel's default shipping method
   */
  setChannelDefault: async (channelId: string, shippingMethodId: string): Promise<ChannelDefaultResponse> => {
    const response = await api.put<ChannelDefaultResponse>(
      `/shipping-methods/channel/${channelId}/default`,
      { shippingMethodId }
    );
    return response.data;
  },

  /**
   * Get the client's default shipping method
   */
  getClientDefault: async (clientId: string): Promise<ClientDefaultResponse> => {
    const response = await api.get<ClientDefaultResponse>(
      `/shipping-methods/client/${clientId}/default`
    );
    return response.data;
  },

  /**
   * Set the client's default shipping method
   */
  setClientDefault: async (clientId: string, shippingMethodId: string): Promise<ClientDefaultResponse> => {
    const response = await api.put<ClientDefaultResponse>(
      `/shipping-methods/client/${clientId}/default`,
      { shippingMethodId }
    );
    return response.data;
  },

  /**
   * Get shipping method mappings for a channel
   */
  getChannelMappings: async (channelId: string): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      channelShippingName: string;
      shippingMethodId: string;
      shippingMethod: ShippingMethod;
    }>;
    error?: string;
  }> => {
    const response = await api.get(`/shipping-methods/mappings/channel/${channelId}`);
    return response.data;
  },

  /**
   * Create or update a shipping method mapping
   */
  upsertMapping: async (data: {
    channelId: string;
    channelShippingName: string;
    shippingMethodId: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await api.post('/shipping-methods/mappings', data);
    return response.data;
  },

  /**
   * Delete a shipping method mapping
   */
  deleteMapping: async (mappingId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await api.delete(`/shipping-methods/mappings/${mappingId}`);
    return response.data;
  },
};

export default shippingMethodsApi;
