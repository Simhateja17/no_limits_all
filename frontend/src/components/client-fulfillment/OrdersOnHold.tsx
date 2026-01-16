'use client';

import { AlertTriangle, Pause, Mail, Package, Clock, Info } from 'lucide-react';
import { OrderOnHold } from '@/lib/client-fulfillment-api';

interface OrdersOnHoldProps {
  orders: OrderOnHold[];
  loading?: boolean;
  onOrderClick?: (orderId: string) => void;
}

const holdReasonLabels: Record<string, { label: string; description: string; color: string }> = {
  AWAITING_PAYMENT: {
    label: 'Awaiting Payment',
    description: 'Payment has not been confirmed',
    color: '#B45309',
  },
  HIGH_RISK_OF_FRAUD: {
    label: 'Fraud Risk',
    description: 'Order flagged for potential fraud',
    color: '#B91C1C',
  },
  INCORRECT_ADDRESS: {
    label: 'Address Issue',
    description: 'Shipping address needs verification',
    color: '#7C3AED',
  },
  INVENTORY_OUT_OF_STOCK: {
    label: 'Out of Stock',
    description: 'One or more items are unavailable',
    color: '#1D4ED8',
  },
  OTHER: {
    label: 'Other',
    description: 'Contact support for details',
    color: '#6B7280',
  },
};

export function OrdersOnHold({ orders, loading, onOrderClick }: OrdersOnHoldProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const getTimeSinceHold = (holdPlacedAt: string) => {
    const hold = new Date(holdPlacedAt);
    const now = new Date();
    const diffMs = now.getTime() - hold.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d on hold`;
    }
    return `${diffHours}h on hold`;
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '24px',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: '24px', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '6px' }} />
          <div style={{ width: '120px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
        </div>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px',
              marginBottom: i < 2 ? '12px' : 0,
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ width: '100%', height: '80px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: orders.length > 0 ? '#FEF2F2' : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          <Pause size={24} color={orders.length > 0 ? '#B91C1C' : '#6B7280'} />
          <div>
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Orders On Hold
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} require attention
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ padding: '16px 24px' }}>
        {orders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Package size={32} color="#15803D" />
            </div>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: '#111827',
                marginBottom: '4px',
              }}
            >
              All Clear!
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
              No orders are currently on hold
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const reasonInfo = holdReasonLabels[order.holdReason] || holdReasonLabels.OTHER;
              return (
                <div
                  key={order.id}
                  onClick={() => onOrderClick?.(order.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    cursor: onOrderClick ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (onOrderClick) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                          {order.customerName}
                        </span>
                        {order.customerEmail && (
                          <>
                            <span style={{ color: '#D1D5DB' }}>|</span>
                            <span
                              className="flex items-center gap-1"
                              style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}
                            >
                              <Mail size={12} />
                              {order.customerEmail}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>

                  {/* Hold Reason Badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="flex items-center gap-1"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: `${reasonInfo.color}15`,
                        color: reasonInfo.color,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <AlertTriangle size={12} />
                      {reasonInfo.label}
                    </span>
                    {order.canClientResolve && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        Action Required
                      </span>
                    )}
                  </div>

                  {/* Hold Details */}
                  <div
                    className="flex items-center gap-4"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Clock size={14} color="#6B7280" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        {getTimeSinceHold(order.holdPlacedAt)}
                      </span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>|</span>
                    <div className="flex items-center gap-1">
                      <Package size={14} color="#6B7280" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        {order.itemCount} items
                      </span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>|</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                      Ordered {formatDate(order.orderDate)}
                    </span>
                  </div>

                  {/* Hold Notes */}
                  {order.holdNotes && (
                    <div
                      className="flex items-start gap-2 mt-3"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                      }}
                    >
                      <Info size={14} color="#B45309" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#92400E' }}>
                        {order.holdNotes}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersOnHold;
