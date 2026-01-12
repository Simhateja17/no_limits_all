'use client';

import { useAuthStore, getDashboardRoute } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const publicRoutes = ['/'];

// Routes that should skip onboarding check
const skipOnboardingRoutes = ['/client/setup'];

// Route prefixes and their allowed roles
const routePermissions: Record<string, string[]> = {
  '/client': ['CLIENT'],
  '/employee': ['EMPLOYEE'],
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard': ['CLIENT', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'], // Legacy route - redirect to proper dashboard
};

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    const timeout = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // Validate user still exists in database (check every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const validateUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // If user no longer exists (401) or account deleted (404)
        if (response.status === 401 || response.status === 404) {
          console.log('Account no longer exists, logging out...');
          logout();
          router.push('/');
        }
      } catch (error) {
        // Network errors - don't logout, just log
        console.error('Error validating user:', error);
      }
    };

    // Validate immediately on mount
    validateUser();

    // Then validate every 30 seconds
    const interval = setInterval(validateUser, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, logout, router]);

  // Check onboarding status for CLIENT users
  const checkOnboardingStatus = useCallback(async () => {
    if (!isAuthenticated || !user || user.role !== 'CLIENT') {
      setOnboardingChecked(true);
      return;
    }

    // Skip if already on setup page
    if (skipOnboardingRoutes.some(route => pathname.startsWith(route))) {
      setOnboardingChecked(true);
      return;
    }

    setIsCheckingOnboarding(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setOnboardingChecked(true);
        setIsCheckingOnboarding(false);
        return;
      }

      // First get the client ID from /auth/me
      const meResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!meResponse.ok) {
        setOnboardingChecked(true);
        setIsCheckingOnboarding(false);
        return;
      }

      const meData = await meResponse.json();
      const clientId = meData.user?.client?.id;

      if (!clientId) {
        setOnboardingChecked(true);
        setIsCheckingOnboarding(false);
        return;
      }

      // Check onboarding status
      const statusResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/integrations/onboarding/status/${clientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!statusResponse.ok) {
        // If API fails, assume onboarding is complete (don't block user)
        setOnboardingChecked(true);
        setIsCheckingOnboarding(false);
        return;
      }

      const status = await statusResponse.json();

      // Check if onboarding is needed
      const needsOnboarding = 
        !status.jtlConfig || 
        status.channels.length === 0;

      if (needsOnboarding) {
        router.push('/client/setup');
        return;
      }

      setOnboardingChecked(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, allow access (don't block user)
      setOnboardingChecked(true);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, [isAuthenticated, user, pathname, router]);

  useEffect(() => {
    if (!isHydrated) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    // If on public route and authenticated, redirect to appropriate dashboard
    if (isPublicRoute && isAuthenticated && user) {
      router.push(getDashboardRoute(user.role));
      return;
    }

    // If on protected route and not authenticated, redirect to login
    if (!isPublicRoute && !isAuthenticated) {
      router.push('/');
      return;
    }

    // Check role-based access for protected routes
    if (!isPublicRoute && isAuthenticated && user) {
      // Handle legacy /dashboard route - redirect to proper role-based dashboard
      if (pathname === '/dashboard') {
        router.push(getDashboardRoute(user.role));
        return;
      }

      // Check if user has access to the current route
      for (const [routePrefix, allowedRoles] of Object.entries(routePermissions)) {
        if (pathname.startsWith(routePrefix)) {
          if (!allowedRoles.includes(user.role)) {
            // Redirect to proper dashboard if no access
            router.push(getDashboardRoute(user.role));
            return;
          }
          break;
        }
      }

      // For CLIENT users, check onboarding status
      if (user.role === 'CLIENT' && !onboardingChecked && !isCheckingOnboarding) {
        checkOnboardingStatus();
      }
    }
  }, [isHydrated, isAuthenticated, user, pathname, router, onboardingChecked, isCheckingOnboarding, checkOnboardingStatus]);

  // Show nothing while hydrating to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="animate-pulse">
          <div className="w-24 h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Show loading while checking onboarding for CLIENT users
  if (isAuthenticated && user?.role === 'CLIENT' && isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Checking account setup...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
