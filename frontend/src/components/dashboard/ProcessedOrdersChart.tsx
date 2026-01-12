'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { dataApi, ChartDataPoint } from '@/lib/data-api';

interface ProcessedOrdersChartProps {
  dateRange?: string;
}

const GRID_LINES = 5;

export function ProcessedOrdersChart({ dateRange }: ProcessedOrdersChartProps) {
  const t = useTranslations('dashboard');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 280 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [referenceData, setReferenceData] = useState<ChartDataPoint[]>([]);
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chart data from API
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataApi.getDashboardChart();
        setChartData(data.chartData);
        setReferenceData(data.referenceData);
        setMonthOptions(data.monthOptions);
        // Set default date range values
        if (data.monthOptions.length > 0) {
          setFromDate(data.monthOptions[0]);
          setToDate(data.monthOptions[data.monthOptions.length - 1]);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 48;
        setDimensions({ width: Math.max(300, width), height: 280 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const padding = { top: 50, right: 20, bottom: 50, left: 20 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  // Handle empty data
  const allValues = [...chartData.map((d) => d.value), ...referenceData.map((d) => d.value)];
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (chartData.length - 1)) * chartWidth;
  };
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const createPath = (data: typeof chartData) => {
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const mainPath = createPath(chartData);
  const referencePath = createPath(referenceData);

  const gridLines = Array.from({ length: GRID_LINES }, (_, i) => {
    const y = padding.top + (i / (GRID_LINES - 1)) * chartHeight;
    return y;
  });

  // Format month key for display - parse "january2026" into "Jan 2026"
  const formatMonthKey = (monthKey: string) => {
    const match = monthKey.match(/^([a-z]+)(\d{4})$/i);
    if (match) {
      const monthName = match[1].toLowerCase();
      const year = match[2];
      // Try to get translation, fallback to capitalized month name
      try {
        const translatedMonth = t(`monthNames.${monthName}`);
        return `${translatedMonth} ${year}`;
      } catch {
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
      }
    }
    return monthKey;
  };

  return (
    <div
      ref={containerRef}
      style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#6B7280',
          }}
        >
          {t('processedOrders')}
        </span>

        {/* Date Range Selectors */}
        {!loading && monthOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '100%',
                color: '#6B7280',
              }}
            >
              {t('from')}
            </span>
            <select
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '100%',
                color: '#111827',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {monthOptions.slice(0, Math.min(3, monthOptions.length)).map((key) => (
                <option key={key} value={key}>
                  {formatMonthKey(key)}
                </option>
              ))}
            </select>
            <span
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '100%',
                color: '#6B7280',
              }}
            >
              {t('to')}
            </span>
            <select
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '100%',
                color: '#111827',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {monthOptions.slice(-Math.min(3, monthOptions.length)).map((key) => (
                <option key={key} value={key}>
                  {formatMonthKey(key)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            height: dimensions.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
        >
          Loading chart data...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            height: dimensions.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chartData.length === 0 && (
        <div
          style={{
            height: dimensions.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
          }}
        >
          No order data available
        </div>
      )}

      {/* Chart */}
      {!loading && !error && chartData.length > 0 && (
        <div style={{ width: '100%', position: 'relative' }}>
        <svg
          width="100%"
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Gradient for shadow */}
          <defs>
            <linearGradient id="shadowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#003450" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#003450" stopOpacity="0" />
            </linearGradient>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="5" floodColor="#000000" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines */}
          {gridLines.map((y, index) => (
            <line
              key={index}
              x1={padding.left}
              y1={y}
              x2={dimensions.width - padding.right}
              y2={y}
              stroke="#F3F4F6"
              strokeWidth="1"
            />
          ))}

          {/* Reference line (light gray) */}
          <path
            d={referencePath}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Main line with shadow */}
          <path
            d={mainPath}
            fill="none"
            stroke="#003450"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#dropShadow)"
          />

          {/* Interactive points */}
          {chartData.map((point, index) => (
            <g key={index}>
              <circle
                cx={getX(index)}
                cy={getY(point.value)}
                r={hoveredIndex === index ? 6 : 4}
                fill={hoveredIndex === index ? '#FFFFFF' : 'transparent'}
                stroke={hoveredIndex === index ? '#003450' : 'transparent'}
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Larger invisible hit area */}
              <circle
                cx={getX(index)}
                cy={getY(point.value)}
                r={20}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <g>
              <rect
                x={getX(hoveredIndex) - 30}
                y={getY(chartData[hoveredIndex].value) - 45}
                width="60"
                height="28"
                rx="4"
                fill="#1F2937"
              />
              <polygon
                points={`${getX(hoveredIndex) - 6},${getY(chartData[hoveredIndex].value) - 17} ${getX(hoveredIndex) + 6},${getY(chartData[hoveredIndex].value) - 17} ${getX(hoveredIndex)},${getY(chartData[hoveredIndex].value) - 10}`}
                fill="#1F2937"
              />
              <text
                x={getX(hoveredIndex)}
                y={getY(chartData[hoveredIndex].value) - 26}
                textAnchor="middle"
                fill="#FFFFFF"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {chartData[hoveredIndex].value}
              </text>
            </g>
          )}

          {/* X-axis labels */}
          {chartData.map((point, index) => (
            <text
              key={index}
              x={getX(index)}
              y={dimensions.height - 10}
              textAnchor="middle"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                fill: '#6B7280',
              }}
            >
              {formatMonthKey(point.monthKey)}
            </text>
          ))}
        </svg>
      </div>
      )}
    </div>
  );
}
