'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FulfillmentOrder,
  FulfillmentOrderStatus,
  FulfillmentRequestStatus
} from '@/lib/fulfillment-api';
import { Package, Clock, AlertTriangle, CheckCircle, XCircle, Pause } from 'lucide-react';

interface FulfillmentQueueProps {
  orders: FulfillmentOrder[];
  loading?: boolean;
  onOrderClick?: (orderId: string) => void;
  basePath?: string;
}

const statusConfig: Record<FulfillmentOrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Open', color: '#1D4ED8', bgColor: '#EFF6FF', icon: <Package size={14} /> },
  IN_PROGRESS: { label: 'In Progress', color: '#B45309', bgColor: '#FFFBEB', icon: <Clock size={14} /> },
  SCHEDULED: { label: 'Scheduled', color: '#7C3AED', bgColor: '#F5F3FF', icon: <Clock size={14} /> },
  ON_HOLD: { label: 'On Hold', color: '#B91C1C', bgColor: '#FEF2F2', icon: <Pause size={14} /> },
  CLOSED: { label: 'Closed', color: '#15803D', bgColor: '#F0FDF4', icon: <CheckCircle size={14} /> },
  CANCELLED: { label: 'Cancelled', color: '#6B7280', bgColor: '#F9FAFB', icon: <XCircle size={14} /> },
};

const requestStatusConfig: Record<FulfillmentRequestStatus, { label: string; color: string }> = {
  UNSUBMITTED: { label: 'Not Submitted', color: '#6B7280' },
  SUBMITTED: { label: 'Submitted', color: '#1D4ED8' },
  ACCEPTED: { label: 'Accepted', color: '#15803D' },
  REJECTED: { label: 'Rejected', color: '#B91C1C' },
  CANCELLATION_REQUESTED: { label: 'Cancellation Requested', color: '#B45309' },
  CANCELLATION_ACCEPTED: { label: 'Cancellation Accepted', color: '#15803D' },
  CANCELLATION_REJECTED: { label: 'Cancellation Rejected', color: '#B91C1C' },
};

export function FulfillmentQueue({
  orders,
  loading = false,
  onOrderClick,
  basePath = '/admin/fulfillment'
}: FulfillmentQueueProps) {
  const router = useRouter();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const handleOrderClick = (orderId: string) => {
    if (onOrderClick) {
      onOrderClick(orderId);
    } else {
      router.push(`${basePath}/${orderId}`);
    }
  };

  const toggleOrderSelection = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getTotalItems = (order: FulfillmentOrder) => {
    return order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid #E5E7EB',
            borderTopColor: '#003450',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
          Loading fulfillment queue...
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '60px 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Package size={32} color="#9CA3AF" />
        </div>
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '8px',
          }}
        >
          No orders in queue
        </h3>
        <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
          All fulfillment orders have been processed.
        </p>
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
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header with bulk selection */}
      {selectedOrders.size > 0 && (
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1D4ED8', fontWeight: 500 }}>
            {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#15803D',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Bulk Fulfill
            </button>
            <button
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#B45309',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Bulk Hold
            </button>
            <button
              onClick={() => setSelectedOrders(new Set())}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: '40px 1fr 120px 100px 120px 100px 80px',
          padding: '12px 24px',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          gap: '16px',
        }}
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedOrders.size === orders.length && orders.length > 0}
            onChange={toggleSelectAll}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>
        {['Order', 'Customer', 'Items', 'Status', 'Created', 'Priority'].map((header) => (
          <span
            key={header}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {header}
          </span>
        ))}
      </div>

      {/* Table Body */}
      {orders.map((order, index) => {
        const status = statusConfig[order.status];
        const isSelected = selectedOrders.has(order.id);
        const isOnHold = order.status === 'ON_HOLD';
        const itemCount = getTotalItems(order);

        return (
          <div
            key={order.id}
            className="grid items-center"
            onClick={() => handleOrderClick(order.id)}
            style={{
              gridTemplateColumns: '40px 1fr 120px 100px 120px 100px 80px',
              padding: '16px 24px',
              borderBottom: index < orders.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              gap: '16px',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            {/* Checkbox */}
            <div className="flex items-center" onClick={(e) => toggleOrderSelection(order.id, e)}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>

            {/* Order Info */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  #{order.orderNumber || order.orderId}
                </span>
                {isOnHold && order.holdReason && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}
                  >
                    {order.holdReason.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {order.channel && (
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#6B7280',
                  }}
                >
                  via {order.channel.name}
                </span>
              )}
            </div>

            {/* Customer */}
            <div>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                {order.customerName || 'N/A'}
              </span>
            </div>

            {/* Items */}
            <div className="flex items-center gap-1">
              <Package size={14} color="#6B7280" />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Status */}
            <div>
              <span
                className="flex items-center gap-1"
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: status.bgColor,
                  color: status.color,
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  width: 'fit-content',
                }}
              >
                {status.icon}
                {status.label}
              </span>
            </div>

            {/* Created */}
            <div>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#6B7280',
                }}
              >
                {formatDate(order.createdAt)}
              </span>
            </div>

            {/* Priority Indicator */}
            <div className="flex items-center">
              {isOnHold ? (
                <AlertTriangle size={18} color="#B91C1C" />
              ) : order.status === 'OPEN' ? (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
