'use client';

import { DashboardLayout } from '@/components/layout';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mock client data - for demonstration
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
  lastOrder: Date;
  lastBillingPeriod: string;
  status: 'active' | 'inactive';
  billingStatus: 'paid' | 'unpaid';
  systemLogin: string;
  emailAction: string;
}

const mockClients: Client[] = [
  {
    id: '1',
    clientId: 1,
    name: 'Max Schmidt',
    email: 'max.schmidt@papercrush.de',
    company: 'Hatstore24',
    phone: '+49 30 12345678',
    address: 'Berliner Str. 123, 10115 Berlin',
    totalOrders: 24,
    totalValue: '€12,450.00',
    lastOrder: new Date('2024-12-10'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'unpaid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  },
  {
    id: '2',
    clientId: 2,
    name: 'Sarah Mueller',
    email: 'sarah@caobali.com',
    company: 'Dogsupplys',
    phone: '+49 40 87654321',
    address: 'Hafenstr. 456, 20459 Hamburg',
    totalOrders: 18,
    totalValue: '€8,920.00',
    lastOrder: new Date('2024-12-08'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'paid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  },
  {
    id: '3',
    clientId: 3,
    name: 'Thomas Weber',
    email: 'thomas@terppens.de',
    company: 'Womenfashion',
    phone: '+49 89 11223344',
    address: 'Maximilianstr. 789, 80539 München',
    totalOrders: 12,
    totalValue: '€5,670.00',
    lastOrder: new Date('2024-11-25'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'paid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  },
  {
    id: '4',
    clientId: 4,
    name: 'Anna Johnson',
    email: 'anna@lighthouse.com',
    company: 'Lighthousestore',
    phone: '+49 30 55667788',
    address: 'Friedrichstr. 456, 10117 Berlin',
    totalOrders: 35,
    totalValue: '€18,320.00',
    lastOrder: new Date('2024-12-12'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'paid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  },
  {
    id: '5',
    clientId: 5,
    name: 'Mike Brown',
    email: 'mike@sunglasses.com',
    company: 'Sunglassesdoor',
    phone: '+49 40 99887766',
    address: 'Reeperbahn 123, 20359 Hamburg',
    totalOrders: 28,
    totalValue: '€14,750.00',
    lastOrder: new Date('2024-12-11'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'paid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  },
  {
    id: '6',
    clientId: 6,
    name: 'Lisa Garcia',
    email: 'lisa@foodexpress.com',
    company: 'Foodexpress',
    phone: '+49 69 44556677',
    address: 'Zeil 789, 60313 Frankfurt',
    totalOrders: 42,
    totalValue: '€22,890.00',
    lastOrder: new Date('2024-12-09'),
    lastBillingPeriod: '01.10.2025 - 30.10.2025',
    status: 'active',
    billingStatus: 'paid',
    systemLogin: 'Login',
    emailAction: 'Mailservice'
  }
];

// Empty state for when there are no clients
const EmptyState = () => (
  <div 
    className="flex flex-col items-center justify-center w-full"
    style={{
      minHeight: '400px',
      padding: '48px 24px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
    }}
  >
    {/* Plus Icon Circle */}
    <div 
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    
    {/* No Clients Text */}
    <h3 
      style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: 'clamp(12px, 1.03vw, 14px)',
        lineHeight: '20px',
        color: '#111827',
        textAlign: 'center',
        marginBottom: '8px',
      }}
    >
      No Clients
    </h3>
    
    {/* Description Text */}
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
      Get started by creating your first client or quotation.
    </p>
  </div>
);

// Client status badge component
const StatusBadge = ({ status }: { status: 'active' | 'inactive' }) => (
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
        backgroundColor: status === 'active' ? '#22C55E' : '#EF4444',
      }}
    />
    {status === 'active' ? 'Active' : 'Inactive'}
  </span>
);

export default function AdminClientsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // For demonstration - toggle this to show empty state
  const [showEmptyState, setShowEmptyState] = useState(false);

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

  // Filter clients based on search
  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // Use empty state or actual clients based on toggle
  const displayClients = showEmptyState ? [] : paginatedClients;
  const displayFilteredClients = showEmptyState ? [] : filteredClients;

  return (
    <DashboardLayout>
      <div 
        className="w-full min-h-screen"
        style={{
          backgroundColor: '#F9FAFB',
          padding: 'clamp(24px, 5.2vw, 70px) clamp(24px, 5.2vw, 70px) clamp(32px, 2.35vw, 32px)',
        }}
      >
        <div className="w-full flex flex-col" style={{ gap: 'clamp(16px, 1.76vw, 24px)' }}>
          
          {/* Back Button */}
          <div>
            <button
              onClick={handleBack}
              style={{
                width: 'clamp(58px, 4.78vw, 65px)',
                height: 'clamp(32px, 2.8vw, 38px)',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: '9px 15px 9px 15px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                gap: '8px',
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ 
                  width: 'clamp(16px, 1.32vw, 18px)', 
                  height: 'clamp(16px, 1.32vw, 18px)', 
                  color: '#374151' 
                }} 
              >
                <path 
                  d="M10 12L6 8L10 4" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Header Section */}
          <div className="flex items-end justify-between w-full">
            {/* Page Title */}
            <div>
              <h1
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(20px, 2.35vw, 32px)',
                  lineHeight: 'clamp(28px, 3.52vw, 48px)',
                  color: '#111827',
                  marginBottom: 'clamp(4px, 0.59vw, 8px)',
                }}
              >
                Clients
              </h1>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: '20px',
                  color: '#6B7280',
                }}
              >
                Manage your client relationships and quotations
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center" style={{ gap: 'clamp(8px, 0.88vw, 12px)' }}>
              {/* Toggle Demo Button (for development) */}
              <button
                onClick={() => setShowEmptyState(!showEmptyState)}
                style={{
                  height: 'clamp(32px, 2.8vw, 38px)',
                  borderRadius: '6px',
                  padding: '9px 17px',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(11px, 1.03vw, 13px)',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                {showEmptyState ? 'Show Clients' : 'Show Empty'}
              </button>

              {/* Create Client Button */}
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
                  fontSize: 'clamp(11px, 1.03vw, 13px)',
                  fontWeight: 500,
                  color: '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                Create Client
              </button>

              {/* Create Quotation Button */}
              <button
                onClick={handleCreateQuotation}
                style={{
                  width: 'clamp(130px, 10.81vw, 147px)',
                  height: 'clamp(32px, 2.8vw, 38px)',
                  borderRadius: '6px',
                  padding: '9px 17px',
                  backgroundColor: '#003450',
                  boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: 'clamp(11px, 1.03vw, 13px)',
                    lineHeight: '20px',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Create Quotation
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {!showEmptyState && (
            <div className="w-full">
              <div className="relative" style={{ maxWidth: 'clamp(280px, 23.5vw, 320px)' }}>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: 'clamp(32px, 2.8vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: '9px 13px 9px 40px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 'clamp(12px, 1vw, 14px)',
                    color: '#374151',
                  }}
                />
                {/* Search Icon */}
                <div
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#9CA3AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Content Area - Table or Empty State */}
          {showEmptyState || displayClients.length === 0 ? (
            <EmptyState />
          ) : (
            <div 
              className="w-full bg-white rounded-lg border"
              style={{
                borderColor: '#E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Table Header */}
              <div 
                className="grid grid-cols-7 gap-4 px-6 py-3 border-b"
                style={{
                  borderBottomColor: '#E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                {['Name', 'Email', 'Company', 'Phone', 'Total Orders', 'Total Value', 'Status'].map((header) => (
                  <div key={header}>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: 'clamp(11px, 0.95vw, 13px)',
                        lineHeight: '16px',
                        color: '#374151',
                      }}
                    >
                      {header}
                    </span>
                  </div>
                ))}
              </div>

              {/* Table Body */}
              <div>
                {displayClients.map((client, index) => (
                  <div 
                    key={client.id}
                    onClick={() => handleClientClick(client.id)}
                    className="grid grid-cols-7 gap-4 px-6 py-4 border-b hover:bg-gray-50 cursor-pointer"
                    style={{
                      borderBottomColor: index === displayClients.length - 1 ? 'transparent' : '#E5E7EB',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#111827',
                        }}
                      >
                        {client.name}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#6B7280',
                        }}
                      >
                        {client.email}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#6B7280',
                        }}
                      >
                        {client.company}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 400,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#6B7280',
                        }}
                      >
                        {client.phone}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#111827',
                        }}
                      >
                        {client.totalOrders}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 'clamp(12px, 1vw, 14px)',
                          lineHeight: '20px',
                          color: '#111827',
                        }}
                      >
                        {client.totalValue}
                      </span>
                    </div>
                    <div>
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!showEmptyState && displayFilteredClients.length > 0 && (
            <div
              className="flex items-center justify-between flex-wrap gap-4"
              style={{
                minHeight: '63px',
                paddingTop: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  lineHeight: '20px',
                  color: '#374151',
                }}
              >
                Showing <span style={{ fontWeight: 500 }}>{displayFilteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                <span style={{ fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, displayFilteredClients.length)}</span> of{' '}
                <span style={{ fontWeight: 500 }}>{displayFilteredClients.length}</span> results
              </span>

              <div className="flex items-center gap-3">
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  style={{
                    minWidth: '92px',
                    height: 'clamp(32px, 2.8vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: '9px 17px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#374151',
                    }}
                  >
                    Previous
                  </span>
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  style={{
                    minWidth: '92px',
                    height: 'clamp(32px, 2.8vw, 38px)',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    padding: '9px 17px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: 'clamp(12px, 1vw, 14px)',
                      lineHeight: '20px',
                      color: '#374151',
                    }}
                  >
                    Next
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}