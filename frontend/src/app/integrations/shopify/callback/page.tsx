'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { onboardingApi } from '@/lib/onboarding-api';

export default function ShopifyOAuthCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Shopify authorization...');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Get OAuth parameters from URL first
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // Create a unique key for this OAuth flow
      const oauthKey = `shopify_oauth_${code}_${state}`;

      // Prevent duplicate calls using sessionStorage (survives React Strict Mode remounts)
      if (hasProcessedRef.current || sessionStorage.getItem(oauthKey)) {
        console.log('[Shopify OAuth] ⏭️ Already processed, skipping duplicate call');
        return;
      }

      // Mark as processing immediately
      hasProcessedRef.current = true;
      sessionStorage.setItem(oauthKey, 'processing');

      try {
        const shop = searchParams.get('shop');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors
        if (error) {
          console.error('[Shopify OAuth] ❌ OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error || 'Authorization failed');

          // Notify parent window of failure
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'shopify-oauth-error',
                error: errorDescription || error,
              },
              window.location.origin
            );
          }

          // Close window after 3 seconds
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Validate required parameters
        if (!code || !state || !shop) {
          console.error('[Shopify OAuth] ❌ Missing required parameters');
          setStatus('error');
          setMessage('Missing required authorization parameters');

          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'shopify-oauth-error',
                error: 'Missing required parameters',
              },
              window.location.origin
            );
          }

          setTimeout(() => window.close(), 3000);
          return;
        }

        // Get additional security parameters from Shopify
        const hmac = searchParams.get('hmac');
        const timestamp = searchParams.get('timestamp');

        console.log('[Shopify OAuth] 📝 Received callback with code');
        console.log('[Shopify OAuth] 📝 Shop:', shop);
        console.log('[Shopify OAuth] 📝 State:', state);
        setMessage('Exchanging authorization code for access token...');

        // Extract clientId from state (format: clientId:nonce or just clientId for backwards compatibility)
        const stateParts = state.split(':');
        const clientId = stateParts[0];

        // Save "pending" state to localStorage immediately so parent knows OAuth is in progress
        try {
          localStorage.setItem('shopify_oauth_pending', JSON.stringify({
            clientId,
            shop,
            timestamp: Date.now()
          }));
          console.log('[Shopify OAuth] ⏳ Saved pending state to localStorage');
        } catch (e) {
          console.error('[Shopify OAuth] ❌ Failed to save pending state:', e);
        }

        // Exchange code for access token with security parameters
        const result = await onboardingApi.completeShopifyOAuth(
          clientId,
          shop,
          code,
          state,
          hmac || undefined,
          timestamp || undefined
        );

        console.log('[Shopify OAuth] 📋 API Response:', result);
        console.log('[Shopify OAuth] 📋 result.success:', result.success);
        console.log('[Shopify OAuth] 📋 result.channelId:', result.channelId);

        // Clean up pending state
        localStorage.removeItem('shopify_oauth_pending');

        if (result.success) {
          console.log('[Shopify OAuth] ✅ OAuth completed successfully');
          setStatus('success');
          setMessage('Authorization successful! Closing...');

          // Clean up sessionStorage
          sessionStorage.removeItem(oauthKey);

          // Store success in localStorage FIRST (this is the most reliable method)
          try {
            const successData = {
              channelId: result.channelId,
              timestamp: Date.now()
            };
            console.log('[Shopify OAuth] 💾 About to save to localStorage:', successData);
            localStorage.setItem('shopify_oauth_success', JSON.stringify(successData));
            console.log('[Shopify OAuth] ✅ Saved success to localStorage');
            
            // Verify it was saved
            const verification = localStorage.getItem('shopify_oauth_success');
            console.log('[Shopify OAuth] 🔍 Verification - localStorage value:', verification);
          } catch (e) {
            console.error('[Shopify OAuth] ❌ Failed to save to localStorage:', e);
          }

          // Notify parent window of success
          if (window.opener && !window.opener.closed) {
            console.log('[Shopify OAuth] 📤 Sending success message to parent window...');
            console.log('[Shopify OAuth] Channel ID:', result.channelId);

            // Send message to parent - try with '*' origin
            try {
              window.opener.postMessage(
                {
                  type: 'shopify-oauth-success',
                  channelId: result.channelId,
                },
                '*' // Allow any origin to receive
              );
              console.log('[Shopify OAuth] ✅ Message sent to parent with * origin!');
            } catch (e) {
              console.error('[Shopify OAuth] ❌ Failed to send message:', e);
            }

            // Close popup after a short delay to ensure message is received
            setTimeout(() => {
              console.log('[Shopify OAuth] 🔒 Closing popup window...');
              window.close();
            }, 1000); // 1 second delay
          } else {
            console.error('[Shopify OAuth] ❌ No parent window or parent closed!');
            setMessage('✅ Success! You can close this window and return to the setup page.');
            // Try to close anyway
            setTimeout(() => window.close(), 3000);
          }
        } else {
          console.error('[Shopify OAuth] ❌ Failed to complete OAuth:', result.error);
          setStatus('error');
          setMessage(result.error || 'Failed to complete authorization');

          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'shopify-oauth-error',
                error: result.error,
              },
              window.location.origin
            );
          }

          setTimeout(() => window.close(), 3000);
        }
      } catch (err) {
        console.error('[Shopify OAuth] ❌ Error in callback:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Unknown error occurred');

        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'shopify-oauth-error',
              error: err instanceof Error ? err.message : 'Unknown error',
            },
            window.location.origin
          );
        }

        setTimeout(() => window.close(), 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - searchParams don't change after initial load

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '24px',
              color: '#003450',
              margin: 0,
            }}
          >
            No Limits
          </h1>
        </div>

        {/* Status Icon */}
        <div style={{ marginBottom: '20px' }}>
          {status === 'processing' && (
            <div
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid #E5E7EB',
                borderTop: '4px solid #003450',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite',
              }}
            />
          )}
          {status === 'success' && (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontSize: '32px',
              }}
            >
              ✓
            </div>
          )}
          {status === 'error' && (
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontSize: '32px',
              }}
            >
              ✕
            </div>
          )}
        </div>

        {/* Message */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#374151',
            lineHeight: '1.6',
            margin: 0,
          }}
        >
          {message}
        </p>

        {status === 'error' && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#6B7280',
              marginTop: '12px',
            }}
          >
            This window will close automatically in 3 seconds.
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
