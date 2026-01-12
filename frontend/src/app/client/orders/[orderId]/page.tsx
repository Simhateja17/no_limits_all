'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { dataApi, type Order as ApiOrder, type UpdateOrderInput } from '@/lib/data-api';

// Type for transformed order details
interface OrderDetails {
  orderId: string;
  status: 'Processing' | 'On Hold' | 'Shipped' | 'Cancelled';
  deliveryMethod: {
    name: string;
    street: string;
    city: string;
    country: string;
  };
  shippingMethod: string;
  trackingNumber: string;
  shipmentWeight: string;
  tags: string[];
  onHoldStatus: boolean;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    gtin: string;
    qty: number;
    merchant: string;
  }>;
}

// Transform API order to component format
const transformApiOrderToDetails = (apiOrder: ApiOrder): OrderDetails => {
  const mapStatus = (status: string): 'Processing' | 'On Hold' | 'Shipped' | 'Cancelled' => {
    switch (status) {
      case 'SHIPPED':
      case 'DELIVERED':
        return 'Shipped';
      case 'ON_HOLD':
        return 'On Hold';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  };

  return {
    orderId: apiOrder.orderNumber || apiOrder.orderId,
    status: mapStatus(apiOrder.status),
    // Use actual shipping address from order
    deliveryMethod: {
      name: apiOrder.customerName ||
        `${apiOrder.shippingFirstName || ''} ${apiOrder.shippingLastName || ''}`.trim() ||
        (apiOrder.client?.name || apiOrder.client?.companyName || '').trim() ||
        'N/A',
      street: apiOrder.shippingAddress1 || 'N/A',
      city: apiOrder.shippingCity || 'N/A',
      country: apiOrder.shippingCountry || 'N/A',
    },
    shippingMethod: apiOrder.shippingMethod || 'Standard',
    trackingNumber: apiOrder.trackingNumber || 'N/A',
    shipmentWeight: apiOrder.totalWeight ? `${apiOrder.totalWeight} kg` : '0 kg',
    tags: apiOrder.tags || [],
    onHoldStatus: apiOrder.status === 'ON_HOLD',
    products: apiOrder.items.map(item => ({
      id: item.id,
      name: item.product?.name || item.productName || 'Unknown Product',
      sku: item.product?.sku || item.sku || 'N/A',
      gtin: item.product?.gtin || 'N/A',
      qty: item.quantity,
      merchant: apiOrder.client?.companyName || apiOrder.client?.name || 'N/A',
    })),
  };
};

// Mock available products to add
const mockAvailableProducts = [
  { id: '3', name: 'Testproduct 3', sku: '#24235', gtin: '342345235325', qty: 1, merchant: 'Merchant 1' },
  { id: '4', name: 'Testproduct 4', sku: '#24236', gtin: '342345235326', qty: 1, merchant: 'Merchant 2' },
  { id: '5', name: 'Testproduct 5', sku: '#24237', gtin: '342345235327', qty: 1, merchant: 'Merchant 3' },
  { id: '6', name: 'Testproduct 6', sku: '#24238', gtin: '342345235328', qty: 1, merchant: 'Merchant 4' },
  { id: '7', name: 'Testproduct 7', sku: '#24234', gtin: '342345235324', qty: 1, merchant: 'Merchant 5' },
];

// Available shipping methods
const shippingMethods = [
  { id: 'dhl', name: 'DHL Paket National', logo: '/dhl.png' },
  { id: 'dhl-express', name: 'DHL Express', logo: '/dhl.png' },
  { id: 'ups', name: 'UPS Standard', logo: '/ups.png' },
  { id: 'ups-express', name: 'UPS Express', logo: '/ups.png' },
  { id: 'fedex', name: 'FedEx Ground', logo: '/fedex.png' },
  { id: 'fedex-express', name: 'FedEx Express', logo: '/fedex.png' },
  { id: 'dpd', name: 'DPD Classic', logo: '/DPD_logo(red)2015.png' },
  { id: 'hermes', name: 'Hermes Paket', logo: '/hermes.png' },
];

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Processing':
      return '#6BAC4D';
    case 'On Hold':
      return '#F59E0B';
    case 'Shipped':
      return '#10B981';
    case 'Cancelled':
      return '#EF4444';
    default:
      return '#6BAC4D';
  }
};

export default function ClientOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');
  const tCountries = useTranslations('countries');
  const tStatus = useTranslations('status');
  const tMessages = useTranslations('messages');
  const tErrors = useTranslations('errors');

  // API state
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [rawOrder, setRawOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingReplacement, setIsCreatingReplacement] = useState(false);

  const [editOrderEnabled, setEditOrderEnabled] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [onHoldStatus, setOnHoldStatus] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [replacementCount, setReplacementCount] = useState(0);
  const [orderProducts, setOrderProducts] = useState<OrderDetails['products']>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [showProductList, setShowProductList] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(shippingMethods[0]);
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [jtlSyncStatus, setJtlSyncStatus] = useState<{ success: boolean; error?: string } | null>(null);

  // Form state for edit modal
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    addressLine2: '',
    streetAddress: '',
    city: '',
    zipPostal: '',
    country: 'United States',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Fetch order details from API
  useEffect(() => {
    const orderId = params.orderId as string;
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataApi.getOrder(orderId);
        setRawOrder(data as any);
        const transformed = transformApiOrderToDetails(data as any);
        setOrderDetails(transformed);
        setOnHoldStatus(transformed.onHoldStatus);
        setTags(transformed.tags);
        setOrderProducts(transformed.products);
        // Initialize form data from raw order
        setFormData({
          firstName: (data as any).shippingFirstName || '',
          lastName: (data as any).shippingLastName || '',
          company: (data as any).shippingCompany || '',
          addressLine2: (data as any).shippingAddress2 || '',
          streetAddress: (data as any).shippingAddress1 || '',
          city: (data as any).shippingCity || '',
          zipPostal: (data as any).shippingZip || '',
          country: (data as any).shippingCountry || 'Deutschland',
        });
        // Initialize order notes
        setOrderNotes((data as any).warehouseNotes || '');
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId]);

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full flex justify-center items-center" style={{ padding: '40px' }}>
          <div style={{ color: '#6B7280', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            {tCommon('loading') || 'Loading order...'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !orderDetails) {
    return (
      <DashboardLayout>
        <div className="w-full flex flex-col items-center justify-center" style={{ padding: '40px', gap: '16px' }}>
          <div style={{ color: '#EF4444', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            {error || tErrors('orderNotFound')}
          </div>
          <button
            onClick={() => router.back()}
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
            {tCommon('back') || 'Go Back'}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const orderId = params.orderId as string;

  const handleBack = () => {
    router.back();
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // Save all order changes to DB and sync to JTL
  const handleSaveOrder = async () => {
    if (!rawOrder?.id) {
      setSaveError('Order data not loaded');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setJtlSyncStatus(null);

    try {
      // Build update data - send all current values, backend will determine what changed
      const updateData: UpdateOrderInput = {
        warehouseNotes: orderNotes || undefined,
        isOnHold: onHoldStatus,
        tags: tags,
        shippingFirstName: formData.firstName || undefined,
        shippingLastName: formData.lastName || undefined,
        shippingCompany: formData.company || undefined,
        shippingAddress1: formData.streetAddress || undefined,
        shippingAddress2: formData.addressLine2 || undefined,
        shippingCity: formData.city || undefined,
        shippingZip: formData.zipPostal || undefined,
        items: orderProducts.map(p => ({
          id: p.id,
          sku: p.sku,
          productName: p.name,
          quantity: p.qty,
        })),
      };

      console.log('[Order Save] Saving order:', rawOrder.id, updateData);

      const result = await dataApi.updateOrder(rawOrder.id, updateData);

      console.log('[Order Save] Save result:', result);

      // Update local state with new data
      setRawOrder(result.data as any);
      const transformed = transformApiOrderToDetails(result.data as any);
      setOrderDetails(transformed);

      // Track JTL sync status
      if (result.jtlSync) {
        setJtlSyncStatus(result.jtlSync);
        if (!result.jtlSync.success) {
          console.warn('JTL sync failed:', result.jtlSync.error);
        }
      }

      setEditOrderEnabled(false);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating order:', err);
      setSaveError(err.response?.data?.error || 'Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  // Save address from modal and close it
  const handleSaveAddress = async () => {
    setShowEditModal(false);
    // The actual save happens when the user clicks the main Save button
    // This just closes the address edit modal
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle removing product from order
  const handleRemoveProduct = (productId: string) => {
    setOrderProducts(orderProducts.filter(p => p.id !== productId));
  };

  // Handle adding product to order
  const handleAddProduct = (product: typeof mockAvailableProducts[0]) => {
    const qty = productQuantities[product.id] || 1;
    const existingProduct = orderProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setOrderProducts(orderProducts.map(p => 
        p.id === product.id ? { ...p, qty: p.qty + qty } : p
      ));
    } else {
      setOrderProducts([...orderProducts, { ...product, qty }]);
    }
    // Don't close the list - keep it open for adding more products
  };

  // Handle closing the product search
  const handleCloseProductSearch = () => {
    setProductSearchQuery('');
    setShowProductList(false);
  };

  // Handle quantity change for available products
  const handleQuantityChange = (productId: string, qty: number) => {
    setProductQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  // Filter available products based on search
  const filteredAvailableProducts = mockAvailableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) &&
    !orderProducts.find(op => op.id === p.id)
  );

  // Get the base order ID (without replacement suffix)
  const getBaseOrderId = (id: string) => {
    const match = id.match(/^(.+?)-\d+$/);
    return match ? match[1] : id;
  };

  // Get current replacement number from order ID
  const getCurrentReplacementNumber = (id: string) => {
    const match = id.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Handle create replacement order
  const handleCreateReplacementOrder = async () => {
    if (!rawOrder?.id) {
      setError('Cannot create replacement: Order data not loaded');
      return;
    }

    setIsCreatingReplacement(true);
    setError(null);

    try {
      // Call the API to create the replacement order
      const result = await dataApi.createReplacementOrder(rawOrder.id, {
        reason: 'Customer requested replacement',
        items: orderProducts.map(p => ({
          sku: p.sku,
          productName: p.name,
          quantity: p.qty,
        })),
        notes: orderNotes || undefined,
      });

      // Show success modal
      setShowReplacementModal(true);

      // Navigate to the new replacement order after a delay
      setTimeout(() => {
        setShowReplacementModal(false);
        router.push(`/client/orders/${result.replacementOrderId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating replacement order:', err);
      setError(err.response?.data?.error || 'Failed to create replacement order');
    } finally {
      setIsCreatingReplacement(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen bg-[#F9FAFB]">
        <div className="px-[clamp(24px,4vw,52px)] py-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            style={{
              height: '38px',
              padding: '9px 17px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
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
              {tCommon('back')}
            </span>
          </button>

          {/* Main Content */}
          <div className="mt-8 flex flex-col lg:flex-row gap-[clamp(20px,2.5vw,34px)]">
            {/* Left Column - Order Info Cards */}
            <div className="flex flex-col gap-4 w-full lg:w-[20%] lg:min-w-[240px] lg:max-w-[280px]">
              {/* Order ID Box */}
              <div
                style={{
                  width: '100%',
                  minHeight: '104px',
                  gap: '4px',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                {locale === 'de' ? (
                  // German layout: Pill above Label
                  <>
                    {/* Status Pill */}
                    <div
                      style={{
                        height: '26px',
                        gap: '8px',
                        padding: '3px 13px',
                        borderRadius: '13px',
                        border: '1px solid #D1D5DB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        marginBottom: '8px',
                        width: 'fit-content'
                      }}
                    >
                      {/* Status Dot */}
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: onHoldStatus
                            ? '#F59E0B'
                            : getStatusColor(orderDetails?.status || 'Processing'),
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '15px',
                          lineHeight: '20px',
                          color: '#000000',
                        }}
                      >
                        {onHoldStatus
                          ? tOrders('onHold')
                          : tOrders((orderDetails?.status || 'Processing').toLowerCase())}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(16px, 1.3vw, 18px)',
                          lineHeight: '24px',
                          color: '#111827',
                        }}
                      >
                        {tOrders('orderId')}
                      </span>
                    </div>
                  </>
                ) : (
                  // English/Other layout: Pill inline/right
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(16px, 1.3vw, 18px)',
                        lineHeight: '24px',
                        color: '#111827',
                      }}
                    >
                      {tOrders('orderId')}
                    </span>
                    {/* Status Pill */}
                    <div
                      style={{
                        height: '26px',
                        gap: '8px',
                        padding: '3px 13px',
                        borderRadius: '13px',
                        border: '1px solid #D1D5DB',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {/* Status Dot */}
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: onHoldStatus
                            ? '#F59E0B'
                            : getStatusColor(orderDetails?.status || 'Processing'),
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '15px',
                          lineHeight: '20px',
                          color: '#000000',
                        }}
                      >
                        {onHoldStatus
                          ? tOrders('onHold')
                          : tOrders((orderDetails?.status || 'Processing').toLowerCase())}
                      </span>
                    </div>
                  </div>
                )}
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '24px',
                    color: '#6B7280',
                    marginTop: '4px',
                    display: 'block',
                  }}
                >
                  {orderId || orderDetails?.orderId}
                </span>
              </div>

              {/* Delivery Method Box */}
              <div
                style={{
                  width: '100%',
                  minHeight: '180px',
                  gap: '4px',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(16px, 1.3vw, 18px)',
                      lineHeight: '24px',
                      color: '#111827',
                    }}
                  >
                    {tOrders('deliveryMethod')}
                  </span>
                  {/* Edit Pill - Only show when edit mode is enabled */}
                  {editOrderEnabled && (
                    <button
                      onClick={handleEditClick}
                      style={{
                        height: 'clamp(18px, 1.5vw, 20px)',
                        padding: 'clamp(1px, 0.15vw, 2px) clamp(8px, 0.74vw, 10px)',
                        borderRadius: '10px',
                        backgroundColor: '#F3F4F6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(10px, 0.88vw, 12px)',
                          lineHeight: '16px',
                          color: '#003450',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tCommon('edit')}
                      </span>
                    </button>
                  )}
                </div>
                <div
                  style={{
                    marginTop: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    lineHeight: '32px',
                    color: '#111827',
                  }}
                >
                  <div>{orderDetails?.deliveryMethod.name}</div>
                  <div>{orderDetails?.deliveryMethod.street}</div>
                  <div>{orderDetails?.deliveryMethod.city}</div>
                  <div>{orderDetails?.deliveryMethod.country}</div>
                </div>
              </div>

              {/* Shipping Method Box */}
              <div
                style={{
                  width: '100%',
                  minHeight: '90px',
                  gap: '4px',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.3vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                  }}
                >
                  {tOrders('shippingMethod')}
                </span>
                {editOrderEnabled ? (
                  <div style={{ position: 'relative', marginTop: '12px' }}>
                    <button
                      onClick={() => setShowShippingDropdown(!showShippingDropdown)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <Image
                            src={selectedShippingMethod.logo}
                            alt={selectedShippingMethod.name}
                            fill
                            sizes="24px"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <span
                          style={{
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: '#111827',
                          }}
                        >
                          {selectedShippingMethod.name}
                        </span>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          transform: showShippingDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="#6B7280"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {showShippingDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 50,
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}
                      >
                        {shippingMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => {
                              setSelectedShippingMethod(method);
                              setShowShippingDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: selectedShippingMethod.id === method.id ? '#F3F4F6' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedShippingMethod.id !== method.id) {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedShippingMethod.id !== method.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              <Image
                                src={method.logo}
                                alt={method.name}
                                fill
                                sizes="24px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <span
                              style={{
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '20px',
                                color: '#111827',
                              }}
                            >
                              {method.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <Image
                          src={selectedShippingMethod.logo}
                          alt={selectedShippingMethod.name}
                          fill
                          sizes="24px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#111827',
                        }}
                      >
                        {selectedShippingMethod.name}
                      </span>
                    </div>
                    {orderDetails?.trackingNumber && (
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#6B7280',
                          paddingLeft: '32px',
                        }}
                      >
                        {orderDetails.trackingNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* On Hold Toggle */}
              <div
                style={{
                  width: '100%',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(16px, 1.3vw, 18px)',
                      lineHeight: '24px',
                      color: '#111827',
                    }}
                  >
                    {tOrders('onHold')}
                  </span>
                  <button
                    onClick={() => editOrderEnabled && setOnHoldStatus(!onHoldStatus)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      padding: '2px',
                      backgroundColor: onHoldStatus ? '#003450' : '#E5E7EB',
                      position: 'relative',
                      cursor: editOrderEnabled ? 'pointer' : 'not-allowed',
                      border: 'none',
                      transition: 'background-color 0.2s',
                      opacity: editOrderEnabled ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        position: 'absolute',
                        top: '2px',
                        left: onHoldStatus ? '22px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                  }}
                >
                  {tOrders('onHoldDescription')}
                </p>
              </div>

              {/* Shipment Weight Box */}
              <div
                style={{
                  width: '100%',
                  minWidth: 'clamp(240px, 19.9%, 270px)',
                  minHeight: '140px',
                  gap: '4px',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.3vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                  }}
                >
                  {tOrders('shipmentWeight')}
                </span>
                <div
                  style={{
                    marginTop: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(13px, 1.1vw, 15px)',
                    lineHeight: '20px',
                    color: '#111827',
                  }}
                >
                  {orderDetails?.shipmentWeight}
                </div>
                <div
                  style={{
                    marginTop: '24px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                  }}
                >
                  {tOrders('shipmentWeightDescription')}
                </div>
              </div>

              {/* Tags Box */}
              <div
                style={{
                  width: '100%',
                  minWidth: 'clamp(240px, 19.9%, 270px)',
                  minHeight: editOrderEnabled ? '150px' : '100px',
                  gap: '4px',
                  padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.3vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                  }}
                >
                  {tOrders('tags')}
                </span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#F3F4F6',
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
                        {tag}
                      </span>
                      {editOrderEnabled && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3L3 9M3 3L9 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editOrderEnabled && (
                  <div 
                    className="relative mt-4"
                    style={{
                      width: '100%',
                    }}
                  >
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag();
                        }
                      }}
                      placeholder={tOrders('addTag')}
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB',
                        padding: '10px 60px 10px 12px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#111827',
                      }}
                    />
                    <button
                      onClick={handleAddTag}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '28px',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Products and Actions */}
            <div className="flex flex-col gap-6" style={{ flex: 1, maxWidth: '927px' }}>
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
                    gridTemplateColumns: editOrderEnabled ? '0.5fr 2fr 1fr 1.5fr 0.8fr' : '2fr 1fr 1.5fr 0.8fr',
                    padding: '12px 24px',
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  {editOrderEnabled && <span></span>}
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
                    {tOrders('productName')}
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
                    SKU
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
                    GTIN
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
                    QTY
                  </span>
                </div>

                {/* Table Body */}
                {orderProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: editOrderEnabled ? '0.5fr 2fr 1fr 1.5fr 0.8fr' : '2fr 1fr 1.5fr 0.8fr',
                      padding: '16px 24px',
                      borderBottom: index < orderProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
                    }}
                  >
                    {editOrderEnabled && (
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 10px',
                          borderRadius: '10px',
                          backgroundColor: '#FEE2E2',
                          border: 'none',
                          cursor: 'pointer',
                          width: 'fit-content',
                          marginRight: '10px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '16px',
                            color: '#DC2626',
                          }}
                        >
                          {tCommon('remove')}
                        </span>
                      </button>
                    )}
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#111827',
                      }}
                    >
                      {product.name}
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
                      {product.sku}
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
                      {product.gtin}
                    </span>
                    {editOrderEnabled ? (
                      <input
                        type="number"
                        min="1"
                        value={product.qty}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newQty = value === '' ? 0 : parseInt(value);
                          setOrderProducts(orderProducts.map(p =>
                            p.id === product.id ? { ...p, qty: newQty } : p
                          ));
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (!value || value < 1) {
                            setOrderProducts(orderProducts.map(p =>
                              p.id === product.id ? { ...p, qty: 1 } : p
                            ));
                          }
                        }}
                        style={{
                          width: '60px',
                          height: '32px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#111827',
                          textAlign: 'center',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: '14px',
                          lineHeight: '20px',
                          color: '#111827',
                        }}
                      >
                        {product.qty}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Products Section - Only visible when edit mode is enabled */}
              {editOrderEnabled && (
                <>
                  {/* Add Products Search Box */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 'clamp(280px, 23.5vw, 320px)',
                      minHeight: 'clamp(48px, 3.9vw, 54px)',
                      padding: 'clamp(10px, 1vw, 12px) clamp(10px, 1vw, 12px)',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '12px',
                        lineHeight: '16px',
                        color: '#374151',
                        marginBottom: '4px',
                      }}
                    >
                      {tOrders('addProducts')}
                    </label>
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        if (e.target.value) {
                          setShowProductList(true);
                        }
                      }}
                      placeholder={tOrders('searchProducts')}
                      style={{
                        width: 'calc(100% - 24px)',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#6B7280',
                        backgroundColor: 'transparent',
                      }}
                    />
                    {productSearchQuery && (
                      <button
                        onClick={handleCloseProductSearch}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          bottom: '10px',
                          background: '#e5e7eb',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4L4 12M4 4L12 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Available Products Table */}
                  {showProductList && productSearchQuery && filteredAvailableProducts.length > 0 && (
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
                          gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr 0.5fr',
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
                          {tOrders('productName')}
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
                          SKU
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
                          GTIN
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
                          QTY
                        </span>
                        <span></span>
                      </div>

                      {/* Table Body */}
                      {filteredAvailableProducts.map((product, index) => (
                        <div
                          key={product.id}
                          className="grid items-center"
                          style={{
                            gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr 0.5fr',
                            padding: '16px 24px',
                            borderBottom: index < filteredAvailableProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
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
                            {product.name}
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
                            {product.sku}
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
                            {product.gtin}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={productQuantities[product.id] ?? 1}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleQuantityChange(product.id, value === '' ? 0 : parseInt(value));
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (!value || value < 1) {
                                handleQuantityChange(product.id, 1);
                              }
                            }}
                            style={{
                              width: '60px',
                              height: '32px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #D1D5DB',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 400,
                              fontSize: '14px',
                              lineHeight: '20px',
                              color: '#111827',
                              textAlign: 'center',
                            }}
                          />
                          <button
                            onClick={() => handleAddProduct(product)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px 10px',
                              borderRadius: '10px',
                              backgroundColor: '#003450',
                              border: 'none',
                              cursor: 'pointer',
                              width: 'fit-content',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500,
                                fontSize: '12px',
                                lineHeight: '16px',
                                color: '#FFFFFF',
                              }}
                            >
                              {tOrders('add')}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Edit Order Box */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  padding: 'clamp(16px, 1.8vw, 24px)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(16px, 1.3vw, 18px)',
                      lineHeight: '24px',
                      color: '#111827',
                    }}
                  >
                    {tOrders('editOrder')}
                  </span>
                  {/* Toggle */}
                  <button
                    onClick={() => setEditOrderEnabled(!editOrderEnabled)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      padding: '2px',
                      backgroundColor: editOrderEnabled ? '#003450' : '#E5E7EB',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
                        transform: editOrderEnabled ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                {/* Save Button - appears when edit mode is enabled */}
                {editOrderEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {saveError && (
                      <div style={{ color: '#EF4444', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                        {saveError}
                      </div>
                    )}
                    {jtlSyncStatus && !jtlSyncStatus.success && (
                      <div style={{ color: '#F59E0B', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                        JTL Sync Warning: {jtlSyncStatus.error}
                      </div>
                    )}
                    <button
                      onClick={handleSaveOrder}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        height: '42px',
                        borderRadius: '6px',
                        padding: '10px 20px',
                        backgroundColor: isSaving ? '#6B7280' : '#003450',
                        border: 'none',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(13px, 1.03vw, 14px)',
                          lineHeight: '20px',
                          color: '#FFFFFF',
                        }}
                      >
                        {isSaving ? (tCommon('saving') || 'Saving...') : (tCommon('saveChanges') || 'Save Changes')}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Order Notes Box */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  padding: 'clamp(20px, 1.77vw, 24px)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(16px, 1.47vw, 20px)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.33vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                  }}
                >
                  {tOrders('orderNotes')}
                </span>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(13px, 1.03vw, 14px)',
                    lineHeight: '20px',
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  {tOrders('orderNotesDescription')}
                </p>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  disabled={!editOrderEnabled}
                  placeholder="Please double check condition of the products before you send it out"
                  style={{
                    width: '100%',
                    minHeight: 'clamp(70px, 5.9vw, 80px)',
                    padding: 'clamp(10px, 0.88vw, 12px) clamp(12px, 1.03vw, 14px)',
                    borderRadius: '6px',
                    border: '1px solid #DFDFDF',
                    backgroundColor: editOrderEnabled ? '#FFFFFF' : '#F3F4F6',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 'clamp(13px, 1.03vw, 14px)',
                    fontWeight: 400,
                    lineHeight: '140%',
                    letterSpacing: '0%',
                    color: editOrderEnabled ? '#111827' : '#6B7280',
                    resize: 'vertical',
                    outline: 'none',
                    cursor: editOrderEnabled ? 'text' : 'not-allowed',
                  }}
                />
              </div>

              {/* Delete Order Box */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  padding: 'clamp(16px, 1.8vw, 24px)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.3vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  {tOrders('deleteOrder')}
                </span>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                    marginBottom: '16px',
                  }}
                >
                  {tOrders('deleteOrderWarning')}
                </p>
                <button
                  style={{
                    minWidth: '120px',
                    height: '38px',
                    borderRadius: '6px',
                    padding: '9px 17px',
                    backgroundColor: '#FEE2E2',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      lineHeight: '20px',
                      color: '#DC2626',
                    }}
                  >
                    {tOrders('deleteOrder')}
                  </span>
                </button>
              </div>



              {/* Create Replacement Order Box */}
              <div
                style={{
                  width: '100%',
                  minHeight: '178px',
                  gap: '20px',
                  borderRadius: '8px',
                  padding: 'clamp(16px, 1.8vw, 24px)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(16px, 1.3vw, 18px)',
                    lineHeight: '24px',
                    color: '#111827',
                    display: 'block',
                  }}
                >
                  {tOrders('createReplacementOrder')}
                </span>
                <p
                  style={{
                    marginTop: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                  }}
                >
                  {tOrders('createReplacementOrderDescription')}
                </p>
                <button
                  onClick={handleCreateReplacementOrder}
                  disabled={isCreatingReplacement}
                  style={{
                    marginTop: '20px',
                    width: 'clamp(170px, 15.2vw, 206px)',
                    height: 'clamp(34px, 2.8vw, 38px)',
                    padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                    borderRadius: '6px',
                    backgroundColor: isCreatingReplacement ? '#9CA3AF' : '#003450',
                    border: 'none',
                    cursor: isCreatingReplacement ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                      textAlign: 'center',
                    }}
                  >
                    {isCreatingReplacement ? 'Creating...' : tOrders('createReplacementOrder')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Address Modal */}
        {showEditModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowEditModal(false)}
          >
            <div
              style={{
                width: '803px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '24px',
                }}
              >
                {tOrders('editOrder')}
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* First Name */}
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
                    {tOrders('firstName')}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* Last Name */}
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
                    {tOrders('lastName')}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* Company */}
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
                    {tOrders('company')}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* Street Address */}
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
                    {tOrders('streetAddress')}
                  </label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* Address Line 2 - Full Width */}
                <div className="flex flex-col gap-2 col-span-2">
                  <label
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                    }}
                  >
                    {tOrders('addressLine2')}
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* City */}
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
                    {tOrders('city')}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* ZIP / Postal */}
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
                    {tOrders('zipPostal')}
                  </label>
                  <input
                    type="text"
                    value={formData.zipPostal}
                    onChange={(e) => setFormData({ ...formData, zipPostal: e.target.value })}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '9px 13px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                    }}
                    placeholder=""
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-2 col-span-2">
                  <label
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                    }}
                  >
                    {tOrders('country')}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      style={{
                        width: '100%',
                        maxWidth: '366px',
                        height: '38px',
                        padding: '9px 13px',
                        paddingRight: '32px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        appearance: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="unitedStates">{tCountries('unitedStates')}</option>
                      <option value="germany">{tCountries('germany')}</option>
                      <option value="austria">{tCountries('austria')}</option>
                      <option value="switzerland">{tCountries('switzerland')}</option>
                    </select>
                    <div
                      style={{
                        position: 'absolute',
                        right: 'calc(100% - 366px + 13px)',
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
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveAddress}
                  style={{
                    minWidth: 'clamp(60px, 5.5vw, 75px)',
                    height: 'clamp(34px, 2.8vw, 38px)',
                    padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                    borderRadius: '6px',
                    backgroundColor: '#003450',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      lineHeight: '20px',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {tCommon('save')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '512px',
                maxWidth: '90vw',
                gap: '24px',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Green Checkmark Circle */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '24px',
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  textAlign: 'center',
                  color: '#111827',
                }}
              >
                {tOrders('shippingAddressChanged')}
              </span>
            </div>
          </div>
        )}

        {/* Replacement Order Created Modal */}
        {showReplacementModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '512px',
                height: '140px',
                maxWidth: '90vw',
                gap: '24px',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Green Checkmark Circle */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '24px',
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  textAlign: 'center',
                  color: '#111827',
                }}
              >
                {tOrders('replacementOrderCreated')}
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
