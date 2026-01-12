'use client';

import { DashboardLayout } from '@/components/layout';
import { StatCard } from '@/components/dashboard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface DashboardStats {
  openOrders: number;
  errorOrders: number;
  avgClickRate: string;
  period: string;
}

export default function ClientDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated || user?.role !== 'CLIENT' || isCheckingSetup) {
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoadingStats(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/data/dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated, user, isCheckingSetup]);

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
        className="w-full px-[5.2%] py-8"
        style={{ maxWidth: '100%' }}
      >
        {/* Last 30 Days Header */}
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '18px',
            lineHeight: '24px',
            color: '#111827',
            marginBottom: '20px',
          }}
        >
          {t('last30Days')}
        </h1>

        {/* Stats Cards Container */}
        <div
          className="flex flex-col"
          style={{
            maxWidth: '247px',
            gap: '20px',
          }}
        >
          {isLoadingStats ? (
            <div className="text-gray-500">Loading stats...</div>
          ) : stats ? (
            <>
              <StatCard label={t('openOrders')} value={stats.openOrders.toString()} />
              <StatCard label={t('errorOrders')} value={stats.errorOrders.toString()} />
              <StatCard label={t('avgClickRate')} value={stats.avgClickRate} />
            </>
          ) : (
            <div className="text-gray-500">No stats available</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
