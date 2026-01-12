'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FulfillmentWorkflowWizard } from '@/components/fulfillment';
import { fulfillmentApi, FulfillmentOrder } from '@/lib/fulfillment-api';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';

function WorkflowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        // If no orderId, try to get the next order in queue
        try {
          setLoading(true);
          const result = await fulfillmentApi.getFulfillmentOrders({ status: 'OPEN', limit: 1 });
          if (result.orders.length > 0) {
            setOrder(result.orders[0]);
          } else {
            setError('No orders available for fulfillment');
          }
        } catch (err) {
          console.error('Error fetching next order:', err);
          // Generate mock order for demo
          setOrder(generateMockOrder('demo-1'));
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const data = await fulfillmentApi.getFulfillmentOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        // Generate mock order for demo
        setOrder(generateMockOrder(orderId));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const generateMockOrder = (id: string): FulfillmentOrder => ({
    id,
    orderId: `ORD-${id}`,
    orderNumber: `#${1000 + Math.floor(Math.random() * 1000)}`,
    externalOrderId: `EXT-${id}`,
    shopifyFulfillmentOrderId: `gid://shopify/FulfillmentOrder/${id}`,
    status: 'OPEN',
    requestStatus: 'ACCEPTED',
    holdReason: null,
    holdNotes: null,
    assignedLocationId: 'loc-1',
    assignedLocationName: 'Main Warehouse - Berlin',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Corp',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'Berlin',
      zip: '10115',
      country: 'Germany',
      countryCode: 'DE',
    },
    lineItems: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        sku: 'WIDGET-PRO-001',
        productName: 'Premium Widget Pro',
        quantity: 2,
        fulfilledQuantity: 0,
        remainingQuantity: 2,
        requiresShipping: true,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        variantId: 'var-2',
        sku: 'GADGET-STD-002',
        productName: 'Standard Gadget',
        quantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
        requiresShipping: true,
      },
      {
        id: 'item-3',
        productId: 'prod-3',
        variantId: 'var-3',
        sku: 'ACC-BASIC-003',
        productName: 'Basic Accessory Pack',
        quantity: 3,
        fulfilledQuantity: 0,
        remainingQuantity: 3,
        requiresShipping: true,
      },
    ],
    trackingInfo: null,
    client: {
      id: 'client-1',
      companyName: 'Acme Store',
      name: 'Acme Store',
    },
    channel: {
      id: 'channel-1',
      name: 'Shopify Store',
      type: 'SHOPIFY',
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    fulfillAt: null,
  });

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
          {error || 'Order not found'}
        </h2>
        <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '24px' }}>
          {error ? 'Please check back later or select an order from the queue.' : 'The requested order could not be loaded.'}
        </p>
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
