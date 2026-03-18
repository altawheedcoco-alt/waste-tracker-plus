import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  PenTool, Loader2, CheckCircle2, Filter, Search,
  Package, Factory, Calendar, Truck, Recycle, FileText,
  ClipboardList, ChevronDown, ChevronUp, X, ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import BatchSignatureDialog, { type BatchDocument } from '@/components/signatures/BatchSignatureDialog';

const WASTE_TYPE_LABELS: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'بناء', other: 'أخرى',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', collecting: 'جاري التجميع',
  in_transit: 'في الطريق', delivered: 'تم التسليم', confirmed: 'مؤكدة',
};

interface ShipmentForSigning {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  pickup_date: string | null;
  generator_id: string;
  transporter_id: string | null;
  recycler_id: string | null;
  generator_name?: string;
  transporter_name?: string;
  recycler_name?: string;
  manifest_signed?: boolean;
  tracking_signed?: boolean;
}

type DocType = 'manifest' | 'shipment_tracking';

export default function BulkSigning() {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [activeTab, setActiveTab] = useState<DocType>('manifest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '', wasteType: 'all', generatorId: 'all', transporterId: 'all',
    recyclerId: 'all', status: 'all', dateFrom: '', dateTo: '',
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['bulk-signing-shipments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, created_at, pickup_date, generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .in('status', ['approved', 'collecting', 'in_transit', 'delivered', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const orgIds = useMemo(() => {
    const ids = new Set<string>();
    shipments.forEach(s => {
      if (s.generator_id) ids.add(s.generator_id);
      if (s.transporter_id) ids.add(s.transporter_id);
      if (s.recycler_id) ids.add(s.recycler_id);
    });
    return [...ids];
  }, [shipments]);

  const { data: orgsMap = {} } = useQuery({
    queryKey: ['bulk-signing-orgs', orgIds.join(',')],
    queryFn: async () => {
      if (!orgIds.length) return {};
      const { data } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      const map: Record<string, string> = {};
      (data || []).forEach(o => { map[o.id] = o.name; });
      return map;
    },
    enabled: orgIds.length > 0,
  });

  const { data: existingSignatures = {} } = useQuery({
    queryKey: ['bulk-signing-existing', orgId, profile?.user_id, shipments.length],
    queryFn: async () => {
      if (!profile?.user_id || !shipments.length) return {};
      const shipmentIds = shipments.map(s => s.id);
      const { data } = await supabase
        .from('document_signatures')
        .select('document_id, document_type')
        .eq('signed_by', profile.user_id)
        .in('document_id', shipmentIds);
      const map: Record<string, Set<string>> = {};
      (data || []).forEach(s => {
        if (!map[s.document_id]) map[s.document_id] = new Set();
        map[s.document_id].add(s.document_type);
      });
      return map;
    },
    enabled: !!profile?.user_id && shipments.length > 0,
  });

  const { data: orgStampUrl } = useQuery({
    queryKey: ['org-stamp-bulk', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from('organization_stamps')
        .select('stamp_image_url')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      return data?.stamp_image_url || null;
    },
    enabled: !!orgId,
  });

  const enrichedShipments: ShipmentForSigning[] = useMemo(() => {
    return shipments.map(s => ({
      ...s,
      generator_name: orgsMap[s.generator_id] || '—',
      transporter_name: s.transporter_id ? orgsMap[s.transporter_id] || '—' : '—',
      recycler_name: s.recycler_id ? orgsMap[s.recycler_id] || '—' : '—',
      manifest_signed: existingSignatures[s.id]?.has('manifest') || false,
      tracking_signed: existingSignatures[s.id]?.has('shipment_tracking') || false,
    }));
  }, [shipments, orgsMap, existingSignatures]);

  const uniqueGenerators = useMemo(() => {
    const map = new Map<string, string>();
    enrichedShipments.forEach(s => { if (s.generator_id) map.set(s.generator_id, s.generator_name || ''); });
    return [...map.entries()];
  }, [enrichedShipments]);

  const uniqueTransporters = useMemo(() => {
    const map = new Map<string, string>();
    enrichedShipments.forEach(s => { if (s.transporter_id) map.set(s.transporter_id, s.transporter_name || ''); });
    return [...map.entries()];
  }, [enrichedShipments]);

  const uniqueRecyclers = useMemo(() => {
    const map = new Map<string, string>();
    enrichedShipments.forEach(s => { if (s.recycler_id) map.set(s.recycler_id, s.recycler_name || ''); });
    return [...map.entries()];
  }, [enrichedShipments]);

  const { unsigned, signed } = useMemo(() => {
    const isSignedField = activeTab === 'manifest' ? 'manifest_signed' : 'tracking_signed';
    let filtered = enrichedShipments;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.shipment_number.toLowerCase().includes(q) || s.generator_name?.toLowerCase().includes(q) ||
        s.transporter_name?.toLowerCase().includes(q) || s.recycler_name?.toLowerCase().includes(q)
      );
    }
    if (filters.wasteType !== 'all') filtered = filtered.filter(s => s.waste_type === filters.wasteType);
    if (filters.generatorId !== 'all') filtered = filtered.filter(s => s.generator_id === filters.generatorId);
    if (filters.transporterId !== 'all') filtered = filtered.filter(s => s.transporter_id === filters.transporterId);
    if (filters.recyclerId !== 'all') filtered = filtered.filter(s => s.recycler_id === filters.recyclerId);
    if (filters.status !== 'all') filtered = filtered.filter(s => s.status === filters.status);
    if (filters.dateFrom) filtered = filtered.filter(s => s.created_at >= filters.dateFrom);
    if (filters.dateTo) filtered = filtered.filter(s => s.created_at <= filters.dateTo + 'T23:59:59');
    return {
      unsigned: filtered.filter(s => !s[isSignedField]),
      signed: filtered.filter(s => s[isSignedField]),
    };
  }, [enrichedShipments, activeTab, filters]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const selectAll = () => setSelectedIds(new Set(unsigned.map(s => s.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleBulkSign = () => {
    if (selectedIds.size === 0) { toast.error('اختر شحنة واحدة على الأقل'); return; }
    setShowBatchDialog(true);
  };

  const batchDocuments: BatchDocument[] = useMemo(() => {
    return [...selectedIds].map(id => {
      const s = enrichedShipments.find(x => x.id === id);
      if (!s) return null;
      return {
        id: s.id, documentType: 'shipment' as const,
        title: `${activeTab === 'manifest' ? 'مانيفست' : 'نموذج تتبع'} — ${s.shipment_number}`,
        subtitle: `${s.generator_name} → ${s.transporter_name} → ${s.recycler_name}`,
      };
    }).filter(Boolean) as BatchDocument[];
  }, [selectedIds, enrichedShipments, activeTab]);

  const clearFilters = () => setFilters({ search: '', wasteType: 'all', generatorId: 'all', transporterId: 'all', recyclerId: 'all', status: 'all', dateFrom: '', dateTo: '' });
  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all' && v !== '').length;

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="w-7 h-7 text-primary" />
            التوقيع الجماعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">توقيع مجموعة من المانيفست أو نماذج التتبع دفعة واحدة</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ClipboardList, count: enrichedShipments.filter(s => !s.manifest_signed).length, label: 'مانيفست بانتظار التوقيع' },
            { icon: FileText, count: enrichedShipments.filter(s => !s.tracking_signed).length, label: 'نموذج تتبع بانتظار التوقيع' },
            { icon: CheckCircle2, count: enrichedShipments.filter(s => s.manifest_signed).length, label: 'مانيفست موقع' },
            { icon: CheckCircle2, count: enrichedShipments.filter(s => s.tracking_signed).length, label: 'نموذج تتبع موقع' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.count}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث برقم الشحنة أو اسم الجهة..." className="pr-9" value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> فلاتر
            {activeFilterCount > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{activeFilterCount}</Badge>}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-destructive"><X className="w-3 h-3" /> مسح</Button>
          )}
        </div>

        {showFilters && (
          <Card><CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 block">نوع المخلفات</Label>
                <Select value={filters.wasteType} onValueChange={v => setFilters(p => ({ ...p, wasteType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">الكل</SelectItem>
                    {Object.entries(WASTE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">الحالة</Label>
                <Select value={filters.status} onValueChange={v => setFilters(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">الكل</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block flex items-center gap-1"><Factory className="w-3 h-3" /> المولّد</Label>
                <Select value={filters.generatorId} onValueChange={v => setFilters(p => ({ ...p, generatorId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">الكل</SelectItem>
                    {uniqueGenerators.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block flex items-center gap-1"><Truck className="w-3 h-3" /> الناقل</Label>
                <Select value={filters.transporterId} onValueChange={v => setFilters(p => ({ ...p, transporterId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">الكل</SelectItem>
                    {uniqueTransporters.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block flex items-center gap-1"><Recycle className="w-3 h-3" /> المدوّر</Label>
                <Select value={filters.recyclerId} onValueChange={v => setFilters(p => ({ ...p, recyclerId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">الكل</SelectItem>
                    {uniqueRecyclers.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">من تاريخ</Label>
                <Input type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">إلى تاريخ</Label>
                <Input type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
              </div>
            </div>
          </CardContent></Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as DocType); setSelectedIds(new Set()); }}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="manifest" className="gap-1.5">
              <ClipboardList className="w-4 h-4" /> المانيفست
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{enrichedShipments.filter(s => !s.manifest_signed).length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shipment_tracking" className="gap-1.5">
              <FileText className="w-4 h-4" /> نماذج التتبع
              <Badge variant="secondary" className="text-[10px] h-4 px-1">{enrichedShipments.filter(s => !s.tracking_signed).length}</Badge>
            </TabsTrigger>
          </TabsList>

          {(['manifest', 'shipment_tracking'] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {unsigned.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedIds.size === unsigned.length && unsigned.length > 0}
                        onCheckedChange={(checked) => checked ? selectAll() : deselectAll()} />
                      <span className="text-sm font-medium">
                        {selectedIds.size > 0 ? `تم تحديد ${selectedIds.size} من ${unsigned.length}` : `${unsigned.length} بانتظار التوقيع`}
                      </span>
                    </div>
                    {selectedIds.size > 0 && (
                      <Button size="sm" onClick={handleBulkSign} className="gap-2">
                        <PenTool className="w-4 h-4" /> توقيع {selectedIds.size} {tab === 'manifest' ? 'مانيفست' : 'نموذج'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : unsigned.length === 0 && signed.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-3" />
                  <p className="font-semibold">لا توجد مستندات</p>
                  <p className="text-sm text-muted-foreground mt-1">لا توجد شحنات مرتبطة بمنظمتك حالياً</p>
                </CardContent></Card>
              ) : (
                <>
                  {unsigned.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <PenTool className="w-3.5 h-3.5" /> بانتظار التوقيع ({unsigned.length})
                      </h3>
                      <ScrollArea className="max-h-[50vh]">
                        <div className="space-y-2">
                          {unsigned.map(s => <ShipmentRow key={s.id} shipment={s} selected={selectedIds.has(s.id)} onToggle={() => toggleSelect(s.id)} isSigned={false} />)}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  {signed.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Separator />
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-3">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> تم التوقيع ({signed.length})
                      </h3>
                      <div className="space-y-2 opacity-70">
                        {signed.slice(0, 10).map(s => <ShipmentRow key={s.id} shipment={s} selected={false} onToggle={() => {}} isSigned />)}
                        {signed.length > 10 && <p className="text-xs text-muted-foreground text-center py-2">و {signed.length - 10} آخرين...</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {showBatchDialog && orgId && profile && (
          <BatchSignatureDialog
            open={showBatchDialog}
            onOpenChange={setShowBatchDialog}
            documents={batchDocuments}
            organizationId={orgId}
            userId={profile.user_id}
            organizationStampUrl={orgStampUrl || undefined}
            signerDefaults={{ name: profile.full_name || '', title: (profile as any)?.job_title || '' }}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['bulk-signing-existing'] });
              setSelectedIds(new Set());
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function ShipmentRow({ shipment, selected, onToggle, isSigned }: {
  shipment: ShipmentForSigning; selected: boolean; onToggle: () => void; isSigned: boolean;
}) {
  return (
    <Card className={`transition-colors ${selected ? 'border-primary bg-primary/5' : ''}`}>
      <CardContent className="p-3 flex items-center gap-3">
        {!isSigned && <Checkbox checked={selected} onCheckedChange={onToggle} />}
        {isSigned && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold">{shipment.shipment_number}</span>
            <Badge variant="outline" className="text-[10px] h-4">{STATUS_LABELS[shipment.status] || shipment.status}</Badge>
            <Badge variant="secondary" className="text-[10px] h-4">
              <Package className="w-3 h-3 ml-0.5" />{WASTE_TYPE_LABELS[shipment.waste_type] || shipment.waste_type}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{shipment.quantity} {shipment.unit}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5"><Factory className="w-3 h-3" /> {shipment.generator_name}</span>
            <span className="flex items-center gap-0.5"><Truck className="w-3 h-3" /> {shipment.transporter_name}</span>
            <span className="flex items-center gap-0.5"><Recycle className="w-3 h-3" /> {shipment.recycler_name}</span>
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
