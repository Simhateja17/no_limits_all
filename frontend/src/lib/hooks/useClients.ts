import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface ClientData {
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

interface UseClientsResult {
  clients: ClientData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClients(): UseClientsResult {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.data);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.error || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, error, refetch: fetchClients };
}

// Simple helper to get client names for filter dropdown
export function getClientNames(clients: ClientData[]): string[] {
  return clients.map(client => client.company || client.name);
}
