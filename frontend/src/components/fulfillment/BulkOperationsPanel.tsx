'use client';

import { useState } from 'react';
import {
  X,
  Package,
  Pause,
  Play,
  Truck,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
} from 'lucide-react';
import { fulfillmentApi, HoldReason, BulkOperationResult } from '@/lib/fulfillment-api';

interface BulkOperationsPanelProps {
  selectedOrderIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

type OperationType = 'fulfill' | 'hold' | 'release' | 'tracking';

const holdReasons: { value: HoldReason; label: string }[] = [
  { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'HIGH_RISK_OF_FRAUD', label: 'High Risk of Fraud' },
  { value: 'INCORRECT_ADDRESS', label: 'Incorrect Address' },
  { value: 'INVENTORY_OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'OTHER', label: 'Other' },
];

export function BulkOperationsPanel({
  selectedOrderIds,
  onClear,
  onSuccess,
}: BulkOperationsPanelProps) {
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hold operation state
  const [holdReason, setHoldReason] = useState<HoldReason>('OTHER');
  const [holdNotes, setHoldNotes] = useState('');

  // Tracking operation state
  const [trackingCsv, setTrackingCsv] = useState('');
  const [notifyCustomers, setNotifyCustomers] = useState(true);

  const handleBulkFulfill = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fulfillmentApi.bulkFulfill(selectedOrderIds, { notifyCustomer: notifyCustomers });
      setResult(result);
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk fulfill error:', err);
      setError('Failed to process bulk fulfillment');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkHold = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fulfillmentApi.bulkHold(selectedOrderIds, {
        reason: holdReason,
        notes: holdNotes || undefined,
      });
      setResult(result);
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk hold error:', err);
      setError('Failed to process bulk hold');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRelease = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fulfillmentApi.bulkRelease(selectedOrderIds);
      setResult(result);
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk release error:', err);
      setError('Failed to process bulk release');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTracking = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse CSV input (format: orderId,trackingNumber,carrier)
      const lines = trackingCsv.trim().split('\n').filter(Boolean);
      const updates = lines.map((line) => {
        const [orderId, trackingNumber, trackingCompany] = line.split(',').map((s) => s.trim());
        return { orderId, trackingNumber, trackingCompany };
      });

      const result = await fulfillmentApi.bulkUpdateTracking(updates);
      setResult(result);
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      console.error('Bulk tracking error:', err);
      setError('Failed to process bulk tracking update');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setActiveOperation(null);
    setResult(null);
    setError(null);
    setHoldReason('OTHER');
    setHoldNotes('');
    setTrackingCsv('');
  };

  if (selectedOrderIds.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        padding: '16px 20px',
        zIndex: 40,
        width: 'calc(100vw - 40px)',
        maxWidth: '600px',
      }}
    >
      {/* Main Panel */}
      {!activeOperation && !result && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1D4ED8',
              }}
            >
              {selectedOrderIds.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveOperation('fulfill')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#15803D',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Package size={16} />
              Bulk Fulfill
            </button>
            <button
              onClick={() => setActiveOperation('hold')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#B45309',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Pause size={16} />
              Bulk Hold
            </button>
            <button
              onClick={() => setActiveOperation('release')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Play size={16} />
              Bulk Release
            </button>
            <button
              onClick={() => setActiveOperation('tracking')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Truck size={16} />
              Bulk Tracking
            </button>
            <button
              onClick={onClear}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} color="#6B7280" />
            </button>
          </div>
        </div>
      )}

      {/* Hold Operation Panel */}
      {activeOperation === 'hold' && !result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Bulk Hold - {selectedOrderIds.length} orders
            </h3>
            <button onClick={resetState} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#6B7280" />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Hold Reason
              </label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value as HoldReason)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              >
                {holdReasons.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Notes (optional)
              </label>
              <input
                type="text"
                value={holdNotes}
                onChange={(e) => setHoldNotes(e.target.value)}
                placeholder="Add notes..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={resetState} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleBulkHold} disabled={loading} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#B45309', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Processing...' : 'Apply Hold'}
            </button>
          </div>
        </div>
      )}

      {/* Tracking Operation Panel */}
      {activeOperation === 'tracking' && !result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              Bulk Tracking Update
            </h3>
            <button onClick={resetState} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#6B7280" />
            </button>
          </div>

          <div className="mb-4">
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
              CSV Data (orderId, trackingNumber, carrier)
            </label>
            <textarea
              value={trackingCsv}
              onChange={(e) => setTrackingCsv(e.target.value)}
              placeholder="order-1, DHL123456, DHL&#10;order-2, UPS789012, UPS"
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Upload size={14} />
                Import CSV
              </button>
              <button
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Download size={14} />
                Download Template
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyCustomers}
                onChange={(e) => setNotifyCustomers(e.target.checked)}
              />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151' }}>
                Notify customers
              </span>
            </label>
            <div className="flex gap-2">
              <button onClick={resetState} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleBulkTracking} disabled={loading || !trackingCsv.trim()} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#003450', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer', opacity: loading || !trackingCsv.trim() ? 0.7 : 1 }}>
                {loading ? 'Processing...' : 'Update Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Fulfill/Release Panel */}
      {(activeOperation === 'fulfill' || activeOperation === 'release') && !result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
              {activeOperation === 'fulfill' ? 'Bulk Fulfill' : 'Bulk Release'} - {selectedOrderIds.length} orders
            </h3>
            <button onClick={resetState} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#6B7280" />
            </button>
          </div>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>
            {activeOperation === 'fulfill'
              ? 'This will mark all selected orders as fulfilled.'
              : 'This will release all selected orders from hold.'}
          </p>

          {activeOperation === 'fulfill' && (
            <label className="flex items-center gap-2 mb-4" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyCustomers}
                onChange={(e) => setNotifyCustomers(e.target.checked)}
              />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151' }}>
                Notify customers via email
              </span>
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={resetState} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={activeOperation === 'fulfill' ? handleBulkFulfill : handleBulkRelease}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeOperation === 'fulfill' ? '#15803D' : '#1D4ED8',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
              {result.success ? (
                <CheckCircle size={20} color="#15803D" />
              ) : (
                <AlertCircle size={20} color="#B91C1C" />
              )}
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                {result.success ? 'Operation Complete' : 'Operation Partially Failed'}
              </h3>
            </div>
            <button onClick={() => { resetState(); onClear(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#6B7280" />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#F0FDF4', flex: 1, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#15803D' }}>
                {result.processed}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#166534' }}>
                Processed
              </p>
            </div>
            {result.failed > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', flex: 1, textAlign: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#B91C1C' }}>
                  {result.failed}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#991B1B' }}>
                  Failed
                </p>
              </div>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={{ maxHeight: '100px', overflow: 'auto', marginBottom: '16px' }}>
              {result.errors.map((err, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#FEF2F2',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#B91C1C',
                  }}
                >
                  Order {err.orderId}: {err.error}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => { resetState(); onClear(); }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#003450',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} color="#B91C1C" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#B91C1C' }}>
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
