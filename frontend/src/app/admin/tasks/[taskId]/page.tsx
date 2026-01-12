'use client';

import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminTaskDetailPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const tCommon = useTranslations('common');
  const tTasks = useTranslations('tasks');

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
        <div className="flex flex-col gap-6">
          {/* Back Button */}
          <div>
            <button
              onClick={() => router.push('/admin/tasks')}
              style={{
                minWidth: '65px',
                height: '38px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: '9px 17px 9px 15px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#374151',
                }}
              >
                {tCommon('back')}
              </span>
            </button>
          </div>

          {/* Task Details Placeholder */}
          <div
            style={{
              borderRadius: '8px',
              padding: '48px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              Task #{taskId}
            </h1>
            <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
              {tTasks('taskDetailsComingSoon')}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
