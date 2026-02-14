import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileCheck,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Send,
  FileText,
  Plus,
} from 'lucide-react';
import ReceiptCard from '@/components/receipts/ReceiptCard';
import ReceiptDetailsDialog from '@/components/receipts/ReceiptDetailsDialog';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import GeneratorDeliveryCertificateDialog from '@/components/receipts/GeneratorDeliveryCertificateDialog';

interface Receipt {
  id: string;
  receipt_number: string;
  pickup_date: string;
  waste_type: string;
  actual_weight: number | null;
  declared_weight: number | null;
  unit: string;
  status: string;
  notes: string | null;
  pickup_location: string | null;
  created_by: string | null;
  shipment: {
    id: string;
    shipment_number: string;
  } | null;
  generator: {
    id: string;
    name: string;
  } | null;
  transporter: {
    id: string;
    name: string;
  } | null;
  driver: {
    id: string;
    profile: {
      full_name: string;
    } | null;
  } | null;
}

interface EligibleShipment {
  id: string;
  shipment_number: string;
  status: string;
  created_at: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  pickup_address?: string;
  delivery_address?: string;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; city?: string } | null;
  recycler?: { name: string; city?: string } | null;
}

const GeneratorReceipts = () => {
  const { organization, user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('delivery');
  const [eligibleShipments, setEligibleShipments] = useState<EligibleShipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [deliveryCertDialogOpen, setDeliveryCertDialogOpen] = useState(false);
  const [selectedShipmentForCert, setSelectedShipmentForCert] = useState<EligibleShipment | null>(null);

  useEffect(() => {
    if (organization?.id) {
      loadReceipts();
      loadEligibleShipments();
      
      const channel = supabase
        .channel(getTabChannelName('generator-receipts'))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipment_receipts',
            filter: `generator_id=eq.${organization.id}`,
          },
          () => {
            loadReceipts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organization?.id]);

  const loadReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from('shipment_receipts')
        .select(`
          id,
          receipt_number,
          pickup_date,
          waste_type,
          actual_weight,
          declared_weight,
          unit,
          status,
          notes,
          pickup_location,
          created_by,
          shipment:shipments(id, shipment_number),
          generator:organizations!shipment_receipts_generator_id_fkey(id, name),
          transporter:organizations!shipment_receipts_transporter_id_fkey(id, name),
          driver:drivers(id, profile:profiles(full_name))
        `)
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data as unknown as Receipt[]);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleShipments = async () => {
    setLoadingShipments(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          status,
          created_at,
          waste_type,
          quantity,
          unit,
          delivered_at,
          confirmed_at,
          pickup_address,
          delivery_address,
          generator:organizations!shipments_generator_id_fkey(name, city),
          transporter:organizations!shipments_transporter_id_fkey(name, city),
          recycler:organizations!shipments_recycler_id_fkey(name, city)
        `)
        .eq('generator_id', organization?.id)
        .in('status', ['approved', 'collecting', 'in_transit', 'delivered', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEligibleShipments(data as unknown as EligibleShipment[]);
    } catch (error) {
      console.error('Error loading eligible shipments:', error);
    } finally {
      setLoadingShipments(false);
    }
  };

  // Separate delivery certificates (created by generator) from receipt certificates (from transporters)
  const deliveryCertificates = receipts.filter(r => r.created_by === user?.id || (!r.transporter && r.generator?.id === organization?.id));
  const receiptCertificates = receipts.filter(r => r.transporter && r.created_by !== user?.id);

  const handleView = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      setSelectedReceipt(receipt);
      setDetailsDialogOpen(true);
    }
  };

  const handlePrint = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) {
      setSelectedReceipt(receipt);
      setDetailsDialogOpen(true);
    }
  };

  const handleIssueDeliveryCert = (shipment: EligibleShipment) => {
    setSelectedShipmentForCert(shipment);
    setDeliveryCertDialogOpen(true);
  };

  const filterReceipts = (list: Receipt[]) => {
    return list.filter(receipt => {
      const matchesSearch =
        receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.transporter?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.shipment?.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredDelivery = filterReceipts(deliveryCertificates);
  const filteredReceipts = filterReceipts(receiptCertificates);

  // Shipments that don't have delivery certificates yet
  const shipmentIdsWithCerts = new Set(deliveryCertificates.map(r => r.shipment?.id).filter(Boolean));
  const shipmentsNeedingCerts = eligibleShipments.filter(s => !shipmentIdsWithCerts.has(s.id));

  const stats = {
    deliveryTotal: deliveryCertificates.length,
    receiptTotal: receiptCertificates.length,
    pending: receiptCertificates.filter(r => r.status === 'pending').length,
    confirmed: receiptCertificates.filter(r => r.status === 'confirmed').length,
    needsCert: shipmentsNeedingCerts.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              شهادات التسليم والاستلام
            </h1>
            <p className="text-muted-foreground">
              إصدار شهادات تسليم الشحنات وعرض شهادات الاستلام الواردة
            </p>
          </div>
          <div className="flex gap-2">
            <BulkCertificateButton
              shipments={shipmentsNeedingCerts}
              type="delivery"
              onSuccess={() => { loadReceipts(); loadEligibleShipments(); }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deliveryTotal}</p>
                <p className="text-sm text-muted-foreground">شهادات تسليم صادرة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.needsCert}</p>
                <p className="text-sm text-muted-foreground">بحاجة لشهادة تسليم</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.receiptTotal}</p>
                <p className="text-sm text-muted-foreground">شهادات استلام واردة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">بانتظار التأكيد</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Alert */}
        {stats.pending > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    لديك {stats.pending} شهادة استلام بانتظار التأكيد
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    يرجى مراجعة الشهادات وتأكيد استلام الشحنات
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشهادة أو الشحنة أو الناقل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">بانتظار التأكيد</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                    <SelectItem value="disputed">متنازع عليها</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="delivery" className="gap-2">
              <Send className="w-4 h-4" />
              شهادات التسليم
              {stats.deliveryTotal > 0 && <Badge variant="secondary" className="mr-1">{stats.deliveryTotal}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-2">
              <Truck className="w-4 h-4" />
              شهادات الاستلام الواردة
              {stats.receiptTotal > 0 && <Badge variant="secondary" className="mr-1">{stats.receiptTotal}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Delivery Certificates Tab */}
          <TabsContent value="delivery" className="space-y-4">
            {/* Shipments needing delivery certificates */}
            {shipmentsNeedingCerts.length > 0 && (
              <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    شحنات بحاجة لشهادة تسليم ({shipmentsNeedingCerts.length})
                  </CardTitle>
                  <CardDescription>اختر شحنة لإصدار شهادة تسليم</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shipmentsNeedingCerts.slice(0, 6).map(shipment => (
                      <Card key={shipment.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleIssueDeliveryCert(shipment)}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium">{shipment.shipment_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {shipment.transporter?.name || '-'} • {shipment.quantity} {shipment.unit || 'كجم'}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="w-3 h-3" />
                            إصدار
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {shipmentsNeedingCerts.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      و {shipmentsNeedingCerts.length - 6} شحنة أخرى - استخدم الإصدار المجمع
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Issued delivery certificates */}
            <Card>
              <CardHeader>
                <CardTitle>شهادات التسليم الصادرة</CardTitle>
                <CardDescription>{filteredDelivery.length} شهادة</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredDelivery.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد شهادات تسليم</h3>
                    <p className="text-muted-foreground">
                      لم يتم إصدار أي شهادات تسليم بعد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDelivery.map((receipt, index) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ReceiptCard
                          receipt={receipt}
                          onView={handleView}
                          onPrint={handlePrint}
                          showTransporter={true}
                          showGenerator={false}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Certificates Tab */}
          <TabsContent value="receipts">
            <Card>
              <CardHeader>
                <CardTitle>شهادات الاستلام الواردة</CardTitle>
                <CardDescription>{filteredReceipts.length} شهادة</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredReceipts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد شهادات استلام</h3>
                    <p className="text-muted-foreground">
                      لم يتم استلام أي شهادات من الجهات الناقلة بعد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReceipts.map((receipt, index) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ReceiptCard
                          receipt={receipt}
                          onView={handleView}
                          onPrint={handlePrint}
                          showTransporter={true}
                          showGenerator={false}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <ReceiptDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          receipt={selectedReceipt}
          onConfirm={loadReceipts}
          isGenerator={true}
        />

        {/* Delivery Certificate Dialog */}
        {selectedShipmentForCert && (
          <GeneratorDeliveryCertificateDialog
            open={deliveryCertDialogOpen}
            onOpenChange={setDeliveryCertDialogOpen}
            shipment={selectedShipmentForCert}
            onSuccess={() => {
              loadReceipts();
              loadEligibleShipments();
              setDeliveryCertDialogOpen(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratorReceipts;
