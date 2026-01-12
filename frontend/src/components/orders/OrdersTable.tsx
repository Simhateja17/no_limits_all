'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useClients, getClientNames } from '@/lib/hooks';
import { dataApi, type Order as ApiOrder } from '@/lib/data-api';

// Tab type for orders
type OrderTabType = 'all' | 'inStock' | 'outOfStock' | 'errors' | 'partiallyFulfilled' | 'cancelled' | 'sent';

// Order status type
type OrderStatus = 'success' | 'error' | 'mildError' | 'partiallyFulfilled';

// Order interface
interface Order {
  id: string;
  orderId: string;
  orderDate: Date;
  client: string;
  weight: string;
  quantity: number;
  method: string;
  status: OrderStatus;
}

// Helper function to map backend status to frontend status
const mapBackendStatusToFrontend = (backendStatus: string): OrderStatus => {
  switch (backendStatus) {
    case 'PENDING':
    case 'PROCESSING':
    case 'IN_STOCK':
    case 'SHIPPED':
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
    case 'ERROR':
      return 'error';
    case 'ON_HOLD':
    case 'OUT_OF_STOCK':
      return 'mildError';
    case 'PARTIALLY_FULFILLED':
      return 'partiallyFulfilled';
    default:
      return 'success';
  }
};

// Helper function to transform API order to component Order
const transformApiOrder = (apiOrder: ApiOrder): Order => ({
  id: apiOrder.id,
  orderId: apiOrder.orderNumber || apiOrder.orderId,
  orderDate: new Date(apiOrder.orderDate),
  client: apiOrder.client.companyName || apiOrder.client.name,
  weight: '0 kg', // Placeholder - can be calculated from items if needed
  quantity: apiOrder.items.reduce((sum, item) => sum + item.quantity, 0),
  method: apiOrder.shippingMethod || 'Standard',
  status: mapBackendStatusToFrontend(apiOrder.status),
});

interface OrdersTableProps {
  showClientColumn: boolean; // Show client column only for superadmin and warehouse labor view
  basePath?: string; // Base path for navigation (e.g., '/admin/orders' or '/employee/orders')
}

// Status tag component - needs translation function
const StatusTag = ({ status, t }: { status: OrderStatus; t: (key: string) => string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          label: t('processing'),
          dotColor: '#22C55E',
        };
      case 'error':
        return {
          label: 'Error',
          dotColor: '#EF4444',
        };
      case 'mildError':
        return {
          label: t('issue'),
          dotColor: '#F59E0B',
        };
      case 'partiallyFulfilled':
        return {
          label: t('partiallyFulfilled'),
          dotColor: '#3B82F6', // Blue
        };
      default:
        return {
          label: t('unknown'),
          dotColor: '#6B7280',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '9999px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 400,
        color: '#111827',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
        }}
      />
      {config.label}
    </span>
  );
};

export function OrdersTable({ showClientColumn, basePath = '/admin/orders' }: OrdersTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // State for API data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real clients for admin/employee filter
  const { clients, loading: clientsLoading } = useClients();
  const customerNames = getClientNames(clients);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataApi.getOrders();
        const transformedOrders = data.map(transformApiOrder);
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Format date for display with locale support
  const formatOrderDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const orderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const localeStr = locale === 'de' ? 'de-DE' : 'en-US';
    const timeStr = date.toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' });

    if (orderDay.getTime() === today.getTime()) {
      return `${tCommon('today')}, ${timeStr}`;
    } else if (orderDay.getTime() === yesterday.getTime()) {
      return `${tCommon('yesterday')}, ${timeStr}`;
    } else {
      const dayOfWeek = date.toLocaleDateString(localeStr, { weekday: 'short' });
      const dateStr = date.toLocaleDateString(localeStr, { day: '2-digit', month: '2-digit', year: '2-digit' });
      return `${dayOfWeek}, ${dateStr}`;
    }
  };

  // Handle order row click - navigate to order detail page
  const handleOrderClick = (orderId: string) => {
    router.push(`${basePath}/${orderId}`);
  };

  // Filter orders based on tab and search
  const filteredOrders = useMemo(() => {
    let filteredList = [...orders];

    // Filter by tab
    if (activeTab === 'inStock') {
      filteredList = filteredList.filter(o => o.status === 'success');
    } else if (activeTab === 'outOfStock') {
      filteredList = filteredList.filter(o => o.status === 'mildError');
    } else if (activeTab === 'errors') {
      filteredList = filteredList.filter(o => o.status === 'error');
    } else if (activeTab === 'partiallyFulfilled') {
      filteredList = filteredList.filter(o => o.status === 'partiallyFulfilled');
    } else if (activeTab === 'cancelled') {
      // For now, no cancelled orders in mock data
      filteredList = [];
    } else if (activeTab === 'sent') {
      // For now, filter sent as success
      filteredList = filteredList.filter(o => o.status === 'success');
    }

    // Filter by customer
    if (customerFilter !== 'ALL') {
      filteredList = filteredList.filter(o => o.client === customerFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter(o =>
        o.orderId.toLowerCase().includes(query) ||
        o.client.toLowerCase().includes(query) ||
        o.method.toLowerCase().includes(query)
      );
    }

    // Sort by date descending (newest first)
    filteredList.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

    return filteredList;
  }, [orders, activeTab, searchQuery, customerFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Count for tabs
  const allCount = orders.length;
  const inStockCount = orders.filter(o => o.status === 'success').length;
  const outOfStockCount = orders.filter(o => o.status === 'mildError').length;
  const errorsCount = orders.filter(o => o.status === 'error').length;
  const partiallyFulfilledCount = orders.filter(o => o.status === 'partiallyFulfilled').length;
  // cancelledCount and sentCount not shown in tabs currently

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center" style={{ padding: '40px' }}>
        <div style={{ color: '#6B7280', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
          {t('loading') || 'Loading orders...'}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center" style={{ padding: '40px', gap: '16px' }}>
        <div style={{ color: '#EF4444', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#003450',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          {t('retry') || 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col" style={{ gap: 'clamp(16px, 1.76vw, 24px)' }}>
      {/* Header with Tabs and Create Button */}
      <div className="flex flex-col w-full">
        <div className="flex items-end justify-between w-full">
        {/* Tabs */}
        <div
          className="flex items-end"
          style={{
            gap: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          {/* All Orders Tab */}
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'all' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'all' ? '#003450' : '#6B7280',
              }}
            >
              {t('allOrders')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'all' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'all' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {allCount}
            </span>
          </button>

          {/* In Stock Tab */}
          <button
            onClick={() => { setActiveTab('inStock'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'inStock' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'inStock' ? '#003450' : '#6B7280',
              }}
            >
              {t('inStock')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'inStock' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'inStock' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {inStockCount}
            </span>
          </button>

          {/* Out of Stock Tab */}
          <button
            onClick={() => { setActiveTab('outOfStock'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'outOfStock' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'outOfStock' ? '#003450' : '#6B7280',
              }}
            >
              {t('outOfStock')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'outOfStock' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'outOfStock' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {outOfStockCount}
            </span>
          </button>

          {/* Errors Tab */}
          <button
            onClick={() => { setActiveTab('errors'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'errors' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'errors' ? '#003450' : '#6B7280',
              }}
            >
              {t('errors')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'errors' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'errors' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {errorsCount}
            </span>
          </button>

          {/* Partially Fulfilled Tab */}
          <button
            onClick={() => { setActiveTab('partiallyFulfilled'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'partiallyFulfilled' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'partiallyFulfilled' ? '#003450' : '#6B7280',
              }}
            >
              {t('partiallyFulfilled')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'partiallyFulfilled' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'partiallyFulfilled' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {partiallyFulfilledCount}
            </span>
          </button>

          {/* Cancelled Tab */}
          <button
            onClick={() => { setActiveTab('cancelled'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'cancelled' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'cancelled' ? '#003450' : '#6B7280',
              }}
            >
              {t('cancelled')}
            </span>
          </button>

          {/* Sent Tab */}
          <button
            onClick={() => { setActiveTab('sent'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'sent' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'sent' ? '#003450' : '#6B7280',
              }}
            >
              {t('sent')}
            </span>
          </button>
        </div>

        {/* Create Order Button */}
        <button
          onClick={() => router.push(`${basePath}/create`)}
          style={{
            height: 'clamp(32px, 2.8vw, 38px)',
            borderRadius: '6px',
            paddingTop: 'clamp(7px, 0.66vw, 9px)',
            paddingRight: 'clamp(13px, 1.25vw, 17px)',
            paddingBottom: 'clamp(7px, 0.66vw, 9px)',
            paddingLeft: 'clamp(13px, 1.25vw, 17px)',
            backgroundColor: '#003450',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            whiteSpace: 'nowrap',
            marginBottom: 'clamp(8px, 0.88vw, 12px)',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1.03vw, 14px)',
              lineHeight: '20px',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {t('createOrder')}
          </span>
        </button>
      </div>

      {/* Full-width horizontal line below tabs */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#E5E7EB',
          marginTop: '-1px', // Overlap with tab border
        }}
      />
      </div>

      {/* Filter and Search Row */}
      <div className="flex items-end gap-6 flex-wrap">
        {/* Filter by Customer - Only show for admin/employee view */}
        {showClientColumn && (
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1vw, 14px)',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('filterByCustomer')}
          </label>
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setCurrentPage(1); }}
              disabled={clientsLoading}
              style={{
                width: 'clamp(200px, 23.5vw, 320px)',
                maxWidth: '100%',
                height: '38px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: '9px 13px',
                paddingRight: '32px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#374151',
                appearance: 'none',
                cursor: clientsLoading ? 'wait' : 'pointer',
                opacity: clientsLoading ? 0.7 : 1,
              }}
            >
              <option key="ALL" value="ALL">
                {tCommon('all')}
              </option>
              {customerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {/* Dropdown Arrow */}
            <div
              style={{
                position: 'absolute',
                right: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        )}

        {/* Search */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1vw, 14px)',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {tCommon('search')}
          </label>
          <input
            type="text"
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: 'clamp(200px, 23.5vw, 320px)',
              maxWidth: '100%',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 13px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1vw, 14px)',
              lineHeight: '20px',
              color: '#374151',
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div
        style={{
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: showClientColumn
              ? 'minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(60px, 0.8fr)'
              : 'minmax(100px, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(60px, 0.8fr)',
            padding: 'clamp(8px, 0.9vw, 12px) clamp(12px, 1.8vw, 24px)',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('orderDate')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('orderId')}
          </span>
          {showClientColumn && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.9vw, 12px)',
                lineHeight: '16px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('client')}
            </span>
          )}
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('weight')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('quantity')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('method')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('status')}
          </span>
        </div>

        {/* Table Body */}
        {paginatedOrders.map((order, index) => (
          <div
            key={order.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: showClientColumn
                ? 'minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(60px, 0.8fr)'
                : 'minmax(100px, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(60px, 0.8fr)',
              padding: 'clamp(12px, 1.2vw, 16px) clamp(12px, 1.8vw, 24px)',
              borderBottom: index < paginatedOrders.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onClick={() => handleOrderClick(order.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {formatOrderDate(order.orderDate)}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              #{order.orderId}
            </span>
            {showClientColumn && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  lineHeight: '20px',
                  color: '#6B7280',
                }}
              >
                {order.client}
              </span>
            )}
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {order.weight}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {order.quantity}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {order.method}
            </span>
            <div className="flex items-center justify-start">
              <StatusTag status={order.status} t={t} />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {paginatedOrders.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6B7280',
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(12px, 1vw, 14px)',
            }}
          >
            No orders found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between flex-wrap gap-4"
        style={{
          minHeight: '63px',
          paddingTop: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(12px, 1vw, 14px)',
            lineHeight: '20px',
            color: '#374151',
          }}
        >
          Showing <span style={{ fontWeight: 500 }}>{filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
          <span style={{ fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{' '}
          <span style={{ fontWeight: 500 }}>{filteredOrders.length}</span> results
        </span>

        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            style={{
              minWidth: '92px',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 17px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {tCommon('previous')}
            </span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            style={{
              minWidth: '92px',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 17px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1vw, 14px)',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {tCommon('next')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
