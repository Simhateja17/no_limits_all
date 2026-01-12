'use client';

import { useState } from 'react';
import { startBackgroundSync } from '@/lib/channels-api';

interface SyncDatePickerModalProps {
  isOpen: boolean;
  channelId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export default function SyncDatePickerModal({
  isOpen,
  channelId,
  onComplete,
  onCancel,
}: SyncDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate default date (180 days ago)
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 180);
    return date.toISOString().split('T')[0];
  };

  // Calculate minimum date (1 year ago)
  const getMinDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  };

  // Get today's date
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleStartSync = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const syncFromDate = new Date(selectedDate).toISOString();
      console.log('[SyncDatePicker] Starting sync from:', syncFromDate, 'Selected date:', selectedDate);

      const response = await startBackgroundSync(channelId, syncFromDate);

      if (response.success) {
        console.log('[SyncDatePicker] Background sync started successfully:', response);
        onComplete();
      } else {
        const errorMsg = response.error || 'Failed to start sync';
        console.error('[SyncDatePicker] Error:', errorMsg);

        // If JTL OAuth not completed, show a helpful message
        if (errorMsg.includes('JTL OAuth not completed')) {
          setError('JTL authorization required. Please complete JTL OAuth setup first to enable syncing.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[SyncDatePicker] Error starting background sync:', err);
      setError(err instanceof Error ? err.message : 'Failed to start sync');
    } finally {
      setIsStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select Sync Start Date
          </h2>
          <p className="text-gray-600">
            Choose the date from which you want to sync your historical data. This will run in the background.
          </p>
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <label htmlFor="sync-date" className="block text-sm font-medium text-gray-700 mb-2">
            Sync from date
          </label>
          <input
            id="sync-date"
            type="date"
            value={selectedDate || getDefaultDate()}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Default: Last 180 days (you can select up to 1 year ago)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isStarting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleStartSync}
            disabled={isStarting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Starting...
              </span>
            ) : (
              'Start Sync & Continue'
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Background Sync
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Your data will sync in the background. You can continue using the platform immediately. Check the sync progress in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
