'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import {
  Package,
  Clock,
  Pause,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { FulfillmentStatsCard, FulfillmentQueue } from '@/components/fulfillment';
import {
  ClientFulfillmentStats,
  ShipmentTrackingHub,
  OrdersOnHold,
  SLAMonitor,
  CarrierPerformanceCard,
  InventoryAlertsCard,
  OrderPipelineChart,
} from '@/components/client-fulfillment';
import {
  fulfillmentApi,
  FulfillmentDashboardStats,
  FulfillmentOrder,
  FulfillmentOrderStatus,
} from '@/lib/fulfillment-api';
import { clientFulfillmentApi } from '@/lib/client-fulfillment-api';
import type {
  ClientFulfillmentStats as Stats,
  ShipmentSummary,
  OrderOnHold,
  SLAStatus,
  CarrierPerformance,
  InventoryAlert,
  PipelineStage,
} from '@/lib/client-fulfillment-api';

type MainTabType = 'operations' | 'analytics';
type OperationsTabType = 'all' | 'pending' | 'inProgress' | 'onHold' | 'shipped';
type AnalyticsTabType = 'overview' | 'shipments' | 'performance' | 'inventory';

export default function EmployeeFulfillmentPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTabType>('operations');

  // Operations state
  const [operationsTab, setOperationsTab] = useState<OperationsTabType>('all');
  const [stats, setStats] = useState<FulfillmentDashboardStats | null>(null);
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Analytics state
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTabType>('overview');
  const [analyticsStats, setAnalyticsStats] = useState<Stats | null>(null);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [shipmentsTotal, setShipmentsTotal] = useState(0);
  const [ordersOnHold, setOrdersOnHold] = useState<OrderOnHold[]>([]);
  const [slaStatus, setSlaStatus] = useState<SLAStatus[]>([]);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformance[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);

  // Analytics loading states
  const [analyticsStatsLoading, setAnalyticsStatsLoading] = useState(true);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [holdLoading, setHoldLoading] = useState(true);
  const [slaLoading, setSlaLoading] = useState(true);
  const [carrierLoading, setCarrierLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status filter mapping for backend API
  const tabToStatus: Record<OperationsTabType, string | undefined> = {
    all: undefined,
    pending: 'OPEN',
    inProgress: 'IN_PROGRESS',
    onHold: 'ON_HOLD',
    shipped: 'CLOSED',
  };

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

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
      const status = tabToStatus[operationsTab];
      const result = await fulfillmentApi.getFulfillmentOrders({
        status: status as FulfillmentOrderStatus | undefined,
        limit: 50,
      });
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Error fetching fulfillment orders:', err);
      setOrdersError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [operationsTab]);

  // Analytics data fetchers
  const fetchAnalyticsStats = useCallback(async () => {
    try {
      setAnalyticsStatsLoading(true);
      const data = await clientFulfillmentApi.getStats();
      setAnalyticsStats(data);
    } catch (err) {
      console.error('Error fetching analytics stats:', err);
    } finally {
      setAnalyticsStatsLoading(false);
    }
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      setPipelineLoading(true);
      const data = await clientFulfillmentApi.getPipeline();
      setPipeline(data);
    } catch (err) {
      console.error('Error fetching pipeline:', err);
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const fetchShipments = useCallback(async (page: number = 1) => {
    try {
      setShipmentsLoading(true);
      const data = await clientFulfillmentApi.getShipments({ page, limit: 20 });
      setShipments(data.shipments);
      setShipmentsTotal(data.total);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching shipments:', err);
    } finally {
      setShipmentsLoading(false);
    }
  }, []);

  const fetchOrdersOnHold = useCallback(async () => {
    try {
      setHoldLoading(true);
      const data = await clientFulfillmentApi.getOrdersOnHold();
      setOrdersOnHold(data);
    } catch (err) {
      console.error('Error fetching orders on hold:', err);
    } finally {
      setHoldLoading(false);
    }
  }, []);

  const fetchSLAStatus = useCallback(async () => {
    try {
      setSlaLoading(true);
      const data = await clientFulfillmentApi.getSLAStatus();
      setSlaStatus(data);
    } catch (err) {
      console.error('Error fetching SLA status:', err);
    } finally {
      setSlaLoading(false);
    }
  }, []);

  const fetchCarrierPerformance = useCallback(async () => {
    try {
      setCarrierLoading(true);
      const data = await clientFulfillmentApi.getCarrierPerformance();
      setCarrierPerformance(data);
    } catch (err) {
      console.error('Error fetching carrier performance:', err);
    } finally {
      setCarrierLoading(false);
    }
  }, []);

  const fetchInventoryAlerts = useCallback(async () => {
    try {
      setInventoryLoading(true);
      const data = await clientFulfillmentApi.getInventoryAlerts();
      setInventoryAlerts(data);
    } catch (err) {
      console.error('Error fetching inventory alerts:', err);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  // Load operations data
  useEffect(() => {
    if (isAuthenticated && user?.role === 'EMPLOYEE' && mainTab === 'operations') {
      fetchStats();
    }
  }, [isAuthenticated, user, mainTab, fetchStats]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'EMPLOYEE' && mainTab === 'operations') {
      fetchOrders();
    }
  }, [isAuthenticated, user, mainTab, fetchOrders]);

  // Load analytics data
  useEffect(() => {
    if (isAuthenticated && user?.role === 'EMPLOYEE' && mainTab === 'analytics') {
      fetchAnalyticsStats();
      fetchPipeline();
      fetchShipments();
      fetchOrdersOnHold();
    }
  }, [
    isAuthenticated,
    user,
    mainTab,
    fetchAnalyticsStats,
    fetchPipeline,
    fetchShipments,
    fetchOrdersOnHold,
  ]);

  // Load tab-specific analytics data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'EMPLOYEE' || mainTab !== 'analytics') return;

    if (analyticsTab === 'performance') {
      fetchSLAStatus();
      fetchCarrierPerformance();
    } else if (analyticsTab === 'inventory') {
      fetchInventoryAlerts();
    }
  }, [
    analyticsTab,
    mainTab,
    isAuthenticated,
    user,
    fetchSLAStatus,
    fetchCarrierPerformance,
    fetchInventoryAlerts,
  ]);

  const handleRefresh = () => {
    if (mainTab === 'operations') {
      fetchStats();
      fetchOrders();
    } else {
      fetchAnalyticsStats();
      fetchPipeline();
      if (analyticsTab === 'overview' || analyticsTab === 'shipments') {
        fetchShipments(currentPage);
        fetchOrdersOnHold();
      }
      if (analyticsTab === 'performance') {
        fetchSLAStatus();
        fetchCarrierPerformance();
      }
      if (analyticsTab === 'inventory') {
        fetchInventoryAlerts();
      }
    }
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/employee/orders/${orderId}`);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/employee/products/${productId}`);
  };

  if (!isAuthenticated || user?.role !== 'EMPLOYEE') {
    return null;
  }

  const operationsTabs: { key: OperationsTabType; label: string; count?: number }[] = [
    { key: 'all', label: 'All Orders', count: stats?.totalOrders },
    { key: 'pending', label: 'Pending', count: stats?.pendingFulfillment },
    { key: 'inProgress', label: 'In Progress', count: stats?.inProgress },
    { key: 'onHold', label: 'On Hold', count: stats?.onHold },
    { key: 'shipped', label: 'Shipped', count: stats?.shipped },
  ];

  const analyticsTabs: { key: AnalyticsTabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'shipments', label: 'Shipments' },
    { key: 'performance', label: 'Performance' },
    { key: 'inventory', label: 'Inventory' },
  ];

  return (
    <DashboardLayout>
      <div
        style={{
          padding: 'clamp(20px, 2.5vw, 40px)',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
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
              Manage orders, track fulfillment, and monitor performance
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
            {mainTab === 'operations' && (
              <button
                onClick={() => router.push('/employee/fulfillment/workflow')}
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
            )}
          </div>
        </div>

        {/* Main Tabs - Operations vs Analytics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => setMainTab('operations')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: mainTab === 'operations' ? '#003450' : '#F3F4F6',
              color: mainTab === 'operations' ? '#FFFFFF' : '#374151',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: mainTab === 'operations' ? 'none' : '1px solid #E5E7EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Package size={18} />
            Operations
          </button>
          <button
            onClick={() => setMainTab('analytics')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: mainTab === 'analytics' ? '#003450' : '#F3F4F6',
              color: mainTab === 'analytics' ? '#FFFFFF' : '#374151',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: mainTab === 'analytics' ? 'none' : '1px solid #E5E7EB',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>

        {/* Operations View */}
        {mainTab === 'operations' && (
          <div className="flex flex-col" style={{ gap: 'clamp(20px, 2vw, 32px)' }}>
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
                <span
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626' }}
                >
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
                value={loading ? '...' : stats?.pendingFulfillment ?? '-'}
                icon={<Package size={24} />}
                color="blue"
                onClick={() => setOperationsTab('pending')}
              />
              <FulfillmentStatsCard
                title="In Progress"
                value={loading ? '...' : stats?.inProgress ?? '-'}
                icon={<Clock size={24} />}
                color="yellow"
                onClick={() => setOperationsTab('inProgress')}
              />
              <FulfillmentStatsCard
                title="On Hold"
                value={loading ? '...' : stats?.onHold ?? '-'}
                icon={<Pause size={24} />}
                color="red"
                onClick={() => setOperationsTab('onHold')}
              />
              <FulfillmentStatsCard
                title="Shipped Today"
                value={loading ? '...' : stats?.todayShipments ?? '-'}
                icon={<CheckCircle size={24} />}
                color="green"
                onClick={() => setOperationsTab('shipped')}
              />
              <FulfillmentStatsCard
                title="Avg. Fulfillment Time"
                value={
                  loading ? '...' : stats?.avgFulfillmentTime ? `${stats.avgFulfillmentTime}h` : '-'
                }
                icon={<TrendingUp size={24} />}
                color="gray"
              />
              <FulfillmentStatsCard
                title="Delivered"
                value={loading ? '...' : stats?.delivered ?? '-'}
                icon={<CheckCircle size={24} />}
                color="green"
              />
            </div>

            {/* Operations Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(16px, 1.5vw, 24px)',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              {operationsTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setOperationsTab(tab.key)}
                  className="flex items-center"
                  style={{
                    gap: '8px',
                    paddingBottom: '12px',
                    borderBottom:
                      operationsTab === tab.key ? '2px solid #003450' : '2px solid transparent',
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
                      color: operationsTab === tab.key ? '#003450' : '#6B7280',
                    }}
                  >
                    {tab.label}
                  </span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: operationsTab === tab.key ? '#E5E7EB' : 'transparent',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: operationsTab === tab.key ? '#003450' : '#6B7280',
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
                <span
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626' }}
                >
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
              basePath="/employee/fulfillment"
              onRefresh={fetchOrders}
            />
          </div>
        )}

        {/* Analytics View */}
        {mainTab === 'analytics' && (
          <div className="flex flex-col" style={{ gap: 'clamp(20px, 2vw, 32px)' }}>
            {/* Stats Cards */}
            <div style={{ marginBottom: '0' }}>
              <ClientFulfillmentStats stats={analyticsStats} loading={analyticsStatsLoading} />
            </div>

            {/* Analytics Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(16px, 1.5vw, 24px)',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              {analyticsTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAnalyticsTab(tab.key)}
                  className="flex items-center"
                  style={{
                    gap: '8px',
                    paddingBottom: '12px',
                    borderBottom:
                      analyticsTab === tab.key ? '2px solid #003450' : '2px solid transparent',
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
                      color: analyticsTab === tab.key ? '#003450' : '#6B7280',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {analyticsTab === 'overview' && (
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}
              >
                <OrderPipelineChart pipeline={pipeline} loading={pipelineLoading} />
                <OrdersOnHold
                  orders={ordersOnHold}
                  loading={holdLoading}
                  onOrderClick={handleOrderClick}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                  <ShipmentTrackingHub
                    shipments={shipments.slice(0, 5)}
                    total={shipmentsTotal}
                    loading={shipmentsLoading}
                  />
                </div>
              </div>
            )}

            {analyticsTab === 'shipments' && (
              <ShipmentTrackingHub
                shipments={shipments}
                total={shipmentsTotal}
                loading={shipmentsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchShipments(page)}
              />
            )}

            {analyticsTab === 'performance' && (
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}
              >
                <SLAMonitor slaStatus={slaStatus} loading={slaLoading} />
                <CarrierPerformanceCard carriers={carrierPerformance} loading={carrierLoading} />
              </div>
            )}

            {analyticsTab === 'inventory' && (
              <InventoryAlertsCard
                alerts={inventoryAlerts}
                loading={inventoryLoading}
                onProductClick={handleProductClick}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
