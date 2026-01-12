'use client';

import { DashboardLayout } from '@/components/layout';
import { ProductsTable } from '@/components/products';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientProductsPage() {
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

  // Don't show client column for client view (they only see their own products)
  const showClientColumn = false;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <ProductsTable showClientColumn={showClientColumn} baseUrl="/client/products" />
      </div>
    </DashboardLayout>
  );
}
