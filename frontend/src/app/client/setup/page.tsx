'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { onboardingApi } from '@/lib/onboarding-api';
import SyncDatePickerModal from '@/components/channels/SyncDatePickerModal';

type SetupStep = 'platform' | 'credentials' | 'jtl' | 'complete';
type PlatformType = 'shopify' | 'woocommerce' | null;

export default function ClientSetupPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('setup');
  const tErrors = useTranslations('errors');

  const [currentStep, setCurrentStep] = useState<SetupStep>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [hasJtlConfig, setHasJtlConfig] = useState<boolean>(false);
  const [isCheckingJtl, setIsCheckingJtl] = useState<boolean>(true);

  // Check if this is "add channel" mode (adding additional channel, not initial setup)
  const [isAddChannelMode, setIsAddChannelMode] = useState(false);

  // Sync modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncChannelId, setSyncChannelId] = useState<string | null>(null);

  // Shopify connection type - NOW WITH THREE OPTIONS
  const [shopifyConnectionType, setShopifyConnectionType] = useState<'access_token' | 'api_key' | 'oauth'>('access_token');

  // Shopify credentials - Access Token method
  const [shopDomain, setShopDomain] = useState('');
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');

  // Shopify credentials - API Key & Secret method
  const [shopifyApiKey, setShopifyApiKey] = useState('');
  const [shopifyApiSecret, setShopifyApiSecret] = useState('');

  // Shopify credentials - OAuth method
  const [shopifyOAuthClientId, setShopifyOAuthClientId] = useState('');
  const [shopifyOAuthClientSecret, setShopifyOAuthClientSecret] = useState('');
  const [shopifyOAuthStatus, setShopifyOAuthStatus] = useState<'pending' | 'authorizing' | 'success' | 'error' | null>(null);
  const [shopifyOAuthError, setShopifyOAuthError] = useState<string | null>(null);

  // WooCommerce credentials
  const [wooStoreUrl, setWooStoreUrl] = useState('');
  const [wooConsumerKey, setWooConsumerKey] = useState('');
  const [wooConsumerSecret, setWooConsumerSecret] = useState('');

  // JTL credentials
  const [jtlClientId, setJtlClientId] = useState('');
  const [jtlClientSecret, setJtlClientSecret] = useState('');
  const [jtlFulfillerId, setJtlFulfillerId] = useState('');
  const [jtlWarehouseId, setJtlWarehouseId] = useState('');
  const [jtlEnvironment, setJtlEnvironment] = useState<'sandbox' | 'production'>('sandbox');

  // Connection test results
  const [platformTestSuccess, setPlatformTestSuccess] = useState<boolean | null>(null);

  // JTL OAuth status
  const [jtlOAuthStatus, setJtlOAuthStatus] = useState<'pending' | 'authorizing' | 'success' | 'error' | null>(null);
  const [jtlOAuthError, setJtlOAuthError] = useState<string | null>(null);

  // Check URL parameters for add channel mode
  // Logout handler
  const handleLogout = () => {
    logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addChannel = params.get('addChannel') === 'true';
    const platform = params.get('platform') as PlatformType;

    if (addChannel && platform) {
      setIsAddChannelMode(true);
      setSelectedPlatform(platform);
      setCurrentStep('credentials');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
      return;
    }

    // Get client ID and check for existing JTL config
    const fetchClientData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const fetchedClientId = data.user?.client?.id;
          setClientId(fetchedClientId);

          // Check if JTL config exists for this client
          if (fetchedClientId) {
            const jtlResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/integrations/jtl/status/${fetchedClientId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (jtlResponse.ok) {
              const jtlData = await jtlResponse.json();
              // Check if JTL is configured AND OAuth is complete
              const hasConfig = jtlData.configured === true && jtlData.oauthComplete === true;
              setHasJtlConfig(hasConfig);
              console.log('[Setup] JTL config check:', hasConfig ? 'Configured with OAuth' : 'Not configured or OAuth incomplete');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching client data:', err);
      } finally {
        setIsCheckingJtl(false);
      }
    };

    fetchClientData();
  }, [isAuthenticated, user, router]);

  const handlePlatformSelect = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setCurrentStep('credentials');
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);
    setPlatformTestSuccess(null);

    try {
      if (selectedPlatform === 'shopify') {
        // OAuth method cannot be tested without completing the full OAuth flow
        if (shopifyConnectionType === 'oauth') {
          setError('OAuth connection will be verified during authorization');
          setPlatformTestSuccess(null);
          setIsLoading(false);
          return;
        }

        const accessToken = shopifyConnectionType === 'access_token' ? shopifyAccessToken : shopifyApiKey;
        const result = await onboardingApi.testShopifyConnection(shopDomain, accessToken);
        setPlatformTestSuccess(result.success);
        if (!result.success) {
          setError(result.message);
        }
      } else if (selectedPlatform === 'woocommerce') {
        const result = await onboardingApi.testWooCommerceConnection(
          wooStoreUrl,
          wooConsumerKey,
          wooConsumerSecret
        );
        setPlatformTestSuccess(result.success);
        if (!result.success) {
          setError(result.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
      setPlatformTestSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle Shopify OAuth flow
  const handleShopifyOAuth = async () => {
    if (!clientId) {
      setShopifyOAuthError(tErrors('clientIdNotFound'));
      return;
    }

    // Prevent duplicate OAuth flows
    if (shopifyOAuthStatus === 'authorizing') {
      console.log('[Setup] ⏭️ OAuth already in progress, skipping');
      return;
    }

    console.log('[Setup] 🔐 Starting Shopify OAuth flow...');
    setShopifyOAuthStatus('authorizing');
    setShopifyOAuthError(null);
    setIsLoading(true);

    try {
      // First, save OAuth client credentials to backend
      const saveResult = await onboardingApi.saveShopifyOAuthCredentials({
        clientId,
        shopDomain,
        oauthClientId: shopifyOAuthClientId,
        oauthClientSecret: shopifyOAuthClientSecret,
      });

      if (!saveResult.success) {
        setShopifyOAuthError(saveResult.error || 'Failed to save OAuth credentials');
        setShopifyOAuthStatus('error');
        setIsLoading(false);
        return;
      }

      // Get OAuth authorization URL
      const redirectUri = `${window.location.origin}/integrations/shopify/callback`;
      const authUrlResponse = await onboardingApi.getShopifyAuthUrl({
        clientId,
        shopDomain,
        redirectUri,
        oauthClientId: shopifyOAuthClientId,
      });

      console.log('[Setup] 🔗 Opening OAuth popup...');

      // Open popup for authorization
      const popup = window.open(
        authUrlResponse.authUrl,
        'shopify-oauth',
        'width=500,height=700'
      );

      if (!popup) {
        setShopifyOAuthStatus('error');
        setShopifyOAuthError('Failed to open popup. Please allow popups for this site.');
        setIsLoading(false);
        return;
      }

      // Use a flag to track if OAuth completed successfully (to avoid closure issues)
      let oauthCompleted = false;

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        console.log('[Setup] 📨 Received message:', event.data, 'Origin:', event.origin);
        console.log('[Setup] 📍 Current window origin:', window.location.origin);

        // Temporarily accept messages from any origin for debugging
        // if (event.origin !== window.location.origin) {
        //   console.log('[Setup] ⚠️ Message origin mismatch, ignoring');
        //   return;
        // }

        if (event.data && event.data.type === 'shopify-oauth-success') {
          console.log('[Setup] ✅ Shopify OAuth completed successfully! Channel ID:', event.data.channelId);
          oauthCompleted = true;
          setShopifyOAuthStatus('success');
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);

          // Save the channel ID
          if (event.data.channelId) {
            setSyncChannelId(event.data.channelId);
          }

          // Check if JTL config already exists OR if adding a channel (skip JTL step)
          if (hasJtlConfig || isAddChannelMode) {
            console.log('[Setup] ✅ JTL already configured or adding channel, showing sync date picker');
            setShowSyncModal(true);
          } else {
            console.log('[Setup] ➡️ Moving to JTL credentials step');
            setCurrentStep('jtl');
          }
        } else if (event.data.type === 'shopify-oauth-error') {
          console.error('[Setup] ❌ Shopify OAuth failed:', event.data.error);
          oauthCompleted = true;
          setShopifyOAuthStatus('error');
          setShopifyOAuthError(event.data.error || 'OAuth authorization failed');
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Clear any existing localStorage state from previous attempts
      localStorage.removeItem('shopify_oauth_success');
      localStorage.removeItem('shopify_oauth_pending');

      // Track when the OAuth flow started for timeout purposes
      const oauthStartTime = Date.now();
      const MAX_OAUTH_TIMEOUT = 120000; // 2 minutes max for entire OAuth flow
      
      // Helper function to check for success in localStorage
      const checkForSuccess = () => {
        const storedSuccess = localStorage.getItem('shopify_oauth_success');
        if (storedSuccess && !oauthCompleted) {
          console.log('[Setup] 📦 Found success in localStorage!', storedSuccess);
          try {
            const data = JSON.parse(storedSuccess);
            // Check if this success is recent (within last 60 seconds)
            if (Date.now() - data.timestamp < 60000) {
              console.log('[Setup] ✅ OAuth succeeded via localStorage! Channel ID:', data.channelId);
              oauthCompleted = true;
              setSyncChannelId(data.channelId);
              setShopifyOAuthStatus('success');
              setIsLoading(false);

              // Check if JTL config already exists OR if adding a channel (skip JTL step)
              if (hasJtlConfig || isAddChannelMode) {
                console.log('[Setup] ✅ JTL already configured or adding channel, showing sync date picker');
                setShowSyncModal(true);
              } else {
                console.log('[Setup] ➡️ Moving to JTL credentials step');
                setCurrentStep('jtl');
              }

              localStorage.removeItem('shopify_oauth_success'); // Clean up
              localStorage.removeItem('shopify_oauth_pending'); // Clean up
              return true;
            }
          } catch (e) {
            console.error('[Setup] ❌ Error parsing localStorage:', e);
          }
        } else if (!oauthCompleted) {
          // Debug: log what we're finding in localStorage
          console.log('[Setup] 🔍 Checking localStorage - shopify_oauth_success:', storedSuccess);
        }
        return false;
      };

      // Helper function to clean up all intervals and listeners
      const cleanup = () => {
        clearInterval(localStorageCheck);
        window.removeEventListener('message', handleMessage);
      };

      // Continuously check localStorage - this is the PRIMARY and ONLY reliable detection method
      // We do NOT rely on popup.closed because it's unreliable for cross-origin navigation
      const localStorageCheck = setInterval(() => {
        // Check for overall timeout first
        if (Date.now() - oauthStartTime > MAX_OAUTH_TIMEOUT) {
          console.log('[Setup] ⏰ OAuth flow timed out (2 minutes)');
          cleanup();
          if (!oauthCompleted) {
            setShopifyOAuthStatus('error');
            setShopifyOAuthError('Authorization timed out - Please try again');
            setIsLoading(false);
            localStorage.removeItem('shopify_oauth_pending');
          }
          return;
        }
        
        // Check for success
        if (checkForSuccess()) {
          cleanup();
          return;
        }

        // Log progress every 5 seconds
        const elapsedSeconds = Math.floor((Date.now() - oauthStartTime) / 1000);
        if (elapsedSeconds % 5 === 0 && elapsedSeconds > 0) {
          const storedPending = localStorage.getItem('shopify_oauth_pending');
          if (storedPending) {
            console.log(`[Setup] ⏳ OAuth in progress (${elapsedSeconds}s elapsed)...`);
          }
        }
      }, 500); // Check every 500ms
    } catch (err) {
      console.error('[Setup] ❌ Error starting Shopify OAuth:', err);
      setShopifyOAuthStatus('error');
      setShopifyOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth flow');
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async () => {
    if (!clientId) {
      setError(tErrors('clientIdNotFound'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let channelId: string | null = null;

      if (selectedPlatform === 'shopify') {
        console.log('[Setup] 🛍️ Adding Shopify channel...');

        // Handle OAuth flow differently
        if (shopifyConnectionType === 'oauth') {
          console.log('[Setup] 🔐 Triggering OAuth flow...');
          await handleShopifyOAuth();
          return; // Don't continue - OAuth flow will handle the rest
        }

        const accessToken = shopifyConnectionType === 'access_token' ? shopifyAccessToken : shopifyApiKey;
        const result = await onboardingApi.addShopifyChannel({
          clientId,
          shopDomain,
          accessToken: accessToken,
          apiSecret: shopifyConnectionType === 'api_key' ? shopifyApiSecret : undefined,
        });

        console.log('[Setup] 📦 Shopify channel result:', result);

        if (!result.success) {
          console.error('[Setup] ❌ Failed to add Shopify channel:', result.error);
          setError(result.error || 'Failed to add Shopify channel');
          return;
        }
        channelId = result.channelId || null;
      } else if (selectedPlatform === 'woocommerce') {
        console.log('[Setup] 🛒 Adding WooCommerce channel...');
        const result = await onboardingApi.addWooCommerceChannel({
          clientId,
          storeUrl: wooStoreUrl,
          consumerKey: wooConsumerKey,
          consumerSecret: wooConsumerSecret,
        });

        console.log('[Setup] 📦 WooCommerce channel result:', result);

        if (!result.success) {
          console.error('[Setup] ❌ Failed to add WooCommerce channel:', result.error);
          setError(result.error || 'Failed to add WooCommerce channel');
          return;
        }
        channelId = result.channelId || null;
      }

      // Save channel ID for sync modal
      if (channelId) {
        console.log('[Setup] 💾 Saved channel ID for sync:', channelId);
        setSyncChannelId(channelId);
      } else {
        console.warn('[Setup] ⚠️ No channel ID returned from platform setup');
      }

      // Check if JTL config already exists OR if adding a channel (skip JTL step)
      if (hasJtlConfig || isAddChannelMode) {
        console.log('[Setup] ✅ JTL already configured or adding channel, showing sync date picker');
        setShowSyncModal(true);
      } else {
        console.log('[Setup] ➡️ Moving to JTL credentials step');
        setCurrentStep('jtl');
      }
    } catch (err) {
      console.error('[Setup] ❌ Error submitting credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJTLOAuth = async () => {
    if (!clientId) {
      setJtlOAuthError(tErrors('clientIdNotFound'));
      return;
    }

    console.log('[Setup] 🔐 Starting JTL OAuth flow...');
    setJtlOAuthStatus('authorizing');
    setJtlOAuthError(null);

    try {
      // Get OAuth authorization URL
      const redirectUri = `${window.location.origin}/integrations/jtl/callback`;
      const authUrlResponse = await onboardingApi.getJTLAuthUrl(
        clientId,
        redirectUri,
        jtlEnvironment
      );

      console.log('[Setup] 🔗 Opening OAuth popup...');

      // Open popup with the complete auth URL (don't append anything)
      const popup = window.open(
        authUrlResponse.authUrl,
        'jtl-oauth',
        'width=500,height=700'
      );

      if (!popup) {
        setJtlOAuthStatus('error');
        setJtlOAuthError('Failed to open popup. Please allow popups for this site.');
        return;
      }

      // Listen for messages from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'jtl-oauth-success') {
          console.log('[Setup] ✅ JTL OAuth completed successfully');
          setJtlOAuthStatus('success');
          window.removeEventListener('message', handleMessage);

          // Show sync progress modal if we have a channel ID
          if (syncChannelId) {
            console.log('[Setup] 🔄 Opening sync modal for channel:', syncChannelId);
            setShowSyncModal(true);
          } else {
            console.log('[Setup] ⚠️ No channel ID, skipping sync modal');
            setCurrentStep('complete');
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing
      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck);
          window.removeEventListener('message', handleMessage);
          if (jtlOAuthStatus !== 'success') {
            console.log('[Setup] ⚠️ OAuth popup closed without completion');
            setJtlOAuthStatus('error');
            setJtlOAuthError('Authorization cancelled');
          }
        }
      }, 500);
    } catch (err) {
      console.error('[Setup] ❌ Error starting OAuth flow:', err);
      setJtlOAuthStatus('error');
      setJtlOAuthError(err instanceof Error ? err.message : 'Failed to start OAuth flow');
    }
  };

  const handleJTLSubmit = async () => {
    if (!clientId) {
      setError(tErrors('clientIdNotFound'));
      return;
    }

    console.log('[Setup] 🔐 Submitting JTL credentials...');
    setIsLoading(true);
    setError(null);
    setJtlOAuthStatus('pending');

    try {
      const result = await onboardingApi.setupJTLCredentials({
        clientId,
        jtlClientId,
        jtlClientSecret,
        fulfillerId: jtlFulfillerId,
        warehouseId: jtlWarehouseId,
        environment: jtlEnvironment,
      });

      console.log('[Setup] 📦 JTL credentials result:', result);

      if (!result.success) {
        console.error('[Setup] ❌ Failed to setup JTL credentials:', result.error);
        setError(result.error || 'Failed to setup JTL credentials');
        return;
      }

      // Credentials saved, now trigger OAuth flow
      console.log('[Setup] 🔓 Credentials saved, starting OAuth...');
      setIsLoading(false);
      await handleJTLOAuth();
    } catch (err) {
      console.error('[Setup] ❌ Error saving JTL credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to save JTL credentials');
      setIsLoading(false);
    }
  };

  const handleSyncComplete = () => {
    console.log('[Setup] ✅ Background sync started, redirecting...');
    setShowSyncModal(false);

    // If adding a channel, redirect back to channels page
    // Otherwise, redirect to dashboard
    if (isAddChannelMode) {
      router.push('/client/channels');
    } else {
      router.push('/client/dashboard');
    }
  };

  const handleComplete = () => {
    console.log('[Setup] 🎉 Setup complete, redirecting to dashboard');
    router.push('/client/dashboard');
  };

  const handleSkipJTL = () => {
    console.log('[Setup] ⏭️ Skipping JTL setup');
    setCurrentStep('complete');
  };

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  return (
    <>
      {/* Sync Date Picker Modal */}
      {syncChannelId && (
        <SyncDatePickerModal
          channelId={syncChannelId}
          isOpen={showSyncModal}
          onComplete={handleSyncComplete}
        />
      )}

      <div
        style={{
          minHeight: '100vh',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
        }}
      >
      {/* Header with Logo and Logout */}
      <div style={{ 
        width: '100%', 
        maxWidth: '680px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '40px' 
      }}>
        <Image
          src="/no_limits.png"
          alt="NoLimits Logo"
          width={140}
          height={45}
          priority
          className="h-auto w-auto"
          style={{ maxHeight: '45px' }}
        />
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#374151',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F3F4F6';
            e.currentTarget.style.borderColor = '#9CA3AF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#D1D5DB';
          }}
        >
          {t('logout') || 'Logout'}
        </button>
      </div>

      {/* Progress Steps */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {/* Show only 2 steps when adding a channel: credentials and complete */}
        {/* Show all 4 steps for initial setup */}
        {(isAddChannelMode ? ['credentials', 'complete'] : ['platform', 'credentials', 'jtl', 'complete']).map((step, index, steps) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background:
                  currentStep === step
                    ? '#003450'
                    : steps.indexOf(currentStep) > index
                    ? '#10B981'
                    : '#E5E7EB',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {steps.indexOf(currentStep) > index ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  width: '40px',
                  height: '2px',
                  background:
                    steps.indexOf(currentStep) > index
                      ? '#10B981'
                      : '#E5E7EB',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Step 1: Platform Selection */}
        {currentStep === 'platform' && (
          <>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {t('selectPlatform') || 'Select Your E-Commerce Platform'}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '32px',
              }}
            >
              {t('selectPlatformDesc') || 'Choose the platform where your online store is hosted'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                onClick={() => handlePlatformSelect('shopify')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#003450')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src="/shopify-logo-svg-vector.svg"
                    alt="Shopify"
                    width={48}
                    height={48}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      color: '#111827',
                    }}
                  >
                    Shopify
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#6B7280',
                    }}
                  >
                    {t('shopifyDesc') || 'Connect your Shopify store'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handlePlatformSelect('woocommerce')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#003450')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src="/WooCommerce-Symbol-1.png"
                    alt="WooCommerce"
                    width={48}
                    height={48}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      color: '#111827',
                    }}
                  >
                    WooCommerce
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      color: '#6B7280',
                    }}
                  >
                    {t('woocommerceDesc') || 'Connect your WooCommerce store'}
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Step 2: Platform Credentials */}
        {currentStep === 'credentials' && (
          <>
            <button
              onClick={() => {
                if (isAddChannelMode) {
                  router.push('/client/channels');
                } else {
                  setCurrentStep('platform');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              ← {t('back') || 'Back'}
            </button>

            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {selectedPlatform === 'shopify'
                ? t('shopifyCredentials') || 'Shopify API Credentials'
                : t('wooCredentials') || 'WooCommerce API Credentials'}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '32px',
              }}
            >
              {t('credentialsDesc') || 'Enter your API credentials to connect your store'}
            </p>

            {selectedPlatform === 'shopify' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Connection Method Toggle */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '8px',
                    }}
                  >
                    Connection Method
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShopifyConnectionType('access_token')}
                      style={{
                        flex: '1 1 150px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: shopifyConnectionType === 'access_token' ? '2px solid #003450' : '1px solid #D1D5DB',
                        background: shopifyConnectionType === 'access_token' ? '#F0F9FF' : 'white',
                        color: shopifyConnectionType === 'access_token' ? '#003450' : '#6B7280',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      Access Token
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopifyConnectionType('api_key')}
                      style={{
                        flex: '1 1 150px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: shopifyConnectionType === 'api_key' ? '2px solid #003450' : '1px solid #D1D5DB',
                        background: shopifyConnectionType === 'api_key' ? '#F0F9FF' : 'white',
                        color: shopifyConnectionType === 'api_key' ? '#003450' : '#6B7280',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      API Key & Secret
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopifyConnectionType('oauth')}
                      style={{
                        flex: '1 1 150px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: shopifyConnectionType === 'oauth' ? '2px solid #003450' : '1px solid #D1D5DB',
                        background: shopifyConnectionType === 'oauth' ? '#F0F9FF' : 'white',
                        color: shopifyConnectionType === 'oauth' ? '#003450' : '#6B7280',
                        fontWeight: 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      OAuth Flow
                    </button>
                  </div>
                </div>

                {/* Shop Domain - Common for both methods */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    Shop Domain
                  </label>
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="mystore.myshopify.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Admin API Access Token Method */}
                {shopifyConnectionType === 'access_token' && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        color: '#374151',
                        marginBottom: '6px',
                      }}
                    >
                      Admin API Access Token
                    </label>
                    <input
                      type="password"
                      value={shopifyAccessToken}
                      onChange={(e) => setShopifyAccessToken(e.target.value)}
                      placeholder="shpat_..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* API Key & Secret Method */}
                {shopifyConnectionType === 'api_key' && (
                  <>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '6px',
                        }}
                      >
                        API Key
                      </label>
                      <input
                        type="text"
                        value={shopifyApiKey}
                        onChange={(e) => setShopifyApiKey(e.target.value)}
                        placeholder="Your Shopify API Key"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '6px',
                        }}
                      >
                        API Secret
                      </label>
                      <input
                        type="password"
                        value={shopifyApiSecret}
                        onChange={(e) => setShopifyApiSecret(e.target.value)}
                        placeholder="Your Shopify API Secret"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </>
                )}

                {/* OAuth Method */}
                {shopifyConnectionType === 'oauth' && (
                  <>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '6px',
                        }}
                      >
                        OAuth Client ID
                      </label>
                      <input
                        type="text"
                        value={shopifyOAuthClientId}
                        onChange={(e) => setShopifyOAuthClientId(e.target.value)}
                        placeholder="Your Shopify App Client ID"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#374151',
                          marginBottom: '6px',
                        }}
                      >
                        OAuth Client Secret
                      </label>
                      <input
                        type="password"
                        value={shopifyOAuthClientSecret}
                        onChange={(e) => setShopifyOAuthClientSecret(e.target.value)}
                        placeholder="Your Shopify App Client Secret"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        background: '#EFF6FF',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#1E40AF',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong>Note:</strong> Create a Shopify App at{' '}
                      <a
                        href="https://partners.shopify.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563EB', textDecoration: 'underline' }}
                      >
                        Shopify Partners
                      </a>{' '}
                      and add the redirect URL: <code style={{background: '#DBEAFE', padding: '2px 4px', borderRadius: '4px'}}>{typeof window !== 'undefined' ? `${window.location.origin}/integrations/shopify/callback` : '/integrations/shopify/callback'}</code>
                    </div>

                    {shopifyOAuthStatus === 'authorizing' && (
                      <div
                        style={{
                          padding: '12px',
                          background: '#EFF6FF',
                          borderRadius: '8px',
                          color: '#1E40AF',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #3B82F6',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        Authorizing with Shopify... Please complete authorization in the popup window.
                      </div>
                    )}

                    {shopifyOAuthStatus === 'success' && (
                      <div
                        style={{
                          padding: '12px',
                          background: '#F0FDF4',
                          borderRadius: '8px',
                          color: '#16A34A',
                          fontSize: '14px',
                        }}
                      >
                        ✓ Authorization successful! Shopify store connected.
                      </div>
                    )}

                    {shopifyOAuthError && (
                      <div
                        style={{
                          padding: '12px',
                          background: '#FEF2F2',
                          borderRadius: '8px',
                          color: '#DC2626',
                          fontSize: '14px',
                        }}
                      >
                        {shopifyOAuthError}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('storeUrl') || 'Store URL'}
                  </label>
                  <input
                    type="text"
                    value={wooStoreUrl}
                    onChange={(e) => setWooStoreUrl(e.target.value)}
                    placeholder="https://mystore.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('consumerKey') || 'Consumer Key'}
                  </label>
                  <input
                    type="text"
                    value={wooConsumerKey}
                    onChange={(e) => setWooConsumerKey(e.target.value)}
                    placeholder="ck_..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('consumerSecret') || 'Consumer Secret'}
                  </label>
                  <input
                    type="password"
                    value={wooConsumerSecret}
                    onChange={(e) => setWooConsumerSecret(e.target.value)}
                    placeholder="cs_..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#FEF2F2',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {platformTestSuccess === true && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#F0FDF4',
                  borderRadius: '8px',
                  color: '#16A34A',
                  fontSize: '14px',
                }}
              >
                ✓ {t('connectionSuccess') || 'Connection successful!'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={handleTestConnection}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? t('testing') || 'Testing...' : t('testConnection') || 'Test Connection'}
              </button>
              <button
                onClick={handleCredentialsSubmit}
                disabled={isLoading || (shopifyConnectionType !== 'oauth' && platformTestSuccess !== true)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (platformTestSuccess === true || shopifyConnectionType === 'oauth') ? '#003450' : '#9CA3AF',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: isLoading || (shopifyConnectionType !== 'oauth' && platformTestSuccess !== true) ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? t('saving') || 'Saving...' : t('continue') || 'Continue'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: JTL Credentials */}
        {currentStep === 'jtl' && (
          <>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {t('jtlCredentials') || 'JTL-FFN API Credentials'}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '32px',
              }}
            >
              {t('jtlDesc') || 'Enter your JTL-FFN Merchant API credentials for warehouse integration'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  {t('jtlClientId') || 'JTL Client ID'}
                </label>
                <input
                  type="text"
                  value={jtlClientId}
                  onChange={(e) => setJtlClientId(e.target.value)}
                  placeholder="Your JTL OAuth Client ID"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  {t('jtlClientSecret') || 'JTL Client Secret'}
                </label>
                <input
                  type="password"
                  value={jtlClientSecret}
                  onChange={(e) => setJtlClientSecret(e.target.value)}
                  placeholder="Your JTL OAuth Client Secret"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  {t('fulfillerId') || 'Fulfiller ID'}
                </label>
                <input
                  type="text"
                  value={jtlFulfillerId}
                  onChange={(e) => setJtlFulfillerId(e.target.value)}
                  placeholder="Your Fulfiller ID"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  {t('warehouseId') || 'Warehouse ID'}
                </label>
                <input
                  type="text"
                  value={jtlWarehouseId}
                  onChange={(e) => setJtlWarehouseId(e.target.value)}
                  placeholder="Your Warehouse ID"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  {t('environment') || 'Environment'}
                </label>
                <select
                  value={jtlEnvironment}
                  onChange={(e) => setJtlEnvironment(e.target.value as 'sandbox' | 'production')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>

            {jtlOAuthStatus === 'authorizing' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#EFF6FF',
                  borderRadius: '8px',
                  color: '#1E40AF',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #3B82F6',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Authorizing with JTL FFN... Please complete authorization in the popup window.
              </div>
            )}

            {jtlOAuthStatus === 'success' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#F0FDF4',
                  borderRadius: '8px',
                  color: '#16A34A',
                  fontSize: '14px',
                }}
              >
                ✓ Authorization successful! JTL FFN is now connected.
              </div>
            )}

            {jtlOAuthError && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#FEF2F2',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '14px',
                }}
              >
                {jtlOAuthError}
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#FEF2F2',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={handleSkipJTL}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t('skipForNow') || 'Skip for Now'}
              </button>
              <button
                onClick={handleJTLSubmit}
                disabled={isLoading || jtlOAuthStatus === 'authorizing' || !jtlClientId || !jtlClientSecret || !jtlFulfillerId || !jtlWarehouseId}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    jtlClientId && jtlClientSecret && jtlFulfillerId && jtlWarehouseId && jtlOAuthStatus !== 'authorizing'
                      ? '#003450'
                      : '#9CA3AF',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '14px',
                  cursor:
                    isLoading || jtlOAuthStatus === 'authorizing' || !jtlClientId || !jtlClientSecret || !jtlFulfillerId || !jtlWarehouseId
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {isLoading ? t('saving') || 'Saving...' : jtlOAuthStatus === 'authorizing' ? 'Authorizing...' : t('saveAndAuthorize') || 'Save & Authorize'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <span style={{ color: 'white', fontSize: '32px' }}>✓</span>
            </div>

            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              {t('setupComplete') || 'Setup Complete!'}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#6B7280',
                marginBottom: '32px',
              }}
            >
              {t('setupCompleteDesc') ||
                'Your store is now connected. We will sync your products and orders automatically.'}
            </p>

            <button
              onClick={handleComplete}
              style={{
                padding: '12px 48px',
                borderRadius: '8px',
                border: 'none',
                background: '#003450',
                color: 'white',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t('goToDashboard') || 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
