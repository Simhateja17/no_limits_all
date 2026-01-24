'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { dataApi, CreateReturnInput } from '@/lib/data-api';

interface CreateReturnProps {
  backUrl: string;
}

// Reusable field component for editable inputs
interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

function Field({ label, value, onChange, required, placeholder }: FieldProps) {
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
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

// Select field component
interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}

function SelectField({ label, value, onChange, options, required }: SelectFieldProps) {
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
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingRight: '32px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#374151',
            outline: 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div
          style={{
            position: 'absolute',
            right: '12px',
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
  );
}

// Textarea field component
interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: TextareaFieldProps) {
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
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
          resize: 'vertical',
        }}
      />
    </div>
  );
}

// Return item row component
interface ReturnItemRowProps {
  item: {
    sku: string;
    productName: string;
    quantity: number;
    condition: string;
  };
  index: number;
  onUpdate: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}

function ReturnItemRow({ item, index, onUpdate, onRemove, t }: ReturnItemRowProps) {
  return (
    <div
      className="grid gap-4 items-end"
      style={{
        gridTemplateColumns: '1fr 2fr 80px 1fr 40px',
        padding: '12px 0',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <input
        type="text"
        value={item.sku}
        onChange={(e) => onUpdate(index, 'sku', e.target.value)}
        placeholder="SKU"
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
      <input
        type="text"
        value={item.productName}
        onChange={(e) => onUpdate(index, 'productName', e.target.value)}
        placeholder={t('productName')}
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
      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
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
          textAlign: 'center',
        }}
      />
      <select
        value={item.condition}
        onChange={(e) => onUpdate(index, 'condition', e.target.value)}
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
          cursor: 'pointer',
        }}
      >
        <option value="GOOD">{t('wellCondition')}</option>
        <option value="ACCEPTABLE">{t('acceptable')}</option>
        <option value="DAMAGED">{t('damaged')}</option>
        <option value="DEFECTIVE">{t('defective')}</option>
      </select>
      <button
        onClick={() => onRemove(index)}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4L12 12M4 12L12 4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export function CreateReturn({ backUrl }: CreateReturnProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tReturns = useTranslations('returns');
  const tOrders = useTranslations('orders');

  // Form state for new return
  const [formData, setFormData] = useState({
    orderId: '',
    reason: '',
    reasonCategory: 'DAMAGED',
    customerName: '',
    customerEmail: '',
    notes: '',
    warehouseNotes: '',
  });

  // Return items state
  const [items, setItems] = useState<{
    sku: string;
    productName: string;
    quantity: number;
    condition: string;
  }[]>([{ sku: '', productName: '', quantity: 1, condition: 'GOOD' }]);

  // Loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonCategoryOptions = [
    { value: 'DAMAGED', label: tReturns('damaged') },
    { value: 'WRONG_ITEM', label: tReturns('wrongItem') },
    { value: 'DEFECTIVE', label: tReturns('defective') },
    { value: 'NOT_AS_DESCRIBED', label: tReturns('notAsDescribed') },
    { value: 'CHANGED_MIND', label: tCommon('changedMind') || 'Changed Mind' },
    { value: 'OTHER', label: tCommon('other') || 'Other' },
  ];

  const handleBack = () => {
    router.push(backUrl);
  };

  const updateField = (field: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { sku: '', productName: '', quantity: 1, condition: 'GOOD' }]);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!items.some(item => item.sku || item.productName)) {
      setError(tReturns('atLeastOneItemRequired') || 'At least one item with SKU or product name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const returnInput: CreateReturnInput = {
        orderId: formData.orderId || undefined,
        reason: formData.reason || undefined,
        reasonCategory: formData.reasonCategory,
        customerName: formData.customerName || undefined,
        customerEmail: formData.customerEmail || undefined,
        notes: formData.notes || undefined,
        warehouseNotes: formData.warehouseNotes || undefined,
        items: items.filter(item => item.sku || item.productName).map(item => ({
          sku: item.sku || undefined,
          productName: item.productName || undefined,
          quantity: item.quantity,
          condition: item.condition as 'GOOD' | 'ACCEPTABLE' | 'DAMAGED' | 'DEFECTIVE',
        })),
      };

      const result = await dataApi.createReturn(returnInput);

      // Navigate to the new return detail page
      router.push(`${backUrl}/${result.returnId}`);
    } catch (err: any) {
      console.error('Error creating return:', err);
      setError(err.response?.data?.error || 'Failed to create return');
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

      {/* Tab - Only Return Data */}
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
            {tReturns('returnDetails')}
          </span>
        </button>
      </div>

      {/* Return Data Content */}
      <div className="flex flex-col gap-6" style={{ maxWidth: '927px' }}>
        {/* Return Details Box */}
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
            {tReturns('returnDetails')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label={tReturns('orderId')}
              value={formData.orderId}
              onChange={updateField('orderId')}
              placeholder={tReturns('enterOrderId') || 'Enter order ID (optional)'}
            />
            <SelectField
              label={tReturns('returnReason')}
              value={formData.reasonCategory}
              onChange={updateField('reasonCategory')}
              options={reasonCategoryOptions}
            />
            <Field
              label={tReturns('customerNotes') || 'Customer Name'}
              value={formData.customerName}
              onChange={updateField('customerName')}
              placeholder={tReturns('enterCustomerName') || 'Enter customer name'}
            />
            <Field
              label={tCommon('email') || 'Email'}
              value={formData.customerEmail}
              onChange={updateField('customerEmail')}
              placeholder={tReturns('enterCustomerEmail') || 'Enter customer email'}
            />
          </div>
          <div className="mt-4">
            <TextareaField
              label={tReturns('reason')}
              value={formData.reason}
              onChange={updateField('reason')}
              placeholder={tReturns('enterReturnReason') || 'Enter return reason details'}
            />
          </div>
        </div>

        {/* Return Items Box */}
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
            {tReturns('returnedItems')}
          </h2>

          {/* Header */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: '1fr 2fr 80px 1fr 40px',
              padding: '8px 0',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
              {tOrders('sku')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
              {tOrders('productName')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
              {tReturns('quantity')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>
              {tReturns('condition')}
            </span>
            <span></span>
          </div>

          {/* Items */}
          {items.map((item, index) => (
            <ReturnItemRow
              key={index}
              item={item}
              index={index}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
              t={tReturns}
            />
          ))}

          {/* Add Item Button */}
          <button
            onClick={handleAddItem}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px dashed #D1D5DB',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', color: '#6B7280' }}>
              {tCommon('addItem') || 'Add Item'}
            </span>
          </button>
        </div>

        {/* Notes Box */}
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
            {tReturns('internalNotes')}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <TextareaField
              label={tReturns('customerNotes')}
              value={formData.notes}
              onChange={updateField('notes')}
              placeholder={tReturns('enterNotes') || 'Enter notes'}
            />
            <TextareaField
              label={tCommon('warehouseNotes') || 'Warehouse Notes'}
              value={formData.warehouseNotes}
              onChange={updateField('warehouseNotes')}
              placeholder={tReturns('enterWarehouseNotes') || 'Enter warehouse notes'}
            />
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

        {/* Save Return Box */}
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
            {tReturns('createReturn') || 'Create Return'}
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
              {isLoading ? (tCommon('saving') || 'Saving...') : tCommon('save')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
