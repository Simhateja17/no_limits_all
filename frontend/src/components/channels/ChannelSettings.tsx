'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { channelsApi, Location, ShippingMethod } from '@/lib/channels-api';
import { onboardingApi } from '@/lib/onboarding-api';
import { SyncStatusBar } from './SyncStatusBar';

// Channel types
const channelTypes = ['Woocommerce', 'Shopify', 'Amazon'];

interface ChannelSettingsProps {
  channelId: string;
  baseUrl: string;
  initialChannelType?: string;
  isNewChannel?: boolean;
}

// Warning Icon Component
function WarningIcon() {
  return (
    <svg
      width="clamp(16px, 1.47vw, 20px)"
      height="clamp(16px, 1.47vw, 20px)"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.57465 3.21665L1.51632 14.1666C1.37079 14.4187 1.29379 14.7044 1.29298 14.9954C1.29216 15.2864 1.36756 15.5725 1.51167 15.8254C1.65579 16.0784 1.86359 16.2893 2.11441 16.4372C2.36523 16.585 2.65032 16.6647 2.94132 16.6683H17.058C17.349 16.6647 17.6341 16.585 17.8849 16.4372C18.1357 16.2893 18.3435 16.0784 18.4876 15.8254C18.6317 15.5725 18.7071 15.2864 18.7063 14.9954C18.7055 14.7044 18.6285 14.4187 18.483 14.1666L11.4247 3.21665C11.2761 2.97174 11.0669 2.76925 10.8173 2.62866C10.5677 2.48806 10.2861 2.41431 9.99965 2.41431C9.71321 2.41431 9.43159 2.48806 9.18199 2.62866C8.93238 2.76925 8.72321 2.97174 8.57465 3.21665Z"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 7.5V10.8333"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.1667H10.0083"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Download Icon Component
function DownloadIcon() {
  return (
    <svg
      width="clamp(15px, 1.47vw, 20px)"
      height="clamp(15px, 1.47vw, 20px)"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33334 13.3333V14.1667C3.33334 14.8297 3.59673 15.4656 4.06558 15.9344C4.53442 16.4033 5.17029 16.6667 5.83334 16.6667H14.1667C14.8297 16.6667 15.4656 16.4033 15.9344 15.9344C16.4033 15.4656 16.6667 14.8297 16.6667 14.1667V13.3333M5.83334 8.33333L10 12.5M10 12.5L14.1667 8.33333M10 12.5V3.33333"
        stroke="#003450"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Checkmark Icon for success modal
function CheckmarkIcon() {
  return (
    <svg
      width="clamp(32px, 3.14vw, 48px)"
      height="clamp(32px, 3.14vw, 48px)"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="#D1FAE5" />
      <path
        d="M16 24L21 29L32 18"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Success Modal Component
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 'clamp(280px, 27.47vw, 373px)',
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(8px, 0.78vw, 12px)',
          padding: 'clamp(32px, 3.14vw, 48px) clamp(24px, 2.36vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 1.57vw, 24px)',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CheckmarkIcon />
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(14px, 1.33vw, 18px)',
            lineHeight: 'clamp(18px, 1.77vw, 24px)',
            color: '#111827',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Channel succesfully added
        </p>
      </div>
    </div>
  );
}

export function ChannelSettings({ channelId, baseUrl, initialChannelType = 'Woocommerce', isNewChannel = false }: ChannelSettingsProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tChannels = useTranslations('channels');
  const { user } = useAuthStore();

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Channel Information State
  const [channelName, setChannelName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(initialChannelType);
  const [isChannelOn, setIsChannelOn] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // API Setup State
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [storeUrl, setStoreUrl] = useState('');

  // Location Setup State
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Shipping Setup State
  const [selectedMethods, setSelectedMethods] = useState<{ [key: string]: string }>({
    '1': 'DHL Parcel',
    '2': 'DHL Parcel',
    '3': 'DHL Parcel',
    '4': 'DHL Parcel',
  });
  const [openShippingDropdown, setOpenShippingDropdown] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [warehouseMethods, setWarehouseMethods] = useState<ShippingMethod[]>([]);
  const [channelMethods, setChannelMethods] = useState<ShippingMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);

  // JTL Configuration State
  const [hasJtlConfig, setHasJtlConfig] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Shipping Methods Save State
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [shippingSaveError, setShippingSaveError] = useState<string | null>(null);
  const [shippingSaveSuccess, setShippingSaveSuccess] = useState(false);

  // Sync Settings State
  const [enableHistoricalSync, setEnableHistoricalSync] = useState(true);
  const [syncFromDate, setSyncFromDate] = useState<string>(() => {
    // Default to 6 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });

  // Suppress unused variable warning
  void baseUrl;

  // Fetch onboarding status to check if JTL is configured
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!user?.clientId) return;

      try {
        setIsLoadingStatus(true);
        const status = await onboardingApi.getOnboardingStatus(user.clientId);
        setHasJtlConfig(status.jtlConfig && status.jtlOAuthComplete);
      } catch (err) {
        console.error('Error fetching onboarding status:', err);
        // Assume JTL is not configured if there's an error
        setHasJtlConfig(false);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchOnboardingStatus();
  }, [user?.clientId]);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.clientId) return;

      try {
        setIsLoadingLocations(true);
        const response = await channelsApi.getWarehouseLocations(user.clientId);
        if (response.success) {
          setLocations(response.locations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [user?.clientId]);

  // Fetch shipping methods when channelId changes
  useEffect(() => {
    const fetchShippingMethods = async () => {
      if (!channelId || channelId === 'new') return;

      try {
        setIsLoadingMethods(true);
        const response = await channelsApi.getShippingMethods(channelId);
        if (response.success) {
          setWarehouseMethods(response.warehouseMethods);
          setChannelMethods(response.channelMethods);
        }
      } catch (err) {
        console.error('Error fetching shipping methods:', err);
      } finally {
        setIsLoadingMethods(false);
      }
    };

    fetchShippingMethods();
  }, [channelId]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!user?.clientId) {
      setSaveError('User client ID not found');
      return;
    }

    // Validate required fields
    if (!channelName.trim()) {
      setSaveError('Please enter a channel name');
      return;
    }

    if (!clientId.trim() || !clientSecret.trim() || !storeUrl.trim()) {
      setSaveError('Please fill in all API credentials');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      let result;

      if (selectedChannel === 'Shopify') {
        // Start Shopify OAuth flow
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/onboarding/channel/shopify/start-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            clientId: user.clientId,
            shopDomain: storeUrl,
            oauthClientId: clientId,           // Shopify App Client ID
            oauthClientSecret: clientSecret,   // Shopify App Secret
            redirectUri: `${window.location.origin}/client/channels/shopify/callback`,
          }),
        });

        const data = await response.json();

        if (data.success && data.authUrl) {
          // Store channel name and sync settings in sessionStorage for callback
          sessionStorage.setItem('shopify_channel_name', channelName);
          sessionStorage.setItem('shopify_client_id', user.clientId);
          sessionStorage.setItem('shopify_shop_domain', storeUrl);
          sessionStorage.setItem('shopify_sync_from_date', enableHistoricalSync ? syncFromDate : '');
          sessionStorage.setItem('shopify_historical_sync', enableHistoricalSync.toString());

          // Redirect to Shopify for authorization
          window.location.href = data.authUrl;
          return; // Don't continue execution
        } else {
          setSaveError(data.error || 'Failed to start OAuth flow');
          setIsSaving(false);
          return;
        }
      } else if (selectedChannel === 'Woocommerce') {
        // Save WooCommerce channel
        result = await onboardingApi.addWooCommerceChannel({
          clientId: user.clientId,
          storeUrl: storeUrl,
          consumerKey: clientId,
          consumerSecret: clientSecret,
          channelName: channelName,
          enableHistoricalSync: enableHistoricalSync,
          syncFromDate: enableHistoricalSync ? syncFromDate : undefined,
        });
      } else {
        setSaveError('Amazon channels are not yet supported');
        setIsSaving(false);
        return;
      }

      if (result.success) {
        setShowSuccessModal(true);
        // Trigger initial sync if channel was created
        if (result.channelId) {
          try {
            await onboardingApi.triggerInitialSync(
              result.channelId,
              enableHistoricalSync ? syncFromDate : undefined,
              enableHistoricalSync
            );
          } catch (syncErr) {
            console.error('Error triggering initial sync:', syncErr);
            // Don't show error to user as channel was created successfully
          }
        }
      } else {
        setSaveError(result.error || 'Failed to save channel');
      }
    } catch (err) {
      console.error('Error saving channel:', err);
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving the channel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push('/client/channels');
  };

  const handleToggleChannel = () => {
    setIsChannelOn(!isChannelOn);
  };

  const handleDeleteChannel = async () => {
    if (showDeleteConfirm) {
      if (!channelId || channelId === 'new') {
        router.push('/client/channels');
        return;
      }

      try {
        setIsSaving(true);
        const result = await channelsApi.deleteChannel(channelId);
        
        if (result.success) {
          router.push('/client/channels');
        } else {
          setSaveError(result.error || 'Failed to delete channel');
        }
      } catch (err) {
        console.error('Error deleting channel:', err);
        setSaveError(err instanceof Error ? err.message : 'Failed to delete channel');
      } finally {
        setIsSaving(false);
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleReloadLocations = async () => {
    if (!user?.clientId) return;

    try {
      setIsLoadingLocations(true);
      const response = await channelsApi.getWarehouseLocations(user.clientId);
      if (response.success) {
        setLocations(response.locations);
      }
    } catch (err) {
      console.error('Error reloading locations:', err);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    setIsLocationDropdownOpen(false);
  };

  const handleReloadMethods = async () => {
    if (!channelId || channelId === 'new') return;

    try {
      setIsLoadingMethods(true);
      const response = await channelsApi.getShippingMethods(channelId);
      if (response.success) {
        setWarehouseMethods(response.warehouseMethods);
        setChannelMethods(response.channelMethods);
      }
    } catch (err) {
      console.error('Error reloading methods:', err);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleMethodSelect = (warehouseId: string, methodName: string) => {
    setSelectedMethods((prev) => ({
      ...prev,
      [warehouseId]: methodName,
    }));
    setOpenShippingDropdown(null);
  };

  const handleSaveShippingMappings = async () => {
    if (!channelId || channelId === 'new') {
      setShippingSaveError('Please save the channel first before configuring shipping mappings');
      return;
    }

    try {
      setIsSavingShipping(true);
      setShippingSaveError(null);
      setShippingSaveSuccess(false);

      // Convert selectedMethods to proper format (warehouseMethodId -> channelMethodName)
      const mappings: Record<string, string> = {};
      for (const [warehouseMethodId, channelMethodName] of Object.entries(selectedMethods)) {
        if (channelMethodName) {
          mappings[warehouseMethodId] = channelMethodName;
        }
      }

      const result = await channelsApi.saveShippingMappings(channelId, mappings);

      if (!result.success) {
        setShippingSaveError(result.error || 'Failed to save shipping mappings');
        return;
      }

      setShippingSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShippingSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving shipping mappings:', err);
      setShippingSaveError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingShipping(false);
    }
  };

  // Get channel-specific labels
  const getUrlLabel = () => {
    switch (selectedChannel) {
      case 'Shopify':
        return tChannels('shopifyStoreUrl');
      case 'Amazon':
        return tChannels('amazonMarketplaceUrl');
      default:
        return tChannels('woocommerceUrl');
    }
  };

  const getApiTitle = () => {
    switch (selectedChannel) {
      case 'Shopify':
        return tChannels('shopifyApi');
      case 'Amazon':
        return tChannels('amazonApi');
      default:
        return tChannels('woocommerceApi');
    }
  };

  const getChannelLabel = () => {
    switch (selectedChannel) {
      case 'Shopify':
        return 'Shopify';
      case 'Amazon':
        return 'Amazon';
      default:
        return 'Woocommerce';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#F9FAFB',
        padding: 'clamp(24px, 2.36vw, 32px) clamp(39px, 3.83vw, 52px)',
        paddingBottom: 'clamp(100px, 9.81vw, 150px)',
      }}
    >
      {/* Back Button - No arrow */}
      <button
        onClick={handleBack}
        style={{
          height: 'clamp(29px, 2.80vw, 38px)',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 'clamp(30px, 2.94vw, 40px)',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(11px, 1.03vw, 14px)',
            lineHeight: 'clamp(15px, 1.47vw, 20px)',
            color: '#374151',
          }}
        >
          {tCommon('back')}
        </span>
      </button>

      {/* Sales-Channels Title */}
      <h1
        style={{
          width: '100%',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(14px, 1.33vw, 18px)',
          lineHeight: 'clamp(18px, 1.77vw, 24px)',
          color: '#111827',
          margin: '0 0 clamp(15px, 1.47vw, 20px) 0',
        }}
      >
        {tChannels('title')}
      </h1>

      {/* Horizontal Line */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#E5E7EB',
          marginBottom: 'clamp(32px, 3.14vw, 48px)',
        }}
      />

      {/* JTL Configuration Status Banner - Shows for new channels when JTL is already configured */}
      {isNewChannel && hasJtlConfig && !isLoadingStatus && (
        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(912px, 89.54vw, 1216px)',
            borderRadius: '8px',
            backgroundColor: '#D1FAE5',
            border: '1px solid #A7F3D0',
            padding: 'clamp(12px, 1.18vw, 16px) clamp(16px, 1.57vw, 24px)',
            marginBottom: 'clamp(24px, 2.36vw, 32px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'clamp(12px, 1.18vw, 16px)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, marginTop: '2px' }}
          >
            <circle cx="10" cy="10" r="9" stroke="#059669" strokeWidth="1.5" fill="none" />
            <path
              d="M6 10L9 13L14 7"
              stroke="#059669"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#065F46',
                margin: '0 0 clamp(4px, 0.39vw, 6px) 0',
              }}
            >
              JTL Credentials Already Configured
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#047857',
                margin: 0,
              }}
            >
              Your JTL connection is active. Simply enter your {selectedChannel} store credentials below to add this channel.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner - Shows save errors */}
      {saveError && (
        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(912px, 89.54vw, 1216px)',
            borderRadius: '8px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            padding: 'clamp(12px, 1.18vw, 16px) clamp(16px, 1.57vw, 24px)',
            marginBottom: 'clamp(24px, 2.36vw, 32px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'clamp(12px, 1.18vw, 16px)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, marginTop: '2px' }}
          >
            <circle cx="10" cy="10" r="9" stroke="#DC2626" strokeWidth="1.5" fill="none" />
            <path
              d="M10 6V10M10 14H10.01"
              stroke="#DC2626"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#991B1B',
                margin: 0,
              }}
            >
              {saveError}
            </p>
          </div>
          <button
            onClick={() => setSaveError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: '#991B1B',
              fontSize: 'clamp(16px, 1.57vw, 20px)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Channel Information Section */}
      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(912px, 89.54vw, 1216px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 1.77vw, 24px)',
          marginBottom: 'clamp(48px, 4.71vw, 64px)',
        }}
      >
        {/* Left Side - Title and Description */}
        <div
          style={{
            width: 'clamp(292px, 28.65vw, 389px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3px, 0.29vw, 4px)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(14px, 1.33vw, 18px)',
              lineHeight: 'clamp(18px, 1.77vw, 24px)',
              color: '#111827',
              margin: 0,
            }}
          >
            {tChannels('channelInformation')}
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#6B7280',
              margin: 0,
            }}
          >
            {tChannels('channelInformationDescription')}
          </p>
        </div>

        {/* Right Side - Form Card */}
        <div
          style={{
            flex: 1,
            maxWidth: 'clamp(602px, 59.13vw, 803px)',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(18px, 1.77vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Channel Name Field */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 0.59vw, 8px)',
            }}
          >
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
              }}
            >
              {tChannels('channelName')}
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder=""
              style={{
                width: '100%',
                maxWidth: 'clamp(371px, 36.45vw, 495px)',
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>

          {/* Channel Type Field */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 0.59vw, 8px)',
            }}
          >
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
              }}
            >
              {tChannels('channelLabel')}
            </label>
            <div className="relative" style={{ width: '100%', maxWidth: 'clamp(281px, 27.54vw, 374px)' }}>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="appearance-none cursor-pointer"
                style={{
                  width: '100%',
                  height: 'clamp(29px, 2.80vw, 38px)',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  padding: 'clamp(7px, 0.66vw, 9px) clamp(30px, 2.94vw, 40px) clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#111827',
                  outline: 'none',
                }}
              >
                {channelTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  right: 'clamp(10px, 0.96vw, 13px)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                <path
                  d="M6 8L10 12L14 8"
                  stroke="#9CA3AF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Settings Section - Only show for new channels */}
      {isNewChannel && (
        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(912px, 89.54vw, 1216px)',
            display: 'flex',
            flexDirection: 'row',
            gap: 'clamp(18px, 1.77vw, 24px)',
            marginBottom: 'clamp(48px, 4.71vw, 64px)',
          }}
        >
          {/* Left Side - Title and Description */}
          <div
            style={{
              width: 'clamp(292px, 28.65vw, 389px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(3px, 0.29vw, 4px)',
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(14px, 1.33vw, 18px)',
                lineHeight: 'clamp(18px, 1.77vw, 24px)',
                color: '#111827',
                margin: 0,
              }}
            >
              Sync Settings
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#6B7280',
                margin: 0,
              }}
            >
              Configure how historical data should be synchronized for this channel
            </p>
          </div>

          {/* Right Side - Form Card */}
          <div
            style={{
              flex: 1,
              maxWidth: 'clamp(602px, 59.13vw, 803px)',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              padding: 'clamp(18px, 1.77vw, 24px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(18px, 1.77vw, 24px)',
            }}
          >
            {/* Historical Sync Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'clamp(12px, 1.18vw, 16px)',
                borderBottom: enableHistoricalSync ? '1px solid #E5E7EB' : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#374151',
                    display: 'block',
                    marginBottom: 'clamp(4px, 0.39vw, 6px)',
                  }}
                >
                  Enable Historical Sync
                </label>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(10px, 0.96vw, 13px)',
                    lineHeight: 'clamp(14px, 1.37vw, 18px)',
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  {enableHistoricalSync
                    ? 'Sync historical data from a specific date'
                    : 'Only sync recent data (last 7 days)'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setEnableHistoricalSync(!enableHistoricalSync)}
                style={{
                  width: 'clamp(36px, 3.53vw, 48px)',
                  height: 'clamp(20px, 1.96vw, 26px)',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: enableHistoricalSync ? '#003450' : '#E5E7EB',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  padding: 0,
                  flexShrink: 0,
                  marginLeft: 'clamp(16px, 1.57vw, 24px)',
                }}
              >
                <div
                  style={{
                    width: 'clamp(16px, 1.57vw, 22px)',
                    height: 'clamp(16px, 1.57vw, 22px)',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: enableHistoricalSync ? 'calc(100% - clamp(18px, 1.77vw, 24px))' : 'clamp(2px, 0.20vw, 2px)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Date Picker - Only show if historical sync is enabled */}
            {enableHistoricalSync && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(6px, 0.59vw, 8px)',
                }}
              >
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#374151',
                  }}
                >
                  Sync From Date
                </label>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(10px, 0.96vw, 13px)',
                    lineHeight: 'clamp(14px, 1.37vw, 18px)',
                    color: '#6B7280',
                    margin: '0 0 clamp(6px, 0.59vw, 8px) 0',
                  }}
                >
                  All orders, products, and returns from this date onwards will be synchronized
                </p>
                <input
                  type="date"
                  value={syncFromDate}
                  onChange={(e) => setSyncFromDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    maxWidth: 'clamp(281px, 27.54vw, 374px)',
                    height: 'clamp(29px, 2.80vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#111827',
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* API Configuration Section */}
      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(912px, 89.54vw, 1216px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 1.77vw, 24px)',
          marginBottom: 'clamp(48px, 4.71vw, 64px)',
        }}
      >
        {/* Left Side - Title, Description, and Warning */}
        <div
          style={{
            width: 'clamp(292px, 28.65vw, 389px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
            flexShrink: 0,
          }}
        >
          {/* Title and Description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(3px, 0.29vw, 4px)',
            }}
          >
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(14px, 1.33vw, 18px)',
                lineHeight: 'clamp(18px, 1.77vw, 24px)',
                color: '#111827',
                margin: 0,
              }}
            >
              {getApiTitle()}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#6B7280',
                margin: 0,
              }}
            >
              {tChannels('enterCredentials')}
            </p>
          </div>

          {/* Warning Box - Only show for Woocommerce */}
          {selectedChannel === 'Woocommerce' && (
            <div
              style={{
                width: '100%',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FEF3C7',
                padding: 'clamp(12px, 1.18vw, 16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 0.59vw, 8px)',
                }}
              >
                <WarningIcon />
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#D97706',
                  }}
                >
                  {tCommon('warning')}
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#92400E',
                  margin: 0,
                  paddingLeft: 'clamp(22px, 2.16vw, 28px)',
                }}
              >
                {tChannels('sslWarning')}
              </p>
            </div>
          )}
        </div>

        {/* Right Side - Form Card */}
        <div
          style={{
            flex: 1,
            maxWidth: 'clamp(602px, 59.13vw, 803px)',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(18px, 1.77vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Client ID Field */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 0.59vw, 8px)',
            }}
          >
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
              }}
            >
              {tChannels('clientId')}
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder=""
              style={{
                width: '100%',
                maxWidth: 'clamp(371px, 36.45vw, 495px)',
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>

          {/* Client Secret Field */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 0.59vw, 8px)',
            }}
          >
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
              }}
            >
              {tChannels('clientSecret')}
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder=""
              style={{
                width: '100%',
                maxWidth: 'clamp(371px, 36.45vw, 495px)',
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>

          {/* Store URL Field */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 0.59vw, 8px)',
            }}
          >
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
              }}
            >
              {getUrlLabel()}
            </label>
            <input
              type="text"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder=""
              style={{
                width: '100%',
                maxWidth: 'clamp(371px, 36.45vw, 495px)',
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Location/Warehouse Section */}
      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(912px, 89.54vw, 1216px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 1.77vw, 24px)',
          marginBottom: 'clamp(48px, 4.71vw, 64px)',
        }}
      >
        {/* Left Side - Title and Description */}
        <div
          style={{
            width: 'clamp(292px, 28.65vw, 389px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3px, 0.29vw, 4px)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(14px, 1.33vw, 18px)',
              lineHeight: 'clamp(18px, 1.77vw, 24px)',
              color: '#111827',
              margin: 0,
            }}
          >
            {tChannels('chooseLocation')}
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#6B7280',
              margin: 0,
            }}
          >
            {tChannels('chooseLocationDescription', { channel: selectedChannel.toLowerCase() })}
          </p>
        </div>

        {/* Right Side - Form Card */}
        <div
          style={{
            flex: 1,
            maxWidth: 'clamp(602px, 59.13vw, 803px)',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(18px, 1.77vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Warehouse and Location Row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(18px, 1.77vw, 24px)',
            }}
          >
            {/* Warehouse Column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#374151',
                  textAlign: 'center',
                }}
              >
                {tChannels('warehouse')}
              </label>
              <div
                style={{
                  width: '100%',
                  maxWidth: 'clamp(240px, 23.56vw, 320px)',
                  height: 'clamp(27px, 2.65vw, 36px)',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  padding: 'clamp(6px, 0.59vw, 8px) clamp(9px, 0.88vw, 12px)',
                  backgroundColor: '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#6B7280',
                  }}
                >
                  JTL FFN Warehouse
                </span>
              </div>
            </div>

            {/* Location Column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#374151',
                  textAlign: 'center',
                }}
              >
                {getChannelLabel()}
              </label>
              
              {/* Custom Dropdown */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 'clamp(240px, 23.56vw, 320px)',
                }}
              >
                <button
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  style={{
                    width: '100%',
                    height: 'clamp(29px, 2.80vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: selectedLocation ? '#111827' : '#9CA3AF',
                  }}
                >
                  <span>{selectedLocation || 'Location'}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: isLocationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isLocationDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      maxHeight: 'clamp(180px, 17.67vw, 240px)',
                      overflowY: 'auto',
                      zIndex: 10,
                    }}
                  >
                    {locations.map((location, index) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location.name)}
                        style={{
                          width: '100%',
                          padding: 'clamp(8px, 0.78vw, 10px) clamp(10px, 0.96vw, 13px)',
                          backgroundColor: selectedLocation === location.name ? '#F9FAFB' : '#FFFFFF',
                          border: 'none',
                          borderBottom: index < locations.length - 1 ? '1px solid #F3F4F6' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(11px, 1.03vw, 14px)',
                          lineHeight: 'clamp(15px, 1.47vw, 20px)',
                          color: '#111827',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = selectedLocation === location.name ? '#F9FAFB' : '#FFFFFF';
                        }}
                      >
                        <span>{location.name}</span>
                        {selectedLocation === location.name && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3333 4L6 11.3333L2.66667 8"
                              stroke="#003450"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reload Locations Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <button
              onClick={handleReloadLocations}
              style={{
                height: 'clamp(30px, 2.94vw, 40px)',
                borderRadius: '100px',
                border: 'none',
                padding: 'clamp(8px, 0.78vw, 10px) clamp(12px, 1.18vw, 16px)',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 0.59vw, 8px)',
                cursor: 'pointer',
              }}
            >
              <DownloadIcon />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: '1',
                  color: '#003450',
                }}
              >
                {tChannels('reloadLocations')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Match Shipping Methods Section - Only show for existing channels */}
      {!isNewChannel && channelId && channelId !== 'new' && (
      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(912px, 89.54vw, 1216px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 1.77vw, 24px)',
          marginBottom: 'clamp(48px, 4.71vw, 64px)',
        }}
      >
        {/* Left Side - Title and Description */}
        <div
          style={{
            width: 'clamp(292px, 28.65vw, 389px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3px, 0.29vw, 4px)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(14px, 1.33vw, 18px)',
              lineHeight: 'clamp(18px, 1.77vw, 24px)',
              color: '#111827',
              margin: 0,
            }}
          >
            Match Shipping Methods
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#6B7280',
              margin: 0,
            }}
          >
            Here you will match your methods with our methods
          </p>
        </div>

        {/* Right Side - Form Card */}
        <div
          style={{
            flex: 1,
            maxWidth: 'clamp(602px, 59.13vw, 803px)',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(18px, 1.77vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Success Message */}
          {shippingSaveSuccess && (
            <div
              style={{
                padding: 'clamp(12px, 1.18vw, 16px)',
                backgroundColor: '#D1FAE5',
                border: '1px solid #A7F3D0',
                borderRadius: '6px',
                color: '#065F46',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              Shipping mappings saved successfully!
            </div>
          )}

          {/* Error Message */}
          {shippingSaveError && (
            <div
              style={{
                padding: 'clamp(12px, 1.18vw, 16px)',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                color: '#DC2626',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{shippingSaveError}</span>
              <button
                onClick={() => setShippingSaveError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#DC2626',
                  fontSize: 'clamp(16px, 1.57vw, 20px)',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(18px, 1.77vw, 24px)',
            }}
          >
            <div
              style={{
                flex: 1,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
                textAlign: 'center',
              }}
            >
              Warehouse
            </div>
            <div
              style={{
                flex: 1,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#374151',
                textAlign: 'center',
              }}
            >
              {getChannelLabel()}
            </div>
          </div>

          {/* Loading State */}
          {isLoadingMethods && (
            <div
              style={{
                padding: 'clamp(24px, 2.36vw, 32px)',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              Loading shipping methods...
            </div>
          )}

          {/* Empty State - No Warehouse Methods */}
          {!isLoadingMethods && warehouseMethods.length === 0 && (
            <div
              style={{
                padding: 'clamp(24px, 2.36vw, 32px)',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              No warehouse shipping methods available. Please contact support to configure shipping methods.
            </div>
          )}

          {/* Empty State - No Channel Methods */}
          {!isLoadingMethods && warehouseMethods.length > 0 && channelMethods.length === 0 && (
            <div
              style={{
                padding: 'clamp(12px, 1.18vw, 16px)',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '6px',
                color: '#92400E',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              No shipping methods found in your {getChannelLabel()} store. Please configure shipping zones in your store first, then click &quot;Reload methods&quot;.
            </div>
          )}

          {/* Method Rows */}
          {!isLoadingMethods && warehouseMethods.map((warehouseMethod) => (
            <div
              key={warehouseMethod.id}
              style={{
                display: 'flex',
                gap: 'clamp(18px, 1.77vw, 24px)',
                alignItems: 'center',
              }}
            >
              {/* Warehouse Method (Read-only) */}
              <div
                style={{
                  flex: 1,
                  height: 'clamp(36px, 3.53vw, 48px)',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  padding: 'clamp(8px, 0.78vw, 12px) clamp(12px, 1.18vw, 16px)',
                  backgroundColor: '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#6B7280',
                  }}
                >
                  {warehouseMethod.name}
                </span>
              </div>

              {/* Channel Method Dropdown */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setOpenShippingDropdown(openShippingDropdown === warehouseMethod.id ? null : warehouseMethod.id)}
                  style={{
                    width: '100%',
                    height: 'clamp(36px, 3.53vw, 48px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: 'clamp(8px, 0.78vw, 12px) clamp(12px, 1.18vw, 16px)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#111827',
                  }}
                >
                  <span>{selectedMethods[warehouseMethod.id] || 'Select method'}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: openShippingDropdown === warehouseMethod.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openShippingDropdown === warehouseMethod.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      maxHeight: 'clamp(160px, 15.69vw, 220px)',
                      overflowY: 'auto',
                      zIndex: 100,
                    }}
                  >
                    {channelMethods.map((method, index) => (
                      <button
                        key={method.id}
                        onClick={() => handleMethodSelect(warehouseMethod.id, method.name)}
                        style={{
                          width: '100%',
                          padding: 'clamp(10px, 0.98vw, 14px) clamp(12px, 1.18vw, 16px)',
                          backgroundColor: selectedMethods[warehouseMethod.id] === method.name ? '#F9FAFB' : '#FFFFFF',
                          border: 'none',
                          borderBottom: index < channelMethods.length - 1 ? '1px solid #F3F4F6' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: selectedMethods[warehouseMethod.id] === method.name ? 500 : 400,
                          fontSize: 'clamp(11px, 1.03vw, 14px)',
                          lineHeight: 'clamp(15px, 1.47vw, 20px)',
                          color: '#111827',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            selectedMethods[warehouseMethod.id] === method.name ? '#F9FAFB' : '#FFFFFF';
                        }}
                      >
                        <span>{method.name}</span>
                        {selectedMethods[warehouseMethod.id] === method.name && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3333 4L6 11.3333L2.66667 8"
                              stroke="#003450"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Action Buttons Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'clamp(12px, 1.18vw, 16px)',
            }}
          >
            {/* Reload Methods Button */}
            <button
              onClick={handleReloadMethods}
              style={{
                height: 'clamp(30px, 2.94vw, 40px)',
                borderRadius: '100px',
                border: 'none',
                padding: 'clamp(8px, 0.78vw, 10px) clamp(12px, 1.18vw, 16px)',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 0.59vw, 8px)',
                cursor: 'pointer',
              }}
            >
              <DownloadIcon />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: '1',
                  color: '#003450',
                }}
              >
                Reload methods
              </span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveShippingMappings}
              disabled={isSavingShipping || isLoadingMethods}
              style={{
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: 'none',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                backgroundColor: isSavingShipping || isLoadingMethods ? '#9CA3AF' : '#003450',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                cursor: isSavingShipping || isLoadingMethods ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(6px, 0.59vw, 8px)',
                opacity: isSavingShipping || isLoadingMethods ? 0.7 : 1,
              }}
            >
              {isSavingShipping && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <path
                    d="M7 1V3M7 11V13M3.5 3.5L4.91 4.91M9.09 9.09L10.5 10.5M1 7H3M11 7H13M3.5 10.5L4.91 9.09M9.09 4.91L10.5 3.5"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: '1',
                  color: '#FFFFFF',
                }}
              >
                {isSavingShipping ? 'Saving...' : tCommon('save')}
              </span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Manage Channel Section */}
      {!isNewChannel && (
        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(912px, 89.54vw, 1216px)',
            display: 'flex',
            flexDirection: 'row',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Left Side - Title and Description */}
          <div
            style={{
              width: 'clamp(292px, 28.65vw, 389px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(3px, 0.29vw, 4px)',
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(14px, 1.33vw, 18px)',
                lineHeight: 'clamp(18px, 1.77vw, 24px)',
                color: '#111827',
                margin: 0,
              }}
            >
              {tChannels('manageChannel')}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(15px, 1.47vw, 20px)',
                color: '#6B7280',
                margin: 0,
              }}
            >
              {tChannels('manageChannelDescription')}
            </p>
          </div>

          {/* Right Side - Toggle and Delete Cards */}
          <div
            style={{
              flex: 1,
              maxWidth: 'clamp(602px, 59.13vw, 803px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(18px, 1.77vw, 24px)',
            }}
          >
            {/* Turn off Channel Card */}
            <div
              style={{
                width: '100%',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                padding: 'clamp(18px, 1.77vw, 24px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#111827',
                }}
              >
                {tChannels('turnOffChannel')}
              </span>
              
              {/* Toggle Switch */}
              <button
                onClick={handleToggleChannel}
                style={{
                  width: 'clamp(36px, 3.53vw, 48px)',
                  height: 'clamp(20px, 1.96vw, 26px)',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: isChannelOn ? '#003450' : '#E5E7EB',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 'clamp(16px, 1.57vw, 22px)',
                    height: 'clamp(16px, 1.57vw, 22px)',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: isChannelOn ? 'calc(100% - clamp(18px, 1.77vw, 24px))' : 'clamp(2px, 0.20vw, 2px)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Delete Channel Card */}
            <div
              style={{
                width: '100%',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                padding: 'clamp(18px, 1.77vw, 24px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(15px, 1.47vw, 20px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(6px, 0.59vw, 8px)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#111827',
                    margin: 0,
                  }}
                >
                  {tChannels('deleteChannel')}
                </h3>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  {tCommon('deleteWarning')}
                </p>
              </div>
              
              <button
                onClick={handleDeleteChannel}
                style={{
                  width: 'fit-content',
                  height: 'clamp(29px, 2.80vw, 38px)',
                  borderRadius: '6px',
                  border: 'none',
                  padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                  backgroundColor: '#FEE2E2',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#991B1B',
                  }}
                >
                  {tChannels('deleteChannel')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={handleModalClose} />
    </div>
  );
}
