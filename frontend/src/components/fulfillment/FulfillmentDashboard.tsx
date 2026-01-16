'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Clock, Pause, CheckCircle, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { FulfillmentStatsCard } from './FulfillmentStatsCard';
import { FulfillmentQueue } from './FulfillmentQueue';
import {
  fulfillmentApi,
  FulfillmentDashboardStats,
  FulfillmentOrder,
  FulfillmentOrderStatus
} from '@/lib/fulfillment-api';

type TabType = 'all' | 'pending' | 'inProgress' | 'onHold' | 'shipped';

interface FulfillmentDashboardProps {
  basePath?: string;
}

export function FulfillmentDashboard({ basePath = '/admin/fulfillment' }: FulfillmentDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [stats, setStats] = useState<FulfillmentDashboardStats | null>(null);
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Status filter mapping for backend API
  const tabToStatus: Record<TabType, string | undefined> = {
    all: undefined,
    pending: 'PENDING',
    inProgress: 'IN_PROGRESS',
    onHold: 'ON_HOLD',
    shipped: 'SHIPPED',
  };

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setStatsError(null);
      const data = await fulfillmentApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching fulfillment stats:', err);
      setStatsError('Failed to load statistics. Please check your connection and try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders based on active tab
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const status = tabToStatus[activeTab];
      const result = await fulfillmentApi.getFulfillmentOrders({
        status: status as FulfillmentOrderStatus | undefined,
        limit: 50
      });
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Error fetching fulfillment orders:', err);
      setOrdersError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchStats();
    fetchOrders();
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'all', label: 'All Orders', count: stats?.totalOrders },
    { key: 'pending', label: 'Pending', count: stats?.pendingFulfillment },
    { key: 'inProgress', label: 'In Progress', count: stats?.inProgress },
    { key: 'onHold', label: 'On Hold', count: stats?.onHold },
    { key: 'shipped', label: 'Shipped', count: stats?.shipped },
  ];

  return (
    <div className="flex flex-col" style={{ gap: 'clamp(20px, 2vw, 32px)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(20px, 1.8vw, 28px)',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '4px',
            }}
          >
            Fulfillment Center
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(13px, 1vw, 15px)',
              color: '#6B7280',
            }}
          >
            Manage and track order fulfillment across all channels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading || ordersLoading}
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #E5E7EB',
              cursor: loading || ordersLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading || ordersLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={18} className={loading || ordersLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => router.push(`${basePath}/workflow`)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#003450',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Package size={18} />
            Start Fulfillment
          </button>
        </div>
      </div>

      {/* Error Banner for Stats */}
      {statsError && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626' }}>
            {statsError}
          </span>
          <button
            onClick={fetchStats}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'clamp(12px, 1.2vw, 20px)',
        }}
      >
        <FulfillmentStatsCard
          title="Pending Fulfillment"
          value={loading ? '...' : (stats?.pendingFulfillment ?? '-')}
          icon={<Package size={24} />}
          color="blue"
          onClick={() => setActiveTab('pending')}
        />
        <FulfillmentStatsCard
          title="In Progress"
          value={loading ? '...' : (stats?.inProgress ?? '-')}
          icon={<Clock size={24} />}
          color="yellow"
          onClick={() => setActiveTab('inProgress')}
        />
        <FulfillmentStatsCard
          title="On Hold"
          value={loading ? '...' : (stats?.onHold ?? '-')}
          icon={<Pause size={24} />}
          color="red"
          onClick={() => setActiveTab('onHold')}
        />
        <FulfillmentStatsCard
          title="Shipped Today"
          value={loading ? '...' : (stats?.todayShipments ?? '-')}
          icon={<CheckCircle size={24} />}
          color="green"
          onClick={() => setActiveTab('shipped')}
        />
        <FulfillmentStatsCard
          title="Avg. Fulfillment Time"
          value={loading ? '...' : (stats?.avgFulfillmentTime ? `${stats.avgFulfillmentTime}h` : '-')}
          icon={<TrendingUp size={24} />}
          color="gray"
        />
        <FulfillmentStatsCard
          title="Delivered"
          value={loading ? '...' : (stats?.delivered ?? '-')}
          icon={<CheckCircle size={24} />}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 1.5vw, 24px)',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center"
            style={{
              gap: '8px',
              paddingBottom: '12px',
              borderBottom: activeTab === tab.key ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                color: activeTab === tab.key ? '#003450' : '#6B7280',
              }}
            >
              {tab.label}
            </span>
            {tab.count !== undefined && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === tab.key ? '#E5E7EB' : 'transparent',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: activeTab === tab.key ? '#003450' : '#6B7280',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error Banner for Orders */}
      {ordersError && (
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626' }}>
            {ordersError}
          </span>
          <button
            onClick={fetchOrders}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Fulfillment Queue */}
      <FulfillmentQueue
        orders={orders}
        loading={ordersLoading}
        basePath={basePath}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
