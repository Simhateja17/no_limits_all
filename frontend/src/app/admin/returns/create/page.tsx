'use client';

import { DashboardLayout } from '@/components/layout';
import { CreateReturn } from '@/components/returns';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminCreateReturnPage() {
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

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <CreateReturn backUrl="/admin/returns" />
      </div>
    </DashboardLayout>
  );
}
