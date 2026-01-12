'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layout';
import { CreateOrderPage } from '@/components/orders/CreateOrderPage';

export default function ClientCreateOrderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const basePath = '/client/orders';

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
      <CreateOrderPage basePath={basePath} />
    </DashboardLayout>
  );
}
