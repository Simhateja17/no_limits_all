'use client';

import { useState } from 'react';
import { X, Send, Check, XCircle, AlertTriangle } from 'lucide-react';
import { fulfillmentApi, FulfillmentRequestStatus } from '@/lib/fulfillment-api';

type RequestAction = 'submit' | 'accept' | 'reject' | 'cancel_request' | 'accept_cancel' | 'reject_cancel';

interface ThreePLRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  currentRequestStatus: FulfillmentRequestStatus;
  action: RequestAction;
  onSuccess: () => void;
}

const actionConfig: Record<RequestAction, {
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  requiresMessage: boolean;
  requiresReason: boolean;
}> = {
  submit: {
    title: 'Submit Fulfillment Request',
    description: 'Submit this order for fulfillment processing. The merchant will be notified.',
    buttonText: 'Submit Request',
    buttonColor: '#1D4ED8',
    requiresMessage: false,
    requiresReason: false,
  },
  accept: {
    title: 'Accept Fulfillment Request',
    description: 'Accept this fulfillment request and begin processing.',
    buttonText: 'Accept Request',
    buttonColor: '#15803D',
    requiresMessage: false,
    requiresReason: false,
  },
  reject: {
    title: 'Reject Fulfillment Request',
    description: 'Reject this fulfillment request. Please provide a reason.',
    buttonText: 'Reject Request',
    buttonColor: '#B91C1C',
    requiresMessage: false,
    requiresReason: true,
  },
  cancel_request: {
    title: 'Request Cancellation',
    description: 'Submit a cancellation request for this order.',
    buttonText: 'Request Cancellation',
    buttonColor: '#B45309',
    requiresMessage: true,
    requiresReason: false,
  },
  accept_cancel: {
    title: 'Accept Cancellation',
    description: 'Accept the cancellation request for this order.',
    buttonText: 'Accept Cancellation',
    buttonColor: '#15803D',
    requiresMessage: false,
    requiresReason: false,
  },
  reject_cancel: {
    title: 'Reject Cancellation',
    description: 'Reject the cancellation request. The order will continue to be processed.',
    buttonText: 'Reject Cancellation',
    buttonColor: '#B91C1C',
    requiresMessage: true,
    requiresReason: false,
  },
};

const rejectionReasons = [
  'Out of stock',
  'Cannot ship to destination',
  'Order contains restricted items',
  'Missing product information',
  'Inventory discrepancy',
  'Other',
];

export function ThreePLRequestModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  currentRequestStatus,
  action,
  onSuccess,
}: ThreePLRequestModalProps) {
  const [message, setMessage] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notifyMerchant, setNotifyMerchant] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = actionConfig[action];

  const handleSubmit = async () => {
    if (config.requiresReason && !selectedReason) {
      setError('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reason = selectedReason === 'Other' ? customReason : selectedReason;

      switch (action) {
        case 'submit':
          await fulfillmentApi.submitFulfillmentRequest(orderId, {
            message: message || undefined,
            notifyMerchant,
          });
          break;
        case 'accept':
          await fulfillmentApi.acceptFulfillmentRequest(orderId, message || undefined);
          break;
        case 'reject':
          await fulfillmentApi.rejectFulfillmentRequest(orderId, reason, message || undefined);
          break;
        case 'cancel_request':
          await fulfillmentApi.requestCancellation(orderId, message || undefined);
          break;
        case 'accept_cancel':
          await fulfillmentApi.acceptCancellation(orderId, message || undefined);
          break;
        case 'reject_cancel':
          await fulfillmentApi.rejectCancellation(orderId, message || undefined);
          break;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error processing request:', err);
      setError('Failed to process request. Please try again.');
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
                backgroundColor: action === 'reject' || action === 'reject_cancel' ? '#FEE2E2' :
                  action === 'accept' || action === 'accept_cancel' ? '#DCFCE7' : '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {action === 'reject' || action === 'reject_cancel' ? (
                <XCircle size={20} color="#B91C1C" />
              ) : action === 'accept' || action === 'accept_cancel' ? (
                <Check size={20} color="#15803D" />
              ) : (
                <Send size={20} color="#1D4ED8" />
              )}
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
                {config.title}
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
          {/* Description */}
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: action === 'reject' || action === 'cancel_request' ? '#FFFBEB' : '#F0F9FF',
              border: `1px solid ${action === 'reject' || action === 'cancel_request' ? '#FDE68A' : '#BAE6FD'}`,
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
            }}
          >
            {(action === 'reject' || action === 'cancel_request') && (
              <AlertTriangle size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: action === 'reject' || action === 'cancel_request' ? '#92400E' : '#0369A1',
              }}
            >
              {config.description}
            </p>
          </div>

          {/* Rejection Reason */}
          {config.requiresReason && (
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
                Rejection Reason *
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Select a reason...</option>
                {rejectionReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              {selectedReason === 'Other' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    marginTop: '8px',
                  }}
                />
              )}
            </div>
          )}

          {/* Message */}
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
              Message {config.requiresMessage ? '*' : '(optional)'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Notify Merchant Toggle (only for submit) */}
          {action === 'submit' && (
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
                  Notify Merchant
                </span>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#6B7280',
                  }}
                >
                  Send notification about this request
                </span>
              </div>
              <button
                onClick={() => setNotifyMerchant(!notifyMerchant)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: notifyMerchant ? '#003450' : '#D1D5DB',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: notifyMerchant ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>
          )}

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
            disabled={loading || (config.requiresMessage && !message) || (config.requiresReason && !selectedReason)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: config.buttonColor,
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'Processing...' : config.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
