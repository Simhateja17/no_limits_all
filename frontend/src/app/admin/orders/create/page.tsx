'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { CreateOrderPage } from '@/components/orders/CreateOrderPage';
import { useAuthStore } from '@/lib/store';

export default function AdminCreateOrderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const basePath = '/admin/orders';

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
      <CreateOrderPage basePath={basePath} />
    </DashboardLayout>
  );
}
