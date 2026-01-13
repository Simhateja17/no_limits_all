'use client';

import { PipelineStage } from '@/lib/client-fulfillment-api';

interface OrderPipelineChartProps {
  pipeline: PipelineStage[];
  loading?: boolean;
}

export function OrderPipelineChart({ pipeline, loading }: OrderPipelineChartProps) {
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
        <div style={{ width: '140px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ flex: 1, height: '120px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  const total = pipeline.reduce((sum, stage) => sum + stage.count, 0);
  const maxCount = Math.max(...pipeline.map((s) => s.count), 1);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '24px',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Order Pipeline
        </h3>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6B7280' }}>
          {total} total orders
        </span>
      </div>

      {/* Pipeline Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          height: '160px',
          paddingBottom: '32px',
        }}
      >
        {pipeline.map((stage) => {
          const heightPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          return (
            <div
              key={stage.stage}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Count Label */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {stage.count}
              </span>

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '60px',
                  height: `${Math.max(heightPercent, 8)}%`,
                  minHeight: '8px',
                  backgroundColor: stage.color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease',
                }}
              />

              {/* Stage Label */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {stage.stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        {pipeline.map((stage) => (
          <div key={stage.stage} className="flex items-center gap-2">
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: stage.color,
              }}
            />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6B7280' }}>
              {stage.stage}: {stage.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderPipelineChart;
