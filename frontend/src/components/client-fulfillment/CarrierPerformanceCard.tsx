'use client';

import { Truck, TrendingUp, Clock, Package } from 'lucide-react';
import { CarrierPerformance } from '@/lib/client-fulfillment-api';

interface CarrierPerformanceCardProps {
  carriers: CarrierPerformance[];
  loading?: boolean;
}

export function CarrierPerformanceCard({ carriers, loading }: CarrierPerformanceCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPerformanceColor = (onTimeRate: number) => {
    if (onTimeRate >= 95) return '#15803D';
    if (onTimeRate >= 85) return '#B45309';
    return '#B91C1C';
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
          <div style={{ width: '160px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? '16px' : 0 }}>
            <div style={{ width: '100%', height: '70px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
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
              Carrier Performance
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
              Last 90 days delivery metrics
            </p>
          </div>
        </div>
      </div>

      {/* Carriers List */}
      <div style={{ padding: '16px 24px' }}>
        {carriers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Package size={40} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
              No carrier data available yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {carriers.map((carrier, index) => (
              <div
                key={carrier.carrier}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: index === 0 ? '#F9FAFB' : '#FFFFFF',
                }}
              >
                {/* Carrier Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Truck size={18} color="#1D4ED8" />
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          display: 'block',
                        }}
                      >
                        {carrier.carrier}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        Last used: {formatDate(carrier.lastUsed)}
                      </span>
                    </div>
                  </div>
                  {index === 0 && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#F0FDF4',
                        color: '#15803D',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      Top Carrier
                    </span>
                  )}
                </div>

                {/* Metrics Grid */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                  }}
                >
                  {/* Total Shipments */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Package size={12} color="#6B7280" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        Shipments
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {carrier.totalShipments}
                    </span>
                  </div>

                  {/* Avg Delivery Time */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={12} color="#6B7280" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        Avg Delivery
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {carrier.avgDeliveryDays}d
                    </span>
                  </div>

                  {/* On-Time Rate */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp size={12} color="#6B7280" />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        On-Time
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600,
                        color: getPerformanceColor(carrier.onTimeRate),
                      }}
                    >
                      {carrier.onTimeRate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CarrierPerformanceCard;
