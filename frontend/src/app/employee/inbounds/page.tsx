'use client';

import { DashboardLayout } from '@/components/layout';
import { InboundsTable } from '@/components/inbounds';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeInboundsPage() {
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

  // Employees can see client column
  const showClientColumn = true;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <InboundsTable showClientColumn={showClientColumn} baseUrl="/employee/inbounds" userRole="EMPLOYEE" />
      </div>
    </DashboardLayout>
  );
}
