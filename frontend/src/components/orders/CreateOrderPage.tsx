'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { dataApi, type Product, type CreateOrderInput } from '@/lib/data-api';

type OrderStatus = 'Processing' | 'On Hold' | 'Shipped' | 'Cancelled';

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  gtin: string;
  qty: number;
  stock: number;
  weightInKg: number | null;
};

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

// Map country codes
const countryCodeMap: Record<string, string> = {
  unitedStates: 'US',
  germany: 'DE',
  austria: 'AT',
  switzerland: 'CH',
};

const getStatusColor = (status: OrderStatus) => {
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

export function CreateOrderPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tOrders = useTranslations('orders');
  const tCountries = useTranslations('countries');
  const tMessages = useTranslations('messages');
  const tProducts = useTranslations('products');

  const isGerman = locale?.toLowerCase().startsWith('de');

  const [orderStatus] = useState<OrderStatus>('Processing');
  const [orderId, setOrderId] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [onHoldStatus, setOnHoldStatus] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Products state
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [orderProducts, setOrderProducts] = useState<ProductRow[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [showProductList, setShowProductList] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedShippingMethod, setSelectedShippingMethod] = useState(shippingMethods[0]);
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);

  const [orderNotes, setOrderNotes] = useState('');

  const [deliveryMethod, setDeliveryMethod] = useState({
    name: '',
    street: '',
    city: '',
    country: '',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    addressLine2: '',
    streetAddress: '',
    city: '',
    zipPostal: '',
    country: 'unitedStates',
  });

  // Fetch products on mount
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const products = await dataApi.getProducts();
      const mappedProducts: ProductRow[] = products.map((p: Product) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        gtin: p.gtin || '',
        qty: 1,
        stock: p.available,
        weightInKg: p.weightInKg,
      }));
      setAllProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Close dropdowns when navigating away
    return () => {
      setShowShippingDropdown(false);
      setShowProductList(false);
    };
  }, [fetchProducts]);

  const handleBack = () => router.back();

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRemoveProduct = (productId: string) => {
    setOrderProducts(orderProducts.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setProductQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const availableProducts = useMemo(() => {
    const query = productSearchQuery.toLowerCase();
    return allProducts.filter(p =>
      (p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)) &&
      !orderProducts.find(op => op.id === p.id)
    );
  }, [productSearchQuery, orderProducts, allProducts]);

  // Calculate total shipment weight
  const totalShipmentWeight = useMemo(() => {
    return orderProducts.reduce((total, product) => {
      const weight = product.weightInKg || 0;
      return total + (weight * product.qty);
    }, 0);
  }, [orderProducts]);

  const handleAddProduct = (product: ProductRow) => {
    const qty = productQuantities[product.id] ?? 1;
    const existingProduct = orderProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setOrderProducts(orderProducts.map(p => (p.id === product.id ? { ...p, qty: p.qty + qty } : p)));
    } else {
      setOrderProducts([...orderProducts, { ...product, qty }]);
    }
  };

  const handleCloseProductSearch = () => {
    setProductSearchQuery('');
    setShowProductList(false);
  };

  const handleSaveAddress = () => {
    const name = `${formData.firstName} ${formData.lastName}`.trim();
    setDeliveryMethod({
      name,
      street: `${formData.streetAddress}${formData.addressLine2 ? ` ${formData.addressLine2}` : ''}`.trim(),
      city: `${formData.zipPostal} ${formData.city}`.trim(),
      country: tCountries(formData.country),
    });
    setShowEditModal(false);
  };

  const handleCreateOrder = async () => {
    // Validate that there are products
    if (orderProducts.length === 0) {
      setErrorMessage('Please add at least one product to the order');
      setShowErrorModal(true);
      return;
    }

    setIsCreating(true);
    try {
      const orderInput: CreateOrderInput = {
        orderId: orderId || undefined,
        items: orderProducts.map(p => ({
          productId: p.id,
          quantity: p.qty,
          sku: p.sku,
          productName: p.name,
        })),
        shippingMethod: selectedShippingMethod.name,
        shippingFirstName: formData.firstName || undefined,
        shippingLastName: formData.lastName || undefined,
        shippingCompany: formData.company || undefined,
        shippingAddress1: formData.streetAddress || undefined,
        shippingAddress2: formData.addressLine2 || undefined,
        shippingCity: formData.city || undefined,
        shippingZip: formData.zipPostal || undefined,
        shippingCountry: tCountries(formData.country),
        shippingCountryCode: countryCodeMap[formData.country],
        notes: orderNotes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        isOnHold: onHoldStatus,
      };

      await dataApi.createOrder(orderInput);

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push(basePath);
      }, 2000);
    } catch (error) {
      console.error('Error creating order:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create order');
      setShowErrorModal(true);
    } finally {
      setIsCreating(false);
    }
  };

  return (
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
          {/* Left Column */}
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
              {(() => {
                const statusPill = (
                  <div
                    style={{
                      height: '26px',
                      gap: '8px',
                      padding: '3px 13px',
                      borderRadius: '13px',
                      border: '1px solid #D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      width: 'fit-content',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: onHoldStatus ? '#F59E0B' : getStatusColor(orderStatus),
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
                      {onHoldStatus ? tOrders('onHold') : tOrders('processing')}
                    </span>
                  </div>
                );

                const orderIdLabel = (
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
                );

                if (isGerman) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                      {statusPill}
                      {orderIdLabel}
                    </div>
                  );
                }

                return (
                  <div className="flex items-center justify-between">
                    {orderIdLabel}
                    {statusPill}
                  </div>
                );
              })()}
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
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
                  marginTop: '12px',
                }}
              />
            </div>

            {/* Shipping Address Box */}
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
                  {tOrders('shippingAddress')}
                </span>
                <button
                  onClick={() => setShowEditModal(true)}
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
                    {tCommon('add')}
                  </span>
                </button>
              </div>
              {deliveryMethod.name ? (
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
                  <div>{deliveryMethod.name}</div>
                  <div>{deliveryMethod.street}</div>
                  <div>{deliveryMethod.city}</div>
                  <div>{deliveryMethod.country}</div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '12px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                  }}
                >
                  {tOrders('noAddressProvided')}
                </div>
              )}
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
                      <Image src={selectedShippingMethod.logo} alt={selectedShippingMethod.name} fill sizes="24px" style={{ objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{selectedShippingMethod.name}</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: showShippingDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  >
                    <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                          <Image src={method.logo} alt={method.name} fill sizes="24px" style={{ objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{method.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: '24px', color: '#111827' }}>
                {tOrders('shipmentWeight')}
              </span>
              <div style={{ marginTop: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(13px, 1.1vw, 15px)', lineHeight: '20px', color: '#111827' }}>
                {totalShipmentWeight > 0 ? `${totalShipmentWeight.toFixed(2).replace('.', ',')} kg` : '0 kg'}
              </div>
              <div style={{ marginTop: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>
                {tOrders('shipmentWeightDescription')}
              </div>
            </div>

            {/* Tags Box */}
            <div
              style={{
                width: '100%',
                minWidth: 'clamp(240px, 19.9%, 270px)',
                minHeight: '150px',
                gap: '4px',
                padding: 'clamp(16px, 1.5vw, 20px) clamp(12px, 1.2vw, 16px)',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: '24px', color: '#111827' }}>{tOrders('tags')}</span>
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tag}</span>
                    <button onClick={() => handleRemoveTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3L3 9M3 3L9 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="relative mt-4" style={{ width: '100%' }}>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                  placeholder={tOrders('addTag')}
                  style={{ width: '100%', height: '42px', borderRadius: '6px', border: '1px solid #E5E7EB', padding: '10px 60px 10px 12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#111827' }}
                />
                <button
                  onClick={handleAddTag}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', height: '28px', padding: '4px 12px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#9CA3AF', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
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
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: '24px', color: '#111827' }}>{tOrders('onHold')}</span>
                <button
                  onClick={() => setOnHoldStatus(!onHoldStatus)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', padding: '2px', backgroundColor: onHoldStatus ? '#003450' : '#E5E7EB', position: 'relative', cursor: 'pointer', border: 'none', transition: 'background-color 0.2s' }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '2px', left: onHoldStatus ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)' }} />
                </button>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>{tOrders('onHoldDescription')}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6" style={{ flex: 1, maxWidth: 'min(927px, 100%)' }}>
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
              <div className="grid" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1.5fr 0.8fr', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                <span></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('productName')}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>SKU</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>GTIN</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('qty')}</span>
              </div>

              {orderProducts.map((product, index) => (
                <div key={product.id} className="grid items-center" style={{ gridTemplateColumns: '0.5fr 2fr 1fr 1.5fr 0.8fr', padding: '16px 24px', borderBottom: index < orderProducts.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                  <button onClick={() => handleRemoveProduct(product.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 10px', borderRadius: '10px', backgroundColor: '#FEE2E2', border: 'none', cursor: 'pointer', width: 'fit-content', marginRight: '10px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#DC2626' }}>{tCommon('remove')}</span>
                  </button>

                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.name}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.sku}</span>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>{product.gtin}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#9CA3AF', marginTop: '2px' }}>
                      {tProducts('available')}: {product.stock}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={product.qty}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newQty = value === '' ? 0 : parseInt(value);
                      setOrderProducts(orderProducts.map(p => (p.id === product.id ? { ...p, qty: newQty } : p)));
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (!value || value < 1) {
                        setOrderProducts(orderProducts.map(p => (p.id === product.id ? { ...p, qty: 1 } : p)));
                      }
                    }}
                    style={{ width: '60px', height: '32px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#111827', textAlign: 'center' }}
                  />
                </div>
              ))}

              {orderProducts.length === 0 && (
                <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>{tOrders('noProducts')}</div>
              )}
            </div>

            {/* Add Products Search */}
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
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#374151', marginBottom: '4px' }}>
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
                style={{ width: 'calc(100% - 24px)', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280', backgroundColor: 'transparent' }}
              />
              {productSearchQuery && (
                <button
                  onClick={handleCloseProductSearch}
                  style={{ position: 'absolute', right: '12px', bottom: '10px', background: '#e5e7eb', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '24px', height: '24px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Available Products Table */}
            {showProductList && productSearchQuery && availableProducts.length > 0 && (
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
                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr 0.5fr', padding: '12px 24px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('productName')}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>SKU</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>GTIN</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('qty')}</span>
                  <span></span>
                </div>

                {availableProducts.map((product, index) => (
                  <div key={product.id} className="grid items-center" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr 0.5fr', padding: '16px 24px', borderBottom: index < availableProducts.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.name}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.sku}</span>
                    <div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>{product.gtin}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#9CA3AF', marginTop: '2px' }}>
                        {tProducts('available')}: {product.stock}
                      </div>
                    </div>
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
                      style={{ width: '60px', height: '32px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#111827', textAlign: 'center' }}
                    />
                    <button
                      onClick={() => handleAddProduct(product)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 10px', borderRadius: '10px', backgroundColor: '#003450', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                    >
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#FFFFFF' }}>{tOrders('add')}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

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
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(16px, 1.33vw, 18px)', lineHeight: '24px', color: '#111827' }}>{tOrders('orderNotes')}</span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 'clamp(13px, 1.03vw, 14px)', lineHeight: '20px', color: '#6B7280', margin: 0 }}>{tOrders('orderNotesDescription')}</p>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder=""
                style={{ width: '100%', minHeight: 'clamp(70px, 5.9vw, 80px)', padding: 'clamp(10px, 0.88vw, 12px) clamp(12px, 1.03vw, 14px)', borderRadius: '6px', border: '1px solid #DFDFDF', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 1.03vw, 14px)', fontWeight: 400, lineHeight: '140%', letterSpacing: '0%', color: '#111827', resize: 'vertical', outline: 'none' }}
              />
            </div>

            {/* Create Order Box */}
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
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(16px, 1.3vw, 18px)', lineHeight: '24px', color: '#111827', display: 'block' }}>{tOrders('createOrder')}</span>
              <p style={{ marginTop: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>{tOrders('createOrderDescription')}</p>
              <button
                onClick={handleCreateOrder}
                disabled={isCreating || orderProducts.length === 0}
                style={{
                  marginTop: '20px',
                  width: 'clamp(170px, 15.2vw, 206px)',
                  height: 'clamp(34px, 2.8vw, 38px)',
                  padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                  borderRadius: '6px',
                  backgroundColor: isCreating || orderProducts.length === 0 ? '#E5E7EB' : '#D1FAE5',
                  border: 'none',
                  cursor: isCreating || orderProducts.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isCreating || orderProducts.length === 0 ? 0.7 : 1,
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1.03vw, 14px)', lineHeight: '20px', color: isCreating || orderProducts.length === 0 ? '#6B7280' : '#059669', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {isCreating ? 'Creating...' : tOrders('createOrder')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showEditModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              width: 'clamp(320px, 62vw, 803px)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              padding: 'clamp(16px, 1.8vw, 24px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px', color: '#111827', marginBottom: '24px' }}>{tOrders('shippingAddress')}</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('firstName')}</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>
              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('lastName')}</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('company')}</label>
                <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('streetAddress')}</label>
                <input type="text" value={formData.streetAddress} onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('addressLine2')}</label>
                <input type="text" value={formData.addressLine2} onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('city')}</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('zipPostal')}</label>
                <input type="text" value={formData.zipPostal} onChange={(e) => setFormData({ ...formData, zipPostal: e.target.value })} style={{ width: '100%', height: '38px', padding: '9px 13px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }} />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <label style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#374151' }}>{tOrders('country')}</label>
                <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} style={{ width: '100%', maxWidth: '366px', height: '38px', padding: '9px 13px', paddingRight: '32px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)', fontFamily: 'Inter, sans-serif', fontSize: '14px', appearance: 'none', cursor: 'pointer' }}>
                  <option value="unitedStates">{tCountries('unitedStates')}</option>
                  <option value="germany">{tCountries('germany')}</option>
                  <option value="austria">{tCountries('austria')}</option>
                  <option value="switzerland">{tCountries('switzerland')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6" style={{ gap: '12px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ minWidth: 'clamp(60px, 5.5vw, 75px)', height: 'clamp(34px, 2.8vw, 38px)', padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1.03vw, 14px)', lineHeight: '20px', color: '#374151' }}>{tCommon('cancel')}</span>
              </button>
              <button onClick={handleSaveAddress} style={{ minWidth: 'clamp(60px, 5.5vw, 75px)', height: 'clamp(34px, 2.8vw, 38px)', padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)', borderRadius: '6px', backgroundColor: '#003450', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 'clamp(12px, 1.03vw, 14px)', lineHeight: '20px', color: '#FFFFFF' }}>{tCommon('save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div
            style={{
              width: 'clamp(320px, 40vw, 512px)',
              maxWidth: '90vw',
              gap: '24px',
              borderRadius: '8px',
              padding: 'clamp(16px, 1.8vw, 24px)',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px', textAlign: 'center', color: '#111827' }}>{tMessages('orderCreated')}</span>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowErrorModal(false)}
        >
          <div
            style={{
              width: 'clamp(320px, 40vw, 512px)',
              maxWidth: '90vw',
              gap: '16px',
              borderRadius: '8px',
              padding: 'clamp(16px, 1.8vw, 24px)',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6L18 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px', textAlign: 'center', color: '#111827' }}>Error</span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', textAlign: 'center', color: '#6B7280', margin: 0 }}>{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#F3F4F6',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: '#374151',
              }}
            >
              {tCommon('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
