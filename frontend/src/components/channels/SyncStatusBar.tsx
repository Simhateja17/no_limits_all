'use client';

import { useEffect, useState } from 'react';
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

interface SyncStatusBarProps {
  channelId: string;
  onSyncComplete?: () => void;
}

// Icons
function SpinnerIcon() {
  return (
    <svg
      style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.4 31.4" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2"/>
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="2"/>
      <path d="M15 9L9 15M9 9L15 15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function SyncStatusBar({ channelId, onSyncComplete }: SyncStatusBarProps) {
  const t = useTranslations('channels');
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchSyncStatus = async () => {
      try {
        const response = await getSyncJobStatus(channelId);
        if (!isMounted) return;

        if (response.syncJob) {
          setSyncJob(response.syncJob);
          
          if (response.syncJob.status === 'COMPLETED') {
            if (pollInterval) clearInterval(pollInterval);
            onSyncComplete?.();
          } else if (response.syncJob.status === 'FAILED') {
            if (pollInterval) clearInterval(pollInterval);
          }
        } else {
          setSyncJob(null);
        }
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch sync status');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSyncStatus();
    pollInterval = setInterval(fetchSyncStatus, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [channelId, onSyncComplete]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
      }}>
        <SpinnerIcon />
        <span style={{ fontSize: 14, color: '#6B7280' }}>Loading sync status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
      }}>
        <ErrorIcon />
        <span style={{ fontSize: 14, color: '#EF4444' }}>{error}</span>
      </div>
    );
  }

  if (!syncJob) {
    return null;
  }

  const getPhaseLabel = (phase: string | null) => {
    switch (phase) {
      case 'initializing':
        return t('sync.phases.initializing') || 'Initializing...';
      case 'products':
        return t('sync.phases.products') || 'Syncing products...';
      case 'orders':
        return t('sync.phases.orders') || 'Syncing orders...';
      case 'returns':
        return t('sync.phases.returns') || 'Syncing returns...';
      case 'done':
        return t('sync.phases.done') || 'Completed';
      default:
        return phase || 'Processing...';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#22C55E';
      case 'FAILED': return '#EF4444';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'PENDING': return '#EAB308';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckIcon />;
      case 'FAILED': return <ErrorIcon />;
      case 'IN_PROGRESS':
      case 'PENDING': return <SpinnerIcon />;
      default: return null;
    }
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt) return '';
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div style={{
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon(syncJob.status)}
          <span style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>
            {syncJob.status === 'IN_PROGRESS' || syncJob.status === 'PENDING'
              ? (t('sync.inProgress') || 'Sync in progress')
              : syncJob.status === 'COMPLETED'
              ? (t('sync.completed') || 'Sync completed')
              : (t('sync.failed') || 'Sync failed')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: getStatusBgColor(syncJob.status),
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 500,
          }}>
            {syncJob.status}
          </span>
          {syncJob.startedAt && (
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              {formatDuration(syncJob.startedAt, syncJob.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(syncJob.status === 'IN_PROGRESS' || syncJob.status === 'PENDING') && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6B7280',
            marginBottom: 4,
          }}>
            <span>{getPhaseLabel(syncJob.currentPhase)}</span>
            <span>{Math.round(syncJob.progress || 0)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${syncJob.progress || 0}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Stats */}
      {syncJob.status !== 'PENDING' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
              {t('sync.products') || 'Products'}
            </p>
            <p style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>
              {syncJob.syncedProducts}
              {syncJob.failedProducts > 0 && (
                <span style={{ color: '#EF4444', fontSize: 12, marginLeft: 4 }}>
                  ({syncJob.failedProducts} failed)
                </span>
              )}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
              {t('sync.orders') || 'Orders'}
            </p>
            <p style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>
              {syncJob.syncedOrders}
              {syncJob.failedOrders > 0 && (
                <span style={{ color: '#EF4444', fontSize: 12, marginLeft: 4 }}>
                  ({syncJob.failedOrders} failed)
                </span>
              )}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
              {t('sync.returns') || 'Returns'}
            </p>
            <p style={{ fontWeight: 500, fontSize: 14, color: '#111827' }}>
              {syncJob.syncedReturns}
              {syncJob.failedReturns > 0 && (
                <span style={{ color: '#EF4444', fontSize: 12, marginLeft: 4 }}>
                  ({syncJob.failedReturns} failed)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {syncJob.status === 'FAILED' && syncJob.errorMessage && (
        <div style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: '#FEE2E2',
          borderRadius: 4,
          fontSize: 13,
          color: '#EF4444',
        }}>
          {syncJob.errorMessage}
        </div>
      )}
    </div>
  );
}

export default SyncStatusBar;
