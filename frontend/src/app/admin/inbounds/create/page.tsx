'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

// Mock available products to add
const mockAvailableProducts = [
  { id: '1', name: 'Testproduct 1', sku: '#24234', gtin: '342345235324', qty: 1 },
  { id: '2', name: 'Testproduct 2', sku: '#24076', gtin: '324343243242', qty: 1 },
  { id: '3', name: 'Testproduct 3', sku: '#24235', gtin: '342345235325', qty: 1 },
  { id: '4', name: 'Testproduct 4', sku: '#24236', gtin: '342345235326', qty: 1 },
  { id: '5', name: 'Testproduct 5', sku: '#24237', gtin: '342345235327', qty: 1 },
  { id: '6', name: 'Testproduct 6', sku: '#24238', gtin: '342345235328', qty: 1 },
  { id: '7', name: 'Testproduct 7', sku: '#24239', gtin: '342345235329', qty: 1 },
];

export default function CreateInboundPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const tCommon = useTranslations('common');
  const tInbounds = useTranslations('inbounds');
  const tOrders = useTranslations('orders');
  const tMessages = useTranslations('messages');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [inboundProducts, setInboundProducts] = useState<typeof mockAvailableProducts>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [showProductList, setShowProductList] = useState(false);
  
  // Delivery form fields
  const [eta, setEta] = useState('');
  const [freightForwarder, setFreightForwarder] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [qtyBoxes, setQtyBoxes] = useState('');
  const [qtyPallets, setQtyPallets] = useState('');
  const [totalCBM, setTotalCBM] = useState('');
  const [extInorderId, setExtInorderId] = useState('');
  
  // File upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Presale toggle
  const [presaleActive, setPresaleActive] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  // Handle removing product from inbound
  const handleRemoveProduct = (productId: string) => {
    setInboundProducts(inboundProducts.filter(p => p.id !== productId));
  };

  // Handle adding product to inbound
  const handleAddProduct = (product: typeof mockAvailableProducts[0]) => {
    const qty = productQuantities[product.id] || 1;
    const existingProduct = inboundProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setInboundProducts(inboundProducts.map(p => 
        p.id === product.id ? { ...p, qty: p.qty + qty } : p
      ));
    } else {
      setInboundProducts([...inboundProducts, { ...product, qty }]);
    }
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
    !inboundProducts.find(op => op.id === p.id)
  );

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDeleteFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // Handle save inbound
  const handleSaveInbound = () => {
    console.log('Saving inbound...', {
      eta,
      freightForwarder,
      trackingNo,
      qtyBoxes,
      qtyPallets,
      totalCBM,
      extInorderId,
      uploadedFile,
      presaleActive,
      products: inboundProducts,
    });
    
    setShowSuccessModal(true);
    
    setTimeout(() => {
      setShowSuccessModal(false);
      router.push('/admin/inbounds');
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen bg-[#F9FAFB]">
        <div className="px-[3.8%] py-6">
          {/* Header with Back button */}
          <div className="flex items-center justify-between mb-6">
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
          </div>

          {/* Tab - Inbound Data */}
          <div
            className="flex items-center"
            style={{
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '24px',
            }}
          >
            <button
              style={{
                height: '38px',
                paddingLeft: '4px',
                paddingRight: '4px',
                paddingBottom: '16px',
                borderBottom: '2px solid #003450',
                marginBottom: '-1px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#003450',
                }}
              >
                Inbound Data
              </span>
            </button>
          </div>

          <div className="flex gap-6 flex-wrap lg:flex-nowrap">
            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col gap-6" style={{ maxWidth: '927px' }}>
            {/* Products Table */}
            <div
              style={{
                width: '100%',
                maxWidth: '927px',
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
                  gridTemplateColumns: '0.6fr 2fr 1fr 1.5fr 0.8fr',
                  padding: '12px 24px',
                  borderBottom: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <span></span>
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
                  {tOrders('sku')}
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
                  {tOrders('gtin')}
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
                  {tOrders('qty')}
                </span>
              </div>

              {/* Table Body */}
              {inboundProducts.length === 0 ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  }}
                >
                  {tOrders('searchProducts')}
                </div>
              ) : (
                inboundProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: '0.6fr 2fr 1fr 1.5fr 0.8fr',
                      padding: '16px 24px',
                      borderBottom: index < inboundProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
                    }}
                  >
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
                        {tOrders('remove')}
                      </span>
                    </button>
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
                      value={product.qty}
                      onChange={(e) => {
                        const value = e.target.value;
                        const newQty = value === '' ? 0 : parseInt(value);
                        setInboundProducts(inboundProducts.map(p =>
                          p.id === product.id ? { ...p, qty: newQty } : p
                        ));
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (!value || value < 1) {
                          setInboundProducts(inboundProducts.map(p =>
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
                  </div>
                ))
              )}
            </div>

            {/* Add Products Search Box */}
            <div
              style={{
                width: '100%',
                maxWidth: '927px',
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '271px',
                  minHeight: '54px',
                  padding: '10px 12px',
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
            </div>

            {/* Available Products Table */}
            {showProductList && productSearchQuery && filteredAvailableProducts.length > 0 && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '927px',
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
                    gridTemplateColumns: '0.6fr 2fr 1fr 1.5fr 0.8fr',
                    padding: '12px 24px',
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <span></span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('productName')}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('sku')}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('gtin')}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#6B7280' }}>{tOrders('qty')}</span>
                </div>

                {/* Table Body */}
                {filteredAvailableProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: '0.6fr 2fr 1fr 1.5fr 0.8fr',
                      padding: '16px 24px',
                      borderBottom: index < filteredAvailableProducts.length - 1 ? '1px solid #E5E7EB' : 'none',
                    }}
                  >
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
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#FFFFFF' }}>{tMessages('add')}</span>
                    </button>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.name}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#111827' }}>{product.sku}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#6B7280' }}>{product.gtin}</span>
                    <input
                      type="number"
                      min="1"
                      value={productQuantities[product.id] ?? 1}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value === '' ? 0 : parseInt(e.target.value))}
                      onBlur={(e) => { if (!parseInt(e.target.value) || parseInt(e.target.value) < 1) handleQuantityChange(product.id, 1); }}
                      style={{ width: '60px', height: '32px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#111827', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Delivery Section */}
            <div
              style={{
                width: '100%',
                maxWidth: '927px',
                borderRadius: '8px',
                gap: '20px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tMessages('delivery')}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                  marginBottom: '20px',
                }}
              >
                {tMessages('deliveryDescription')}
              </p>

              {/* Row 1: ETA, Freight forwarder, Tracking no */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('eta')}
                  </label>
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('freightForwarder')}
                  </label>
                  <input
                    type="text"
                    value={freightForwarder}
                    onChange={(e) => setFreightForwarder(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('trackingNo')}
                  </label>
                  <input
                    type="text"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Qty boxes, Qty pallets, Total CBM */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('qtyBoxes')}
                  </label>
                  <input
                    type="text"
                    value={qtyBoxes}
                    onChange={(e) => setQtyBoxes(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('qtyPallets')}
                  </label>
                  <input
                    type="text"
                    value={qtyPallets}
                    onChange={(e) => setQtyPallets(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('totalCBM')}
                  </label>
                  <input
                    type="text"
                    value={totalCBM}
                    onChange={(e) => setTotalCBM(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Ext. Inorder ID */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#374151',
                      marginBottom: '6px',
                    }}
                  >
                    {tMessages('extInboundId')}
                  </label>
                  <input
                    type="text"
                    value={extInorderId}
                    onChange={(e) => setExtInorderId(e.target.value)}
                    placeholder=""
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: '9px 13px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#111827',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Import Inbound File Section */}
            <div
              style={{
                width: '100%',
                maxWidth: '927px',
                borderRadius: '8px',
                gap: '20px',
                padding: '24px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tMessages('importInboundFile')}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                  marginBottom: '20px',
                }}
              >
                {tMessages('uploadCsvDescription')}{' '}
                <a
                  href="#"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#6B7280',
                    textDecoration: 'underline',
                  }}
                >
                  {tMessages('here')}
                </a>
              </p>

              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  minHeight: '131px',
                  borderRadius: '8px',
                  border: '2px dashed #D1D5DB',
                  padding: '50px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.3333 5H10C8.16667 5 6.68333 6.5 6.68333 8.33333L6.66667 31.6667C6.66667 33.5 8.15 35 9.98333 35H30C31.8333 35 33.3333 33.5 33.3333 31.6667V15L23.3333 5Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23.3333 5V15H33.3333" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#111827',
                    textAlign: 'center',
                  }}
                >
                  {tMessages('importInboundFile')}
                </span>
              </div>

              {/* Uploaded File */}
              {uploadedFile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '16px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.3333 8.58333V10C18.3333 13.6819 18.3333 15.5228 17.178 16.678C16.0228 17.8333 14.1819 17.8333 10.5 17.8333H9.5C5.8181 17.8333 3.97715 17.8333 2.82191 16.678C1.66667 15.5228 1.66667 13.6819 1.66667 10V9.16667C1.66667 5.48477 1.66667 3.64382 2.82191 2.48858C3.97715 1.33333 5.8181 1.33333 9.5 1.33333H10.9167" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M1.66667 10.8333L3.72678 9.01229C4.58993 8.24847 5.89358 8.29571 6.69887 9.11955L10.4138 12.9249C11.0813 13.6072 12.1395 13.7196 12.9377 13.1896L13.2206 13.001C14.2981 12.2832 15.7039 12.3469 16.7103 13.157L18.3333 14.4643" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M15 1.66667V6.66667M15 6.66667L17.5 4.16667M15 6.66667L12.5 4.16667" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '20px',
                      color: '#6B7280',
                    }}
                  >
                    {uploadedFile.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 10px',
                      borderRadius: '10px',
                      backgroundColor: '#FEE2E2',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '12px',
                        lineHeight: '16px',
                        color: '#991B1B',
                        textAlign: 'center',
                      }}
                    >
                      {tCommon('delete')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Activate Presale Section */}
            <div
              style={{
                width: '100%',
                maxWidth: '927px',
                borderRadius: '8px',
                padding: '20px 16px',
                gap: '4px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '18px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tMessages('activatePresale')}
              </h2>
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
                {tMessages('presaleDescription')}
              </p>

              {/* Toggle Switch */}
              <button
                onClick={() => setPresaleActive(!presaleActive)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: presaleActive ? '#003450' : '#E5E7EB',
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
                    position: 'absolute',
                    top: '2px',
                    left: presaleActive ? '22px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </button>
            </div>

            {/* Save Button at Bottom */}
            <div style={{ width: '100%', maxWidth: '927px', display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={handleSaveInbound}
                style={{
                  height: '38px',
                  padding: '9px 17px',
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
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tCommon('save')}
                </span>
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: '512px', maxWidth: '90vw', gap: '24px', borderRadius: '8px', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', lineHeight: '24px', textAlign: 'center', color: '#111827' }}>{tMessages('inboundSavedSuccessfully')}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
