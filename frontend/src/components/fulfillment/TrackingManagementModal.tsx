'use client';

import { useState, useEffect } from 'react';
import { X, Truck, ExternalLink, Bell, BellOff } from 'lucide-react';
import { fulfillmentApi, TrackingInfo } from '@/lib/fulfillment-api';

interface TrackingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  fulfillmentId?: string;
  currentTracking?: TrackingInfo | null;
  onSuccess: () => void;
}

const commonCarriers = [
  { id: 'dhl', name: 'DHL', urlTemplate: 'https://www.dhl.com/track?trackingNumber=' },
  { id: 'ups', name: 'UPS', urlTemplate: 'https://www.ups.com/track?trackingNumber=' },
  { id: 'fedex', name: 'FedEx', urlTemplate: 'https://www.fedex.com/apps/fedextrack/?trackingnumber=' },
  { id: 'dpd', name: 'DPD', urlTemplate: 'https://track.dpd.com/parcel/' },
  { id: 'hermes', name: 'Hermes', urlTemplate: 'https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#' },
  { id: 'gls', name: 'GLS', urlTemplate: 'https://gls-group.eu/track/' },
  { id: 'deutsche_post', name: 'Deutsche Post', urlTemplate: 'https://www.deutschepost.de/sendung/simpleQuery.html?locale=en_GB&trackingId=' },
  { id: 'other', name: 'Other', urlTemplate: '' },
];

export function TrackingManagementModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  fulfillmentId,
  currentTracking,
  onSuccess,
}: TrackingManagementModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(currentTracking?.trackingNumber || '');
  const [selectedCarrier, setSelectedCarrier] = useState(
    currentTracking?.trackingCompany || 'dhl'
  );
  const [customTrackingUrl, setCustomTrackingUrl] = useState(currentTracking?.trackingUrl || '');
  const [notifyCustomer, setNotifyCustomer] = useState(currentTracking?.notifyCustomer ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdate = !!currentTracking?.trackingNumber;
  const showCustomUrl = selectedCarrier === 'other';

  // Generate tracking URL based on carrier
  const getTrackingUrl = () => {
    if (showCustomUrl) {
      return customTrackingUrl;
    }
    const carrier = commonCarriers.find((c) => c.id === selectedCarrier);
    if (carrier && trackingNumber) {
      return carrier.urlTemplate + trackingNumber;
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      setError('Tracking number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const carrierName = commonCarriers.find((c) => c.id === selectedCarrier)?.name || selectedCarrier;
      const trackingUrl = getTrackingUrl();

      if (isUpdate && fulfillmentId) {
        await fulfillmentApi.updateTracking(orderId, fulfillmentId, {
          trackingNumber: trackingNumber.trim(),
          trackingCompany: carrierName,
          trackingUrl: trackingUrl || undefined,
          notifyCustomer,
        });
      } else {
        await fulfillmentApi.addTracking(orderId, {
          trackingNumber: trackingNumber.trim(),
          trackingCompany: carrierName,
          trackingUrl: trackingUrl || undefined,
          notifyCustomer,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving tracking:', err);
      setError('Failed to save tracking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={20} color="#1D4ED8" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                {isUpdate ? 'Update Tracking' : 'Add Tracking'}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#6B7280',
                }}
              >
                Order {orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color="#6B7280" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Carrier Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Shipping Carrier
            </label>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {commonCarriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Number */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Custom Tracking URL (for 'Other' carrier) */}
          {showCustomUrl && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Tracking URL
              </label>
              <input
                type="url"
                value={customTrackingUrl}
                onChange={(e) => setCustomTrackingUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          {/* Preview Tracking URL */}
          {trackingNumber && !showCustomUrl && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Tracking URL Preview
              </label>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#1D4ED8',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getTrackingUrl()}
                </span>
                <a
                  href={getTrackingUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Notify Customer Toggle */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-3">
              {notifyCustomer ? (
                <Bell size={20} color="#15803D" />
              ) : (
                <BellOff size={20} color="#6B7280" />
              )}
              <div>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#111827',
                    display: 'block',
                  }}
                >
                  Notify Customer
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                  }}
                >
                  Send shipping confirmation email
                </span>
              </div>
            </div>
            <button
              onClick={() => setNotifyCustomer(!notifyCustomer)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: notifyCustomer ? '#003450' : '#D1D5DB',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: notifyCustomer ? '22px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#B91C1C',
                }}
              >
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !trackingNumber.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#003450',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              cursor: loading || !trackingNumber.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !trackingNumber.trim() ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Saving...
              </>
            ) : (
              <>
                <Truck size={16} />
                {isUpdate ? 'Update Tracking' : 'Add Tracking'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
