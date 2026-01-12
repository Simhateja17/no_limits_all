'use client';

import { DashboardLayout } from '@/components/layout';
import { ProductsTable } from '@/components/products';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminProductsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  // Show client column for SUPER_ADMIN (superadmin and warehouse labor view)
  const showClientColumn = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <ProductsTable showClientColumn={showClientColumn} baseUrl="/admin/products" />
      </div>
    </DashboardLayout>
  );
}
