'use client';

import { ReactNode } from 'react';

interface FulfillmentStatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
}

const colorMap = {
  blue: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', iconBg: '#DBEAFE' },
  green: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', iconBg: '#DCFCE7' },
  yellow: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', iconBg: '#FEF3C7' },
  red: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', iconBg: '#FEE2E2' },
  gray: { bg: '#F9FAFB', border: '#E5E7EB', text: '#374151', iconBg: '#F3F4F6' },
};

export function FulfillmentStatsCard({
  title,
  value,
  icon,
  trend,
  color = 'gray',
  onClick,
}: FulfillmentStatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: 'clamp(16px, 1.5vw, 24px)',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      className={onClick ? 'hover:shadow-md hover:border-gray-300' : ''}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(12px, 0.9vw, 14px)',
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: '8px',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(24px, 2vw, 32px)',
              fontWeight: 600,
              color: '#111827',
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          {trend && (
            <div
              className="flex items-center gap-1 mt-2"
              style={{
                color: trend.isPositive ? '#15803D' : '#B91C1C',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: trend.isPositive ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
              >
                <path
                  d="M8 4L12 8H9V12H7V8H4L8 4Z"
                  fill="currentColor"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {trend.value}% from last week
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: colors.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.text,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
