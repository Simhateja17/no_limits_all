'use client';

import { Target, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SLAStatus } from '@/lib/client-fulfillment-api';

interface SLAMonitorProps {
  slaStatus: SLAStatus[];
  loading?: boolean;
}

export function SLAMonitor({ slaStatus, loading }: SLAMonitorProps) {
  const getStatusIcon = (status: SLAStatus['status']) => {
    switch (status) {
      case 'ON_TRACK':
        return <CheckCircle size={18} color="#15803D" />;
      case 'AT_RISK':
        return <AlertTriangle size={18} color="#B45309" />;
      case 'BREACHED':
        return <XCircle size={18} color="#B91C1C" />;
    }
  };

  const getStatusColor = (status: SLAStatus['status']) => {
    switch (status) {
      case 'ON_TRACK':
        return { bg: '#F0FDF4', text: '#15803D', bar: '#22C55E' };
      case 'AT_RISK':
        return { bg: '#FFFBEB', text: '#B45309', bar: '#F59E0B' };
      case 'BREACHED':
        return { bg: '#FEF2F2', text: '#B91C1C', bar: '#EF4444' };
    }
  };

  const getProgressPercentage = (sla: SLAStatus) => {
    if (sla.target === 0) return 100;
    if (sla.unit === '%') {
      return Math.min((sla.actual / sla.target) * 100, 100);
    }
    // For time-based SLAs (lower is better)
    if (sla.unit === 'hours') {
      const ratio = sla.actual / sla.target;
      return Math.max(0, Math.min(100, (2 - ratio) * 50));
    }
    return 100;
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
          <div key={i} style={{ marginBottom: i < 3 ? '20px' : 0 }}>
            <div style={{ width: '100%', height: '60px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
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
          <Target size={24} color="#003450" />
          <div>
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              SLA Performance
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
              Service level agreement tracking
            </p>
          </div>
        </div>
      </div>

      {/* SLA Metrics */}
      <div style={{ padding: '20px 24px' }}>
        {slaStatus.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
              No SLA data available
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {slaStatus.map((sla, index) => {
              const colors = getStatusColor(sla.status);
              const progress = getProgressPercentage(sla);

              return (
                <div key={index}>
                  {/* Metric Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sla.status)}
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                        }}
                      >
                        {sla.metricName}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {sla.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: colors.bar,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Metric Values */}
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                      {sla.period}
                    </span>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                        Actual:{' '}
                        <strong style={{ color: '#111827' }}>
                          {sla.actual}
                          {sla.unit}
                        </strong>
                      </span>
                      {sla.target > 0 && (
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
                          Target:{' '}
                          <strong style={{ color: '#111827' }}>
                            {sla.unit === 'hours' ? `<${sla.target}` : `${sla.target}`}
                            {sla.unit}
                          </strong>
                        </span>
                      )}
                    </div>
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

export default SLAMonitor;
