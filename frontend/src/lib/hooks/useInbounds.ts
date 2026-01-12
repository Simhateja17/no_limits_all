import { useState, useEffect, useCallback } from 'react';
import { dataApi, Inbound } from '@/lib/data-api';

// Inbound status type mapping
type InboundStatus = 'booked_in' | 'partially_booked_in' | 'pending';

// Transform API inbound to display format
export interface DisplayInbound {
  id: string;
  inboundId: string;
  deliveryType: string;
  anouncedQty: number;
  noOfProducts: number;
  expectDate: string;
  status: InboundStatus;
  client: string;
}

// Map API status to display status
function mapApiStatusToDisplay(apiStatus: string): InboundStatus {
  const statusMap: Record<string, InboundStatus> = {
    'RECEIVED': 'booked_in',
    'BOOKED_IN': 'booked_in',
    'PARTIALLY_RECEIVED': 'partially_booked_in',
    'PARTIALLY_BOOKED_IN': 'partially_booked_in',
    'PENDING': 'pending',
    'ANNOUNCED': 'pending',
    'IN_TRANSIT': 'pending',
    'CREATED': 'pending',
  };
  return statusMap[apiStatus?.toUpperCase()] || 'pending';
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Transform API Inbound to DisplayInbound
function transformInbound(apiInbound: Inbound): DisplayInbound {
  // Calculate total quantities from items
  const totalAnnounced = apiInbound.items?.reduce((sum, item) => sum + item.expectedQuantity, 0) || 0;
  const noOfProducts = apiInbound.items?.length || 0;

  return {
    id: apiInbound.id,
    inboundId: apiInbound.inboundId,
    deliveryType: apiInbound.deliveryType || 'Parcel service',
    anouncedQty: totalAnnounced,
    noOfProducts,
    expectDate: formatDate(apiInbound.expectedDate),
    status: mapApiStatusToDisplay(apiInbound.status),
    client: apiInbound.client?.companyName || apiInbound.client?.name || 'Unknown',
  };
}

interface UseInboundsResult {
  inbounds: DisplayInbound[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInbounds(): UseInboundsResult {
  const [inbounds, setInbounds] = useState<DisplayInbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiInbounds = await dataApi.getInbounds();
      const displayInbounds = apiInbounds.map(transformInbound);
      setInbounds(displayInbounds);
    } catch (err: any) {
      console.error('Error fetching inbounds:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch inbounds');
      setInbounds([]); // Clear inbounds on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbounds();
  }, [fetchInbounds]);

  return { inbounds, loading, error, refetch: fetchInbounds };
}

// Get unique client names for filter dropdown
export function getInboundClientNames(inbounds: DisplayInbound[]): string[] {
  const uniqueClients = [...new Set(inbounds.map(i => i.client))];
  return uniqueClients.filter(Boolean).sort();
}

// Get unique delivery types for filter dropdown
export function getDeliveryTypes(inbounds: DisplayInbound[]): string[] {
  const uniqueTypes = [...new Set(inbounds.map(i => i.deliveryType))];
  return uniqueTypes.filter(Boolean).sort();
}
