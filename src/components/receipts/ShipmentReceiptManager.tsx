import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { autoCreateReceipt } from '@/utils/autoReceiptCreator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  FileCheck,
  ArrowRight,
  Loader2,
  Zap,
  Hand,
  RefreshCw,
  FileStack,
} from 'lucide-react';

interface ManagedShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  generator_id: string;
  has_receipt: boolean;
  generator: { name: string } | null;
}

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  in_transit: 'قيد النقل',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', other: 'أخرى',
};

const statusTabs = [
  { value: 'all', label: 'الكل', icon: Package },
  { value: 'in_transit', label: 'قيد النقل', icon: Truck },
  { value: 'delivered', label: 'تم التسليم', icon: CheckCircle2 },
  { value: 'confirmed', label: 'مؤكدة', icon: CheckCircle2 },
  { value: 'new', label: 'جديدة', icon: Clock },
];

// Valid transitions for transporter
const validTransitions: Record<string, string[]> = {
  new: ['approved'],
  approved: ['in_transit'],
  in_transit: ['delivered'],
  delivered: ['confirmed'],
};

interface ShipmentReceiptManagerProps {
  onReceiptsChanged?: () => void;
}

const ShipmentReceiptManager = ({ onReceiptsChanged }: ShipmentReceiptManagerProps) => {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<ManagedShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (organization?.id) loadShipments();
  }, [organization?.id]);

  const loadShipments = async () => {
    setLoading(true);
    try {
      // Get shipments
      const { data: shipmentsData, error: shipError } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, status, waste_type, quantity, unit,
          created_at, pickup_address, delivery_address, generator_id,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('transporter_id', organization?.id)
        .in('status', ['new', 'approved', 'in_transit', 'delivered', 'confirmed'])
        .order('created_at', { ascending: false });

      if (shipError) throw shipError;

      // Get existing receipts
      const { data: receiptsData } = await supabase
        .from('shipment_receipts')
        .select('shipment_id')
        .eq('transporter_id', organization?.id);

      const receiptShipmentIds = new Set((receiptsData || []).map(r => r.shipment_id));

      const enriched = (shipmentsData || []).map(s => ({
        ...s,
        has_receipt: receiptShipmentIds.has(s.id),
        generator: s.generator as { name: string } | null,
      }));

      setShipments(enriched);
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = useMemo(() => {
    if (activeTab === 'all') return shipments;
    return shipments.filter(s => s.status === activeTab);
  }, [shipments, activeTab]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shipments.length };
    shipments.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [shipments]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredShipments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShipments.map(s => s.id)));
    }
  };

  const selectedShipments = filteredShipments.filter(s => selectedIds.has(s.id));

  // Issue receipt for single shipment
  const issueReceipt = async (shipment: ManagedShipment) => {
    if (shipment.has_receipt) {
      toast.info('تم إصدار شهادة لهذه الشحنة مسبقاً');
      return;
    }
    try {
      await autoCreateReceipt(shipment.id, organization?.id || '');
      toast.success(`تم إصدار شهادة للشحنة ${shipment.shipment_number}`);
      loadShipments();
      onReceiptsChanged?.();
    } catch {
      toast.error('فشل في إصدار الشهادة');
    }
  };

  // Issue receipts for selected shipments
  const issueBulkReceipts = async () => {
    const eligible = selectedShipments.filter(s => !s.has_receipt);
    if (eligible.length === 0) {
      toast.info('جميع الشحنات المختارة لديها شهادات بالفعل');
      return;
    }
    setProcessing(true);
    let success = 0;
    for (const s of eligible) {
      try {
        await autoCreateReceipt(s.id, organization?.id || '');
        success++;
      } catch { /* skip */ }
    }
    toast.success(`تم إصدار ${success} شهادة من أصل ${eligible.length}`);
    setSelectedIds(new Set());
    setProcessing(false);
    loadShipments();
    onReceiptsChanged?.();
  };

  // Change status for single shipment
  const changeStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
      if (newStatus === 'confirmed') updateData.confirmed_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;
      toast.success('تم تحديث حالة الشحنة');
      loadShipments();
    } catch {
      toast.error('فشل في تحديث الحالة');
    }
  };

  // Bulk status change
  const bulkChangeStatus = async () => {
    if (!bulkAction || selectedShipments.length === 0) return;
    setProcessing(true);
    let success = 0;
    for (const s of selectedShipments) {
      const allowed = validTransitions[s.status] || [];
      if (allowed.includes(bulkAction)) {
        try {
          const updateData: Record<string, any> = { status: bulkAction };
          if (bulkAction === 'delivered') updateData.delivered_at = new Date().toISOString();
          if (bulkAction === 'confirmed') updateData.confirmed_at = new Date().toISOString();

          await supabase.from('shipments').update(updateData).eq('id', s.id);
          success++;
        } catch { /* skip */ }
      }
    }
    toast.success(`تم تحديث ${success} شحنة إلى "${statusLabels[bulkAction]}"`);
    setBulkAction('');
    setSelectedIds(new Set());
    setProcessing(false);
    loadShipments();
  };

  // Get available bulk transitions from selected
  const availableBulkTransitions = useMemo(() => {
    if (selectedShipments.length === 0) return [];
    const transitions = new Set<string>();
    selectedShipments.forEach(s => {
      (validTransitions[s.status] || []).forEach(t => transitions.add(t));
    });
    return Array.from(transitions);
  }, [selectedShipments]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              إدارة الشحنات وإصدار الشهادات
            </CardTitle>
            <CardDescription>إصدار شهادات وتغيير حالات الشحنات — فردياً أو مجمّعاً</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadShipments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds(new Set()); }}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {statusTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {statusCounts[tab.value] || 0}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Badge variant="default">{selectedIds.size} محدد</Badge>

            {/* Bulk Receipt */}
            <Button size="sm" variant="outline" onClick={issueBulkReceipts} disabled={processing} className="gap-1">
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileStack className="w-3.5 h-3.5" />}
              إصدار شهادات مجمعة
            </Button>

            {/* Bulk Status Change */}
            {availableBulkTransitions.length > 0 && (
              <div className="flex items-center gap-1">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="تحويل الحالة إلى..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBulkTransitions.map(t => (
                      <SelectItem key={t} value={t}>{statusLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={bulkChangeStatus}
                  disabled={!bulkAction || processing}
                  className="gap-1 h-8"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  تنفيذ
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Select All */}
        {filteredShipments.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedIds.size === filteredShipments.length && filteredShipments.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">تحديد الكل ({filteredShipments.length})</span>
          </div>
        )}

        {/* Shipments List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>لا توجد شحنات في هذه الحالة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredShipments.map(shipment => {
                const nextStatuses = validTransitions[shipment.status] || [];
                return (
                  <div
                    key={shipment.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedIds.has(shipment.id) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(shipment.id)}
                      onCheckedChange={() => toggleSelect(shipment.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{shipment.shipment_number}</span>
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[shipment.status] || shipment.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                        </Badge>
                        {shipment.has_receipt && (
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 gap-1">
                            <FileCheck className="w-3 h-3" />
                            تم الإصدار
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {shipment.generator?.name || '-'} • {shipment.quantity} {shipment.unit}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Issue receipt button */}
                      {!shipment.has_receipt && ['in_transit', 'delivered', 'confirmed'].includes(shipment.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => issueReceipt(shipment)}
                          className="gap-1 text-xs h-7"
                          title="إصدار شهادة يدوياً"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          شهادة
                        </Button>
                      )}

                      {/* Status change buttons */}
                      {nextStatuses.map(ns => (
                        <Button
                          key={ns}
                          size="sm"
                          variant="ghost"
                          onClick={() => changeStatus(shipment.id, ns)}
                          className="gap-1 text-xs h-7"
                          title={`تحويل إلى ${statusLabels[ns]}`}
                        >
                          <ArrowRight className="w-3 h-3" />
                          {statusLabels[ns]}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ShipmentReceiptManager;
