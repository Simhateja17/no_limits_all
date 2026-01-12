'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  CheckCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  Scan,
  Box,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';
import { fulfillmentApi, FulfillmentOrder, FulfillmentLineItem } from '@/lib/fulfillment-api';

type WorkflowStep = 'pick' | 'pack' | 'ship' | 'complete';

interface FulfillmentWorkflowWizardProps {
  order: FulfillmentOrder;
  onComplete: () => void;
  onCancel: () => void;
}

interface PickedItem extends FulfillmentLineItem {
  pickedQuantity: number;
  verified: boolean;
}

export function FulfillmentWorkflowWizard({
  order,
  onComplete,
  onCancel,
}: FulfillmentWorkflowWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('pick');
  const [pickedItems, setPickedItems] = useState<PickedItem[]>(
    order.lineItems.map((item) => ({
      ...item,
      pickedQuantity: 0,
      verified: false,
    }))
  );
  const [scanInput, setScanInput] = useState('');
  const [packingNotes, setPackingNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('dhl');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: { key: WorkflowStep; label: string; icon: React.ReactNode }[] = [
    { key: 'pick', label: 'Pick Items', icon: <Scan size={20} /> },
    { key: 'pack', label: 'Pack Order', icon: <Box size={20} /> },
    { key: 'ship', label: 'Ship', icon: <Truck size={20} /> },
    { key: 'complete', label: 'Complete', icon: <CheckCircle size={20} /> },
  ];

  const getCurrentStepIndex = () => steps.findIndex((s) => s.key === currentStep);

  const allItemsPicked = pickedItems.every((item) => item.pickedQuantity === item.quantity);
  const allItemsVerified = pickedItems.every((item) => item.verified);

  // Handle barcode scan input
  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      const scannedSku = scanInput.trim().toUpperCase();
      const itemIndex = pickedItems.findIndex(
        (item) => item.sku?.toUpperCase() === scannedSku
      );

      if (itemIndex !== -1) {
        const updatedItems = [...pickedItems];
        const item = updatedItems[itemIndex];
        if (item.pickedQuantity < item.quantity) {
          item.pickedQuantity += 1;
          if (item.pickedQuantity === item.quantity) {
            item.verified = true;
          }
          setPickedItems(updatedItems);
        }
      } else {
        setError(`SKU "${scannedSku}" not found in this order`);
        setTimeout(() => setError(null), 3000);
      }
      setScanInput('');
    }
  };

  // Manual quantity adjustment
  const adjustQuantity = (itemId: string, delta: number) => {
    const updatedItems = pickedItems.map((item) => {
      if (item.id === itemId) {
        const newQty = Math.max(0, Math.min(item.quantity, item.pickedQuantity + delta));
        return {
          ...item,
          pickedQuantity: newQty,
          verified: newQty === item.quantity,
        };
      }
      return item;
    });
    setPickedItems(updatedItems);
  };

  // Complete fulfillment
  const handleCompleteFulfillment = async () => {
    try {
      setLoading(true);
      setError(null);

      await fulfillmentApi.createFulfillment({
        orderId: order.id,
        lineItems: pickedItems.map((item) => ({
          id: item.id,
          quantity: item.pickedQuantity,
        })),
        trackingNumber: trackingNumber || undefined,
        trackingCompany: selectedCarrier,
        notifyCustomer,
      });

      setCurrentStep('complete');
    } catch (err) {
      console.error('Error completing fulfillment:', err);
      setError('Failed to complete fulfillment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPickStep = () => (
    <div>
      {/* Scan Input */}
      <div style={{ marginBottom: '24px' }}>
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
          Scan Item Barcode
        </label>
        <div className="flex gap-3">
          <div style={{ position: 'relative', flex: 1 }}>
            <Scan
              size={18}
              color="#9CA3AF"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={handleScan}
              placeholder="Scan or enter SKU..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Items List */}
      <div
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h3
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Items to Pick ({pickedItems.filter((i) => i.verified).length}/{pickedItems.length})
          </h3>
        </div>

        {pickedItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: '16px',
              borderBottom: index < pickedItems.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: item.verified ? '#F0FDF4' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Status Icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: item.verified ? '#DCFCE7' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.verified ? (
                <CheckCircle size={20} color="#15803D" />
              ) : (
                <Package size={20} color="#6B7280" />
              )}
            </div>

            {/* Item Info */}
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  display: 'block',
                }}
              >
                {item.productName}
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#6B7280',
                }}
              >
                SKU: {item.sku || 'N/A'}
              </span>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustQuantity(item.id, -1)}
                disabled={item.pickedQuantity === 0}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  cursor: item.pickedQuantity === 0 ? 'not-allowed' : 'pointer',
                  opacity: item.pickedQuantity === 0 ? 0.5 : 1,
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                -
              </button>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: item.verified ? '#15803D' : '#111827',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              >
                {item.pickedQuantity} / {item.quantity}
              </span>
              <button
                onClick={() => adjustQuantity(item.id, 1)}
                disabled={item.pickedQuantity >= item.quantity}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  cursor: item.pickedQuantity >= item.quantity ? 'not-allowed' : 'pointer',
                  opacity: item.pickedQuantity >= item.quantity ? 0.5 : 1,
                  fontSize: '18px',
                  fontWeight: 500,
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPackStep = () => (
    <div>
      {/* Packing Checklist */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ClipboardCheck size={20} />
          Packing Checklist
        </h3>

        {[
          'Verify all items are correct',
          'Add packing slip / invoice',
          'Use appropriate box size',
          'Add protective packaging if needed',
          'Seal package securely',
        ].map((task, index) => (
          <label
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
              borderBottom: index < 4 ? '1px solid #E5E7EB' : 'none',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" style={{ width: '18px', height: '18px' }} />
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              {task}
            </span>
          </label>
        ))}
      </div>

      {/* Items Summary */}
      <div
        style={{
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h3
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Items to Pack
          </h3>
        </div>

        {pickedItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              padding: '12px 16px',
              borderBottom: index < pickedItems.length - 1 ? '1px solid #E5E7EB' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151' }}>
              {item.productName}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#111827' }}>
              x{item.pickedQuantity}
            </span>
          </div>
        ))}
      </div>

      {/* Packing Notes */}
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
          Packing Notes (optional)
        </label>
        <textarea
          value={packingNotes}
          onChange={(e) => setPackingNotes(e.target.value)}
          placeholder="Add any notes about packing..."
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
  );

  const renderShipStep = () => (
    <div>
      {/* Shipping Address */}
      <div
        style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '12px',
          }}
        >
          Ship To
        </h3>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#111827', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 500 }}>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
          <p>{order.shippingAddress.address1}</p>
          {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
          <p>
            {order.shippingAddress.zip} {order.shippingAddress.city}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

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
          }}
        >
          <option value="dhl">DHL</option>
          <option value="ups">UPS</option>
          <option value="fedex">FedEx</option>
          <option value="dpd">DPD</option>
          <option value="hermes">Hermes</option>
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
          placeholder="Enter or scan tracking number"
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

      {/* Notify Customer */}
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
            }}
          />
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#DCFCE7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <CheckCircle size={40} color="#15803D" />
      </div>
      <h2
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '8px',
        }}
      >
        Order Fulfilled!
      </h2>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          color: '#6B7280',
          marginBottom: '32px',
        }}
      >
        Order {order.orderNumber || order.orderId} has been successfully fulfilled.
      </p>

      {trackingNumber && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280' }}>
            Tracking Number
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            {trackingNumber}
          </p>
        </div>
      )}

      <button
        onClick={onComplete}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          backgroundColor: '#003450',
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Return to Dashboard
      </button>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Progress Steps */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
        }}
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = getCurrentStepIndex() > index;

            return (
              <div
                key={step.key}
                className="flex items-center"
                style={{ flex: index < steps.length - 1 ? 1 : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#15803D' : isActive ? '#003450' : '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCompleted || isActive ? '#FFFFFF' : '#6B7280',
                    }}
                  >
                    {isCompleted ? <CheckCircle size={18} /> : step.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#111827' : '#6B7280',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: isCompleted ? '#15803D' : '#E5E7EB',
                      margin: '0 16px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Info Bar */}
      <div
        style={{
          padding: '12px 24px',
          backgroundColor: '#EFF6FF',
          borderBottom: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1D4ED8' }}>
            Order {order.orderNumber || order.orderId}
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3B82F6' }}>
            {order.customerName}
          </span>
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3B82F6' }}>
          {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)} items
        </span>
      </div>

      {/* Step Content */}
      <div style={{ padding: '24px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={18} color="#B91C1C" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#B91C1C' }}>
              {error}
            </span>
          </div>
        )}

        {currentStep === 'pick' && renderPickStep()}
        {currentStep === 'pack' && renderPackStep()}
        {currentStep === 'ship' && renderShipStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>

      {/* Footer Actions */}
      {currentStep !== 'complete' && (
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#F9FAFB',
          }}
        >
          <button
            onClick={currentStep === 'pick' ? onCancel : () => setCurrentStep(steps[getCurrentStepIndex() - 1].key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft size={16} />
            {currentStep === 'pick' ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => {
              if (currentStep === 'ship') {
                handleCompleteFulfillment();
              } else {
                setCurrentStep(steps[getCurrentStepIndex() + 1].key);
              }
            }}
            disabled={
              (currentStep === 'pick' && !allItemsPicked) ||
              loading
            }
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentStep === 'ship' ? '#15803D' : '#003450',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              cursor:
                (currentStep === 'pick' && !allItemsPicked) || loading
                  ? 'not-allowed'
                  : 'pointer',
              opacity: (currentStep === 'pick' && !allItemsPicked) || loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              'Processing...'
            ) : currentStep === 'ship' ? (
              <>
                Complete Fulfillment
                <CheckCircle size={16} />
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
