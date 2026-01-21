'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { channelsApi, Channel as ApiChannel } from '@/lib/channels-api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FFNAccountDetails } from './FFNAccountDetails';

// Channel interface
interface Channel {
  id: string;
  name: string;
  type: 'Woocommerce' | 'Shopify' | 'Amazon';
  url: string;
  status: 'Active' | 'Inactive';
}

// Status Badge Component
function StatusBadge({ status, t }: { status: 'Active' | 'Inactive'; t: (key: string) => string }) {
  const isActive = status === 'Active';
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'clamp(16px, 1.47vw, 20px)',
        borderRadius: '10px',
        padding: 'clamp(1.5px, 0.15vw, 2px) clamp(7.5px, 0.74vw, 10px)',
        backgroundColor: isActive ? '#F3F4F6' : '#FEE2E2',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: 'clamp(10px, 0.88vw, 12px)',
        lineHeight: 'clamp(13px, 1.18vw, 16px)',
        textAlign: 'center',
        color: isActive ? '#003450' : '#991B1B',
      }}
    >
      {isActive ? t('active') : t('inactive')}
    </span>
  );
}

// Adjustments Icon Component
function AdjustmentsIcon() {
  return (
    <svg
      width="clamp(13px, 1.18vw, 16px)"
      height="clamp(11px, 1.03vw, 14px)"
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 3H5M5 3C5 4.10457 5.89543 5 7 5C8.10457 5 9 4.10457 9 3M5 3C5 1.89543 5.89543 1 7 1C8.10457 1 9 1.89543 9 3M9 3H15M1 11H9M9 11C9 12.1046 9.89543 13 11 13C12.1046 13 13 12.1046 13 11M9 11C9 9.89543 9.89543 9 11 9C12.1046 9 13 9.89543 13 11M13 11H15"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Channel Card Component
function ChannelCard({ channel, onSettingsClick, onNameClick, t }: { channel: Channel; onSettingsClick: (id: string) => void; onNameClick: (id: string) => void; t: (key: string) => string }) {
  const getChannelLogo = (type: string) => {
    switch (type) {
      case 'Shopify':
        return '/shopify-logo-svg-vector.svg';
      case 'Woocommerce':
        return '/WooCommerce-Symbol-1.png';
      default:
        return null;
    }
  };

  const channelLogo = getChannelLogo(channel.type);

  return (
    <div
      className="w-full sm:w-auto"
      style={{
        minWidth: 'clamp(260px, 28.65vw, 389px)',
        maxWidth: '100%',
        height: 'clamp(110px, 10.75vw, 146px)',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Card Content */}
      <div
        style={{
          flex: 1,
          padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.77vw, 24px)',
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(10px, 0.98vw, 12px)',
        }}
      >
        {/* Logo */}
        {channelLogo && (
          <div
            style={{
              width: 'clamp(32px, 3.14vw, 40px)',
              height: 'clamp(32px, 3.14vw, 40px)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Image
              src={channelLogo}
              alt={channel.type}
              width={40}
              height={40}
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Channel Info */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(3px, 0.29vw, 4px)',
          }}
        >
          {/* Name and Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 0.74vw, 10px)',
            }}
          >
            <span
              onClick={() => onNameClick(channel.id)}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(11px, 1.03vw, 14px)',
                lineHeight: 'clamp(16px, 1.47vw, 20px)',
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              {channel.name} - {channel.type}
            </span>
            <StatusBadge status={channel.status} t={t} />
          </div>

          {/* URL */}
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(16px, 1.47vw, 20px)',
              color: '#6B7280',
            }}
          >
            {channel.url}
          </span>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => onSettingsClick(channel.id)}
        style={{
          width: '100%',
          height: 'clamp(40px, 3.90vw, 53px)',
          padding: 'clamp(13px, 1.25vw, 17px) 0 clamp(12px, 1.18vw, 16px) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(9px, 0.88vw, 12px)',
          backgroundColor: '#FFFFFF',
          border: 'none',
          borderTop: '1px solid #E5E7EB',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
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
        <AdjustmentsIcon />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(11px, 1.03vw, 14px)',
            lineHeight: 'clamp(16px, 1.47vw, 20px)',
            color: '#374151',
          }}
        >
          {t('settings')}
        </span>
      </button>
    </div>
  );
}

// Plus Icon Component
function PlusIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4V16M4 10H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Empty State Plus Icon (larger, with circle)
function EmptyStatePlusIcon() {
  return (
    <div
      style={{
        width: 'clamp(36px, 3.53vw, 48px)',
        height: 'clamp(36px, 3.53vw, 48px)',
        borderRadius: '50%',
        border: '2px solid #D1D5DB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'clamp(12px, 1.18vw, 16px)',
      }}
    >
      <svg
        width="clamp(18px, 1.77vw, 24px)"
        height="clamp(18px, 1.77vw, 24px)"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface SalesChannelsProps {
  baseUrl: string;
}

// Channel Type Selection Modal
function ChannelTypeModal({ 
  isOpen, 
  onClose, 
  onSelect,
  t
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (type: 'Woocommerce' | 'Shopify' | 'Amazon') => void;
  t: (key: string) => string;
}) {
  if (!isOpen) return null;

  const channelTypes: { type: 'Woocommerce' | 'Shopify' | 'Amazon'; label: string; descriptionKey: string; logo?: string }[] = [
    { type: 'Woocommerce', label: 'Woocommerce', descriptionKey: 'woocommerceDescription', logo: '/WooCommerce-Symbol-1.png' },
    { type: 'Shopify', label: 'Shopify', descriptionKey: 'shopifyDescription', logo: '/shopify-logo-svg-vector.svg' },
    { type: 'Amazon', label: 'Amazon', descriptionKey: 'amazonDescription' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[1000] p-4 md:p-0"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px]"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'clamp(8px, 0.78vw, 12px)',
          padding: 'clamp(20px, 2.36vw, 32px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 1.96vw, 28px)',
          boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(16px, 1.57vw, 22px)',
              lineHeight: 'clamp(20px, 1.96vw, 28px)',
              color: '#111827',
              margin: 0,
            }}
          >
            {t('selectChannelType')}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 'clamp(24px, 2.36vw, 32px)',
              height: 'clamp(24px, 2.36vw, 32px)',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#6B7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Channel Type Options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 1.18vw, 16px)',
          }}
        >
          {channelTypes.map((channel) => (
            <button
              key={channel.type}
              onClick={() => onSelect(channel.type)}
              style={{
                width: '100%',
                padding: 'clamp(14px, 1.37vw, 20px) clamp(16px, 1.57vw, 22px)',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 'clamp(12px, 1.18vw, 16px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#003450';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              {channel.logo && (
                <div
                  style={{
                    width: 'clamp(32px, 3.14vw, 40px)',
                    height: 'clamp(32px, 3.14vw, 40px)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={channel.logo}
                    alt={channel.label}
                    width={40}
                    height={40}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 'clamp(2px, 0.20vw, 4px)',
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(13px, 1.18vw, 16px)',
                    lineHeight: 'clamp(16px, 1.47vw, 20px)',
                    color: '#111827',
                  }}
                >
                  {channel.label}
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(14px, 1.37vw, 18px)',
                    color: '#6B7280',
                  }}
                >
                  {t(channel.descriptionKey)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SalesChannels({ baseUrl }: SalesChannelsProps) {
  const router = useRouter();
  const t = useTranslations('channels');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [showChannelTypeModal, setShowChannelTypeModal] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasChannels = channels.length > 0;

  // Fetch channels when component mounts
  useEffect(() => {
    const fetchChannels = async () => {
      if (!user?.clientId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await channelsApi.getChannels(user.clientId);

        if (response.success) {
          // Map API response to component Channel interface
          const mappedChannels: Channel[] = response.channels.map(ch => ({
            id: ch.id,
            name: ch.name,
            type: ch.type as 'Woocommerce' | 'Shopify' | 'Amazon',
            url: ch.url || '',
            // Convert backend status (ACTIVE/INACTIVE) to frontend format (Active/Inactive)
            status: (ch.status === 'ACTIVE' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          }));
          setChannels(mappedChannels);
          setError(null);
        } else {
          setError(response.error || 'Failed to load channels');
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
        const errorMessage = err instanceof Error
          ? err.message.includes('CORS') || err.message.includes('Network') || err.message.includes('fetch')
            ? 'Unable to connect to server. Please ensure the backend is running on http://localhost:3001'
            : err.message
          : 'Failed to load channels';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, [user?.clientId]);

  const handleBack = () => {
    router.back();
  };

  const handleSettingsClick = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      router.push(`${baseUrl}/${channelId}/settings?type=${encodeURIComponent(channel.type)}`);
    }
  };

  const handleNameClick = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      router.push(`${baseUrl}/${channelId}/settings?type=${encodeURIComponent(channel.type)}`);
    }
  };

  const handleNewChannel = () => {
    setShowChannelTypeModal(true);
  };

  const handleChannelTypeSelect = (type: 'Woocommerce' | 'Shopify' | 'Amazon') => {
    setShowChannelTypeModal(false);

    // Redirect to existing setup flow with pre-selected platform
    // This will skip platform selection and JTL configuration
    const platform = type === 'Woocommerce' ? 'woocommerce' : type === 'Shopify' ? 'shopify' : 'amazon';
    router.push(`/client/setup?platform=${platform}&addChannel=true`);
  };

  return (
    <div
      className="px-4 sm:px-6 md:px-8 lg:px-[52px] py-6 md:py-8"
      style={{
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#F9FAFB',
      }}
    >
      {/* Header Row - Back Button and New Channel Button */}
      <div
        className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center mb-6 md:mb-8"
      >
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="w-full sm:w-auto"
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
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#374151',
            }}
          >
            {tCommon('back')}
          </span>
        </button>

        {/* New Channel Button */}
        <button
          onClick={handleNewChannel}
          className="w-full sm:w-auto"
          style={{
            height: 'clamp(29px, 2.80vw, 38px)',
            borderRadius: '6px',
            border: 'none',
            padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
            gap: 'clamp(6px, 0.59vw, 8px)',
            backgroundColor: '#003450',
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
              fontSize: 'clamp(11px, 1.03vw, 14px)',
              lineHeight: 'clamp(15px, 1.47vw, 20px)',
              color: '#FFFFFF',
            }}
          >
            {t('newChannel')}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="salesChannels">
        <div
          style={{
            marginBottom: 'clamp(20px, 1.96vw, 28px)',
          }}
        >
          <TabsList
            className="bg-gray-100 p-1 rounded-lg"
          >
          <TabsTrigger value="salesChannels">{t('tabs.salesChannels')}</TabsTrigger>
          <TabsTrigger value="ffn">{t('tabs.ffn')}</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="salesChannels">
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
            {t('title')}
          </h1>

          {/* Horizontal Line */}
          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#E5E7EB',
              marginBottom: 'clamp(24px, 2.36vw, 32px)',
            }}
          />

          {/* Loading State */}
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#6B7280',
                fontSize: '14px',
              }}
            >
              {tCommon('loading')}...
            </div>
          ) : error ? (
            /* Error State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px',
                color: '#DC2626',
                fontSize: '14px',
                gap: '16px',
              }}
            >
              <div>{error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#003450',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {tCommon('retry')}
              </button>
            </div>
          ) : /* Content - Either Channel Cards or Empty State */
          hasChannels ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onSettingsClick={handleSettingsClick}
                  onNameClick={handleNameClick}
                  t={t}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 'clamp(80px, 7.86vw, 120px)',
                paddingBottom: 'clamp(80px, 7.86vw, 120px)',
              }}
            >
              <EmptyStatePlusIcon />
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: 'clamp(16px, 1.47vw, 20px)',
                  color: '#111827',
                  margin: '0 0 clamp(6px, 0.59vw, 8px) 0',
                  textAlign: 'center',
                }}
              >
                {t('noChannelsTitle')}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(11px, 1.03vw, 14px)',
                  lineHeight: 'clamp(16px, 1.47vw, 20px)',
                  color: '#6B7280',
                  margin: '0 0 clamp(18px, 1.77vw, 24px) 0',
                  textAlign: 'center',
                }}
              >
                {t('noChannelsDescription')}
              </p>
              <button
                onClick={handleNewChannel}
                style={{
                  height: 'clamp(29px, 2.80vw, 38px)',
                  borderRadius: '6px',
                  border: 'none',
                  padding: 'clamp(7px, 0.66vw, 9px) clamp(13px, 1.25vw, 17px)',
                  gap: 'clamp(6px, 0.59vw, 8px)',
                  backgroundColor: '#003450',
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
                    fontSize: 'clamp(11px, 1.03vw, 14px)',
                    lineHeight: 'clamp(15px, 1.47vw, 20px)',
                    color: '#FFFFFF',
                  }}
                >
                  {t('newChannel')}
                </span>
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ffn">
          {/* FFN Title */}
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
            JTL FFN
          </h1>

          {/* Horizontal Line */}
          <div
            style={{
              width: '100%',
              height: '1px',
              backgroundColor: '#E5E7EB',
              marginBottom: 'clamp(24px, 2.36vw, 32px)',
            }}
          />

          {/* FFN Account Details */}
          <FFNAccountDetails />
        </TabsContent>
      </Tabs>

      {/* Channel Type Selection Modal */}
      <ChannelTypeModal
        isOpen={showChannelTypeModal}
        onClose={() => setShowChannelTypeModal(false)}
        onSelect={handleChannelTypeSelect}
        t={t}
      />
    </div>
  );
}
