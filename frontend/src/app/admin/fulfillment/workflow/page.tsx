'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FulfillmentWorkflowWizard } from '@/components/fulfillment';
import { fulfillmentApi, FulfillmentOrder } from '@/lib/fulfillment-api';
import { ArrowLeft, Package, AlertCircle, RefreshCw } from 'lucide-react';

function WorkflowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!orderId) {
        // If no orderId, try to get the next order in queue
        const result = await fulfillmentApi.getFulfillmentOrders({ status: 'OPEN', limit: 1 });
        if (result.orders && result.orders.length > 0) {
          setOrder(result.orders[0]);
        } else {
          setError('No orders available for fulfillment. All pending orders have been processed.');
          setOrder(null);
        }
      } else {
        // Fetch specific order
        const data = await fulfillmentApi.getFulfillmentOrder(orderId);
        setOrder(data);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load order';
      setError(`${errorMessage}. Please check your connection and try again.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleComplete = () => {
    router.push('/admin/fulfillment');
  };

  const handleCancel = () => {
    if (orderId) {
      router.push(`/admin/fulfillment/${orderId}`);
    } else {
      router.push('/admin/fulfillment');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid #E5E7EB',
            borderTopColor: '#003450',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}
        />
        <p style={{ marginTop: '20px', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>
          Loading order for fulfillment...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <AlertCircle size={32} color="#B91C1C" />
        </div>
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          {error ? 'Unable to Load Order' : 'Order Not Found'}
        </h2>
        <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
          {error || 'The requested order could not be found. It may have been fulfilled or cancelled.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={fetchOrder}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <button
            onClick={() => router.push('/admin/fulfillment')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#003450',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Back to Fulfillment
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#374151" />
        </button>
        <div>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(20px, 1.8vw, 28px)',
              fontWeight: 600,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Package size={24} />
            Fulfillment Workflow
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Pick, pack, and ship order {order.orderNumber || order.orderId}
          </p>
        </div>
      </div>

      {/* Workflow Wizard */}
      <FulfillmentWorkflowWizard
        order={order}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </>
  );
}

export default function FulfillmentWorkflowPage() {
  return (
    <DashboardLayout>
      <div
        style={{
          padding: 'clamp(20px, 2.5vw, 40px)',
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Suspense fallback={
          <div style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid #E5E7EB',
                borderTopColor: '#003450',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
            <p style={{ marginTop: '20px', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>
              Loading...
            </p>
          </div>
        }>
          <WorkflowContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
