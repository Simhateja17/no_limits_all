'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Truck,
  RefreshCw,
  Plus,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
  Settings,
  Package,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  carrier: string;
  jtlShippingMethodId?: string;
  jtlFulfillerId?: string;
  jtlShippingType?: string;
  jtlCarrierCode?: string;
  jtlCarrierName?: string;
  trackingUrlSchema?: string;
  cutoffTime?: string;
  isActive: boolean;
  isDefault: boolean;
  basePrice?: number;
  pricePerKg?: number;
  logoUrl?: string;
}

interface ShippingMethodMapping {
  id: string;
  channelShippingCode: string;
  channelShippingTitle: string;
  channelType: 'SHOPIFY' | 'WOOCOMMERCE';
  shippingMethodId: string;
  shippingMethod?: ShippingMethod;
  clientId?: string;
  channelId?: string;
}

interface ShippingMismatch {
  id: string;
  orderId: string;
  channelShippingCode?: string;
  channelShippingTitle?: string;
  channelType: 'SHOPIFY' | 'WOOCOMMERCE';
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  usedFallback: boolean;
  order?: {
    id: string;
    orderId: string;
    orderNumber?: string;
    customerName?: string;
  };
}

interface Client {
  id: string;
  name: string;
  companyName: string;
}

export default function ShippingSettingsPage() {
  const t = useTranslations();
  
  // State
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [mappings, setMappings] = useState<ShippingMethodMapping[]>([]);
  const [mismatches, setMismatches] = useState<ShippingMismatch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  // Dialog state
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({
    channelShippingCode: '',
    channelShippingTitle: '',
    channelType: 'SHOPIFY' as 'SHOPIFY' | 'WOOCOMMERCE',
    shippingMethodId: '',
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch shipping methods
      const methodsRes = await fetch(`${API_URL}/shipping-methods`, { headers });
      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        setShippingMethods(methodsData.data || []);
      }

      // Fetch clients
      const clientsRes = await fetch(`${API_URL}/clients`, { headers });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.data || []);
      }

      // Fetch mappings
      if (selectedClient) {
        const mappingsRes = await fetch(`${API_URL}/shipping-methods/mappings/client/${selectedClient}`, { headers });
        if (mappingsRes.ok) {
          const mappingsData = await mappingsRes.json();
          setMappings(mappingsData.data || []);
        }
      }

      // Fetch mismatches
      const mismatchUrl = selectedClient 
        ? `${API_URL}/shipping-methods/mismatches?clientId=${selectedClient}`
        : `${API_URL}/shipping-methods/mismatches`;
      const mismatchRes = await fetch(mismatchUrl, { headers });
      if (mismatchRes.ok) {
        const mismatchData = await mismatchRes.json();
        setMismatches(mismatchData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch shipping data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromJTL = async () => {
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }
    
    setSyncing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/shipping-methods/jtl/${selectedClient}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Synced ${data.synced} shipping methods from JTL FFN`);
        fetchData();
      } else {
        const error = await res.json();
        alert(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync shipping methods');
    } finally {
      setSyncing(false);
    }
  };

  const createMapping = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/shipping-methods/mappings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMapping,
          clientId: selectedClient || undefined,
        }),
      });

      if (res.ok) {
        setMappingDialogOpen(false);
        setNewMapping({
          channelShippingCode: '',
          channelShippingTitle: '',
          channelType: 'SHOPIFY',
          shippingMethodId: '',
        });
        fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to create mapping: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create mapping:', error);
    }
  };

  const deleteMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_URL}/shipping-methods/mappings/${mappingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const setClientDefault = async (shippingMethodId: string) => {
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/shipping-methods/client/${selectedClient}/default`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingMethodId }),
      });

      if (res.ok) {
        alert('Default shipping method updated');
        fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to update default: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const resolveMismatch = async (mismatchId: string, shippingMethodId?: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const userId = 'admin'; // TODO: Get from auth context
      
      const res = await fetch(`${API_URL}/shipping-methods/mismatches/${mismatchId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: userId,
          resolutionNote: shippingMethodId ? 'Assigned shipping method' : 'Dismissed',
          shippingMethodId,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to resolve mismatch:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full px-[5.2%] py-8">
        <main>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Shipping Methods</h1>
              <p className="text-gray-500">Configure shipping methods and JTL FFN mappings</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={syncFromJTL} disabled={syncing || !selectedClient}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync from JTL FFN
              </Button>
            </div>
          </div>

          {/* Mismatches Alert */}
          {mismatches.length > 0 && (
            <Card className="mb-6 border-yellow-500 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-yellow-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  {mismatches.length} Shipping Method Mismatch{mismatches.length > 1 ? 'es' : ''}
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  These orders have shipping methods that couldn't be mapped to JTL FFN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mismatches.slice(0, 5).map((mismatch) => (
                    <div
                      key={mismatch.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div>
                        <span className="font-medium">Order {mismatch.order?.orderNumber || mismatch.orderId}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{mismatch.channelShippingTitle || mismatch.channelShippingCode}</span>
                        <Badge variant="outline" className="ml-2">{mismatch.channelType}</Badge>
                        {mismatch.usedFallback && (
                          <Badge variant="secondary" className="ml-2">Using fallback</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => resolveMismatch(mismatch.id, value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Assign method..." />
                          </SelectTrigger>
                          <SelectContent>
                            {shippingMethods.filter(m => m.isActive).map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveMismatch(mismatch.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {mismatches.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {mismatches.length - 5} more...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="methods" className="space-y-4">
            <TabsList>
              <TabsTrigger value="methods">
                <Truck className="w-4 h-4 mr-2" />
                Shipping Methods
              </TabsTrigger>
              <TabsTrigger value="mappings">
                <ArrowRight className="w-4 h-4 mr-2" />
                Channel Mappings
              </TabsTrigger>
            </TabsList>

            {/* Shipping Methods Tab */}
            <TabsContent value="methods">
              <Card>
                <CardHeader>
                  <CardTitle>Available Shipping Methods</CardTitle>
                  <CardDescription>
                    JTL FFN shipping methods synchronized from your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : shippingMethods.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No shipping methods found</p>
                      <p className="text-sm">Sync from JTL FFN to load available methods</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>JTL ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Cutoff</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingMethods.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="font-medium">
                              {method.name}
                              {method.isDefault && (
                                <Badge variant="secondary" className="ml-2">Default</Badge>
                              )}
                            </TableCell>
                            <TableCell>{method.carrier}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {method.jtlShippingMethodId || method.code}
                              </code>
                            </TableCell>
                            <TableCell>{method.jtlShippingType || '-'}</TableCell>
                            <TableCell>{method.cutoffTime || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={method.isActive ? 'default' : 'secondary'}>
                                {method.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {selectedClient && !method.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setClientDefault(method.id)}
                                >
                                  Set as Default
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mappings Tab */}
            <TabsContent value="mappings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Channel Shipping Mappings</CardTitle>
                    <CardDescription>
                      Map Shopify/WooCommerce shipping methods to JTL FFN methods
                    </CardDescription>
                  </div>
                  <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Mapping
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Shipping Method Mapping</DialogTitle>
                        <DialogDescription>
                          Map a channel shipping method to a JTL FFN shipping method
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Channel Type</Label>
                          <Select
                            value={newMapping.channelType}
                            onValueChange={(v) => setNewMapping({ ...newMapping, channelType: v as 'SHOPIFY' | 'WOOCOMMERCE' })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SHOPIFY">Shopify</SelectItem>
                              <SelectItem value="WOOCOMMERCE">WooCommerce</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Channel Shipping Code</Label>
                          <Input
                            placeholder="e.g., flat_rate, free_shipping, express"
                            value={newMapping.channelShippingCode}
                            onChange={(e) => setNewMapping({ ...newMapping, channelShippingCode: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Channel Shipping Title</Label>
                          <Input
                            placeholder="e.g., Standard Shipping, Free Shipping"
                            value={newMapping.channelShippingTitle}
                            onChange={(e) => setNewMapping({ ...newMapping, channelShippingTitle: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Map to JTL Shipping Method</Label>
                          <Select
                            value={newMapping.shippingMethodId}
                            onValueChange={(v) => setNewMapping({ ...newMapping, shippingMethodId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select JTL method..." />
                            </SelectTrigger>
                            <SelectContent>
                              {shippingMethods.filter(m => m.isActive).map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name} ({method.carrier})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setMappingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createMapping}>Create Mapping</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : !selectedClient ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a client to view mappings</p>
                    </div>
                  ) : mappings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ArrowRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No mappings configured</p>
                      <p className="text-sm">Create mappings to automatically route orders to the correct shipping method</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Channel Shipping</TableHead>
                          <TableHead></TableHead>
                          <TableHead>JTL Method</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell>
                              <Badge variant="outline">{mapping.channelType}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{mapping.channelShippingTitle}</span>
                                <br />
                                <code className="text-xs text-gray-500">{mapping.channelShippingCode}</code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </TableCell>
                            <TableCell>
                              {mapping.shippingMethod?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMapping(mapping.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
}
