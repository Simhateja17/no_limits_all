'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useClients, getClientNames } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store';
import { dataApi } from '@/lib/data-api';
import { channelsApi, Channel } from '@/lib/channels-api';
import type { Product as ApiProduct } from '@/lib/data-api';

// Tab type
type TabType = 'all' | 'outOfStock' | 'missingData';

// Product interface
interface Product {
  id: string;
  productId: string;
  productName: string;
  available: number;
  reserved: number;
  announced: number;
  client: string;
}

// Channel interface for display
interface DisplayChannel {
  id: string;
  name: string;
  client: string;
  type: string;
}

interface ProductsTableProps {
  showClientColumn: boolean; // Show client column only for superadmin and warehouse labor view
  baseUrl: string; // Base URL for product details navigation (e.g., '/admin/products' or '/employee/products')
}

export function ProductsTable({ showClientColumn, baseUrl }: ProductsTableProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<DisplayChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  // Fetch real clients for admin/employee filter
  const { clients, loading: clientsLoading } = useClients();
  const customerNames = getClientNames(clients);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await dataApi.getProducts();
        // Transform API data to component format
        const transformedProducts: Product[] = data.map(p => ({
          id: p.id,
          productId: p.productId,
          productName: p.name,
          available: p.available,
          reserved: p.reserved,
          announced: p.announced,
          client: p.client.companyName || p.client.name,
        }));
        setProducts(transformedProducts);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch channels from API
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user?.clientId) return;

      try {
        const response = await channelsApi.getChannels(user.clientId);
        if (response.success) {
          // Transform to display format
          const displayChannels: DisplayChannel[] = response.channels.map(ch => ({
            id: ch.id,
            name: ch.name,
            client: user.name || 'Client',
            type: ch.type,
          }));
          setChannels(displayChannels);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
        // Keep empty channels array on error
      }
    };

    fetchChannels();
  }, [user?.clientId, user?.name]);

  // Current client from auth context
  const currentClient = user?.name || 'Client';

  // Filter channels based on user role
  // showClientColumn = true means admin/employee view (can see all channels)
  // showClientColumn = false means client view (can only see their own channels)
  const filteredChannels = showClientColumn
    ? channels
    : channels.filter(ch => ch.client === currentClient);

  const handleProductClick = (productId: string) => {
    router.push(`${baseUrl}/${productId}`);
  };

  // Filter products based on tab and search
  const filteredProducts = useMemo(() => {
    let filteredList = [...products];

    // Filter by tab
    if (activeTab === 'outOfStock') {
      filteredList = filteredList.filter(p => p.available === 0);
    } else if (activeTab === 'missingData') {
      filteredList = filteredList.filter(p => !p.productName || !p.client);
    }

    // Filter by customer
    if (customerFilter !== 'ALL') {
      filteredList = filteredList.filter(p => p.client === customerFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter(p =>
        p.productId.toLowerCase().includes(query) ||
        p.productName.toLowerCase().includes(query) ||
        p.client.toLowerCase().includes(query)
      );
    }

    return filteredList;
  }, [products, activeTab, searchQuery, customerFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Count for tabs
  const allCount = products.length;
  const outOfStockCount = products.filter(p => p.available === 0).length;
  const missingDataCount = products.filter(p => !p.productName || !p.client).length;

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

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <p className="text-red-500">{error}</p>
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
          {/* All Products Tab */}
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
              {t('allProducts')}
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

          {/* Missing Data Tab */}
          <button
            onClick={() => { setActiveTab('missingData'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'missingData' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'missingData' ? '#003450' : '#6B7280',
              }}
            >
              {t('missingData')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'missingData' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'missingData' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {missingDataCount}
            </span>
          </button>
        </div>

        {/* Create Product Button */}
        <button
          onClick={() => router.push(`${baseUrl}/create`)}
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
            {t('createProduct')}
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
        {/* Filter by Customer (admin/employee) or Channels (client) */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {showClientColumn ? t('filterByCustomer') : tCommon('channels')}
          </label>
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setCurrentPage(1); }}
              disabled={showClientColumn ? clientsLoading : false}
              style={{
                width: '320px',
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
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option key="ALL" value="ALL">
                {tCommon('all')}
              </option>
              {/* Show clients for admin/employee, show channels for client view */}
              {showClientColumn
                ? customerNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                : channels.map((channel) => (
                    <option key={channel.name} value={channel.name}>
                      {channel.name} - {channel.type}
                    </option>
                  ))
              }
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

        {/* Search */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
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
              width: '320px',
              maxWidth: '100%',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 13px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          />
        </div>

        {/* Info text for client column visibility */}
        {showClientColumn && (
          <div
            className="ml-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#6B7280',
            }}
          >
            
          </div>
        )}
      </div>

      {/* Products Table */}
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
              ? 'minmax(80px, 1fr) minmax(120px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(100px, 1.5fr)'
              : 'minmax(80px, 1fr) minmax(120px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)',
            padding: '12px 24px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('productId')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('productName')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('available')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('reserved')}
          </span>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B7280',
            }}
          >
            {t('announced')}
          </span>
          {showClientColumn && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('client')}
            </span>
          )}
        </div>

        {/* Table Body */}
        {paginatedProducts.map((product, index) => (
          <div
            key={product.id}
            className="grid"
            onClick={() => handleProductClick(product.productId)}
            style={{
              gridTemplateColumns: showClientColumn
                ? 'minmax(80px, 1fr) minmax(120px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(100px, 1.5fr)'
                : 'minmax(80px, 1fr) minmax(120px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)',
              padding: '16px 24px',
              borderBottom: index < paginatedProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
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
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {product.productId}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {product.productName || <span style={{ color: '#EF4444', fontStyle: 'italic' }}>Missing</span>}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {product.available}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {product.reserved}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6B7280',
              }}
            >
              {product.announced}
            </span>
            {showClientColumn && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                }}
              >
                {product.client || <span style={{ color: '#EF4444', fontStyle: 'italic' }}>Missing</span>}
              </span>
            )}
          </div>
        ))}

        {/* Empty State */}
        {paginatedProducts.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6B7280',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            }}
          >
            No products found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between"
        style={{
          height: '63px',
          paddingTop: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            lineHeight: '20px',
            color: '#374151',
          }}
        >
          Showing <span style={{ fontWeight: 500 }}>{filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
          <span style={{ fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of{' '}
          <span style={{ fontWeight: 500 }}>{filteredProducts.length}</span> results
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
                fontSize: '14px',
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
                fontSize: '14px',
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
