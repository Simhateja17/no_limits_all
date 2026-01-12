'use client';

import { DashboardLayout } from '@/components/layout';
import { TasksTable } from '@/components/tasks';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminTasksPage() {
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
        <TasksTable showClientColumn={showClientColumn} baseUrl="/admin/tasks" />
      </div>
    </DashboardLayout>
  );
}
