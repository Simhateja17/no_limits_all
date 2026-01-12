'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { channelsApi, ShippingMethod } from '@/lib/channels-api';
import { shippingMethodsApi, ShippingMethod as FFNShippingMethod } from '@/lib/shipping-methods-api';

interface ChannelShippingSetupProps {
  channelId: string;
  channelType: string;
  baseUrl: string;
}

// Download Icon Component
function DownloadIcon() {
  return (
    <svg
      width="clamp(15px, 1.47vw, 20px)"
      height="clamp(15px, 1.47vw, 20px)"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33334 13.3333V14.1667C3.33334 14.8297 3.59673 15.4656 4.06558 15.9344C4.53442 16.4033 5.17029 16.6667 5.83334 16.6667H14.1667C14.8297 16.6667 15.4656 16.4033 15.9344 15.9344C16.4033 15.4656 16.6667 14.8297 16.6667 14.1667V13.3333M5.83334 8.33333L10 12.5M10 12.5L14.1667 8.33333M10 12.5V3.33333"
        stroke="#003450"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Checkmark Icon for success modal
function CheckmarkIcon() {
  return (
    <svg
      width="clamp(32px, 3.14vw, 48px)"
      height="clamp(32px, 3.14vw, 48px)"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="#D1FAE5" />
      <path
        d="M16 24L21 29L32 18"
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Success Modal Component
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
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
          width: 'clamp(280px, 27.47vw, 373px)',
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(8px, 0.78vw, 12px)',
          padding: 'clamp(32px, 3.14vw, 48px) clamp(24px, 2.36vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 1.57vw, 24px)',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CheckmarkIcon />
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(14px, 1.33vw, 18px)',
            lineHeight: 'clamp(18px, 1.77vw, 24px)',
            color: '#111827',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Channel succesfully added
        </p>
      </div>
    </div>
  );
}

export function ChannelShippingSetup({ channelId, channelType, baseUrl }: ChannelShippingSetupProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tChannels = useTranslations('channels');
  const tShipping = useTranslations('channels.shipping');

  // Default shipping method state
  const [ffnShippingMethods, setFFNShippingMethods] = useState<FFNShippingMethod[]>([]);
  const [selectedDefaultMethod, setSelectedDefaultMethod] = useState<string>('');
  const [defaultDropdownOpen, setDefaultDropdownOpen] = useState(false);
  
  // Advanced mapping state (optional)
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<{ [key: string]: string }>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [warehouseMethods, setWarehouseMethods] = useState<ShippingMethod[]>([]);
  const [channelMethods, setChannelMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Suppress unused variable warning
  void baseUrl;

  // Fetch FFN shipping methods and current default on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!channelId || channelId === 'new') return;

      try {
        setIsLoading(true);
        
        // Fetch FFN shipping methods (for default selection)
        const ffnResponse = await shippingMethodsApi.getAll(true);
        if (ffnResponse.success && ffnResponse.data) {
          setFFNShippingMethods(ffnResponse.data);
        }
        
        // Fetch current channel default
        const defaultResponse = await shippingMethodsApi.getChannelDefault(channelId);
        if (defaultResponse.success && defaultResponse.data?.defaultShippingMethodId) {
          setSelectedDefaultMethod(defaultResponse.data.defaultShippingMethodId);
        }
        
        // Fetch channel shipping methods for advanced mapping
        const response = await channelsApi.getShippingMethods(channelId);
        if (response.success) {
          setWarehouseMethods(response.warehouseMethods);
          setChannelMethods(response.channelMethods);
        }
      } catch (err) {
        console.error('Error fetching shipping methods:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [channelId]);

  const handleBack = () => {
    router.back();
  };

  const handleFinish = async () => {
    if (channelId && channelId !== 'new') {
      try {
        setIsSaving(true);
        setSaveError(null);

        // Save default shipping method for the channel
        if (selectedDefaultMethod) {
          const defaultResult = await shippingMethodsApi.setChannelDefault(channelId, selectedDefaultMethod);
          if (!defaultResult.success) {
            setSaveError(defaultResult.error || 'Failed to save default shipping method');
            return;
          }
        }

        // If advanced mapping is enabled and has mappings, save them
        if (showAdvancedMapping && Object.keys(selectedMethods).length > 0) {
          const mappings: Record<string, string> = {};
          for (const [warehouseMethodId, channelMethodName] of Object.entries(selectedMethods)) {
            if (channelMethodName) {
              mappings[warehouseMethodId] = channelMethodName;
            }
          }

          if (Object.keys(mappings).length > 0) {
            const result = await channelsApi.saveShippingMappings(channelId, mappings);
            if (!result.success) {
              setSaveError(result.error || 'Failed to save shipping mappings');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error saving shipping settings:', err);
        setSaveError(err instanceof Error ? err.message : 'An error occurred');
        return;
      } finally {
        setIsSaving(false);
      }
    }

    setShowSuccessModal(true);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push('/client/channels');
  };

  const handleReloadMethods = async () => {
    if (!channelId || channelId === 'new') return;

    try {
      setIsLoading(true);
      const response = await channelsApi.getShippingMethods(channelId);
      if (response.success) {
        setWarehouseMethods(response.warehouseMethods);
        setChannelMethods(response.channelMethods);
      }
    } catch (err) {
      console.error('Error reloading methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (warehouseId: string, methodName: string) => {
    setSelectedMethods((prev) => ({
      ...prev,
      [warehouseId]: methodName,
    }));
    setOpenDropdown(null);
  };

  // Get channel-specific label
  const getChannelLabel = () => {
    switch (channelType) {
      case 'Shopify':
        return 'Shopify';
      case 'Amazon':
        return 'Amazon';
      default:
        return 'Woocommerce';
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#F9FAFB',
        padding: 'clamp(24px, 2.36vw, 32px) clamp(39px, 3.83vw, 52px)',
        paddingBottom: 'clamp(200px, 19.63vw, 300px)',
      }}
    >
      {/* Back Button - No arrow */}
      <button
        onClick={handleBack}
        style={{
          height: 'clamp(29px, 2.80vw, 38px)',
          borderRadius: '6px',
          border: '1px solid #D1D5DB',
          padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 'clamp(30px, 2.94vw, 40px)',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(11px, 1.03vw, 14px)',
            lineHeight: '1',
            color: '#374151',
          }}
        >
          {tCommon('back')}
        </span>
      </button>

      {/* Sales-Channels Title */}
      <h1
        style={{
          width: '100%',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(14px, 1.33vw, 18px)',
          lineHeight: 'clamp(18px, 1.77vw, 24px)',
          color: '#111827',
          margin: '0 0 clamp(15px, 1.47vw, 20px) 0',
        }}
      >
        {tChannels('title')}
      </h1>

      {/* Horizontal Line */}
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#E5E7EB',
          marginBottom: 'clamp(32px, 3.14vw, 48px)',
        }}
      />

      {/* Match Shipping Methods Section */}
      <div
        style={{
          width: '100%',
          maxWidth: 'clamp(912px, 89.54vw, 1216px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 1.77vw, 24px)',
        }}
      >
        {/* Left Side - Title and Description */}
        <div
          style={{
            width: 'clamp(292px, 28.65vw, 389px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3px, 0.29vw, 4px)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(14px, 1.33vw, 18px)',
              lineHeight: 'clamp(18px, 1.77vw, 24px)',
              color: '#111827',
              margin: 0,
            }}
          >
            {tShipping('defaultTitle')}
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#6B7280',
              margin: 0,
            }}
          >
            {tShipping('defaultDescription')}
          </p>
        </div>

        {/* Right Side - Form Card */}
        <div
          style={{
            flex: 1,
            maxWidth: 'clamp(602px, 59.13vw, 803px)',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(18px, 1.77vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(18px, 1.77vw, 24px)',
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <div
              style={{
                padding: 'clamp(24px, 2.36vw, 32px)',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              {tCommon('loading')}...
            </div>
          )}

          {/* Error State */}
          {saveError && (
            <div
              style={{
                padding: 'clamp(12px, 1.18vw, 16px)',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                color: '#DC2626',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
              }}
            >
              {saveError}
            </div>
          )}

          {/* No FFN Methods */}
          {!isLoading && ffnShippingMethods.length === 0 && (
            <div
              style={{
                padding: 'clamp(20px, 1.96vw, 28px)',
                textAlign: 'center',
                color: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '6px',
              }}
            >
              {tShipping('noFFNMethods')}
            </div>
          )}

          {/* Default Shipping Method Selection */}
          {!isLoading && ffnShippingMethods.length > 0 && (
            <>
              <div>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(12px, 1.03vw, 14px)',
                    lineHeight: 'clamp(16px, 1.47vw, 20px)',
                    color: '#374151',
                    marginBottom: 'clamp(6px, 0.59vw, 8px)',
                    display: 'block',
                  }}
                >
                  {tShipping('defaultLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDefaultDropdownOpen(!defaultDropdownOpen)}
                    style={{
                      width: '100%',
                      height: 'clamp(40px, 3.93vw, 52px)',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      padding: 'clamp(10px, 0.98vw, 14px) clamp(14px, 1.37vw, 18px)',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 'clamp(12px, 1.03vw, 14px)',
                      lineHeight: 'clamp(16px, 1.47vw, 20px)',
                      color: selectedDefaultMethod ? '#111827' : '#9CA3AF',
                      textAlign: 'left',
                    }}
                  >
                    <span>
                      {selectedDefaultMethod
                        ? ffnShippingMethods.find(m => m.jtlShippingMethodId === selectedDefaultMethod)?.name || selectedDefaultMethod
                        : tShipping('selectDefault')}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: defaultDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="#9CA3AF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {defaultDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        maxHeight: 'clamp(200px, 19.61vw, 280px)',
                        overflowY: 'auto',
                        zIndex: 100,
                      }}
                    >
                      {ffnShippingMethods.map((method, index) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedDefaultMethod(method.jtlShippingMethodId || '');
                            setDefaultDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            padding: 'clamp(12px, 1.18vw, 16px) clamp(14px, 1.37vw, 18px)',
                            backgroundColor: selectedDefaultMethod === method.jtlShippingMethodId ? '#F3F4F6' : '#FFFFFF',
                            border: 'none',
                            borderBottom: index < ffnShippingMethods.length - 1 ? '1px solid #F3F4F6' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: selectedDefaultMethod === method.jtlShippingMethodId ? 500 : 400,
                              fontSize: 'clamp(12px, 1.03vw, 14px)',
                              color: '#111827',
                            }}
                          >
                            {method.name}
                          </span>
                          <span
                            style={{
                              fontSize: 'clamp(10px, 0.88vw, 12px)',
                              color: '#6B7280',
                              marginTop: '2px',
                            }}
                          >
                            {method.carrier} • {method.jtlShippingMethodId}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(10px, 0.88vw, 12px)',
                    lineHeight: 'clamp(14px, 1.27vw, 18px)',
                    color: '#6B7280',
                    marginTop: 'clamp(6px, 0.59vw, 8px)',
                    margin: 'clamp(6px, 0.59vw, 8px) 0 0 0',
                  }}
                >
                  {tShipping('defaultHint')}
                </p>
              </div>

              {/* Advanced Mapping Toggle */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 'clamp(16px, 1.57vw, 22px)' }}>
                <button
                  onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 0.78vw, 10px)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(12px, 1.03vw, 14px)',
                    color: '#003450',
                    padding: 0,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: showAdvancedMapping ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="#003450"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {tShipping('advancedMapping')}
                </button>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(10px, 0.88vw, 12px)',
                    lineHeight: 'clamp(14px, 1.27vw, 18px)',
                    color: '#6B7280',
                    marginTop: 'clamp(4px, 0.39vw, 6px)',
                    margin: 'clamp(4px, 0.39vw, 6px) 0 0 0',
                  }}
                >
                  {tShipping('advancedDescription')}
                </p>
              </div>

              {/* Advanced Mapping Section (collapsible) */}
              {showAdvancedMapping && (
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '6px',
                    padding: 'clamp(16px, 1.57vw, 22px)',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  {/* Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'clamp(18px, 1.77vw, 24px)',
                      marginBottom: 'clamp(12px, 1.18vw, 16px)',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 1.03vw, 14px)',
                        lineHeight: 'clamp(15px, 1.47vw, 20px)',
                        color: '#374151',
                        textAlign: 'center',
                      }}
                    >
                      {getChannelLabel()} {tShipping('method')}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 1.03vw, 14px)',
                        lineHeight: 'clamp(15px, 1.47vw, 20px)',
                        color: '#374151',
                        textAlign: 'center',
                      }}
                    >
                      FFN {tShipping('method')}
                    </div>
                  </div>

                  {/* No Channel Methods */}
                  {channelMethods.length === 0 && (
                    <div
                      style={{
                        padding: 'clamp(16px, 1.57vw, 22px)',
                        textAlign: 'center',
                        color: '#6B7280',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 'clamp(11px, 1.03vw, 14px)',
                      }}
                    >
                      {tShipping('noChannelMethods', { channel: getChannelLabel() })}
                    </div>
                  )}

                  {/* Method Rows */}
                  {channelMethods.map((channelMethod) => (
                    <div
                      key={channelMethod.id}
                      style={{
                        display: 'flex',
                        gap: 'clamp(18px, 1.77vw, 24px)',
                        alignItems: 'center',
                        marginBottom: 'clamp(10px, 0.98vw, 14px)',
                      }}
                    >
                      {/* Channel Method (Read-only) */}
                      <div
                        style={{
                          flex: 1,
                          height: 'clamp(36px, 3.53vw, 48px)',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          padding: 'clamp(8px, 0.78vw, 12px) clamp(12px, 1.18vw, 16px)',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            fontSize: 'clamp(11px, 1.03vw, 14px)',
                            lineHeight: 'clamp(15px, 1.47vw, 20px)',
                            color: '#374151',
                          }}
                        >
                          {channelMethod.name}
                        </span>
                      </div>

                      {/* FFN Method Dropdown */}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === channelMethod.id ? null : channelMethod.id)}
                          style={{
                            width: '100%',
                            height: 'clamp(36px, 3.53vw, 48px)',
                            borderRadius: '6px',
                            border: '1px solid #D1D5DB',
                            padding: 'clamp(8px, 0.78vw, 12px) clamp(12px, 1.18vw, 16px)',
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            fontSize: 'clamp(11px, 1.03vw, 14px)',
                            lineHeight: 'clamp(15px, 1.47vw, 20px)',
                            color: selectedMethods[channelMethod.id] ? '#111827' : '#9CA3AF',
                          }}
                        >
                          <span>
                            {selectedMethods[channelMethod.id]
                              ? ffnShippingMethods.find(m => m.jtlShippingMethodId === selectedMethods[channelMethod.id])?.name || selectedMethods[channelMethod.id]
                              : tShipping('useDefault')}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              transform: openDropdown === channelMethod.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="#9CA3AF"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {openDropdown === channelMethod.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px',
                              boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              maxHeight: 'clamp(160px, 15.69vw, 220px)',
                              overflowY: 'auto',
                              zIndex: 100,
                            }}
                          >
                            {/* Use Default option */}
                            <button
                              onClick={() => {
                                setSelectedMethods(prev => {
                                  const newMethods = { ...prev };
                                  delete newMethods[channelMethod.id];
                                  return newMethods;
                                });
                                setOpenDropdown(null);
                              }}
                              style={{
                                width: '100%',
                                padding: 'clamp(10px, 0.98vw, 14px) clamp(12px, 1.18vw, 16px)',
                                backgroundColor: !selectedMethods[channelMethod.id] ? '#F9FAFB' : '#FFFFFF',
                                border: 'none',
                                borderBottom: '1px solid #F3F4F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: !selectedMethods[channelMethod.id] ? 500 : 400,
                                fontSize: 'clamp(11px, 1.03vw, 14px)',
                                color: '#6B7280',
                                fontStyle: 'italic',
                                textAlign: 'left',
                              }}
                            >
                              {tShipping('useDefault')}
                            </button>
                            {ffnShippingMethods.map((method, index) => (
                              <button
                                key={method.id}
                                onClick={() => {
                                  setSelectedMethods(prev => ({
                                    ...prev,
                                    [channelMethod.id]: method.jtlShippingMethodId || '',
                                  }));
                                  setOpenDropdown(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: 'clamp(10px, 0.98vw, 14px) clamp(12px, 1.18vw, 16px)',
                                  backgroundColor: selectedMethods[channelMethod.id] === method.jtlShippingMethodId ? '#F9FAFB' : '#FFFFFF',
                                  border: 'none',
                                  borderBottom: index < ffnShippingMethods.length - 1 ? '1px solid #F3F4F6' : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: selectedMethods[channelMethod.id] === method.jtlShippingMethodId ? 500 : 400,
                                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                                  color: '#111827',
                                  textAlign: 'left',
                                }}
                              >
                                {method.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Reload Methods Button */}
                  <button
                    onClick={handleReloadMethods}
                    style={{
                      height: 'clamp(30px, 2.94vw, 40px)',
                      borderRadius: '100px',
                      border: 'none',
                      padding: 'clamp(8px, 0.78vw, 10px) clamp(12px, 1.18vw, 16px)',
                      backgroundColor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'clamp(6px, 0.59vw, 8px)',
                      cursor: 'pointer',
                      marginTop: 'clamp(8px, 0.78vw, 12px)',
                    }}
                  >
                    <DownloadIcon />
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 1.03vw, 14px)',
                        lineHeight: '1',
                        color: '#003450',
                      }}
                    >
                      {tShipping('reloadMethods')}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Finish Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'clamp(8px, 0.78vw, 12px)' }}>
            <button
              onClick={handleFinish}
              disabled={isSaving || isLoading || (!selectedDefaultMethod && ffnShippingMethods.length > 0)}
              style={{
                height: 'clamp(36px, 3.53vw, 44px)',
                borderRadius: '6px',
                border: 'none',
                padding: 'clamp(10px, 0.98vw, 14px) clamp(24px, 2.36vw, 32px)',
                backgroundColor: (isSaving || isLoading || (!selectedDefaultMethod && ffnShippingMethods.length > 0)) ? '#9CA3AF' : '#003450',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                cursor: (isSaving || isLoading || (!selectedDefaultMethod && ffnShippingMethods.length > 0)) ? 'not-allowed' : 'pointer',
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
                  lineHeight: '1',
                  color: '#FFFFFF',
                }}
              >
                {isSaving ? `${tCommon('loading')}...` : tCommon('finish')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={handleModalClose} />
    </div>
  );
}
