'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { shippingMethodsApi, ShippingMethod } from '@/lib/shipping-methods-api';
import { onboardingApi } from '@/lib/onboarding-api';

// Keyframes for spin animation (injected once)
if (typeof document !== 'undefined' && !document.getElementById('ffn-spin-keyframes')) {
  const style = document.createElement('style');
  style.id = 'ffn-spin-keyframes';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

interface JTLStatus {
  success: boolean;
  configured: boolean;
  hasOAuth: boolean;
  environment: string | null;
  fulfillerId?: string;
  warehouseId?: string;
  lastSyncAt?: string;
}

// Info Row Component
function InfoRow({ label, value, valueColor = '#111827' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(12px, 1.18vw, 16px) 0',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: 'clamp(16px, 1.47vw, 20px)',
          color: '#6B7280',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: 'clamp(16px, 1.47vw, 20px)',
          color: valueColor,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ isActive, activeText, inactiveText }: { isActive: boolean; activeText: string; inactiveText: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'clamp(20px, 1.77vw, 24px)',
        borderRadius: '12px',
        padding: 'clamp(2px, 0.20vw, 4px) clamp(10px, 0.98vw, 14px)',
        backgroundColor: isActive ? '#DEF7EC' : '#FDE8E8',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: 'clamp(11px, 0.96vw, 13px)',
        lineHeight: 'clamp(14px, 1.27vw, 18px)',
        color: isActive ? '#03543F' : '#9B1C1C',
      }}
    >
      {isActive ? activeText : inactiveText}
    </span>
  );
}

export function FFNAccountDetails() {
  const t = useTranslations('channels.ffn');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<JTLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [syncingShipping, setSyncingShipping] = useState(false);
  const [shippingSyncResult, setShippingSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Re-authenticate state
  const [reauthenticating, setReauthenticating] = useState(false);
  const [reauthResult, setReauthResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reconfigure modal state
  const [showReconfigureModal, setShowReconfigureModal] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);
  const [reconfigureError, setReconfigureError] = useState<string | null>(null);
  const [reconfigureForm, setReconfigureForm] = useState({
    jtlClientId: '',
    jtlClientSecret: '',
    fulfillerId: '',
    warehouseId: '',
    environment: 'sandbox' as 'sandbox' | 'production',
  });

  useEffect(() => {
    fetchJTLStatus();
    fetchShippingMethods();
  }, [user?.clientId]);

  const fetchJTLStatus = async () => {
    if (!user?.clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/integrations/jtl/status/${user.clientId}`);
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch JTL status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch JTL status');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      const response = await shippingMethodsApi.getAll(true);
      if (response.success && response.data) {
        setShippingMethods(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch shipping methods:', err);
    }
  };

  const handleSyncShippingMethods = async () => {
    setSyncingShipping(true);
    setShippingSyncResult(null);

    try {
      const response = await shippingMethodsApi.syncFromJTL();
      if (response.success) {
        setShippingSyncResult({
          success: true,
          message: t('shippingSyncSuccess', { count: response.synced || 0 }),
        });
        if (response.shippingMethods) {
          setShippingMethods(response.shippingMethods);
        } else {
          // Refresh the list
          await fetchShippingMethods();
        }
      } else {
        setShippingSyncResult({
          success: false,
          message: response.error || t('shippingSyncFailed'),
        });
      }
    } catch (err) {
      setShippingSyncResult({
        success: false,
        message: t('shippingSyncFailed'),
      });
    } finally {
      setSyncingShipping(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user?.clientId) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await api.post(`/integrations/jtl/test/${user.clientId}`);
      setTestResult({
        success: response.data.success,
        message: response.data.success ? t('connectionSuccess') : t('connectionFailed'),
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: t('connectionFailed'),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfigure = () => {
    router.push('/client/setup?step=jtl');
  };

  const handleOpenReconfigureModal = () => {
    // Pre-populate with current values
    setReconfigureForm({
      jtlClientId: '',
      jtlClientSecret: '',
      fulfillerId: status?.fulfillerId || '',
      warehouseId: status?.warehouseId || '',
      environment: (status?.environment as 'sandbox' | 'production') || 'sandbox',
    });
    setReconfigureError(null);
    setShowReconfigureModal(true);
  };

  const handleCloseReconfigureModal = () => {
    setShowReconfigureModal(false);
    setReconfigureError(null);
    setReconfiguring(false);
  };

  const handleReconfigure = async () => {
    if (!user?.clientId) return;

    // Validate required fields
    if (!reconfigureForm.jtlClientId.trim()) {
      setReconfigureError(t('reconfigureClientIdRequired'));
      return;
    }
    if (!reconfigureForm.jtlClientSecret.trim()) {
      setReconfigureError(t('reconfigureClientSecretRequired'));
      return;
    }
    if (!reconfigureForm.fulfillerId.trim()) {
      setReconfigureError(t('reconfigureFulfillerIdRequired'));
      return;
    }
    if (!reconfigureForm.warehouseId.trim()) {
      setReconfigureError(t('reconfigureWarehouseIdRequired'));
      return;
    }

    setReconfiguring(true);
    setReconfigureError(null);

    let oauthCompleted = false;

    try {
      // Save new JTL credentials
      const result = await onboardingApi.setupJTLCredentials({
        clientId: user.clientId,
        jtlClientId: reconfigureForm.jtlClientId.trim(),
        jtlClientSecret: reconfigureForm.jtlClientSecret.trim(),
        fulfillerId: reconfigureForm.fulfillerId.trim(),
        warehouseId: reconfigureForm.warehouseId.trim(),
        environment: reconfigureForm.environment,
      });

      if (!result.success) {
        setReconfigureError(result.error || t('reconfigureFailed'));
        setReconfiguring(false);
        return;
      }

      // Trigger OAuth flow
      const redirectUri = `${window.location.origin}/integrations/jtl/callback`;
      const authUrlResponse = await onboardingApi.getJTLAuthUrl(
        user.clientId,
        redirectUri,
        reconfigureForm.environment
      );

      // Open popup with the auth URL
      const popup = window.open(
        authUrlResponse.authUrl,
        'jtl-oauth',
        'width=500,height=700'
      );

      if (!popup) {
        setReconfigureError(t('popupBlocked'));
        setReconfiguring(false);
        return;
      }

      // Listen for messages from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'jtl-oauth-success') {
          oauthCompleted = true;
          window.removeEventListener('message', handleMessage);

          // Close modal and show success
          setShowReconfigureModal(false);
          setReconfiguring(false);

          setReauthResult({
            success: true,
            message: t('reconfigureSuccess'),
          });

          // Refresh the status
          await fetchJTLStatus();

          // Automatically sync shipping methods
          await handleSyncShippingMethods();
        } else if (event.data.type === 'jtl-oauth-error') {
          oauthCompleted = true;
          window.removeEventListener('message', handleMessage);

          setReconfigureError(event.data.error || t('reconfigureFailed'));
          setReconfiguring(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup is closed without completing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);

          if (!oauthCompleted) {
            setReconfigureError(t('reauthCancelled'));
            setReconfiguring(false);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to reconfigure JTL:', err);
      setReconfigureError(t('reconfigureFailed'));
      setReconfiguring(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!user?.clientId) return;

    setReauthenticating(true);
    setReauthResult(null);
    setTestResult(null);

    let completed = false;

    try {
      // Get the environment from current status (default to sandbox if not known)
      const environment = (status?.environment as 'sandbox' | 'production') || 'sandbox';
      
      // Get OAuth authorization URL
      const redirectUri = `${window.location.origin}/integrations/jtl/callback`;
      const authUrlResponse = await onboardingApi.getJTLAuthUrl(
        user.clientId,
        redirectUri,
        environment
      );

      // Open popup with the auth URL
      const popup = window.open(
        authUrlResponse.authUrl,
        'jtl-oauth',
        'width=500,height=700'
      );

      if (!popup) {
        setReauthResult({
          success: false,
          message: t('popupBlocked'),
        });
        setReauthenticating(false);
        return;
      }

      // Listen for messages from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'jtl-oauth-success') {
          completed = true;
          window.removeEventListener('message', handleMessage);
          
          setReauthResult({
            success: true,
            message: t('reauthSuccess'),
          });
          
          // Refresh the status
          await fetchJTLStatus();
          
          // Automatically sync shipping methods after re-authentication
          await handleSyncShippingMethods();
          
          setReauthenticating(false);
        } else if (event.data.type === 'jtl-oauth-error') {
          completed = true;
          window.removeEventListener('message', handleMessage);
          
          setReauthResult({
            success: false,
            message: event.data.error || t('reauthFailed'),
          });
          setReauthenticating(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Also check if popup is closed without completing
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          
          // Only set as cancelled if we haven't received a success/error
          if (!completed) {
            setReauthResult({
              success: false,
              message: t('reauthCancelled'),
            });
            setReauthenticating(false);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start re-authentication:', err);
      setReauthResult({
        success: false,
        message: t('reauthFailed'),
      });
      setReauthenticating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(60px, 5.89vw, 80px)',
          color: '#6B7280',
          fontSize: 'clamp(12px, 1.03vw, 14px)',
        }}
      >
        {tCommon('loading')}...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'clamp(40px, 3.93vw, 60px)',
          gap: 'clamp(12px, 1.18vw, 16px)',
        }}
      >
        <span style={{ color: '#DC2626', fontSize: 'clamp(12px, 1.03vw, 14px)' }}>{error}</span>
        <button
          onClick={fetchJTLStatus}
          style={{
            padding: 'clamp(8px, 0.78vw, 12px) clamp(16px, 1.57vw, 24px)',
            backgroundColor: '#003450',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: 'clamp(12px, 1.03vw, 14px)',
          }}
        >
          {tCommon('retry')}
        </button>
      </div>
    );
  }

  // Not configured state
  if (!status?.configured) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 'clamp(60px, 5.89vw, 80px)',
          paddingBottom: 'clamp(60px, 5.89vw, 80px)',
        }}
      >
        {/* FFN Icon */}
        <div
          style={{
            width: 'clamp(48px, 4.71vw, 64px)',
            height: 'clamp(48px, 4.71vw, 64px)',
            borderRadius: '50%',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 1.57vw, 24px)',
          }}
        >
          <svg
            width="clamp(24px, 2.36vw, 32px)"
            height="clamp(24px, 2.36vw, 32px)"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(14px, 1.33vw, 18px)',
            lineHeight: 'clamp(18px, 1.77vw, 24px)',
            color: '#111827',
            margin: '0 0 clamp(8px, 0.78vw, 12px) 0',
            textAlign: 'center',
          }}
        >
          {t('notConfigured')}
        </h2>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(12px, 1.03vw, 14px)',
            lineHeight: 'clamp(16px, 1.47vw, 20px)',
            color: '#6B7280',
            margin: '0 0 clamp(20px, 1.96vw, 28px) 0',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          Connect your JTL FFN account to enable fulfillment synchronization.
        </p>
        <button
          onClick={handleConfigure}
          style={{
            height: 'clamp(36px, 3.53vw, 44px)',
            borderRadius: '6px',
            border: 'none',
            padding: 'clamp(10px, 0.98vw, 14px) clamp(20px, 1.96vw, 28px)',
            backgroundColor: '#003450',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(12px, 1.03vw, 14px)',
            lineHeight: 'clamp(16px, 1.47vw, 20px)',
            color: '#FFFFFF',
          }}
        >
          {t('configureNow')}
        </button>
      </div>
    );
  }

  // Configured state - show account details
  return (
    <div
      style={{
        maxWidth: '600px',
      }}
    >
      {/* Account Details Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
          padding: 'clamp(20px, 1.96vw, 28px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 1.18vw, 16px)',
            marginBottom: 'clamp(20px, 1.96vw, 28px)',
            paddingBottom: 'clamp(16px, 1.57vw, 22px)',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {/* JTL FFN Logo/Icon */}
          <div
            style={{
              width: 'clamp(40px, 3.93vw, 52px)',
              height: 'clamp(40px, 3.93vw, 52px)',
              borderRadius: '8px',
              backgroundColor: '#003450',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(12px, 1.18vw, 16px)',
                color: '#FFFFFF',
              }}
            >
              FFN
            </span>
          </div>
          <div>
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(14px, 1.33vw, 18px)',
                lineHeight: 'clamp(18px, 1.77vw, 24px)',
                color: '#111827',
                margin: 0,
              }}
            >
              {t('title')}
            </h3>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(11px, 0.96vw, 13px)',
                color: '#6B7280',
              }}
            >
              JTL Fulfillment Network
            </span>
          </div>
        </div>

        {/* Status Info */}
        <div style={{ marginBottom: 'clamp(4px, 0.39vw, 8px)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'clamp(12px, 1.18vw, 16px) 0',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: '#6B7280',
              }}
            >
              {t('status')}
            </span>
            <StatusBadge
              isActive={status.configured}
              activeText={t('connected')}
              inactiveText={t('notConnected')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'clamp(12px, 1.18vw, 16px) 0',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: '#6B7280',
              }}
            >
              {t('oauthStatus')}
            </span>
            <StatusBadge
              isActive={status.hasOAuth}
              activeText={t('authenticated')}
              inactiveText={t('notAuthenticated')}
            />
          </div>

          <InfoRow
            label={t('environment')}
            value={status.environment === 'production' ? t('production') : t('sandbox')}
            valueColor={status.environment === 'production' ? '#059669' : '#D97706'}
          />

          {status.fulfillerId && (
            <InfoRow label={t('fulfillerId')} value={status.fulfillerId} />
          )}

          {status.warehouseId && (
            <InfoRow label={t('warehouseId')} value={status.warehouseId} />
          )}

          <InfoRow
            label={t('lastSync')}
            value={status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : t('never')}
            valueColor="#6B7280"
          />
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            style={{
              padding: 'clamp(10px, 0.98vw, 14px)',
              borderRadius: '6px',
              backgroundColor: testResult.success ? '#DEF7EC' : '#FDE8E8',
              marginBottom: 'clamp(16px, 1.57vw, 22px)',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: testResult.success ? '#03543F' : '#9B1C1C',
              }}
            >
              {testResult.message}
            </span>
          </div>
        )}

        {/* Re-authenticate Result Message */}
        {reauthResult && (
          <div
            style={{
              padding: 'clamp(10px, 0.98vw, 14px)',
              borderRadius: '6px',
              backgroundColor: reauthResult.success ? '#DEF7EC' : '#FDE8E8',
              marginBottom: 'clamp(16px, 1.57vw, 22px)',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: reauthResult.success ? '#03543F' : '#9B1C1C',
              }}
            >
              {reauthResult.message}
            </span>
          </div>
        )}

        {/* Token Expiry Info */}
        <div
          style={{
            padding: 'clamp(10px, 0.98vw, 14px)',
            borderRadius: '6px',
            backgroundColor: '#FEF3C7',
            marginBottom: 'clamp(16px, 1.57vw, 22px)',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(11px, 0.96vw, 13px)',
              color: '#92400E',
            }}
          >
            {t('tokenExpiryInfo')}
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 0.98vw, 14px)',
            marginTop: 'clamp(20px, 1.96vw, 28px)',
          }}
        >
          {/* Primary row: Re-authenticate button */}
          <button
            onClick={handleReauthenticate}
            disabled={reauthenticating}
            style={{
              width: '100%',
              height: 'clamp(40px, 3.93vw, 48px)',
              borderRadius: '6px',
              border: 'none',
              padding: 'clamp(10px, 0.98vw, 14px) clamp(16px, 1.57vw, 22px)',
              backgroundColor: '#059669',
              cursor: reauthenticating ? 'not-allowed' : 'pointer',
              opacity: reauthenticating ? 0.6 : 1,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1.03vw, 14px)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: reauthenticating ? 'spin 1s linear infinite' : 'none',
              }}
            >
              <path
                d="M1 4V10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 20V14H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {reauthenticating ? t('reauthenticating') : t('reauthenticate')}
          </button>

          {/* Secondary row: Test Connection and Reconfigure */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(10px, 0.98vw, 14px)',
            }}
          >
            <button
              onClick={handleTestConnection}
              disabled={testing}
              style={{
                flex: 1,
                height: 'clamp(36px, 3.53vw, 44px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(10px, 0.98vw, 14px) clamp(16px, 1.57vw, 22px)',
                backgroundColor: '#FFFFFF',
                cursor: testing ? 'not-allowed' : 'pointer',
                opacity: testing ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: '#374151',
              }}
            >
              {testing ? `${tCommon('loading')}...` : t('testConnection')}
            </button>
            <button
              onClick={handleOpenReconfigureModal}
              style={{
                flex: 1,
                height: 'clamp(36px, 3.53vw, 44px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(10px, 0.98vw, 14px) clamp(16px, 1.57vw, 22px)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                color: '#374151',
              }}
            >
              {t('reconfigure')}
            </button>
          </div>
        </div>
      </div>

      {/* Shipping Methods Card */}
      {status.hasOAuth && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(20px, 1.96vw, 28px)',
            marginTop: 'clamp(20px, 1.96vw, 28px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'clamp(16px, 1.57vw, 22px)',
              paddingBottom: 'clamp(12px, 1.18vw, 16px)',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(14px, 1.33vw, 18px)',
                  lineHeight: 'clamp(18px, 1.77vw, 24px)',
                  color: '#111827',
                  margin: 0,
                }}
              >
                {t('shippingMethodsTitle')}
              </h3>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(11px, 0.96vw, 13px)',
                  color: '#6B7280',
                }}
              >
                {t('shippingMethodsDescription')}
              </span>
            </div>
            <button
              onClick={handleSyncShippingMethods}
              disabled={syncingShipping}
              style={{
                height: 'clamp(32px, 3.14vw, 40px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: 'clamp(8px, 0.78vw, 12px) clamp(14px, 1.37vw, 18px)',
                backgroundColor: '#FFFFFF',
                cursor: syncingShipping ? 'not-allowed' : 'pointer',
                opacity: syncingShipping ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 0.96vw, 13px)',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  animation: syncingShipping ? 'spin 1s linear infinite' : 'none',
                }}
              >
                <path
                  d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 4L14 2L14 5L11 5"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {syncingShipping ? `${tCommon('loading')}...` : t('syncShippingMethods')}
            </button>
          </div>

          {/* Sync Result Message */}
          {shippingSyncResult && (
            <div
              style={{
                padding: 'clamp(10px, 0.98vw, 14px)',
                borderRadius: '6px',
                backgroundColor: shippingSyncResult.success ? '#DEF7EC' : '#FDE8E8',
                marginBottom: 'clamp(16px, 1.57vw, 22px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  color: shippingSyncResult.success ? '#03543F' : '#9B1C1C',
                }}
              >
                {shippingSyncResult.message}
              </span>
            </div>
          )}

          {/* Shipping Methods List */}
          {shippingMethods.length === 0 ? (
            <div
              style={{
                padding: 'clamp(20px, 1.96vw, 28px)',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                backgroundColor: '#F9FAFB',
                borderRadius: '6px',
              }}
            >
              {t('noShippingMethods')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 0.78vw, 12px)' }}>
              {shippingMethods.map((method) => (
                <div
                  key={method.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'clamp(10px, 0.98vw, 14px) clamp(12px, 1.18vw, 16px)',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(12px, 1.03vw, 14px)',
                        color: '#111827',
                      }}
                    >
                      {method.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: 'clamp(10px, 0.88vw, 12px)',
                        color: '#6B7280',
                        marginTop: '2px',
                      }}
                    >
                      {method.carrier} • {method.jtlShippingMethodId}
                    </div>
                  </div>
                  <StatusBadge
                    isActive={method.isActive}
                    activeText={t('active')}
                    inactiveText={t('inactive')}
                  />
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 'clamp(16px, 1.57vw, 22px)',
              padding: 'clamp(10px, 0.98vw, 14px)',
              backgroundColor: '#F0F9FF',
              borderRadius: '6px',
              border: '1px solid #BAE6FD',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 0.96vw, 13px)',
                color: '#0369A1',
              }}
            >
              {t('shippingMethodsInfo')}
            </span>
          </div>
        </div>
      )}

      {/* Reconfigure Modal */}
      {showReconfigureModal && (
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
          onClick={handleCloseReconfigureModal}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(16px, 1.57vw, 24px)',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#003450',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#FFFFFF',
                    }}
                  >
                    FFN
                  </span>
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: 'clamp(16px, 1.47vw, 20px)',
                      color: '#111827',
                      margin: 0,
                    }}
                  >
                    {t('reconfigureTitle')}
                  </h2>
                  <p
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#6B7280',
                      margin: 0,
                    }}
                  >
                    {t('reconfigureSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseReconfigureModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#6B7280',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'clamp(16px, 1.57vw, 24px)' }}>
              {/* Error Message */}
              {reconfigureError && (
                <div
                  style={{
                    padding: 'clamp(10px, 0.98vw, 14px)',
                    borderRadius: '6px',
                    backgroundColor: '#FDE8E8',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#9B1C1C',
                    }}
                  >
                    {reconfigureError}
                  </span>
                </div>
              )}

              {/* Info Banner */}
              <div
                style={{
                  padding: 'clamp(10px, 0.98vw, 14px)',
                  borderRadius: '6px',
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  marginBottom: '20px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 'clamp(11px, 0.96vw, 13px)',
                    color: '#0369A1',
                  }}
                >
                  {t('reconfigureInfo')}
                </span>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* JTL Client ID */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('jtlClientId')} *
                  </label>
                  <input
                    type="text"
                    value={reconfigureForm.jtlClientId}
                    onChange={(e) => setReconfigureForm({ ...reconfigureForm, jtlClientId: e.target.value })}
                    placeholder={t('jtlClientIdPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* JTL Client Secret */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('jtlClientSecret')} *
                  </label>
                  <input
                    type="password"
                    value={reconfigureForm.jtlClientSecret}
                    onChange={(e) => setReconfigureForm({ ...reconfigureForm, jtlClientSecret: e.target.value })}
                    placeholder={t('jtlClientSecretPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Fulfiller ID */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('fulfillerId')} *
                  </label>
                  <input
                    type="text"
                    value={reconfigureForm.fulfillerId}
                    onChange={(e) => setReconfigureForm({ ...reconfigureForm, fulfillerId: e.target.value })}
                    placeholder={t('fulfillerIdPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Warehouse ID */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('warehouseId')} *
                  </label>
                  <input
                    type="text"
                    value={reconfigureForm.warehouseId}
                    onChange={(e) => setReconfigureForm({ ...reconfigureForm, warehouseId: e.target.value })}
                    placeholder={t('warehouseIdPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Environment */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {t('environment')} *
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: `2px solid ${reconfigureForm.environment === 'sandbox' ? '#003450' : '#D1D5DB'}`,
                        backgroundColor: reconfigureForm.environment === 'sandbox' ? '#F0F9FF' : '#FFFFFF',
                        flex: 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="sandbox"
                        checked={reconfigureForm.environment === 'sandbox'}
                        onChange={() => setReconfigureForm({ ...reconfigureForm, environment: 'sandbox' })}
                        style={{ accentColor: '#003450' }}
                      />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 'clamp(12px, 1.03vw, 14px)',
                          color: '#374151',
                        }}
                      >
                        {t('sandbox')}
                      </span>
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: `2px solid ${reconfigureForm.environment === 'production' ? '#003450' : '#D1D5DB'}`,
                        backgroundColor: reconfigureForm.environment === 'production' ? '#F0F9FF' : '#FFFFFF',
                        flex: 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="production"
                        checked={reconfigureForm.environment === 'production'}
                        onChange={() => setReconfigureForm({ ...reconfigureForm, environment: 'production' })}
                        style={{ accentColor: '#003450' }}
                      />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 'clamp(12px, 1.03vw, 14px)',
                          color: '#374151',
                        }}
                      >
                        {t('production')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: 'clamp(16px, 1.57vw, 24px)',
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <button
                onClick={handleCloseReconfigureModal}
                disabled={reconfiguring}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  cursor: reconfiguring ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  color: '#374151',
                }}
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleReconfigure}
                disabled={reconfiguring}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#003450',
                  cursor: reconfiguring ? 'not-allowed' : 'pointer',
                  opacity: reconfiguring ? 0.6 : 1,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {reconfiguring && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path
                      d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {reconfiguring ? t('saving') : t('saveAndAuthorize')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
