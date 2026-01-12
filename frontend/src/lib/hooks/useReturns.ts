import { useState, useEffect, useCallback } from 'react';
import { dataApi, Return } from '@/lib/data-api';

// Return status type mapping from API to display
type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

// Transform API return to display format
export interface DisplayReturn {
  id: string;
  returnId: string;
  returnDate: Date;
  client: string;
  orderId: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
}

// Map API status to display status
function mapApiStatusToDisplay(apiStatus: string): ReturnStatus {
  const statusMap: Record<string, ReturnStatus> = {
    'ANNOUNCED': 'pending',
    'RECEIVED': 'processing',
    'PROCESSED': 'completed',
    'PENDING': 'pending',
    'APPROVED': 'approved',
    'REJECTED': 'rejected',
    'PROCESSING': 'processing',
    'COMPLETED': 'completed',
  };
  return statusMap[apiStatus?.toUpperCase()] || 'processing';
}

// Transform API Return to DisplayReturn
function transformReturn(apiReturn: Return): DisplayReturn {
  // Calculate total quantity from items
  const totalQuantity = apiReturn.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // Get primary reason from first item or the return's reason field
  const reason = apiReturn.reason || 
    apiReturn.items?.[0]?.condition || 
    'Unknown';

  return {
    id: apiReturn.id,
    returnId: apiReturn.returnId,
    returnDate: new Date(apiReturn.createdAt),
    client: apiReturn.client?.companyName || apiReturn.client?.name || 'Unknown',
    orderId: apiReturn.order?.orderId || apiReturn.order?.orderNumber || 'N/A',
    quantity: totalQuantity,
    reason,
    status: mapApiStatusToDisplay(apiReturn.status),
  };
}

interface UseReturnsResult {
  returns: DisplayReturn[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReturns(): UseReturnsResult {
  const [returns, setReturns] = useState<DisplayReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiReturns = await dataApi.getReturns();
      const displayReturns = apiReturns.map(transformReturn);
      setReturns(displayReturns);
    } catch (err: any) {
      console.error('Error fetching returns:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch returns');
      setReturns([]); // Clear returns on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return { returns, loading, error, refetch: fetchReturns };
}

// Get unique client names for filter dropdown
export function getReturnClientNames(returns: DisplayReturn[]): string[] {
  const uniqueClients = [...new Set(returns.map(r => r.client))];
  return uniqueClients.filter(Boolean).sort();
}
