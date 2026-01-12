'use client';

import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface Client {
  id: string;
  clientId: number;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  totalValue: string;
  lastBillingPeriod: string;
  isActive: boolean;
  billingStatus: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
  channels: Array<{
    id: string;
    type: string;
    shopDomain: string;
    isActive: boolean;
  }>;
  _count: {
    orders: number;
    products: number;
    returns: number;
  };
}

export default function ClientDetailPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('clients');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/clients/${clientId}`);
        if (response.data.success) {
          setClient(response.data.data);
        } else {
          setError(tErrors('failedToFetchDetails'));
        }
      } catch (err: any) {
        console.error('Error fetching client:', err);
        setError(err.response?.data?.error || tErrors('failedToFetchDetails'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchClient();
    }
  }, [isAuthenticated, user, clientId]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const handleBack = () => {
    router.push('/admin/clients');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="text-gray-600">{tCommon('loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="text-red-600">{error || tErrors('clientIdNotFound')}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="w-full px-[5.2%] py-8">
          {/* Back Button */}
          <div style={{ marginBottom: 'clamp(12px, 1.18vw, 16px)' }}>
            <button
              onClick={handleBack}
              style={{
                height: 'clamp(32px, 2.8vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: '9px 15px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {tCommon('back')}
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(16px, 1.76vw, 24px)' }}>
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(24px, 2.35vw, 32px)',
                lineHeight: '38px',
                color: '#111827',
              }}
            >
              {client.name}
            </h1>
          </div>

          {/* Client Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Company</label>
                  <p className="text-gray-900">{client.companyName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-900">{client.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="text-gray-900">{client.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Address</label>
                  <p className="text-gray-900">
                    {client.address && client.city && client.zipCode
                      ? `${client.address}, ${client.zipCode} ${client.city}, ${client.country || ''}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Account Status</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        client.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Billing Status</label>
                  <p className="text-gray-900 capitalize">{client.billingStatus}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Total Value</label>
                  <p className="text-gray-900">{client.totalValue || '€0.00'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Billing Period</label>
                  <p className="text-gray-900">{client.lastBillingPeriod || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900">{client._count?.orders || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 mb-2">Total Products</h3>
              <p className="text-3xl font-bold text-gray-900">{client._count?.products || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 mb-2">Total Returns</h3>
              <p className="text-3xl font-bold text-gray-900">{client._count?.returns || 0}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            {client.orders && client.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Order Number
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="capitalize">{order.status}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {order.totalAmount}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            )}
          </div>

          {/* Connected Channels */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Connected Channels</h2>
            {client.channels && client.channels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.channels.map((channel) => (
                  <div key={channel.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{channel.type.toLowerCase()}</p>
                        <p className="text-sm text-gray-500">{channel.shopDomain}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          channel.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No channels connected</p>
            )}
          </div>

          {/* User Account Details */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">User Account</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">User Name</label>
                <p className="text-gray-900">{client.user?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">User Email</label>
                <p className="text-gray-900">{client.user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="text-gray-900">{client.user?.role || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Login</label>
                <p className="text-gray-900">
                  {client.user?.lastLoginAt
                    ? new Date(client.user.lastLoginAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
