'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layout';
import { CreateOrderPage } from '@/components/orders/CreateOrderPage';

export default function EmployeeCreateOrderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const basePath = '/employee/orders';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <DashboardLayout>
      <CreateOrderPage basePath={basePath} />
    </DashboardLayout>
  );
}
