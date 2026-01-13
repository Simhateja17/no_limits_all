'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import {
  ClientFulfillmentStats,
  ShipmentTrackingHub,
  OrdersOnHold,
  SLAMonitor,
  CarrierPerformanceCard,
  InventoryAlertsCard,
  OrderPipelineChart,
} from '@/components/client-fulfillment';
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
import { useAuthStore } from '@/lib/store';
import { RefreshCw, Package, AlertTriangle } from 'lucide-react';

type TabType = 'overview' | 'shipments' | 'analytics' | 'inventory';

export default function ClientFulfillmentPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [shipments, setShipments] = useState<ShipmentSummary[]>([]);
  const [shipmentsTotal, setShipmentsTotal] = useState(0);
  const [ordersOnHold, setOrdersOnHold] = useState<OrderOnHold[]>([]);
  const [slaStatus, setSlaStatus] = useState<SLAStatus[]>([]);
  const [carrierPerformance, setCarrierPerformance] = useState<CarrierPerformance[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [holdLoading, setHoldLoading] = useState(true);
  const [slaLoading, setSlaLoading] = useState(true);
  const [carrierLoading, setCarrierLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await clientFulfillmentApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load fulfillment statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch pipeline
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

  // Fetch shipments
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

  // Fetch orders on hold
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

  // Fetch SLA status
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

  // Fetch carrier performance
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

  // Fetch inventory alerts
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

  // Initial load
  useEffect(() => {
    if (isAuthenticated && user?.role === 'CLIENT') {
      fetchStats();
      fetchPipeline();
      fetchShipments();
      fetchOrdersOnHold();
    }
  }, [isAuthenticated, user, fetchStats, fetchPipeline, fetchShipments, fetchOrdersOnHold]);

  // Load tab-specific data
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') return;

    if (activeTab === 'analytics') {
      fetchSLAStatus();
      fetchCarrierPerformance();
    } else if (activeTab === 'inventory') {
      fetchInventoryAlerts();
    }
  }, [activeTab, isAuthenticated, user, fetchSLAStatus, fetchCarrierPerformance, fetchInventoryAlerts]);

  const handleRefresh = () => {
    setError(null);
    fetchStats();
    fetchPipeline();
    if (activeTab === 'overview' || activeTab === 'shipments') {
      fetchShipments(currentPage);
      fetchOrdersOnHold();
    }
    if (activeTab === 'analytics') {
      fetchSLAStatus();
      fetchCarrierPerformance();
    }
    if (activeTab === 'inventory') {
      fetchInventoryAlerts();
    }
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/client/orders/${orderId}`);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/client/products/${productId}`);
  };

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'shipments', label: 'Shipments' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'inventory', label: 'Inventory' },
  ];

  return (
    <DashboardLayout>
      <div
        className="w-full px-[5.2%] py-8"
        style={{ maxWidth: '100%' }}
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
              Fulfillment Status
            </h1>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(13px, 1vw, 15px)',
                color: '#6B7280',
              }}
            >
              Track your orders through fulfillment and delivery
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={statsLoading}
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #E5E7EB',
              cursor: statsLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: statsLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={18} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <AlertTriangle size={20} color="#DC2626" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#DC2626' }}>
              {error}
            </span>
            <button
              onClick={handleRefresh}
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
        <div style={{ marginBottom: '24px' }}>
          <ClientFulfillmentStats stats={stats} loading={statsLoading} />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 1.5vw, 24px)',
            borderBottom: '1px solid #E5E7EB',
            marginBottom: '24px',
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
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <OrderPipelineChart pipeline={pipeline} loading={pipelineLoading} />
            <OrdersOnHold orders={ordersOnHold} loading={holdLoading} onOrderClick={handleOrderClick} />
            <div style={{ gridColumn: '1 / -1' }}>
              <ShipmentTrackingHub
                shipments={shipments.slice(0, 5)}
                total={shipmentsTotal}
                loading={shipmentsLoading}
              />
            </div>
          </div>
        )}

        {activeTab === 'shipments' && (
          <ShipmentTrackingHub
            shipments={shipments}
            total={shipmentsTotal}
            loading={shipmentsLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => fetchShipments(page)}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <SLAMonitor slaStatus={slaStatus} loading={slaLoading} />
            <CarrierPerformanceCard carriers={carrierPerformance} loading={carrierLoading} />
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryAlertsCard
            alerts={inventoryAlerts}
            loading={inventoryLoading}
            onProductClick={handleProductClick}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
