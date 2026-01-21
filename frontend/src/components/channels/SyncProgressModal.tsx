'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getSyncJobStatus } from '@/lib/channels-api';

interface SyncJob {
  id: string;
  channelId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  type: string;
  currentPhase: string | null;
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  totalOrders: number;
  syncedOrders: number;
  failedOrders: number;
  totalReturns: number;
  syncedReturns: number;
  failedReturns: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  progress: number;
}

interface SyncProgressModalProps {
  channelId: string;
  isOpen: boolean;
  onComplete: () => void;
}

export function SyncProgressModal({ channelId, isOpen, onComplete }: SyncProgressModalProps) {
  const t = useTranslations('channels');
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<string>('initializing');
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      console.log('[SyncProgressModal] 📡 Fetching sync status for channel:', channelId);
      const response = await getSyncJobStatus(channelId);
      
      console.log('[SyncProgressModal] 📦 Received sync status:', {
        hasJob: !!response.syncJob,
        status: response.syncJob?.status,
        progress: response.syncJob?.progress,
        phase: response.syncJob?.currentPhase,
        syncedProducts: response.syncJob?.syncedProducts,
        totalProducts: response.syncJob?.totalProducts,
        syncedOrders: response.syncJob?.syncedOrders,
        totalOrders: response.syncJob?.totalOrders,
      });
      
      if (response.syncJob) {
        setSyncJob(response.syncJob);
        setProgress(response.syncJob.progress || 0);
        setPhase(response.syncJob.currentPhase || 'initializing');
        
        console.log('[SyncProgressModal] 📊 Updated state:', {
          progress: response.syncJob.progress || 0,
          phase: response.syncJob.currentPhase || 'initializing',
        });
        
        if (response.syncJob.status === 'COMPLETED') {
          console.log('[SyncProgressModal] ✅ Sync completed successfully!');
          setIsComplete(true);
          setProgress(100);
        } else if (response.syncJob.status === 'FAILED') {
          console.log('[SyncProgressModal] ❌ Sync failed:', response.syncJob.errorMessage);
          setIsFailed(true);
          setErrorMessage(response.syncJob.errorMessage);
        }
      } else {
        console.log('[SyncProgressModal] ⚠️ No sync job found');
      }
    } catch (err) {
      console.error('[SyncProgressModal] ❌ Error fetching sync status:', err);
    }
  }, [channelId]);

  useEffect(() => {
    if (!isOpen || !channelId) return;

    console.log('[SyncProgressModal] 🚀 Modal opened, starting sync polling for channel:', channelId);

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!isMounted) return;
      await fetchSyncStatus();
    };

    // Start polling
    poll();
    pollInterval = setInterval(() => {
      console.log('[SyncProgressModal] 🔄 Polling sync status...');
      poll();
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log('[SyncProgressModal] 🛑 Stopping sync polling');
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, channelId, fetchSyncStatus]);

  // Auto-close after completion (with delay for user to see completion)
  useEffect(() => {
    if (isComplete) {
      console.log('[SyncProgressModal] ⏱️ Sync complete, closing modal in 2 seconds...');
      const timer = setTimeout(() => {
        console.log('[SyncProgressModal] 🔚 Closing modal and calling onComplete');
        onComplete();
      }, 2000); // 2 second delay to show completion
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  if (!isOpen) return null;

  const getPhaseLabel = (currentPhase: string) => {
    switch (currentPhase) {
      case 'initializing':
        return 'Initializing sync...';
      case 'products':
        return 'Syncing products...';
      case 'orders':
        return 'Syncing orders...';
      case 'returns':
        return 'Syncing returns...';
      case 'done':
        return 'Sync completed!';
      default:
        return 'Processing...';
    }
  };

  const getPhaseDetails = () => {
    if (!syncJob) return null;

    if (phase === 'products' && syncJob.totalProducts > 0) {
      return `${syncJob.syncedProducts} of ${syncJob.totalProducts} products`;
    }
    if (phase === 'orders' && syncJob.totalOrders > 0) {
      return `${syncJob.syncedOrders} of ${syncJob.totalOrders} orders`;
    }
    if (phase === 'returns' && syncJob.totalReturns > 0) {
      return `${syncJob.syncedReturns} of ${syncJob.totalReturns} returns`;
    }
    return null;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            padding: '40px 60px',
            width: '100%',
            maxWidth: 500,
            margin: '0 16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #E5E7EB',
          }}
        >
          {/* Title */}
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 20,
              color: '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {isComplete ? 'Sync Complete!' : isFailed ? 'Sync Failed' : 'Sync in progress'}
          </h2>

          {/* Phase Label */}
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {isFailed ? errorMessage : getPhaseLabel(phase)}
          </p>

          {/* Progress Bar Container */}
          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            {/* Progress Fill */}
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: isComplete ? '#22C55E' : isFailed ? '#EF4444' : '#2563EB', // Royal Blue
                borderRadius: 4,
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>

          {/* Progress Percentage */}
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 14,
              color: isComplete ? '#22C55E' : isFailed ? '#EF4444' : '#2563EB',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {Math.round(progress)}%
          </p>

          {/* Phase Details */}
          {getPhaseDetails() && (
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: 13,
                color: '#9CA3AF',
                textAlign: 'center',
              }}
            >
              {getPhaseDetails()}
            </p>
          )}

          {/* Completion Summary */}
          {isComplete && syncJob && (
            <div
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: '#ECFDF5',
                borderRadius: 8,
                border: '1px solid #A7F3D0',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 13,
                  color: '#059669',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Successfully synced:
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 24,
                }}
              >
                <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#047857' }}>
                  📦 {syncJob.syncedProducts} products
                </span>
                <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#047857' }}>
                  📋 {syncJob.syncedOrders} orders
                </span>
                <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#047857' }}>
                  🔄 {syncJob.syncedReturns} returns
                </span>
              </div>
            </div>
          )}

          {/* Failed - Retry Button */}
          {isFailed && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={onComplete}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
