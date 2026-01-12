'use client';

import { DashboardLayout } from '@/components/layout';
import { ProductsTable } from '@/components/products';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeProductsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
    return null;
  }

  // Show client column for warehouse labor view (employee)
  const showClientColumn = true;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <ProductsTable showClientColumn={showClientColumn} baseUrl="/employee/products" />
      </div>
    </DashboardLayout>
  );
}
