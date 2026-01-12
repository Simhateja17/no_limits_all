'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function JTLOAuthCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasExchangedRef = useRef(false);
  const tErrors = useTranslations('errors');
  const tIntegrations = useTranslations('integrations');

  // Get translated messages
  const authCodeNotFound = tErrors('authCodeNotFound');
  const clientIdNotInState = tErrors('clientIdNotInState');
  const jtlAuthSuccess = tIntegrations('jtlAuthSuccess');

  const exchangeToken = useCallback(async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check if OAuth provider returned an error
      if (error) {
        setStatus('error');
        setMessage(`OAuth Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        console.error('[JTL OAuth] Provider returned error:', { error, errorDescription });
        return;
      }

      // The state parameter contains the clientId (set during auth URL generation)
      const clientId = state;

      if (!code) {
        setStatus('error');
        setMessage(authCodeNotFound);
        console.error('[JTL OAuth] No authorization code in callback URL');
        return;
      }

      if (!clientId) {
        setStatus('error');
        setMessage(clientIdNotInState);
        console.error('[JTL OAuth] No client ID in state parameter');
        return;
      }

      console.log('[JTL OAuth] Starting token exchange for client:', clientId);
      console.log('[JTL OAuth] Code received (first 10 chars):', code.substring(0, 10) + '...');

      // Construct redirect URI (this same page)
      const redirectUri = `${window.location.origin}/integrations/jtl/callback`;
      console.log('[JTL OAuth] Redirect URI:', redirectUri);

      // Exchange code for tokens using the configured API client
      const response = await api.post('/integrations/jtl/exchange-token', {
        clientId,
        code,
        redirectUri,
      });

      const data = response.data;

      if (data.success) {
        console.log('[JTL OAuth] ✅ Token exchange successful');
        setStatus('success');
        setMessage(jtlAuthSuccess);

        // Notify parent window (if opened in popup)
        if (window.opener) {
          window.opener.postMessage({ type: 'jtl-oauth-success', clientId }, window.location.origin);
        }

        // Close popup after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        console.error('[JTL OAuth] ❌ Token exchange failed:', data.error);
        setStatus('error');
        setMessage(data.error || 'Failed to complete authentication');
      }
    } catch (error: any) {
      console.error('[JTL OAuth] ❌ Error exchanging token:', error);

      // Extract more detailed error message
      let errorMsg = 'An unexpected error occurred';
      if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      // Check if it's a "revoked" error and provide helpful message
      if (errorMsg.includes('revoked') || errorMsg.includes('invalid_request')) {
        errorMsg += '\n\nPossible causes:\n- Authorization code was already used (duplicate request)\n- Authorization code expired (took longer than 10 minutes)\n- Browser page was refreshed/reloaded\n\nPlease close this window and start the authorization process again.';
      }

      setStatus('error');
      setMessage(errorMsg);
    }
  }, [searchParams, authCodeNotFound, clientIdNotInState, jtlAuthSuccess]);

  useEffect(() => {
    // Prevent multiple token exchanges (React StrictMode runs effects twice in dev)
    if (hasExchangedRef.current) {
      console.log('[JTL OAuth] ⏭️ Skipping duplicate token exchange (already in progress)');
      return;
    }

    // Mark as exchanging IMMEDIATELY to prevent race conditions
    hasExchangedRef.current = true;

    exchangeToken();
  }, [exchangeToken]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              {tIntegrations('authenticating')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {tIntegrations('pleaseWaitJtl')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              {tIntegrations('success')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {message}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>
              {tIntegrations('windowWillClose')}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              {tIntegrations('authFailed')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {message}
            </p>
            <button
              onClick={() => window.close()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {tIntegrations('closeWindow')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
