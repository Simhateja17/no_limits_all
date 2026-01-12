'use client';

import { DashboardLayout } from '@/components/layout';
import { ProcessedOrdersChart, QuickChat, NewEvents } from '@/components/dashboard';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('dashboard');

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
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
        {/* Header - Übersicht */}
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
          {/* Processed Orders Chart - Full width to align with bottom sections */}
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
