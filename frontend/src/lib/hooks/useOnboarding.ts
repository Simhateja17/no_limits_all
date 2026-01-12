/**
 * useOnboarding Hook
 * Manages client onboarding state and API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { onboardingApi, OnboardingStatus } from '../onboarding-api';
import { useAuthStore } from '../store';

interface UseOnboardingReturn {
  status: OnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  needsJTLSetup: boolean;
  needsChannelSetup: boolean;
  needsJTLOAuth: boolean;
  refetch: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { user, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    // Only check for CLIENT role users
    if (!isAuthenticated || !user || user.role !== 'CLIENT') {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    // Get clientId from user - need to fetch from backend if not available
    const clientId = (user as any).clientId || (user as any).client?.id;
    
    if (!clientId) {
      // Try to get clientId from the me endpoint
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const fetchedClientId = data.user?.client?.id;
          
          if (fetchedClientId) {
            const onboardingStatus = await onboardingApi.getOnboardingStatus(fetchedClientId);
            setStatus(onboardingStatus);
          }
        }
      } catch (err) {
        console.error('Error fetching onboarding status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch onboarding status');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const onboardingStatus = await onboardingApi.getOnboardingStatus(clientId);
      setStatus(onboardingStatus);
      setError(null);
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding status');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Determine what onboarding steps are needed
  const needsJTLSetup = status ? !status.jtlConfig : false;
  const needsJTLOAuth = status ? (status.jtlConfig && !status.jtlOAuthComplete) : false;
  const needsChannelSetup = status ? status.channels.length === 0 : false;
  const needsOnboarding = needsJTLSetup || needsJTLOAuth || needsChannelSetup;

  return {
    status,
    isLoading,
    error,
    needsOnboarding,
    needsJTLSetup,
    needsChannelSetup,
    needsJTLOAuth,
    refetch: fetchStatus,
  };
}

export default useOnboarding;
