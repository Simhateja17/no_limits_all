'use client';

import { DashboardLayout } from '@/components/layout';
import { OrdersTable } from '@/components/orders';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientOrdersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  // Don't show client column for client view (they only see their own orders)
  const showClientColumn = false;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <OrdersTable showClientColumn={showClientColumn} basePath="/client/orders" />
      </div>
    </DashboardLayout>
  );
}
