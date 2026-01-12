'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { dataApi, CreateProductInput } from '@/lib/data-api';

interface CreateProductProps {
  backUrl: string;
}

// Reusable field component for editable inputs
interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ label, value, onChange }: FieldProps) {
  return (
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
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#374151',
          outline: 'none',
        }}
      />
    </div>
  );
}

export function CreateProduct({ backUrl }: CreateProductProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tProducts = useTranslations('products');

  // Form state for new product
  const [formData, setFormData] = useState({
    productName: '',
    manufacturer: '',
    // Geodaten
    heightInCm: '',
    lengthInCm: '',
    widthInCm: '',
    weightInKg: '',
    // Identifizierung
    sku: '',
    gtin: '',
    amazonAsin: '',
    amazonSku: '',
    isbn: '',
    han: '',
    // Eigenschaften
    mhd: '',
    charge: '',
    zolltarifnummer: '',
    ursprung: '',
    nettoVerkaufspreis: '',
    manufacture: '',
  });

  // Product image state
  const [productImage, setProductImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleBack = () => {
    router.push(backUrl);
  };

  const updateField = (field: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      setError('SKU is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const productInput: CreateProductInput = {
        name: formData.productName,
        manufacturer: formData.manufacturer || undefined,
        sku: formData.sku,
        gtin: formData.gtin || undefined,
        han: formData.han || undefined,
        heightInCm: formData.heightInCm || undefined,
        lengthInCm: formData.lengthInCm || undefined,
        widthInCm: formData.widthInCm || undefined,
        weightInKg: formData.weightInKg || undefined,
        amazonAsin: formData.amazonAsin || undefined,
        amazonSku: formData.amazonSku || undefined,
        isbn: formData.isbn || undefined,
        zolltarifnummer: formData.zolltarifnummer || undefined,
        ursprung: formData.ursprung || undefined,
        nettoVerkaufspreis: formData.nettoVerkaufspreis || undefined,
        imageUrl: productImage || undefined,
      };

      await dataApi.createProduct(productInput);

      // Navigate back to products list after successful save
      router.push(backUrl);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Back Button */}
      <div>
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

      {/* Tab - Only Product Data */}
      <div
        className="flex items-center"
        style={{
          borderBottom: '1px solid #E5E7EB',
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
            {tProducts('productData')}
          </span>
        </button>
      </div>

      {/* Product Data Content */}
      <div className="flex gap-6 flex-wrap lg:flex-nowrap">
          {/* Product Image Upload */}
          <div
            onClick={handleImageClick}
            style={{
              width: '192px',
              minWidth: '192px',
              height: '192px',
              borderRadius: '8px',
              border: productImage ? 'none' : '2px dashed #D1D5DB',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {productImage ? (
              <>
                <img
                  src={productImage}
                  alt="Product"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {/* Hover overlay for re-upload */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  className="hover:!opacity-100"
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17,8 12,3 7,8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>{tCommon('change')}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/>
                  <path d="M12 8V16M8 12H16" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: '#003450',
                    textAlign: 'center',
                  }}
                >
                    <span style={{ textDecoration: 'underline' }}>{tProducts('upload')}</span> {tCommon('or')} {tCommon('dragAndDrop')}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    color: '#9CA3AF',
                  }}
                  >
                    {tProducts('uploadFileDescription')}
                  </span>
              </>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-6" style={{ maxWidth: '927px' }}>
          {/* Product Details Box */}
          <div
            className="w-full"
            style={{
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '24px',
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              {tProducts('productDetails')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label={tProducts('productName')}
                value={formData.productName}
                onChange={updateField('productName')}
              />
              <Field
                label={tProducts('manufacturer')}
                value={formData.manufacturer}
                onChange={updateField('manufacturer')}
              />
            </div>
          </div>

        {/* Information Box - Geodata, Identifier, Attributes */}
        <div
          style={{
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Geodata Column */}
            <div className="flex flex-col gap-4">
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tProducts('geodata')}
              </h3>
              <Field label={tProducts('heightInCm')} value={formData.heightInCm} onChange={updateField('heightInCm')} />
              <Field label={tProducts('lengthInCm')} value={formData.lengthInCm} onChange={updateField('lengthInCm')} />
              <Field label={tProducts('widthInCm')} value={formData.widthInCm} onChange={updateField('widthInCm')} />
              <Field label={tProducts('weightInKg')} value={formData.weightInKg} onChange={updateField('weightInKg')} />
            </div>

            {/* Identifier Column */}
            <div className="flex flex-col gap-4">
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tProducts('identification')}
              </h3>
              <Field label={tProducts('sku')} value={formData.sku} onChange={updateField('sku')} />
              <Field label={tProducts('gtin')} value={formData.gtin} onChange={updateField('gtin')} />
              <Field label={tProducts('amazonAsin')} value={formData.amazonAsin} onChange={updateField('amazonAsin')} />
              <Field label={tProducts('amazonSku')} value={formData.amazonSku} onChange={updateField('amazonSku')} />
              <Field label={tProducts('isbn')} value={formData.isbn} onChange={updateField('isbn')} />
              <Field label={tProducts('han')} value={formData.han} onChange={updateField('han')} />
            </div>

            {/* Attributes Column */}
            <div className="flex flex-col gap-4">
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {tProducts('properties')}
              </h3>
              <Field label={tProducts('mhd')} value={formData.mhd} onChange={updateField('mhd')} />
              <Field label={tProducts('charge')} value={formData.charge} onChange={updateField('charge')} />
              <Field label={tProducts('zolltarifnummer')} value={formData.zolltarifnummer} onChange={updateField('zolltarifnummer')} />
              <Field label={tProducts('ursprung')} value={formData.ursprung} onChange={updateField('ursprung')} />
              <Field label={tProducts('nettoVerkaufspreis')} value={formData.nettoVerkaufspreis} onChange={updateField('nettoVerkaufspreis')} />
              <Field label={tProducts('manufacturer')} value={formData.manufacture} onChange={updateField('manufacture')} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#DC2626',
              }}
            >
              {error}
            </span>
          </div>
        )}

        {/* Save Product Box */}
        <div
          style={{
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#111827',
            }}
          >
            {tProducts('createProduct')}
          </span>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              minWidth: '102px',
              height: '38px',
              borderRadius: '6px',
              padding: '9px 17px',
              backgroundColor: isLoading ? '#9CA3AF' : '#003450',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
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
              }}
            >
              {isLoading ? 'Saving...' : tCommon('save')}
            </span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
