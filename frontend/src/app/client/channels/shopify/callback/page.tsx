'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

function ShopifyCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const tIntegrations = useTranslations('integrations');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const shop = searchParams.get('shop');
        const hmac = searchParams.get('hmac');
        const timestamp = searchParams.get('timestamp');

        // Get saved data from sessionStorage
        const channelName = sessionStorage.getItem('shopify_channel_name');
        const clientId = sessionStorage.getItem('shopify_client_id');
        const shopDomain = sessionStorage.getItem('shopify_shop_domain');
        const syncFromDate = sessionStorage.getItem('shopify_sync_from_date');
        const enableHistoricalSync = sessionStorage.getItem('shopify_historical_sync') === 'true';

        if (!code || !state || !clientId) {
          setErrorMessage(tIntegrations('missingOAuthParams'));
          setStatus('error');
          return;
        }

        console.log('Completing Shopify OAuth...');

        // Complete OAuth and create channel
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/onboarding/channel/shopify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            clientId,
            shopDomain: shop || shopDomain,
            code,
            state,
            hmac,
            timestamp,
            channelName,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log('Channel created successfully:', data.channelId);

          // Trigger initial sync if needed
          if (data.channelId && enableHistoricalSync && syncFromDate) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/onboarding/sync/${data.channelId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  syncFromDate,
                  enableHistoricalSync: true,
                }),
              });
            } catch (syncErr) {
              console.error('Error triggering sync:', syncErr);
              // Don't fail the whole flow if sync fails
            }
          }

          // Clear sessionStorage
          sessionStorage.removeItem('shopify_channel_name');
          sessionStorage.removeItem('shopify_client_id');
          sessionStorage.removeItem('shopify_shop_domain');
          sessionStorage.removeItem('shopify_sync_from_date');
          sessionStorage.removeItem('shopify_historical_sync');

          setStatus('success');

          // Redirect to channels page after 1.5 seconds
          setTimeout(() => {
            router.push('/client/channels');
          }, 1500);
        } else {
          setErrorMessage(data.error || tIntegrations('failedToCreateChannel'));
          setStatus('error');
        }
      } catch (error) {
        console.error('Error completing OAuth:', error);
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '48px 32px',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {status === 'processing' && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#E5E7EB"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M44 24C44 13.5066 35.4934 5 25 5"
                stroke="#003450"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: '#111827',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {tIntegrations('connectingShopify')}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {tIntegrations('pleaseWaitSetup')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <svg
              width="48"
              height="48"
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
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: '#111827',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {tIntegrations('successfullyConnected')}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {tIntegrations('redirectingToChannels')}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="24" fill="#FEE2E2" />
              <path
                d="M24 16V24M24 32H24.02"
                stroke="#DC2626"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '18px',
                color: '#111827',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {tIntegrations('connectionFailed')}
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/client/channels/new')}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                backgroundColor: '#003450',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {tIntegrations('tryAgain')}
            </button>
          </>
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
    </div>
  );
}

export default function ShopifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#6B7280',
            }}
          >
            Loading...
          </div>
        </div>
      }
    >
      <ShopifyCallbackContent />
    </Suspense>
  );
}
