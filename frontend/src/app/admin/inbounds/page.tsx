'use client';

import { DashboardLayout } from '@/components/layout';
import { InboundsTable } from '@/components/inbounds';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminInboundsPage() {
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

  // Show client column for SUPER_ADMIN and ADMIN
  const showClientColumn = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <InboundsTable showClientColumn={showClientColumn} baseUrl="/admin/inbounds" userRole={user?.role || 'ADMIN'} />
      </div>
    </DashboardLayout>
  );
}
