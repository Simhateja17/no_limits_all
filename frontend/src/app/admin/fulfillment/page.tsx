'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FulfillmentDashboard } from '@/components/fulfillment';

export default function AdminFulfillmentPage() {
  return (
    <DashboardLayout>
      <div
        style={{
          padding: 'clamp(20px, 2.5vw, 40px)',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <FulfillmentDashboard basePath="/admin/fulfillment" />
      </div>
    </DashboardLayout>
  );
}
