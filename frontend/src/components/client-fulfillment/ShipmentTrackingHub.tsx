'use client';

import { useState } from 'react';
import { Package, ExternalLink, Truck, CheckCircle, Clock } from 'lucide-react';
import { ShipmentSummary } from '@/lib/client-fulfillment-api';

interface ShipmentTrackingHubProps {
  shipments: ShipmentSummary[];
  total: number;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
}

export function ShipmentTrackingHub({
  shipments,
  total,
  loading,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
}: ShipmentTrackingHubProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 'in_transit' | 'delivered'>('all');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle size={16} color="#15803D" />;
      case 'SHIPPED':
        return <Truck size={16} color="#1D4ED8" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: '#F0FDF4', text: '#15803D' };
      case 'SHIPPED':
        return { bg: '#EFF6FF', text: '#1D4ED8' };
      default:
        return { bg: '#F9FAFB', text: '#6B7280' };
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
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: '24px', height: '24px', backgroundColor: '#F3F4F6', borderRadius: '6px' }} />
          <div style={{ width: '150px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              padding: '16px 0',
              borderBottom: i < 4 ? '1px solid #E5E7EB' : 'none',
            }}
          >
            <div style={{ width: '100%', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck size={24} color="#003450" />
            <div>
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Shipment Tracking
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                {total} total shipments
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          {[
            { key: 'all', label: 'All Shipments' },
            { key: 'in_transit', label: 'In Transit' },
            { key: 'delivered', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: selectedTab === tab.key ? '#003450' : 'transparent',
                color: selectedTab === tab.key ? '#FFFFFF' : '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                border: selectedTab === tab.key ? 'none' : '1px solid #E5E7EB',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      <div>
        {shipments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Package size={48} color="#9CA3AF" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
              No shipments found
            </p>
          </div>
        ) : (
          shipments
            .filter((s) => {
              if (selectedTab === 'in_transit') return s.status === 'SHIPPED';
              if (selectedTab === 'delivered') return s.status === 'DELIVERED';
              return true;
            })
            .map((shipment, index) => {
              const statusColors = getStatusColor(shipment.status);
              return (
                <div
                  key={shipment.id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: index < shipments.length - 1 ? '1px solid #E5E7EB' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 140px 100px 100px',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  {/* Order Info */}
                  <div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      #{shipment.orderNumber}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: '#6B7280',
                        display: 'block',
                      }}
                    >
                      {shipment.customerName} - {shipment.itemCount} items
                    </span>
                  </div>

                  {/* Carrier */}
                  <div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      {shipment.carrier}
                    </span>
                  </div>

                  {/* Tracking */}
                  <div>
                    {shipment.trackingNumber ? (
                      shipment.trackingUrl ? (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#1D4ED8',
                            textDecoration: 'none',
                          }}
                        >
                          {shipment.trackingNumber.substring(0, 14)}...
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151' }}>
                          {shipment.trackingNumber.substring(0, 14)}...
                        </span>
                      )
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF' }}>
                        No tracking
                      </span>
                    )}
                  </div>

                  {/* Shipped Date */}
                  <div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                      {formatDate(shipment.shippedAt)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {getStatusIcon(shipment.status)}
                      {shipment.status === 'DELIVERED' ? 'Delivered' : 'In Transit'}
                    </span>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.5 : 1,
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            }}
          >
            Previous
          </button>
          <span
            style={{
              padding: '8px 16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#6B7280',
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.5 : 1,
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ShipmentTrackingHub;
