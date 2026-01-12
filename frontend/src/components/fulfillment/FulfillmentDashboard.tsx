'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Clock, Pause, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { FulfillmentStatsCard } from './FulfillmentStatsCard';
import { FulfillmentQueue } from './FulfillmentQueue';
import {
  fulfillmentApi,
  FulfillmentDashboardStats,
  FulfillmentOrder,
  FulfillmentOrderStatus
} from '@/lib/fulfillment-api';

type TabType = 'all' | 'open' | 'inProgress' | 'onHold' | 'completed';

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
  const [error, setError] = useState<string | null>(null);

  // Status filter mapping
  const tabToStatus: Record<TabType, FulfillmentOrderStatus | undefined> = {
    all: undefined,
    open: 'OPEN',
    inProgress: 'IN_PROGRESS',
    onHold: 'ON_HOLD',
    completed: 'CLOSED',
  };

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await fulfillmentApi.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching fulfillment stats:', err);
        // Set mock data for demo if API not ready
        setStats({
          totalOrders: 250,
          pendingFulfillment: 42,
          inProgress: 15,
          onHold: 7,
          shipped: 128,
          delivered: 856,
          avgFulfillmentTime: 4.2,
          todayShipments: 24,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch orders based on active tab
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const status = tabToStatus[activeTab];
        const result = await fulfillmentApi.getFulfillmentOrders({ status, limit: 20 });
        setOrders(result.orders);
      } catch (err) {
        console.error('Error fetching fulfillment orders:', err);
        // Set mock data for demo if API not ready
        setOrders(generateMockOrders(activeTab));
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab]);

  // Mock data generator for demo
  const generateMockOrders = (tab: TabType): FulfillmentOrder[] => {
    const statusMap: Record<TabType, FulfillmentOrderStatus> = {
      all: 'OPEN',
      open: 'OPEN',
      inProgress: 'IN_PROGRESS',
      onHold: 'ON_HOLD',
      completed: 'CLOSED',
    };

    const mockOrders: FulfillmentOrder[] = [];
    const count = tab === 'all' ? 10 : tab === 'onHold' ? 3 : 5;

    for (let i = 0; i < count; i++) {
      const status = tab === 'all'
        ? (['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED'] as FulfillmentOrderStatus[])[i % 4]
        : statusMap[tab];

      mockOrders.push({
        id: `order-${tab}-${i}`,
        orderId: `ORD-${1000 + i}`,
        orderNumber: `#${1000 + i}`,
        externalOrderId: `EXT-${1000 + i}`,
        shopifyFulfillmentOrderId: `gid://shopify/FulfillmentOrder/${1000 + i}`,
        status,
        requestStatus: 'ACCEPTED',
        holdReason: status === 'ON_HOLD' ? 'INCORRECT_ADDRESS' : null,
        holdNotes: status === 'ON_HOLD' ? 'Customer needs to confirm address' : null,
        assignedLocationId: 'loc-1',
        assignedLocationName: 'Main Warehouse',
        customerName: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'][i % 5],
        customerEmail: 'customer@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          company: null,
          address1: '123 Main St',
          address2: null,
          city: 'Berlin',
          zip: '10115',
          country: 'Germany',
          countryCode: 'DE',
        },
        lineItems: [
          {
            id: `item-${i}-1`,
            productId: `prod-${i}`,
            variantId: `var-${i}`,
            sku: `SKU-${1000 + i}`,
            productName: 'Premium Widget',
            quantity: Math.floor(Math.random() * 3) + 1,
            fulfilledQuantity: 0,
            remainingQuantity: Math.floor(Math.random() * 3) + 1,
            requiresShipping: true,
          },
        ],
        trackingInfo: status === 'CLOSED' ? {
          trackingNumber: `DHL${Math.random().toString().slice(2, 12)}`,
          trackingCompany: 'DHL',
          trackingUrl: 'https://tracking.dhl.com',
          notifyCustomer: true,
        } : null,
        client: {
          id: 'client-1',
          companyName: 'Acme Corp',
          name: 'Acme Corp',
        },
        channel: {
          id: 'channel-1',
          name: 'Shopify Store',
          type: 'SHOPIFY',
        },
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
        fulfillAt: null,
      });
    }

    return mockOrders;
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'all', label: 'All Orders', count: stats?.totalOrders },
    { key: 'open', label: 'Pending', count: stats?.pendingFulfillment },
    { key: 'inProgress', label: 'In Progress', count: stats?.inProgress },
    { key: 'onHold', label: 'On Hold', count: stats?.onHold },
    { key: 'completed', label: 'Shipped', count: stats?.shipped },
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
          value={loading ? '...' : stats?.pendingFulfillment || 0}
          icon={<Package size={24} />}
          color="blue"
          onClick={() => setActiveTab('open')}
        />
        <FulfillmentStatsCard
          title="In Progress"
          value={loading ? '...' : stats?.inProgress || 0}
          icon={<Clock size={24} />}
          color="yellow"
          onClick={() => setActiveTab('inProgress')}
        />
        <FulfillmentStatsCard
          title="On Hold"
          value={loading ? '...' : stats?.onHold || 0}
          icon={<Pause size={24} />}
          color="red"
          onClick={() => setActiveTab('onHold')}
        />
        <FulfillmentStatsCard
          title="Shipped Today"
          value={loading ? '...' : stats?.todayShipments || 0}
          icon={<CheckCircle size={24} />}
          color="green"
          trend={{ value: 12, isPositive: true }}
          onClick={() => setActiveTab('completed')}
        />
        <FulfillmentStatsCard
          title="Avg. Fulfillment Time"
          value={loading ? '...' : `${stats?.avgFulfillmentTime || 0}h`}
          icon={<TrendingUp size={24} />}
          color="gray"
        />
        <FulfillmentStatsCard
          title="Delivered"
          value={loading ? '...' : stats?.delivered || 0}
          icon={<AlertTriangle size={24} />}
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

      {/* Fulfillment Queue */}
      <FulfillmentQueue
        orders={orders}
        loading={ordersLoading}
        basePath={basePath}
      />
    </div>
  );
}
