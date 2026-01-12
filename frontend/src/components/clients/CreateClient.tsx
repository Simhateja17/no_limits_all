'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CreateClientProps {
  backUrl: string;
}

interface PricingTemplate {
  id: string;
  name: string;
}

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      style={{
        backgroundColor: checked ? '#1F2937' : '#E5E7EB',
      }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        style={{
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

// Section Header Component (Left side of each section)
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-shrink-0" style={{ width: 'min(28.6%, 389px)', minWidth: '200px' }}>
      <h2
        className="mb-1"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(16px, 1.32vw, 18px)',
          lineHeight: '24px',
          color: '#111827',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#6B7280',
        }}
      >
        {description}
      </p>
    </div>
  );
}

// Form Field with Toggle Component
function FieldWithToggle({
  label,
  value,
  onChange,
  enabled,
  onToggle,
  showToggle = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  showToggle?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <label
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#374151',
          minWidth: '140px',
        }}
      >
        {label}
      </label>
      <div className="flex items-center gap-4 flex-1 justify-end">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 'min(100%, 280px)',
            height: '38px',
            padding: '9px 13px',
            backgroundColor: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #D1D5DB',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(12px, 1.03vw, 14px)',
            lineHeight: '20px',
            color: '#374151',
            outline: 'none',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          }}
        />
        {showToggle && onToggle && (
          <ToggleSwitch checked={enabled || false} onChange={onToggle} />
        )}
      </div>
    </div>
  );
}

// Basic Field Row (for Client Information section)
function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-b-0">
      <label
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#374151',
          minWidth: '180px',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: 'min(100%, 360px)',
          height: '38px',
          padding: '9px 13px',
          backgroundColor: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#374151',
          outline: 'none',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        }}
      />
    </div>
  );
}

// Pricing Template Dropdown Component
function PricingTemplateDropdown({
  templates,
  selectedTemplate,
  onSelect,
  onDelete,
}: {
  templates: PricingTemplate[];
  selectedTemplate: PricingTemplate | null;
  onSelect: (template: PricingTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} style={{ width: 'min(100%, 320px)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
        style={{
          padding: '12px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            color: '#374151',
            marginBottom: '2px',
          }}
        >
          Pricing template
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#6B7280',
          }}
        >
          {selectedTemplate?.name || 'Select a template'}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
        >
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onSelect(template);
                setIsOpen(false);
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#374151',
                }}
              >
                {template.name}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template.id);
                  }}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#6B7280',
                  }}
                >
                  delete
                </button>
                {selectedTemplate?.id === template.id && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateClient({ backUrl }: CreateClientProps) {
  const router = useRouter();

  // Form state - Client Information
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');

  // Pricing template
  const [useQuotationPricing, setUseQuotationPricing] = useState(false);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([
    { id: '1', name: 'Pricing XY' },
    { id: '2', name: 'Pricing XY' },
    { id: '3', name: 'Pricing XY' },
    { id: '4', name: 'Pricing 2026' },
    { id: '5', name: 'Pricing XY' },
    { id: '6', name: 'Pricing XY' },
    { id: '7', name: 'Pricing XY' },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<PricingTemplate | null>(pricingTemplates[3]);

  // Outbound Pricing
  const [outboundFirstPick, setOutboundFirstPick] = useState('');
  const [outboundFirstPickEnabled, setOutboundFirstPickEnabled] = useState(true);
  const [outboundSecondPick, setOutboundSecondPick] = useState('');
  const [outboundSecondPickEnabled, setOutboundSecondPickEnabled] = useState(true);
  const [outboundSecondPick2, setOutboundSecondPick2] = useState('');
  const [outboundSecondPick2Enabled, setOutboundSecondPick2Enabled] = useState(true);

  // Inbound Pricing
  const [inboundBasePrice, setInboundBasePrice] = useState('');
  const [inboundBasePriceEnabled, setInboundBasePriceEnabled] = useState(true);
  const [firstProduct, setFirstProduct] = useState('');
  const [firstProductEnabled, setFirstProductEnabled] = useState(true);
  const [secondProduct, setSecondProduct] = useState('');
  const [secondProductEnabled, setSecondProductEnabled] = useState(true);
  const [pallet, setPallet] = useState('');
  const [palletEnabled, setPalletEnabled] = useState(true);
  const [box, setBox] = useState('');
  const [boxEnabled, setBoxEnabled] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');
  const [hourlyRateEnabled, setHourlyRateEnabled] = useState(true);
  const [inboundBasePrice2, setInboundBasePrice2] = useState('');

  // Save quotation pricing
  const [saveQuotationPricing, setSaveQuotationPricing] = useState(false);
  const [quotationName, setQuotationName] = useState('Pricing 2026');

  // Send quotation
  const [sendAgreementPricing, setSendAgreementPricing] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteTemplate = (id: string) => {
    setPricingTemplates(templates => templates.filter(t => t.id !== id));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!companyName.trim() || !email.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      const clientData = {
        name: companyName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        password: 'temp123456', // Temporary password
        isActive: true,
        pricing: {
          templateId: selectedTemplate?.id,
          useQuotationPricing,
          outbound: {
            firstPick: { value: outboundFirstPick, enabled: outboundFirstPickEnabled },
            secondPick: { value: outboundSecondPick, enabled: outboundSecondPickEnabled },
            secondPick2: { value: outboundSecondPick2, enabled: outboundSecondPick2Enabled },
          },
          inbound: {
            basePrice: { value: inboundBasePrice, enabled: inboundBasePriceEnabled },
            firstProduct: { value: firstProduct, enabled: firstProductEnabled },
            secondProduct: { value: secondProduct, enabled: secondProductEnabled },
            pallet: { value: pallet, enabled: palletEnabled },
            box: { value: box, enabled: boxEnabled },
            hourlyRate: { value: hourlyRate, enabled: hourlyRateEnabled },
            basePrice2: inboundBasePrice2,
          },
          saveAsTemplate: saveQuotationPricing,
          templateName: quotationName,
          sendAgreement: sendAgreementPricing,
        },
      };

      const response = await api.post('/clients', clientData);

      if (response.data.success) {
        router.push(backUrl);
      } else {
        setError(response.data.error || 'Failed to create client');
      }
    } catch (err: any) {
      console.error('Error creating client:', err);
      setError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full min-h-screen"
      style={{
        backgroundColor: '#F9FAFB',
        padding: 'clamp(16px, 2.5vw, 32px)',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => router.push(backUrl)}
        className="mb-8 flex items-center justify-center"
        style={{
          padding: '8px 16px',
          backgroundColor: '#FFFFFF',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        Back
      </button>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Client Information Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Client Information"
          description="Type in your Clients Company name for quotation"
        />
        <div
          className="flex-1 rounded-lg"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
            paddingTop: 'clamp(24px, 2.87vw, 39px)',
          }}
        >
          <FieldRow
            label="Company or clients name"
            value={companyName}
            onChange={setCompanyName}
          />
          <FieldRow
            label="Email address"
            value={email}
            onChange={setEmail}
            type="email"
          />
        </div>
      </div>

      {/* Use Quotation Pricing Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Use quotation pricing"
          description="You can save your quotation as a template for future quotations."
        />
        <div
          className="flex-1 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          <PricingTemplateDropdown
            templates={pricingTemplates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
            onDelete={handleDeleteTemplate}
          />
          <ToggleSwitch checked={useQuotationPricing} onChange={setUseQuotationPricing} />
        </div>
      </div>

      {/* Outbound Pricing Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Outbound Pricing"
          description="Type in all pricing details for the client. Prices based on monthly rate."
        />
        <div
          className="flex-1 rounded-lg"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          <FieldWithToggle
            label="First pick"
            value={outboundFirstPick}
            onChange={setOutboundFirstPick}
            enabled={outboundFirstPickEnabled}
            onToggle={setOutboundFirstPickEnabled}
          />
          <FieldWithToggle
            label="Second pick"
            value={outboundSecondPick}
            onChange={setOutboundSecondPick}
            enabled={outboundSecondPickEnabled}
            onToggle={setOutboundSecondPickEnabled}
          />
          <FieldWithToggle
            label="Second pick"
            value={outboundSecondPick2}
            onChange={setOutboundSecondPick2}
            enabled={outboundSecondPick2Enabled}
            onToggle={setOutboundSecondPick2Enabled}
          />
        </div>
      </div>

      {/* Inbound Pricing Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Inbound Pricing"
          description="Type in all pricing details for the client. Prices based on monthly rate."
        />
        <div
          className="flex-1 rounded-lg"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          <FieldWithToggle
            label="Inbound base price"
            value={inboundBasePrice}
            onChange={setInboundBasePrice}
            enabled={inboundBasePriceEnabled}
            onToggle={setInboundBasePriceEnabled}
          />
          <FieldWithToggle
            label="First product"
            value={firstProduct}
            onChange={setFirstProduct}
            enabled={firstProductEnabled}
            onToggle={setFirstProductEnabled}
          />
          <FieldWithToggle
            label="Second product"
            value={secondProduct}
            onChange={setSecondProduct}
            enabled={secondProductEnabled}
            onToggle={setSecondProductEnabled}
          />
          <FieldWithToggle
            label="Pallet"
            value={pallet}
            onChange={setPallet}
            enabled={palletEnabled}
            onToggle={setPalletEnabled}
          />
          <FieldWithToggle
            label="Box"
            value={box}
            onChange={setBox}
            enabled={boxEnabled}
            onToggle={setBoxEnabled}
          />
          <FieldWithToggle
            label="Houly rate"
            value={hourlyRate}
            onChange={setHourlyRate}
            enabled={hourlyRateEnabled}
            onToggle={setHourlyRateEnabled}
          />
          <FieldWithToggle
            label="Inbound base price"
            value={inboundBasePrice2}
            onChange={setInboundBasePrice2}
            showToggle={false}
          />
        </div>
      </div>

      {/* Save Quotation Pricing Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Save quotation pricing"
          description="You can save your quotation as a template for future quotations."
        />
        <div
          className="flex-1 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          <div
            style={{
              width: 'min(100%, 320px)',
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '16px',
                color: '#6B7280',
                marginBottom: '2px',
              }}
            >
              Name
            </div>
            <input
              type="text"
              value={quotationName}
              onChange={(e) => setQuotationName(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
              }}
            />
          </div>
          <ToggleSwitch checked={saveQuotationPricing} onChange={setSaveQuotationPricing} />
        </div>
      </div>

      {/* Send Quotation Section */}
      <div className="mb-12 flex flex-col lg:flex-row gap-6 lg:gap-12">
        <SectionHeader
          title="Send quotation"
          description="You can send the quotation by Mail"
        />
        <div
          className="flex-1 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            padding: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(14px, 1.18vw, 16px)',
              lineHeight: '24px',
              color: '#111827',
            }}
          >
            Send agreement and pricing
          </span>
          <ToggleSwitch checked={sendAgreementPricing} onChange={setSendAgreementPricing} />
        </div>
      </div>

      {/* Create Client Button */}
      <div className="flex justify-end mt-12 mb-8">
        <button
          onClick={handleSave}
          disabled={loading || !companyName.trim() || !email.trim()}
          style={{
            width: 'min(100%, 320px)',
            height: '44px',
            padding: '10px 24px',
            borderRadius: '6px',
            backgroundColor: (!loading && companyName.trim() && email.trim()) ? '#4F46E5' : '#9CA3AF',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#FFFFFF',
            cursor: (!loading && companyName.trim() && email.trim()) ? 'pointer' : 'not-allowed',
            border: 'none',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          }}
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </div>
    </div>
  );
}
