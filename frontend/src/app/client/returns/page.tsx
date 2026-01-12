'use client';

import { DashboardLayout } from '@/components/layout';
import { ReturnsTable } from '@/components/returns';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientReturnsPage() {
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

  // Don't show client column for client view (they only see their own returns)
  const showClientColumn = false;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <ReturnsTable showClientColumn={showClientColumn} basePath="/client/returns" />
      </div>
    </DashboardLayout>
  );
}
