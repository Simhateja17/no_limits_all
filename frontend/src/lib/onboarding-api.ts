/**
 * Onboarding API Service
 * Handles client onboarding - collecting Shopify/WooCommerce and JTL credentials
 */

import { api } from './api';

// ============= TYPES =============

export interface OnboardingStatus {
  client: boolean;
  jtlConfig: boolean;
  jtlOAuthComplete: boolean;
  channels: {
    id: string;
    name: string;
    type: string;
    status: string;
  }[];
  readyForSync: boolean;
}

export interface JTLCredentialsInput {
  clientId: string;
  jtlClientId: string;
  jtlClientSecret: string;
  fulfillerId: string;
  warehouseId: string;
  environment: 'sandbox' | 'production';
}

export interface ShopifyChannelInput {
  clientId: string;
  shopDomain: string;
  accessToken: string;
  apiSecret?: string;
  channelName?: string;
  syncFromDate?: string; // ISO date string for historical sync
  enableHistoricalSync?: boolean;
}

export interface ShopifyOAuthCredentialsInput {
  clientId: string;
  shopDomain: string;
  oauthClientId: string;
  oauthClientSecret: string;
}

export interface ShopifyAuthUrlInput {
  clientId: string;
  shopDomain: string;
  redirectUri: string;
  oauthClientId: string;
}

export interface WooCommerceChannelInput {
  clientId: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  channelName?: string;
  syncFromDate?: string; // ISO date string for historical sync
  enableHistoricalSync?: boolean;
}

export interface OnboardingResult {
  success: boolean;
  clientId?: string;
  channelId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface JTLFulfiller {
  id: string;
  name: string;
}

export interface JTLWarehouse {
  id: string;
  name: string;
}

// ============= API FUNCTIONS =============

export const onboardingApi = {
  /**
   * Get onboarding status for the current client
   */
  getOnboardingStatus: async (clientId: string): Promise<OnboardingStatus> => {
    const response = await api.get<{ success: boolean } & OnboardingStatus>(
      `/integrations/onboarding/status/${clientId}`
    );
    return response.data;
  },

  /**
   * Setup JTL credentials
   */
  setupJTLCredentials: async (input: JTLCredentialsInput): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/onboarding/jtl-credentials',
      input
    );
    return response.data;
  },

  /**
   * Get JTL OAuth authorization URL
   */
  getJTLAuthUrl: async (
    clientId: string,
    redirectUri: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ): Promise<{ authUrl: string }> => {
    const response = await api.get<{ success: boolean; authUrl: string }>(
      '/integrations/jtl/auth-url',
      {
        params: {
          clientId,
          redirectUri,
          state: clientId, // Use clientId as state for simplicity
          environment,
        },
      }
    );
    return response.data;
  },

  /**
   * Complete JTL OAuth flow
   */
  completeJTLOAuth: async (
    clientId: string,
    authorizationCode: string,
    redirectUri: string
  ): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/onboarding/jtl-oauth-complete',
      {
        clientId,
        authorizationCode,
        redirectUri,
      }
    );
    return response.data;
  },

  /**
   * Add Shopify channel
   */
  addShopifyChannel: async (input: ShopifyChannelInput): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/onboarding/channel/shopify',
      input
    );
    return response.data;
  },

  /**
   * Add WooCommerce channel
   */
  addWooCommerceChannel: async (input: WooCommerceChannelInput): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/onboarding/channel/woocommerce',
      input
    );
    return response.data;
  },

  /**
   * Test Shopify connection
   */
  testShopifyConnection: async (
    shopDomain: string,
    accessToken: string
  ): Promise<{ success: boolean; message: string; shopInfo?: { name: string } }> => {
    const response = await api.post('/integrations/shopify/test', {
      shopDomain,
      accessToken,
    });
    return response.data;
  },

  /**
   * Test WooCommerce connection
   */
  testWooCommerceConnection: async (
    storeUrl: string,
    consumerKey: string,
    consumerSecret: string
  ): Promise<{ success: boolean; message: string; storeInfo?: { name: string } }> => {
    const response = await api.post('/integrations/woocommerce/test', {
      storeUrl,
      consumerKey,
      consumerSecret,
    });
    return response.data;
  },

  /**
   * Get available JTL fulfillers
   */
  getJTLFulfillers: async (clientId: string): Promise<JTLFulfiller[]> => {
    const response = await api.get<{ success: boolean; fulfillers: JTLFulfiller[] }>(
      `/integrations/jtl/fulfillers/${clientId}`
    );
    return response.data.fulfillers || [];
  },

  /**
   * Trigger initial sync for a channel
   */
  triggerInitialSync: async (
    channelId: string,
    syncFromDate?: string,
    enableHistoricalSync?: boolean
  ): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      `/integrations/onboarding/sync/${channelId}`,
      {
        syncFromDate,
        enableHistoricalSync,
      }
    );
    return response.data;
  },

  /**
   * Save Shopify OAuth credentials (before starting OAuth flow)
   */
  saveShopifyOAuthCredentials: async (input: ShopifyOAuthCredentialsInput): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/shopify/oauth/save-credentials',
      input
    );
    return response.data;
  },

  /**
   * Get Shopify OAuth authorization URL
   */
  getShopifyAuthUrl: async (input: ShopifyAuthUrlInput): Promise<{ success: boolean; authUrl: string }> => {
    const response = await api.post<{ success: boolean; authUrl: string }>(
      '/integrations/shopify/oauth/auth-url',
      input
    );
    return response.data;
  },

  /**
   * Complete Shopify OAuth flow (called by callback page)
   * Includes HMAC and timestamp for security validation
   */
  completeShopifyOAuth: async (
    clientId: string,
    shopDomain: string,
    code: string,
    state: string,
    hmac?: string,
    timestamp?: string
  ): Promise<OnboardingResult> => {
    const response = await api.post<OnboardingResult>(
      '/integrations/shopify/oauth/complete',
      {
        clientId,
        shopDomain,
        code,
        state,
        ...(hmac && { hmac }),
        ...(timestamp && { timestamp }),
      }
    );
    return response.data;
  },
};

export default onboardingApi;
