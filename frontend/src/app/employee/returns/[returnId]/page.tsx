'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { ReturnDetails } from '@/components/returns';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';

export default function EmployeeReturnDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const returnId = params.returnId as string;

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <DashboardLayout>
      <ReturnDetails returnId={returnId} />
    </DashboardLayout>
  );
}
