'use client';

import { DashboardLayout } from '@/components/layout';
import { TasksTable } from '@/components/tasks';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeTasksPage() {
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

  // Show client column for employees (warehouse view)
  const showClientColumn = true;

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <TasksTable showClientColumn={showClientColumn} baseUrl="/employee/tasks" />
      </div>
    </DashboardLayout>
  );
}
