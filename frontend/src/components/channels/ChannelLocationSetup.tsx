'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { channelsApi, Location } from '@/lib/channels-api';

interface ChannelLocationSetupProps {
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

export function ChannelLocationSetup({ channelId, channelType, baseUrl }: ChannelLocationSetupProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tChannels = useTranslations('channels');
  const { user } = useAuthStore();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.clientId) return;

      try {
        setIsLoading(true);
        const response = await channelsApi.getWarehouseLocations(user.clientId);
        if (response.success) {
          setLocations(response.locations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [user?.clientId]);

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (!selectedLocation) {
      setSaveError('Please select a location');
      return;
    }

    // Save location selection if we have a channelId
    if (channelId && channelId !== 'new') {
      try {
        setIsSaving(true);
        setSaveError(null);

        // Find the location ID from the selected location name
        const selectedLoc = locations.find(loc => loc.name === selectedLocation);
        if (!selectedLoc) {
          setSaveError('Selected location not found');
          return;
        }

        const result = await channelsApi.saveLocationSelection(channelId, selectedLoc.id);
        
        if (!result.success) {
          setSaveError(result.error || 'Failed to save location');
          return;
        }
      } catch (err) {
        console.error('Error saving location:', err);
        setSaveError(err instanceof Error ? err.message : 'An error occurred');
        return;
      } finally {
        setIsSaving(false);
      }
    }

    router.push(`${baseUrl}/shipping-setup?type=${encodeURIComponent(channelType)}&channelId=${channelId}`);
  };

  const handleReloadLocations = async () => {
    if (!user?.clientId) return;

    try {
      setIsLoading(true);
      const response = await channelsApi.getWarehouseLocations(user.clientId);
      if (response.success) {
        setLocations(response.locations);
      }
    } catch (err) {
      console.error('Error reloading locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (locationName: string) => {
    setSelectedLocation(locationName);
    setIsDropdownOpen(false);
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

      {/* Location/Warehouse Section */}
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
            {tChannels('chooseLocation')}
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
            {tChannels('chooseLocationDescription', { channel: channelType.toLowerCase() })}
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
          {/* Warehouse and Location Row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(18px, 1.77vw, 24px)',
            }}
          >
            {/* Warehouse Column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#374151',
                  textAlign: 'center',
                }}
              >
                {tChannels('warehouse')}
              </label>
              <div
                style={{
                  width: '100%',
                  maxWidth: 'clamp(240px, 23.56vw, 320px)',
                  height: 'clamp(27px, 2.65vw, 36px)',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  padding: 'clamp(6px, 0.59vw, 8px) clamp(9px, 0.88vw, 12px)',
                  backgroundColor: '#F9FAFB',
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
                    color: '#6B7280',
                  }}
                >
                  JTL FFN Warehouse
                </span>
              </div>
            </div>

            {/* Location Column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(6px, 0.59vw, 8px)',
              }}
            >
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(15px, 1.47vw, 20px)',
                  color: '#374151',
                  textAlign: 'center',
                }}
              >
                {getChannelLabel()}
              </label>
              
              {/* Custom Dropdown */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 'clamp(240px, 23.56vw, 320px)',
                }}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '100%',
                    height: 'clamp(29px, 2.80vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: 'clamp(7px, 0.66vw, 9px) clamp(10px, 0.96vw, 13px)',
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
                    color: selectedLocation ? '#111827' : '#9CA3AF',
                  }}
                >
                  <span>{selectedLocation || 'Location'}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
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

                {/* Dropdown Menu */}
                {isDropdownOpen && (
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
                      maxHeight: 'clamp(180px, 17.67vw, 240px)',
                      overflowY: 'auto',
                      zIndex: 10,
                    }}
                  >
                    {locations.map((location, index) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location.name)}
                        style={{
                          width: '100%',
                          padding: 'clamp(8px, 0.78vw, 10px) clamp(10px, 0.96vw, 13px)',
                          backgroundColor: selectedLocation === location.name ? '#F9FAFB' : '#FFFFFF',
                          border: 'none',
                          borderBottom: index < locations.length - 1 ? '1px solid #F3F4F6' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(11px, 1.03vw, 14px)',
                          lineHeight: 'clamp(15px, 1.47vw, 20px)',
                          color: '#111827',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = selectedLocation === location.name ? '#F9FAFB' : '#FFFFFF';
                        }}
                      >
                        <span>{location.name}</span>
                        {selectedLocation === location.name && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M13.3333 4L6 11.3333L2.66667 8"
                              stroke="#6366F1"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'clamp(12px, 1.18vw, 16px)',
            }}
          >
            {/* Reload Locations Button */}
            <button
              onClick={handleReloadLocations}
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
                {tChannels('reloadLocations')}
              </span>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              style={{
                height: 'clamp(29px, 2.80vw, 38px)',
                borderRadius: '6px',
                border: 'none',
                padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                backgroundColor: '#003450',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
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
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: '1',
                  color: '#FFFFFF',
                }}
              >
                {tCommon('next')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
