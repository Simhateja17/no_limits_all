'use client';

import { AlertTriangle, Package, XCircle, AlertCircle, TrendingDown } from 'lucide-react';
import { InventoryAlert } from '@/lib/client-fulfillment-api';

interface InventoryAlertsCardProps {
  alerts: InventoryAlert[];
  loading?: boolean;
  onProductClick?: (productId: string) => void;
}

export function InventoryAlertsCard({ alerts, loading, onProductClick }: InventoryAlertsCardProps) {
  const getAlertConfig = (alertType: InventoryAlert['alertType']) => {
    switch (alertType) {
      case 'OVERSOLD':
        return {
          icon: <XCircle size={16} />,
          label: 'Oversold',
          bg: '#FEF2F2',
          color: '#B91C1C',
          description: 'Inventory is negative',
        };
      case 'OUT_OF_STOCK':
        return {
          icon: <AlertCircle size={16} />,
          label: 'Out of Stock',
          bg: '#FEF2F2',
          color: '#B91C1C',
          description: 'No available inventory',
        };
      case 'LOW_STOCK':
        return {
          icon: <AlertTriangle size={16} />,
          label: 'Low Stock',
          bg: '#FFFBEB',
          color: '#B45309',
          description: 'Below threshold',
        };
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
          <div style={{ width: '140px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? '12px' : 0 }}>
            <div style={{ width: '100%', height: '50px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Count alerts by type
  const oversoldCount = alerts.filter((a) => a.alertType === 'OVERSOLD').length;
  const outOfStockCount = alerts.filter((a) => a.alertType === 'OUT_OF_STOCK').length;
  const lowStockCount = alerts.filter((a) => a.alertType === 'LOW_STOCK').length;

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
          backgroundColor: alerts.length > 0 ? '#FFFBEB' : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} color={alerts.length > 0 ? '#B45309' : '#003450'} />
            <div>
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                Inventory Alerts
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
                {alerts.length} {alerts.length === 1 ? 'product needs' : 'products need'} attention
              </p>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        {alerts.length > 0 && (
          <div className="flex gap-3 mt-4">
            {oversoldCount > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  color: '#B91C1C',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <XCircle size={14} />
                {oversoldCount} Oversold
              </span>
            )}
            {outOfStockCount > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  color: '#B91C1C',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <AlertCircle size={14} />
                {outOfStockCount} Out of Stock
              </span>
            )}
            {lowStockCount > 0 && (
              <span
                className="flex items-center gap-1"
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFBEB',
                  color: '#B45309',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <AlertTriangle size={14} />
                {lowStockCount} Low Stock
              </span>
            )}
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div style={{ padding: '16px 24px', maxHeight: '400px', overflowY: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
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
              Inventory Healthy
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
              No stock alerts at this time
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => {
              const config = getAlertConfig(alert.alertType);
              return (
                <div
                  key={alert.productId}
                  onClick={() => onProductClick?.(alert.productId)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    cursor: onProductClick ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (onProductClick) {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  {/* Product Info Row */}
                  <div className="flex items-start justify-between mb-2">
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#111827',
                          display: 'block',
                          marginBottom: '2px',
                        }}
                      >
                        {alert.productName}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        SKU: {alert.sku}
                      </span>
                    </div>
                    <span
                      className="flex items-center gap-1"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: config.bg,
                        color: config.color,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                  </div>

                  {/* Stock Info */}
                  <div
                    className="flex items-center gap-4"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        Available
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: alert.availableQuantity < 0 ? '#B91C1C' : '#111827',
                          display: 'block',
                        }}
                      >
                        {alert.availableQuantity}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: '#E5E7EB' }} />
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        Reserved
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          display: 'block',
                        }}
                      >
                        {alert.reservedQuantity}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '30px', backgroundColor: '#E5E7EB' }} />
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6B7280' }}>
                        Threshold
                      </span>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                          display: 'block',
                        }}
                      >
                        {alert.threshold}
                      </span>
                    </div>
                    {alert.daysUntilStockout !== null && alert.daysUntilStockout > 0 && (
                      <>
                        <div style={{ width: '1px', height: '30px', backgroundColor: '#E5E7EB' }} />
                        <div className="flex items-center gap-1">
                          <TrendingDown size={14} color="#B45309" />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#B45309' }}>
                            ~{alert.daysUntilStockout}d until stockout
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryAlertsCard;
