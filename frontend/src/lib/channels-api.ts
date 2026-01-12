/**
 * Channels API Service
 * Handles fetching channels, warehouse locations, and shipping methods
 */

import { api } from './api';

// ============= TYPES =============

export interface Channel {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier?: string;
}

export interface ChannelsResponse {
  success: boolean;
  channels: Channel[];
  error?: string;
}

export interface LocationsResponse {
  success: boolean;
  locations: Location[];
  error?: string;
}

export interface ShippingMethodsResponse {
  success: boolean;
  warehouseMethods: ShippingMethod[];
  channelMethods: ShippingMethod[];
  error?: string;
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  syncedAt: string;
  error?: string;
}

export interface HistoricSyncResponse {
  success: boolean;
  channelId: string;
  syncedSince: string;
  details: {
    products: SyncResult;
    orders: SyncResult;
    returns: SyncResult;
  };
  error?: string;
}

// ============= API FUNCTIONS =============

export const channelsApi = {
  /**
   * Get all channels for a client
   */
  getChannels: async (clientId: string): Promise<ChannelsResponse> => {
    const response = await api.get<ChannelsResponse>(
      '/integrations/channels',
      {
        params: { clientId }
      }
    );
    return response.data;
  },

  /**
   * Get warehouse locations for a client
   */
  getWarehouseLocations: async (clientId: string): Promise<LocationsResponse> => {
    const response = await api.get<LocationsResponse>(
      '/integrations/warehouse-locations',
      {
        params: { clientId }
      }
    );
    return response.data;
  },

  /**
   * Get shipping methods for a channel
   */
  getShippingMethods: async (channelId: string): Promise<ShippingMethodsResponse> => {
    const response = await api.get<ShippingMethodsResponse>(
      `/integrations/shipping-methods/${channelId}`
    );
    return response.data;
  },

  /**
   * Save API credentials for a channel
   */
  saveApiCredentials: async (
    channelId: string,
    credentials: {
      storeUrl: string;
      clientId?: string;
      clientSecret?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await api.put(
      `/integrations/channels/${channelId}/credentials`,
      credentials
    );
    return response.data;
  },

  /**
   * Save location selection for a channel
   */
  saveLocationSelection: async (
    channelId: string,
    locationId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await api.put(
      `/integrations/channels/${channelId}/location`,
      { locationId }
    );
    return response.data;
  },

  /**
   * Save shipping method mappings for a channel
   */
  saveShippingMappings: async (
    channelId: string,
    mappings: Record<string, string> // warehouseMethodId -> channelMethodId
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await api.put(
      `/integrations/channels/${channelId}/shipping-mappings`,
      { mappings }
    );
    return response.data;
  },

  /**
   * Delete a channel
   */
  deleteChannel: async (channelId: string): Promise<{ success: boolean; error?: string }> => {
    const response = await api.delete(`/integrations/channels/${channelId}`);
    return response.data;
  },

  /**
   * Trigger historic data sync for a channel
   * Pulls orders, returns, and inbounds from the last N days (default 180)
   */
  triggerHistoricSync: async (channelId: string, daysBack: number = 180): Promise<HistoricSyncResponse> => {
    const response = await api.post<HistoricSyncResponse>(
      `/integrations/sync/historic/${channelId}`,
      { daysBack }
    );
    return response.data;
  },

  /**
   * Trigger manual sync for a channel
   */
  triggerSync: async (channelId: string, fullSync: boolean = false): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(
      `/integrations/sync/${channelId}`,
      { fullSync }
    );
    return response.data;
  },
};

// ============= SYNC JOB STATUS =============

export interface SyncJob {
  id: string;
  channelId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  type: string;
  currentPhase: string | null;
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  totalOrders: number;
  syncedOrders: number;
  failedOrders: number;
  totalReturns: number;
  syncedReturns: number;
  failedReturns: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  progress: number;
}

export interface SyncJobStatusResponse {
  success: boolean;
  syncJob: SyncJob | null;
  error?: string;
}

export interface SyncJobHistoryResponse {
  success: boolean;
  syncJobs: SyncJob[];
  error?: string;
}

/**
 * Get the current/latest sync job status for a channel
 */
export const getSyncJobStatus = async (channelId: string): Promise<SyncJobStatusResponse> => {
  const response = await api.get<SyncJobStatusResponse>(
    `/integrations/sync-job/${channelId}`
  );
  return response.data;
};

/**
 * Get sync job history for a channel
 */
export const getSyncJobHistory = async (channelId: string, limit: number = 10): Promise<SyncJobHistoryResponse> => {
  const response = await api.get<SyncJobHistoryResponse>(
    `/integrations/sync-jobs/${channelId}`,
    { params: { limit } }
  );
  return response.data;
};

/**
 * Start background sync with user-selected date
 */
export const startBackgroundSync = async (
  channelId: string,
  syncFromDate: string
): Promise<{ success: boolean; syncJobId?: string; error?: string; details?: any }> => {
  const response = await api.post(
    `/integrations/sync/background/${channelId}`,
    { syncFromDate }
  );
  return response.data;
};

export default channelsApi;
