'use client';

import { DashboardLayout } from '@/components/layout';
import { ProcessedOrdersChart, QuickChat, NewEvents } from '@/components/dashboard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ClientDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
      return;
    }

    // Check if client has completed setup
    const checkSetupStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsCheckingSetup(false);
          return;
        }

        // Check if client has channels
        const channelsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/integrations/channels?clientId=${user.clientId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (channelsResponse.ok) {
          const channelsData = await channelsResponse.json();

          // If no channels, redirect to setup
          if (!channelsData.channels || channelsData.channels.length === 0) {
            router.push('/client/setup');
            return;
          }
        }

        setIsCheckingSetup(false);
      } catch (err) {
        console.error('Error checking setup status:', err);
        setIsCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  // Show loading while checking setup status
  if (isCheckingSetup) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking setup status...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        style={{
          width: '100%',
          padding: '32px 5.2%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header - Overview */}
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '18px',
            lineHeight: '24px',
            color: '#111827',
            margin: 0,
          }}
        >
          {t('title')}
        </h1>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#E5E7EB',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '31px',
            width: '100%',
          }}
        >
          {/* Processed Orders Chart - Full width */}
          <div style={{ width: '100%' }}>
            <ProcessedOrdersChart />
          </div>

          {/* Bottom Section - Quick Chat and New Events */}
          <div
            style={{
              display: 'grid',
              gap: '20px',
              width: '100%',
            }}
            className="grid-cols-1 lg:grid-cols-[1.1fr_1fr]"
          >
            {/* Quick Chat */}
            <div style={{ minWidth: 0 }}>
              <QuickChat />
            </div>

            {/* New Events */}
            <div style={{ minWidth: 0 }}>
              <NewEvents />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
