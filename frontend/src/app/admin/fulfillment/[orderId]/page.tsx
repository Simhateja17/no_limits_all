'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  FulfillmentAuditTrail,
  HoldManagementModal,
  TrackingManagementModal,
  ThreePLRequestModal,
} from '@/components/fulfillment';
import { fulfillmentApi, FulfillmentOrder } from '@/lib/fulfillment-api';
import {
  ArrowLeft,
  Package,
  Truck,
  Pause,
  Play,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  ExternalLink,
  Send,
  Check,
  X,
  MoreHorizontal,
} from 'lucide-react';

export default function FulfillmentOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAction, setRequestAction] = useState<'submit' | 'accept' | 'reject'>('submit');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await fulfillmentApi.getFulfillmentOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      // Set mock data for demo
      setOrder(generateMockOrder(orderId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const generateMockOrder = (id: string): FulfillmentOrder => ({
    id,
    orderId: `ORD-${id}`,
    orderNumber: `#${1000 + parseInt(id.split('-').pop() || '0')}`,
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
        sku: 'SKU-001',
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
        sku: 'SKU-002',
        productName: 'Standard Gadget',
        quantity: 1,
        fulfilledQuantity: 0,
        remainingQuantity: 1,
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
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    fulfillAt: null,
  });

  const statusConfig = {
    OPEN: { label: 'Open', color: '#1D4ED8', bgColor: '#EFF6FF' },
    IN_PROGRESS: { label: 'In Progress', color: '#B45309', bgColor: '#FFFBEB' },
    SCHEDULED: { label: 'Scheduled', color: '#7C3AED', bgColor: '#F5F3FF' },
    ON_HOLD: { label: 'On Hold', color: '#B91C1C', bgColor: '#FEF2F2' },
    CLOSED: { label: 'Closed', color: '#15803D', bgColor: '#F0FDF4' },
    CANCELLED: { label: 'Cancelled', color: '#6B7280', bgColor: '#F9FAFB' },
  };

  const handleRefresh = () => {
    fetchOrder();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#003450',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <p style={{ marginTop: '16px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            Loading order details...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#B91C1C', fontFamily: 'Inter, sans-serif' }}>
            Order not found
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[order.status];
  const totalItems = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DashboardLayout>
      <div
        style={{
          padding: 'clamp(20px, 2.5vw, 40px)',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/fulfillment')}
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
                Order {order.orderNumber || order.orderId}
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: status.bgColor,
                    color: status.color,
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {status.label}
                </span>
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                {order.channel?.name} • Created {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {order.status === 'ON_HOLD' ? (
              <button
                onClick={() => setShowHoldModal(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#15803D',
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={16} />
                Release Hold
              </button>
            ) : order.status === 'OPEN' || order.status === 'IN_PROGRESS' ? (
              <>
                <button
                  onClick={() => setShowHoldModal(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Pause size={16} />
                  Hold
                </button>
                <button
                  onClick={() => router.push(`/admin/fulfillment/workflow?orderId=${order.id}`)}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Package size={16} />
                  Start Fulfillment
                </button>
              </>
            ) : null}

            {/* More Actions Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoreHorizontal size={20} color="#374151" />
              </button>

              {showActionsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '44px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    minWidth: '200px',
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={() => {
                      setShowTrackingModal(true);
                      setShowActionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#374151',
                    }}
                  >
                    <Truck size={16} />
                    {order.trackingInfo ? 'Update Tracking' : 'Add Tracking'}
                  </button>
                  <button
                    onClick={() => {
                      setRequestAction('submit');
                      setShowRequestModal(true);
                      setShowActionsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      color: '#374151',
                    }}
                  >
                    <Send size={16} />
                    Submit Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 380px',
            gap: '24px',
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Order Items */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Package size={18} />
                  Items ({totalItems})
                </h3>
              </div>

              {order.lineItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: index < order.lineItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Package size={24} color="#6B7280" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#111827',
                      }}
                    >
                      {item.productName}
                    </p>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: '#6B7280',
                      }}
                    >
                      SKU: {item.sku || 'N/A'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      x{item.quantity}
                    </p>
                    {item.fulfilledQuantity > 0 && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: '#15803D',
                        }}
                      >
                        {item.fulfilledQuantity} fulfilled
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tracking Info */}
            {order.trackingInfo && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Truck size={18} />
                  Tracking Information
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
                      {order.trackingInfo.trackingCompany || 'Carrier'}
                    </p>
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {order.trackingInfo.trackingNumber}
                    </p>
                  </div>
                  {order.trackingInfo.trackingUrl && (
                    <a
                      href={order.trackingInfo.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      Track
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <FulfillmentAuditTrail orderId={order.id} />
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Customer Info */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <User size={18} />
                Customer
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#111827',
                  }}
                >
                  {order.customerName || 'N/A'}
                </p>
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} color="#6B7280" />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
                      {order.customerEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MapPin size={18} />
                Shipping Address
              </h3>

              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                <p style={{ fontWeight: 500 }}>
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.zip} {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Fulfillment Location */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MapPin size={18} />
                Fulfillment Location
              </h3>

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151' }}>
                {order.assignedLocationName || 'Not assigned'}
              </p>
            </div>

            {/* Hold Info (if on hold) */}
            {order.status === 'ON_HOLD' && order.holdReason && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: '12px',
                  border: '1px solid #FECACA',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#B91C1C',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Pause size={18} />
                  On Hold
                </h3>

                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#991B1B', fontWeight: 500 }}>
                  {order.holdReason.replace(/_/g, ' ')}
                </p>
                {order.holdNotes && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#7F1D1D', marginTop: '8px' }}>
                    {order.holdNotes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <HoldManagementModal
        isOpen={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        orderId={order.id}
        orderNumber={order.orderNumber || order.orderId}
        currentStatus={order.status as 'ON_HOLD' | 'OPEN' | 'IN_PROGRESS'}
        currentHoldReason={order.holdReason}
        currentHoldNotes={order.holdNotes}
        onSuccess={handleRefresh}
      />

      <TrackingManagementModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        orderId={order.id}
        orderNumber={order.orderNumber || order.orderId}
        currentTracking={order.trackingInfo}
        onSuccess={handleRefresh}
      />

      <ThreePLRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        orderId={order.id}
        orderNumber={order.orderNumber || order.orderId}
        currentRequestStatus={order.requestStatus}
        action={requestAction}
        onSuccess={handleRefresh}
      />
    </DashboardLayout>
  );
}
