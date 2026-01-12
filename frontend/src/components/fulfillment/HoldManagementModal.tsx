'use client';

import { useState } from 'react';
import { X, AlertTriangle, Pause, Play } from 'lucide-react';
import { fulfillmentApi, HoldReason } from '@/lib/fulfillment-api';

interface HoldManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  currentStatus: 'ON_HOLD' | 'OPEN' | 'IN_PROGRESS';
  currentHoldReason?: HoldReason | null;
  currentHoldNotes?: string | null;
  onSuccess: () => void;
}

const holdReasons: { value: HoldReason; label: string; description: string }[] = [
  {
    value: 'AWAITING_PAYMENT',
    label: 'Awaiting Payment',
    description: 'Order is waiting for payment confirmation',
  },
  {
    value: 'HIGH_RISK_OF_FRAUD',
    label: 'High Risk of Fraud',
    description: 'Order flagged for potential fraud review',
  },
  {
    value: 'INCORRECT_ADDRESS',
    label: 'Incorrect Address',
    description: 'Shipping address needs verification',
  },
  {
    value: 'INVENTORY_OUT_OF_STOCK',
    label: 'Out of Stock',
    description: 'One or more items are currently unavailable',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Custom reason - please specify in notes',
  },
];

export function HoldManagementModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  currentStatus,
  currentHoldReason,
  currentHoldNotes,
  onSuccess,
}: HoldManagementModalProps) {
  const [selectedReason, setSelectedReason] = useState<HoldReason>(currentHoldReason || 'OTHER');
  const [notes, setNotes] = useState(currentHoldNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnHold = currentStatus === 'ON_HOLD';

  const handleHold = async () => {
    try {
      setLoading(true);
      setError(null);
      await fulfillmentApi.holdOrder(orderId, {
        reason: selectedReason,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error placing hold:', err);
      setError('Failed to place hold. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    try {
      setLoading(true);
      setError(null);
      await fulfillmentApi.releaseHold(orderId);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error releasing hold:', err);
      setError('Failed to release hold. Please try again.');
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
                backgroundColor: isOnHold ? '#DCFCE7' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isOnHold ? (
                <Play size={20} color="#15803D" />
              ) : (
                <Pause size={20} color="#B45309" />
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
                {isOnHold ? 'Release Hold' : 'Place on Hold'}
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
          {isOnHold ? (
            // Release Hold View
            <div>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#166534',
                  }}
                >
                  This order is currently on hold. Releasing it will allow fulfillment to proceed.
                </p>
              </div>

              {currentHoldReason && (
                <div style={{ marginBottom: '16px' }}>
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
                    Current Hold Reason
                  </label>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#991B1B',
                        fontWeight: 500,
                      }}
                    >
                      {holdReasons.find((r) => r.value === currentHoldReason)?.label || currentHoldReason}
                    </span>
                  </div>
                </div>
              )}

              {currentHoldNotes && (
                <div>
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
                    Hold Notes
                  </label>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#374151',
                      }}
                    >
                      {currentHoldNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Place Hold View
            <div>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <AlertTriangle size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#92400E',
                  }}
                >
                  Placing this order on hold will prevent fulfillment until the hold is released.
                </p>
              </div>

              {/* Hold Reason Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    display: 'block',
                    marginBottom: '12px',
                  }}
                >
                  Select Hold Reason
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {holdReasons.map((reason) => (
                    <label
                      key={reason.value}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${selectedReason === reason.value ? '#003450' : '#E5E7EB'}`,
                        backgroundColor: selectedReason === reason.value ? '#F0F9FF' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="holdReason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value as HoldReason)}
                        style={{ marginTop: '2px' }}
                      />
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
                          {reason.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#6B7280',
                          }}
                        >
                          {reason.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
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
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this hold..."
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
            onClick={isOnHold ? handleRelease : handleHold}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isOnHold ? '#15803D' : '#B45309',
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
                Processing...
              </>
            ) : isOnHold ? (
              <>
                <Play size={16} />
                Release Hold
              </>
            ) : (
              <>
                <Pause size={16} />
                Place on Hold
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
