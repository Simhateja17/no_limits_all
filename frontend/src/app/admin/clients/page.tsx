'use client';

import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

// Client interface matching API response
interface Client {
  id: string;
  clientId: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalValue: string;
  lastOrder: Date | null;
  lastBillingPeriod: string;
  status: 'active' | 'inactive';
  billingStatus: string;
  systemLogin: string;
  emailAction: string;
}

// Empty state component
const EmptyState = ({ onCreateClient, onCreateQuotation, t }: { onCreateClient: () => void, onCreateQuotation: () => void, t: any }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center w-full"
      style={{
        minHeight: 'clamp(300px, 29.4vw, 400px)',
        padding: 'clamp(32px, 3.53vw, 48px) clamp(16px, 1.76vw, 24px)',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
      }}
    >
      <div 
        style={{
          width: 'clamp(48px, 4.12vw, 56px)',
          height: 'clamp(48px, 4.12vw, 56px)',
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'clamp(12px, 1.18vw, 16px)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#111827',
          textAlign: 'center',
          marginBottom: 'clamp(6px, 0.59vw, 8px)',
        }}
      >
        {t('noClients')}
      </h3>
      <p 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(12px, 1.03vw, 14px)',
          lineHeight: '20px',
          color: '#6B7280',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        {t('noClientsDescription')}
      </p>
    </div>
  );
};

export default function AdminClientsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('clients');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'quotations'>('all');
  
  // State for clients data
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number; quotations: number; totalOrders: number } | null>(null);

  // Fetch clients and stats from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch clients and stats in parallel
        const [clientsResponse, statsResponse] = await Promise.all([
          api.get('/clients'),
          api.get('/clients/stats'),
        ]);
        
        if (clientsResponse.data.success) {
          setClients(clientsResponse.data.data);
        } else {
          setError('Failed to fetch clients');
        }
        
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError(err.response?.data?.error || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const handleBack = () => {
    router.push('/admin/dashboard');
  };

  const handleCreateQuotation = () => {
    router.push('/admin/clients/create-quotation');
  };

  const handleCreateClient = () => {
    router.push('/admin/clients/create');
  };

  const handleClientClick = (clientId: string) => {
    router.push(`/admin/clients/${clientId}`);
  };

  // Filter clients based on active tab
  const filteredClients = clients.filter(client => {
    if (activeTab === 'active') return client.status === 'active';
    if (activeTab === 'inactive') return client.status === 'inactive';
    if (activeTab === 'quotations') return false; // No quotations yet
    return true; // 'all' tab
  });

  // Count clients by status (use stats from API if available, otherwise calculate)
  const allClientsCount = stats?.total ?? clients.length;
  const activeClientsCount = stats?.active ?? clients.filter(c => c.status === 'active').length;
  const inactiveClientsCount = stats?.inactive ?? clients.filter(c => c.status === 'inactive').length;
  const quotationsCount = stats?.quotations ?? 0;

  // Display clients
  const displayClients = filteredClients;

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

          {/* Header and Actions */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'clamp(16px, 1.76vw, 24px)' }}>
            <h1
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(20px, 2.35vw, 32px)',
                lineHeight: 'clamp(28px, 3.52vw, 48px)',
                color: '#111827',
              }}
            >
              {t('title')}
            </h1>
            <div className="flex items-center" style={{ gap: 'clamp(8px, 0.88vw, 12px)' }}>
              <button
                onClick={handleCreateQuotation}
                style={{
                  height: 'clamp(32px, 2.8vw, 38px)',
                  borderRadius: '6px',
                  padding: '9px 17px',
                  backgroundColor: '#003450',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: '20px',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('createQuotation')}
              </button>
              <button
                onClick={handleCreateClient}
                style={{
                  height: 'clamp(32px, 2.8vw, 38px)',
                  borderRadius: '6px',
                  padding: '9px 17px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: '20px',
                  color: '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('createClient')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-col w-full" style={{ marginBottom: 'clamp(16px, 1.76vw, 24px)' }}>
            <div className="flex items-end justify-between w-full">
              <div className="flex items-end" style={{ gap: 'clamp(16px, 1.76vw, 24px)' }}>
                {[
                  { key: 'all', label: t('allClients'), count: allClientsCount },
                  { key: 'active', label: t('activeClients'), count: activeClientsCount },
                  { key: 'inactive', label: t('inactiveClients'), count: inactiveClientsCount },
                  { key: 'quotations', label: t('quotations'), count: quotationsCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className="flex items-center"
                    style={{
                      gap: 'clamp(4px, 0.59vw, 8px)',
                      paddingBottom: 'clamp(8px, 0.88vw, 12px)',
                      borderBottom: activeTab === tab.key ? '2px solid #003450' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(12px, 1.03vw, 14px)',
                        lineHeight: '20px',
                        color: activeTab === tab.key ? '#003450' : '#6B7280',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(10px, 0.88vw, 12px)',
                        lineHeight: '16px',
                        color: activeTab === tab.key ? '#003450' : '#6B7280',
                        backgroundColor: activeTab === tab.key ? '#E5E7EB' : 'transparent',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#E5E7EB', marginTop: '-1px' }} />
          </div>

          {/* Content */}
          {loading ? (
            <div 
              className="flex items-center justify-center w-full"
              style={{
                minHeight: 'clamp(300px, 29.4vw, 400px)',
                padding: 'clamp(32px, 3.53vw, 48px) clamp(16px, 1.76vw, 24px)',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading clients...</p>
              </div>
            </div>
          ) : error ? (
            <div 
              className="flex items-center justify-center w-full"
              style={{
                minHeight: 'clamp(300px, 29.4vw, 400px)',
                padding: 'clamp(32px, 3.53vw, 48px) clamp(16px, 1.76vw, 24px)',
                backgroundColor: '#FEF2F2',
                borderRadius: '8px',
                border: '1px solid #FECACA',
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <p style={{ color: '#DC2626', fontSize: '14px' }}>{error}</p>
              </div>
            </div>
          ) : displayClients.length === 0 ? (
            <EmptyState onCreateClient={handleCreateClient} onCreateQuotation={handleCreateQuotation} t={t} />
          ) : (
            <div 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Table Header */}
              <div 
                className="grid grid-cols-7 gap-4" 
                style={{
                  padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.76vw, 24px)',
                  backgroundColor: '#F9FAFB',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                {[t('clientId'), t('client'), t('lastBillingPeriod'), t('billingStatus'), t('systemLogin'), t('emailAction'), t('clientStatus')].map((header) => (
                  <div
                    key={header}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(11px, 0.95vw, 13px)',
                      lineHeight: '16px',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {header}
                  </div>
                ))}
              </div>

              {/* Table Body */}
              {displayClients.map((client, index) => (
                <div
                  key={client.id}
                  className="grid grid-cols-7 gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  style={{
                    padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.76vw, 24px)',
                    borderBottom: index === displayClients.length - 1 ? 'none' : '1px solid #E5E7EB',
                  }}
                  onClick={() => handleClientClick(client.id)}
                >
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#111827',
                    }}
                  >
                    {client.clientId}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#111827',
                    }}
                  >
                    {client.company}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#6B7280',
                    }}
                  >
                    {client.lastBillingPeriod}
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 'clamp(11px, 0.95vw, 13px)',
                        fontWeight: 400,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: client.billingStatus === 'paid' ? '#22C55E' : '#EF4444',
                        }}
                      />
                      {client.billingStatus === 'paid' ? t('paid') : t('unpaid')}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#6B7280',
                    }}
                  >
                    {client.systemLogin}
                  </div>
                  <div>
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        minWidth: 'clamp(70px, 6.33vw, 86px)',
                        height: 'clamp(18px, 1.47vw, 20px)',
                        borderRadius: 'clamp(8px, 0.74vw, 10px)',
                        padding: '2px 10px',
                        backgroundColor: '#F3F4F6',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 0.88vw, 12px)',
                        lineHeight: 'clamp(14px, 1.18vw, 16px)',
                        textAlign: 'center',
                        color: '#003450',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {client.emailAction}
                    </span>
                  </div>
                  <div>
                    <span
                      className="inline-flex items-center justify-center"
                      style={{
                        minWidth: 'clamp(50px, 4.2vw, 57px)',
                        height: 'clamp(18px, 1.47vw, 20px)',
                        borderRadius: 'clamp(8px, 0.74vw, 10px)',
                        padding: '2px 10px',
                        backgroundColor: '#F3F4F6',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 0.88vw, 12px)',
                        lineHeight: 'clamp(14px, 1.18vw, 16px)',
                        textAlign: 'center',
                        color: '#003450',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {client.status === 'active' ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}