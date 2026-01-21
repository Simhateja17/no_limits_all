'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useClients, getClientNames, useReturns, getReturnClientNames } from '@/lib/hooks';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Tab type for returns
type ReturnTabType = 'all' | 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

// Return status type
type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

// Return interface
interface Return {
  id: string;
  returnId: string;
  returnDate: Date;
  client: string;
  orderId: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
}

interface ReturnsTableProps {
  showClientColumn: boolean;
  basePath?: string;
}

// Status tag component - needs translations
const StatusTag = ({ status, t, compact = false }: { status: ReturnStatus; t: (key: string) => string; compact?: boolean }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          label: t('completed'),
          dotColor: '#F59E0B',
        };
      case 'processing':
      default:
        return {
          label: t('processing'),
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
        gap: compact ? '4px' : '8px',
        padding: compact ? '4px 10px' : '6px 14px',
        borderRadius: '9999px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        fontFamily: 'Inter, sans-serif',
        fontSize: compact ? '12px' : '14px',
        fontWeight: 400,
        color: '#111827',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: compact ? '6px' : '8px',
          height: compact ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
        }}
      />
      {config.label}
    </span>
  );
};

export function ReturnsTable({ showClientColumn, basePath = '/admin/returns' }: ReturnsTableProps) {
  const router = useRouter();
  const t = useTranslations('returns');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<ReturnTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch real returns data from API
  const { returns: apiReturns, loading: returnsLoading, error: returnsError, refetch: refetchReturns } = useReturns();

  // Fetch real clients for admin/employee filter
  const { clients, loading: clientsLoading } = useClients();
  const customerNames = showClientColumn 
    ? getClientNames(clients)
    : getReturnClientNames(apiReturns);

  // Format date for display with locale awareness
  const formatReturnDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const returnDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const localeCode = locale === 'de' ? 'de-DE' : 'en-US';
    const timeStr = date.toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });

    if (returnDay.getTime() === today.getTime()) {
      return `${tCommon('today')}, ${timeStr}`;
    } else if (returnDay.getTime() === yesterday.getTime()) {
      return `${tCommon('yesterday')}, ${timeStr}`;
    } else {
      const dayOfWeek = date.toLocaleDateString(localeCode, { weekday: 'short' });
      const dateStr = date.toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: '2-digit' });
      return `${dayOfWeek}, ${dateStr}`;
    }
  };

  // Handle return row click
  const handleReturnClick = (returnId: string) => {
    router.push(`${basePath}/${returnId}`);
  };

  // Filter returns based on tab and search - uses real API data
  const filteredReturns = useMemo(() => {
    let returns = [...apiReturns];

    // Filter by tab
    if (activeTab === 'pending') {
      returns = returns.filter(r => r.status === 'processing' || r.status === 'pending');
    } else if (activeTab === 'completed') {
      returns = returns.filter(r => r.status === 'completed');
    }

    // Filter by customer
    if (customerFilter !== 'ALL') {
      returns = returns.filter(r => r.client === customerFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      returns = returns.filter(r =>
        r.returnId.toLowerCase().includes(query) ||
        r.client.toLowerCase().includes(query) ||
        r.orderId.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    returns.sort((a, b) => b.returnDate.getTime() - a.returnDate.getTime());

    return returns;
  }, [activeTab, searchQuery, customerFilter, apiReturns]);

  // Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = filteredReturns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Count for tabs - uses real API data
  const allCount = apiReturns.length;
  const pendingCount = apiReturns.filter(r => r.status === 'processing' || r.status === 'pending').length;
  const completedCount = apiReturns.filter(r => r.status === 'completed').length;

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

  // Mobile hook
  const isMobile = useIsMobile();

  // Return Card Component for mobile view
  const ReturnCard = ({ returnItem }: { returnItem: Return }) => (
    <div
      onClick={() => handleReturnClick(returnItem.returnId)}
      className="p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-sm font-medium text-gray-900">#{returnItem.returnId}</span>
          <p className="text-xs text-gray-500 mt-1">{formatReturnDate(returnItem.returnDate)}</p>
        </div>
        <StatusTag status={returnItem.status} t={t} compact />
      </div>
      <div className="flex flex-col gap-1 text-xs text-gray-500">
        {showClientColumn && <span>{t('client')}: {returnItem.client}</span>}
        <span>{t('orderId')}: #{returnItem.orderId}</span>
        <span>{t('quantity')}: {returnItem.quantity} | {t('condition')}: {returnItem.reason}</span>
      </div>
    </div>
  );

  // Show loading state
  if (returnsLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003450] mx-auto mb-4"></div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
            {tCommon('loading')}...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (returnsError) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#EF4444', marginBottom: '12px' }}>
            {t('failedToLoadReturns') || 'Failed to load returns'}
          </p>
          <button
            onClick={() => refetchReturns()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#003450',
              color: 'white',
              borderRadius: '6px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {tCommon('retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col" style={{ gap: 'clamp(16px, 1.76vw, 24px)' }}>
      {/* Header with Tabs */}
      <div className="flex flex-col w-full">
        <div className="flex items-end justify-between w-full">
        {/* Tabs - Mobile dropdown or desktop tabs */}
        {isMobile ? (
          <div className="flex-1">
            <select
              value={activeTab}
              onChange={(e) => { setActiveTab(e.target.value as ReturnTabType); setCurrentPage(1); }}
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700"
            >
              <option value="all">{t('allReturns')} ({allCount})</option>
              <option value="pending">{t('processing')} ({pendingCount})</option>
              <option value="completed">{t('completed')} ({completedCount})</option>
            </select>
          </div>
        ) : (
        <div
          className="flex items-end"
          style={{
            gap: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          {/* All Returns Tab */}
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
              {t('allReturns')}
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

          {/* Pending Tab */}
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'pending' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'pending' ? '#003450' : '#6B7280',
              }}
            >
              {t('processing')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'pending' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'pending' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {pendingCount}
            </span>
          </button>

          {/* Approved Tab - Removed */}
          {/* Rejected Tab - Removed */}
          {/* Processing Tab - Removed */}

          {/* Completed Tab */}
          <button
            onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'completed' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'completed' ? '#003450' : '#6B7280',
              }}
            >
              {t('completed')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'completed' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'completed' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {completedCount}
            </span>
          </button>
        </div>
        )}

        {/* Invisible spacer to match height of pages with Create button - hidden on mobile */}
        {!isMobile && (
        <div
          style={{
            height: 'clamp(32px, 2.8vw, 38px)',
            marginBottom: 'clamp(8px, 0.88vw, 12px)',
            visibility: 'hidden',
          }}
        />
        )}
      </div>

      {/* Full-width horizontal line below tabs - hidden on mobile */}
      {!isMobile && (
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#E5E7EB',
          marginTop: '-1px', // Overlap with tab border
        }}
      />
      )}
      </div>

      {/* Filter and Search Row */}
      <div className="flex items-end gap-4 md:gap-6 flex-wrap">
        {/* Filter by Customer - Only show for admin/employee view */}
        {showClientColumn && (
        <div className="flex flex-col gap-2 w-full md:w-auto">
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
              className="w-full md:w-auto"
              style={{
                minWidth: '200px',
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
        <div className="flex flex-col gap-2 w-full md:w-auto">
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
            placeholder=""
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-auto"
            style={{
              minWidth: '200px',
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

      {/* Returns Table - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="flex flex-col gap-3">
          {paginatedReturns.map((returnItem) => (
            <ReturnCard key={returnItem.id} returnItem={returnItem} />
          ))}
          {paginatedReturns.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              {t('noReturnsFound')}
            </div>
          )}
        </div>
      ) : (
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
              ? 'minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(80px, 1fr)'
              : 'minmax(100px, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(80px, 1fr)',
            padding: 'clamp(8px, 0.9vw, 12px) clamp(12px, 1.8vw, 24px)',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
          }}
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {t('returnDate')}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {t('returnId')}
          </span>
          {showClientColumn && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
              {t('client')}
            </span>
          )}
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {t('orderId')}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {t('quantity')}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {t('condition')}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(10px, 0.9vw, 12px)', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>
            {tCommon('status')}
          </span>
        </div>

        {/* Table Body */}
        {paginatedReturns.map((returnItem, index) => (
          <div
            key={returnItem.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: showClientColumn
                ? 'minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(100px, 1.2fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(80px, 1fr)'
                : 'minmax(100px, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(60px, 0.8fr) minmax(100px, 1.2fr) minmax(80px, 1fr)',
              padding: 'clamp(12px, 1.2vw, 16px) clamp(12px, 1.8vw, 24px)',
              borderBottom: index < paginatedReturns.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onClick={() => handleReturnClick(returnItem.returnId)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#111827' }}>
              {formatReturnDate(returnItem.returnDate)}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#111827' }}>
              #{returnItem.returnId}
            </span>
            {showClientColumn && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#6B7280' }}>
                {returnItem.client}
              </span>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#6B7280' }}>
              #{returnItem.orderId}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#6B7280' }}>
              {returnItem.quantity}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#6B7280' }}>
              {returnItem.reason}
            </span>
            <div className="flex items-center justify-start">
              <StatusTag status={returnItem.status} t={t} />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {paginatedReturns.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 1vw, 14px)' }}>
            {t('noReturnsFound')}
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ paddingTop: '12px' }}>
        <span className="text-sm text-gray-700 order-2 sm:order-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Showing <span style={{ fontWeight: 500 }}>{filteredReturns.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
          <span style={{ fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, filteredReturns.length)}</span> of{' '}
          <span style={{ fontWeight: 500 }}>{filteredReturns.length}</span> results
        </span>

        <div className="flex items-center gap-3 order-1 sm:order-2">
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#374151' }}>
              {tCommon('previous')}
            </span>
          </button>

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
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1vw, 14px)', lineHeight: '20px', color: '#374151' }}>
              {tCommon('next')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
