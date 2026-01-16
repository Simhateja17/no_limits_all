'use client';

import { Package, Clock, Pause, TrendingUp, CheckCircle, Truck } from 'lucide-react';
import { ClientFulfillmentStats as Stats } from '@/lib/client-fulfillment-api';

interface ClientFulfillmentStatsProps {
  stats: Stats | null;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'red' | 'green' | 'purple' | 'gray';
  subtitle?: string;
  trend?: number;
}

const colorMap = {
  blue: { bg: '#EFF6FF', icon: '#1D4ED8', text: '#1D4ED8' },
  yellow: { bg: '#FFFBEB', icon: '#B45309', text: '#B45309' },
  red: { bg: '#FEF2F2', icon: '#B91C1C', text: '#B91C1C' },
  green: { bg: '#F0FDF4', icon: '#15803D', text: '#15803D' },
  purple: { bg: '#F5F3FF', icon: '#7C3AED', text: '#7C3AED' },
  gray: { bg: '#F9FAFB', icon: '#6B7280', text: '#6B7280' },
};

function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.icon,
          }}
        >
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: trend > 0 ? '#15803D' : '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '28px',
            fontWeight: 600,
            color: '#111827',
            display: 'block',
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#6B7280',
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: '#9CA3AF',
              display: 'block',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function ClientFulfillmentStats({ stats, loading }: ClientFulfillmentStatsProps) {
  if (loading) {
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '20px',
              height: '120px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#F3F4F6',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                width: '60px',
                height: '28px',
                backgroundColor: '#F3F4F6',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                width: '100px',
                height: '16px',
                backgroundColor: '#F3F4F6',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}
    >
      <StatCard
        title="Pending Fulfillment"
        value={stats?.pendingFulfillment ?? '-'}
        icon={<Package size={20} />}
        color="blue"
      />
      <StatCard
        title="In Progress"
        value={stats?.inProgress ?? '-'}
        icon={<Clock size={20} />}
        color="yellow"
      />
      <StatCard
        title="On Hold"
        value={stats?.onHold ?? '-'}
        icon={<Pause size={20} />}
        color="red"
      />
      <StatCard
        title="Shipped Today"
        value={stats?.shippedToday ?? '-'}
        icon={<Truck size={20} />}
        color="green"
      />
      <StatCard
        title="This Week"
        value={stats?.shippedThisWeek ?? '-'}
        icon={<CheckCircle size={20} />}
        color="purple"
        trend={stats?.shippedTrend}
        subtitle="vs last week"
      />
      <StatCard
        title="On-Time Rate"
        value={stats ? `${stats.onTimeRate}%` : '-'}
        icon={<TrendingUp size={20} />}
        color={stats && stats.onTimeRate >= 95 ? 'green' : stats && stats.onTimeRate >= 85 ? 'yellow' : 'red'}
        subtitle={stats ? `Avg ${stats.avgFulfillmentTimeHours}h to ship` : undefined}
      />
    </div>
  );
}

export default ClientFulfillmentStats;
