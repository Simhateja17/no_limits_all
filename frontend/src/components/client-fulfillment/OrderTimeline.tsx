'use client';

import { Clock, Package, Truck, CheckCircle, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { FulfillmentTimelineEntry } from '@/lib/client-fulfillment-api';

interface OrderTimelineProps {
  timeline: FulfillmentTimelineEntry[];
  loading?: boolean;
  orderNumber?: string;
}

export function OrderTimeline({ timeline, loading, orderNumber }: OrderTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case 'ORDER_CREATED':
      case 'CREATE':
        return <FileText size={16} color="#1D4ED8" />;
      case 'SHIPPED':
        return <Truck size={16} color="#15803D" />;
      case 'DELIVERED':
        return <CheckCircle size={16} color="#059669" />;
      case 'HOLD':
        return <AlertTriangle size={16} color="#B91C1C" />;
      case 'RELEASE_HOLD':
        return <RefreshCw size={16} color="#15803D" />;
      case 'UPDATE':
      case 'UPDATE_TRACKING':
        return <RefreshCw size={16} color="#7C3AED" />;
      case 'FULFILL':
        return <Package size={16} color="#15803D" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'ORDER_CREATED':
      case 'CREATE':
        return { bg: '#EFF6FF', border: '#BFDBFE' };
      case 'SHIPPED':
        return { bg: '#F0FDF4', border: '#BBF7D0' };
      case 'DELIVERED':
        return { bg: '#ECFDF5', border: '#A7F3D0' };
      case 'HOLD':
        return { bg: '#FEF2F2', border: '#FECACA' };
      case 'RELEASE_HOLD':
        return { bg: '#F0FDF4', border: '#BBF7D0' };
      case 'UPDATE':
      case 'UPDATE_TRACKING':
        return { bg: '#F5F3FF', border: '#DDD6FE' };
      case 'FULFILL':
        return { bg: '#F0FDF4', border: '#BBF7D0' };
      default:
        return { bg: '#F9FAFB', border: '#E5E7EB' };
    }
  };

  const getOriginLabel = (origin: string) => {
    switch (origin?.toUpperCase()) {
      case 'SHOPIFY':
        return 'Shopify';
      case 'WAREHOUSE':
        return 'Warehouse';
      case 'CARRIER':
        return 'Carrier';
      case 'SYSTEM':
        return 'System';
      case 'USER':
        return 'Manual';
      default:
        return origin || 'Unknown';
    }
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
        <div className="flex items-center gap-3 mb-6">
          <div style={{ width: '24px', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '6px' }} />
          <div style={{ width: '120px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div style={{ width: '24px', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '60%', height: '16px', backgroundColor: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '40%', height: '12px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
            </div>
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
        }}
      >
        <div className="flex items-center gap-3">
          <Clock size={24} color="#003450" />
          <div>
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Order Timeline
            </h3>
            {orderNumber && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                #{orderNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '24px' }}>
        {timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Clock size={40} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
              No timeline data available
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Vertical Line */}
            <div
              style={{
                position: 'absolute',
                left: '15px',
                top: '24px',
                bottom: '24px',
                width: '2px',
                backgroundColor: '#E5E7EB',
              }}
            />

            {/* Timeline Entries */}
            <div className="flex flex-col gap-1">
              {timeline.map((entry, index) => {
                const colors = getActionColor(entry.action);
                return (
                  <div key={entry.id} className="flex gap-4" style={{ position: 'relative' }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div
                      style={{
                        flex: 1,
                        paddingBottom: index < timeline.length - 1 ? '20px' : 0,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#111827',
                          }}
                        >
                          {entry.description}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#F3F4F6',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: '#6B7280',
                            textTransform: 'uppercase',
                          }}
                        >
                          {getOriginLabel(entry.origin)}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: '#6B7280',
                        }}
                      >
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderTimeline;
