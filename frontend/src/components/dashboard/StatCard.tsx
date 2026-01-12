interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '20px 24px',
        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        gap: '8px',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#6B7280',
        }}
      >
        {label}
      </span>

      {/* Value */}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '30px',
          lineHeight: '36px',
          color: '#111827',
        }}
      >
        {value}
      </span>
    </div>
  );
}
