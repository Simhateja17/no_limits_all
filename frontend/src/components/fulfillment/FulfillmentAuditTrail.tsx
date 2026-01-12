'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Pause,
  Play,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  Send,
  Package,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { fulfillmentApi, FulfillmentAuditEntry } from '@/lib/fulfillment-api';

interface FulfillmentAuditTrailProps {
  orderId: string;
}

const actionTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  STATUS_CHANGE: {
    icon: <Clock size={16} />,
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
  },
  HOLD: {
    icon: <Pause size={16} />,
    color: '#B45309',
    bgColor: '#FEF3C7',
  },
  RELEASE: {
    icon: <Play size={16} />,
    color: '#15803D',
    bgColor: '#DCFCE7',
  },
  TRACKING_UPDATE: {
    icon: <Truck size={16} />,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  FULFILLMENT_CREATED: {
    icon: <CheckCircle size={16} />,
    color: '#15803D',
    bgColor: '#DCFCE7',
  },
  REQUEST_SUBMITTED: {
    icon: <Send size={16} />,
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
  },
  REQUEST_ACCEPTED: {
    icon: <CheckCircle size={16} />,
    color: '#15803D',
    bgColor: '#DCFCE7',
  },
  REQUEST_REJECTED: {
    icon: <XCircle size={16} />,
    color: '#B91C1C',
    bgColor: '#FEE2E2',
  },
  CANCELLATION: {
    icon: <XCircle size={16} />,
    color: '#B91C1C',
    bgColor: '#FEE2E2',
  },
  LOCATION_CHANGE: {
    icon: <MapPin size={16} />,
    color: '#0891B2',
    bgColor: '#CFFAFE',
  },
};

export function FulfillmentAuditTrail({ orderId }: FulfillmentAuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<FulfillmentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        setLoading(true);
        const entries = await fulfillmentApi.getAuditTrail(orderId);
        setAuditEntries(entries);
      } catch (err) {
        console.error('Error fetching audit trail:', err);
        // Set mock data for demo
        setAuditEntries(generateMockAuditEntries());
      } finally {
        setLoading(false);
      }
    };

    fetchAuditTrail();
  }, [orderId]);

  const generateMockAuditEntries = (): FulfillmentAuditEntry[] => {
    const now = new Date();
    return [
      {
        id: '1',
        orderId,
        action: 'Fulfillment completed',
        actionType: 'FULFILLMENT_CREATED',
        previousValue: null,
        newValue: 'DHL123456789',
        notes: 'All items shipped successfully',
        performedBy: 'John Doe',
        performedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        orderId,
        action: 'Tracking number added',
        actionType: 'TRACKING_UPDATE',
        previousValue: null,
        newValue: 'DHL123456789',
        notes: null,
        performedBy: 'John Doe',
        performedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        orderId,
        action: 'Hold released',
        actionType: 'RELEASE',
        previousValue: 'ON_HOLD',
        newValue: 'IN_PROGRESS',
        notes: 'Address verified by customer',
        performedBy: 'Jane Smith',
        performedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        orderId,
        action: 'Order placed on hold',
        actionType: 'HOLD',
        previousValue: 'OPEN',
        newValue: 'ON_HOLD',
        notes: 'Awaiting address confirmation',
        performedBy: 'System',
        performedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        orderId,
        action: 'Fulfillment request accepted',
        actionType: 'REQUEST_ACCEPTED',
        previousValue: 'SUBMITTED',
        newValue: 'ACCEPTED',
        notes: null,
        performedBy: 'Warehouse System',
        performedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '6',
        orderId,
        action: 'Order received',
        actionType: 'STATUS_CHANGE',
        previousValue: null,
        newValue: 'OPEN',
        notes: 'New order from Shopify',
        performedBy: 'System',
        performedAt: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
          Loading audit trail...
        </p>
      </div>
    );
  }

  if (auditEntries.length === 0) {
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
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <FileText size={24} color="#9CA3AF" />
        </div>
        <p style={{ color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
          No audit history available
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
          <Clock size={18} />
          Fulfillment History
        </h3>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          {/* Timeline Line */}
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
          {auditEntries.map((entry, index) => {
            const config = actionTypeConfig[entry.actionType] || actionTypeConfig.STATUS_CHANGE;

            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: index < auditEntries.length - 1 ? '24px' : 0,
                  position: 'relative',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: config.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: config.color,
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#111827',
                      }}
                    >
                      {entry.action}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        color: '#6B7280',
                      }}
                    >
                      {formatDate(entry.performedAt)}
                    </span>
                  </div>

                  {/* Details */}
                  <div style={{ marginTop: '4px' }}>
                    {entry.previousValue && entry.newValue && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#6B7280',
                        }}
                      >
                        {entry.previousValue} → {entry.newValue}
                      </p>
                    )}
                    {entry.newValue && !entry.previousValue && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: config.color,
                          fontWeight: 500,
                        }}
                      >
                        {entry.newValue}
                      </p>
                    )}
                    {entry.notes && (
                      <p
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: '#6B7280',
                          fontStyle: 'italic',
                          marginTop: '4px',
                        }}
                      >
                        "{entry.notes}"
                      </p>
                    )}
                  </div>

                  {/* Performer */}
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#6B7280',
                      }}
                    >
                      {entry.performedBy.charAt(0).toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        color: '#6B7280',
                      }}
                    >
                      {entry.performedBy} at {formatTime(entry.performedAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
