import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
  Eye,
  ClipboardCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ReceiptCard from '@/components/receipts/ReceiptCard';
import ReceiptDetailsDialog from '@/components/receipts/ReceiptDetailsDialog';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import GeneratorDeliveryCertificateDialog from '@/components/receipts/GeneratorDeliveryCertificateDialog';
import DeliveryDeclarationViewDialog from '@/components/shipments/DeliveryDeclarationViewDialog';

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
    status?: string;
    pickup_address?: string | null;
    delivery_address?: string | null;
    recycler?: {
      id: string;
      name: string;
      city?: string | null;
    } | null;
  } | null;
  generator: {
    id: string;
    name: string;
    city?: string | null;
  } | null;
  transporter: {
    id: string;
    name: string;
    city?: string | null;
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

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', wood: 'أخشاب',
  hazardous: 'خطرة', textile: 'منسوجات', leather: 'جلود', other: 'أخرى',
};

const GeneratorReceipts = () => {
  const { organization, user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [generatorFilter, setGeneratorFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('delivery');
  const [eligibleShipments, setEligibleShipments] = useState<EligibleShipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [deliveryCertDialogOpen, setDeliveryCertDialogOpen] = useState(false);
  const [selectedShipmentForCert, setSelectedShipmentForCert] = useState<EligibleShipment | null>(null);
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null);
  const [declarationViewOpen, setDeclarationViewOpen] = useState(false);

  // Helper: get partner org IDs linked to current org
  const getPartnerOrgIds = async (): Promise<string[]> => {
    if (!organization?.id) return [];
    const { data: links } = await supabase
      .from('partner_links')
      .select('partner_organization_id, organization_id')
      .or(`organization_id.eq.${organization.id},partner_organization_id.eq.${organization.id}`)
      .eq('status', 'active');
    if (!links?.length) return [];
    return links.map(l => l.organization_id === organization.id ? l.partner_organization_id : l.organization_id).filter(Boolean) as string[];
  };

  // === Declarations query ===
  const { data: declarations = [], isLoading: declarationsLoading } = useQuery({
    queryKey: ['all-delivery-declarations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const partnerIds = await getPartnerOrgIds();
      const allOrgIds = [organization.id, ...partnerIds];

      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .in('declared_by_organization_id', allOrgIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching declarations:', error);
        return [];
      }

      const { data: shipmentDeclarations, error: err2 } = await supabase
        .from('shipments')
        .select('id')
        .or(allOrgIds.map(id => `organization_id.eq.${id},generator_id.eq.${id},transporter_id.eq.${id},recycler_id.eq.${id}`).join(','));

      if (err2 || !shipmentDeclarations?.length) return data || [];
      const shipmentIds = shipmentDeclarations.map((s: any) => s.id);
      const { data: allDeclarations, error: err3 } = await supabase
        .from('delivery_declarations')
        .select('*')
        .in('shipment_id', shipmentIds)
        .order('created_at', { ascending: false });

      if (err3) return data || [];
      const merged = [...(data || []), ...(allDeclarations || [])];
      return Array.from(new Map(merged.map((d: any) => [d.id, d])).values());
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (organization?.id) {
      loadReceipts();
      loadEligibleShipments();
    } else {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('generator-receipts'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipment_receipts' }, () => loadReceipts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id]);

  const loadReceipts = async () => {
    try {
      const partnerIds = await getPartnerOrgIds();
      const allOrgIds = [organization?.id, ...partnerIds].filter(Boolean) as string[];

      const { data, error } = await supabase
        .from('shipment_receipts')
        .select(`id, receipt_number, pickup_date, waste_type, actual_weight, declared_weight, unit, status, notes, pickup_location, created_by,
          shipment:shipments(id, shipment_number, status, pickup_address, delivery_address, recycler:organizations!shipments_recycler_id_fkey(id, name, city)),
          generator:organizations!shipment_receipts_generator_id_fkey(id, name, city),
          transporter:organizations!shipment_receipts_transporter_id_fkey(id, name, city),
          driver:drivers(id, profile:profiles(full_name))`)
        .in('generator_id', allOrgIds)
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
      const partnerIds = await getPartnerOrgIds();
      const allOrgIds = [organization?.id, ...partnerIds].filter(Boolean) as string[];

      const { data, error } = await supabase
        .from('shipments')
        .select(`id, shipment_number, status, created_at, waste_type, quantity, unit, delivered_at, confirmed_at, pickup_address, delivery_address,
          generator:organizations!shipments_generator_id_fkey(name, city),
          transporter:organizations!shipments_transporter_id_fkey(name, city),
          recycler:organizations!shipments_recycler_id_fkey(name, city)`)
        .in('generator_id', allOrgIds)
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

  const deliveryCertificates = receipts.filter(r => r.created_by === user?.id || (!r.transporter && r.generator?.id === organization?.id));
  const receiptCertificates = receipts.filter(r => r.transporter && r.created_by !== user?.id);

  const handleView = (id: string) => {
    const receipt = receipts.find(r => r.id === id);
    if (receipt) { setSelectedReceipt(receipt); setDetailsDialogOpen(true); }
  };
  const handlePrint = (id: string) => handleView(id);
  const handleIssueDeliveryCert = (shipment: EligibleShipment) => {
    setSelectedShipmentForCert(shipment); setDeliveryCertDialogOpen(true);
  };

  const filterReceipts = (list: Receipt[]) => list.filter(receipt => {
    const matchesSearch = receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.transporter?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.generator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.shipment?.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    const matchesWasteType = wasteTypeFilter === 'all' || receipt.waste_type === wasteTypeFilter;
    const matchesGenerator = generatorFilter === 'all' || receipt.generator?.id === generatorFilter;
    return matchesSearch && matchesStatus && matchesWasteType && matchesGenerator;
  });

  const filteredDelivery = filterReceipts(deliveryCertificates);
  const filteredReceipts = filterReceipts(receiptCertificates);

  const filteredDeclarations = declarations.filter((d: any) => {
    const matchesSearch = !searchQuery || 
      d.shipment_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.generator_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.transporter_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWasteType = wasteTypeFilter === 'all' || d.waste_type === wasteTypeFilter;
    return matchesSearch && matchesWasteType;
  });

  // Unique generators and waste types for filter dropdowns
  const uniqueGenerators = receipts.reduce<{ id: string; name: string }[]>((acc, r) => {
    if (r.generator?.id && !acc.find(g => g.id === r.generator?.id)) {
      acc.push({ id: r.generator.id, name: r.generator.name });
    }
    return acc;
  }, []);
  const uniqueWasteTypes = Array.from(new Set(receipts.map(r => r.waste_type).filter(Boolean)));

  const shipmentIdsWithCerts = new Set(deliveryCertificates.map(r => r.shipment?.id).filter(Boolean));
  const shipmentsNeedingCerts = eligibleShipments.filter(s => !shipmentIdsWithCerts.has(s.id));

  const stats = {
    deliveryTotal: deliveryCertificates.length,
    receiptTotal: receiptCertificates.length,
    pending: receiptCertificates.filter(r => r.status === 'pending').length,
    confirmed: receiptCertificates.filter(r => r.status === 'confirmed').length,
    needsCert: shipmentsNeedingCerts.length,
    declarationsTotal: declarations.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              شهادات التسليم والاستلام والإقرارات
            </h1>
            <p className="text-muted-foreground">
              إصدار شهادات تسليم الشحنات وعرض شهادات الاستلام والإقرارات القانونية
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.deliveryTotal}</p>
                <p className="text-xs text-muted-foreground">شهادات تسليم</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.needsCert}</p>
                <p className="text-xs text-muted-foreground">بحاجة لشهادة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.receiptTotal}</p>
                <p className="text-xs text-muted-foreground">شهادات استلام</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.declarationsTotal}</p>
                <p className="text-xs text-muted-foreground">إقرارات قانونية</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">بانتظار التأكيد</p>
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
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشهادة أو الشحنة أو الجهة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
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
                <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="نوع المخلفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {uniqueWasteTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {wasteTypeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uniqueGenerators.length > 1 && (
                  <Select value={generatorFilter} onValueChange={setGeneratorFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="الجهة المولدة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الجهات</SelectItem>
                      {uniqueGenerators.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - 3 tabs now */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="delivery" className="gap-1.5 text-xs sm:text-sm">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">شهادات</span> التسليم
              {stats.deliveryTotal > 0 && <Badge variant="secondary" className="mr-1 text-xs">{stats.deliveryTotal}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1.5 text-xs sm:text-sm">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">شهادات</span> الاستلام
              {stats.receiptTotal > 0 && <Badge variant="secondary" className="mr-1 text-xs">{stats.receiptTotal}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="declarations" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardCheck className="w-4 h-4" />
              الإقرارات
              {stats.declarationsTotal > 0 && <Badge variant="secondary" className="mr-1 text-xs">{stats.declarationsTotal}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* === Delivery Certificates Tab === */}
          <TabsContent value="delivery" className="space-y-4">
            {shipmentsNeedingCerts.length > 0 && (
              <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    شحنات بحاجة لشهادة تسليم ({shipmentsNeedingCerts.length})
                  </CardTitle>
                  <CardDescription>اختر شحنة لإصدار شهادة تسليم وإقرار قانوني</CardDescription>
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
                            <Plus className="w-3 h-3" /> إصدار
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
                    <p className="text-muted-foreground">لم يتم إصدار أي شهادات تسليم بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDelivery.map((receipt, index) => (
                      <motion.div key={receipt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <ReceiptCard receipt={receipt} onView={handleView} onPrint={handlePrint} showTransporter={true} showGenerator={false} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Receipt Certificates Tab === */}
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
                    <p className="text-muted-foreground">لم يتم استلام أي شهادات من الجهات الناقلة بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReceipts.map((receipt, index) => (
                      <motion.div key={receipt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <ReceiptCard receipt={receipt} onView={handleView} onPrint={handlePrint} showTransporter={true} showGenerator={false} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Declarations Tab === */}
          <TabsContent value="declarations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-primary" />
                  الإقرارات القانونية
                </CardTitle>
                <CardDescription>
                  {filteredDeclarations.length} إقرار - جميع إقرارات التسليم والاستلام الموقعة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {declarationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredDeclarations.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد إقرارات</h3>
                    <p className="text-muted-foreground">لم يتم تسجيل أي إقرارات تسليم بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDeclarations.map((declaration: any, index: number) => (
                      <motion.div key={declaration.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 shrink-0"
                                onClick={() => { setSelectedDeclaration(declaration); setDeclarationViewOpen(true); }}
                              >
                                <Eye className="w-4 h-4" /> عرض
                              </Button>

                              <div className="flex-1 text-right space-y-2">
                                <div className="flex items-center gap-2 justify-end flex-wrap">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {declaration.shipment_number || 'غير محدد'}
                                  </Badge>
                                  <Badge className={
                                    declaration.declaration_type === 'generator_handover' || declaration.declaration_type === 'generator_delivery'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : declaration.declaration_type === 'recycler_receipt'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                  }>
                                    <FileCheck className="w-3 h-3 ml-1" />
                                    {declaration.declaration_type === 'generator_handover' || declaration.declaration_type === 'generator_delivery'
                                      ? 'إقرار مولّد'
                                      : declaration.declaration_type === 'recycler_receipt'
                                      ? 'إقرار مدوّر'
                                      : 'إقرار ناقل'}
                                  </Badge>
                                  {declaration.auto_generated && (
                                    <Badge variant="secondary" className="text-xs">تلقائي</Badge>
                                  )}
                                  <span className="font-semibold">{declaration.driver_name || declaration.generator_name || 'غير محدد'}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-end">
                                  {declaration.waste_type && <span>النفايات: {declaration.waste_type}</span>}
                                  {declaration.quantity && <span>الكمية: {declaration.quantity} {declaration.unit || 'طن'}</span>}
                                  {declaration.generator_name && <span>المولد: {declaration.generator_name}</span>}
                                  {declaration.transporter_name && <span>الناقل: {declaration.transporter_name}</span>}
                                  <span>
                                    التاريخ: {format(new Date(declaration.declared_at || declaration.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                                  </span>
                                  {declaration.status === 'rejected' && (
                                    <Badge variant="destructive" className="text-xs">مرفوض</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
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

        {/* Declaration View Dialog */}
        {selectedDeclaration && (
          <DeliveryDeclarationViewDialog
            open={declarationViewOpen}
            onOpenChange={setDeclarationViewOpen}
            declaration={selectedDeclaration}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default GeneratorReceipts;
