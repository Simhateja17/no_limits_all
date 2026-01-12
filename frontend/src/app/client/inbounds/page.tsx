'use client';

import { DashboardLayout } from '@/components/layout';
import { InboundsTable } from '@/components/inbounds';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientInboundsPage() {
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

  // Clients don't see client column (they only see their own inbounds)
  const showClientColumn = false;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <InboundsTable showClientColumn={showClientColumn} baseUrl="/client/inbounds" userRole="CLIENT" />
      </div>
    </DashboardLayout>
  );
}
