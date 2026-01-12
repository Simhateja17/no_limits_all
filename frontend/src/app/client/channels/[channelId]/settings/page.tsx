'use client';

import { DashboardLayout } from '@/components/layout';
import { ChannelSettings } from '@/components/channels';
import { useAuthStore } from '@/lib/store';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ChannelSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const channelId = params.channelId as string;
  const channelType = searchParams.get('type') || 'Woocommerce';
  const isNew = searchParams.get('isNew') === 'true';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  return (
    <DashboardLayout>
      <ChannelSettings 
        channelId={channelId} 
        baseUrl="/client/channels" 
        initialChannelType={channelType}
        isNewChannel={isNew}
      />
    </DashboardLayout>
  );
}
