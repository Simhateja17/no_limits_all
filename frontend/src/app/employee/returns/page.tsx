'use client';

import { DashboardLayout } from '@/components/layout';
import { ReturnsTable } from '@/components/returns';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeReturnsPage() {
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

  // Show client column for employees (warehouse labor view)
  const showClientColumn = true;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <ReturnsTable showClientColumn={showClientColumn} basePath="/employee/returns" />
      </div>
    </DashboardLayout>
  );
}
