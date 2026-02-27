import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Link2, CheckCircle, XCircle, Loader2, Search, MapPin, Scale, Clock,
  Package, List, LayoutGrid, Filter, Eye, ArrowUpDown, QrCode,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';

interface CustodyEvent {
  id: string;
  shipment_id: string;
  block_number: number;
  custody_hash: string;
  previous_hash: string;
  event_type: string;
  event_description: string;
  actor_name: string;
  actor_role: string;
  location_name: string;
  weight_at_event: number;
  waste_type: string;
  created_at: string;
  verified: boolean;
}

interface QrHandoverEvent {
  id: string;
  shipment_id: string;
  event_type: string;
  actor_organization_id: string;
  qr_code_hash: string;
  gps_latitude: number;
  gps_longitude: number;
  notes: string;
  created_at: string;
  actor_org_name?: string;
}

const eventTypeLabels: Record<string, string> = {
  pickup: 'استلام',
  in_transit: 'نقل',
  checkpoint: 'نقطة تفتيش',
  weighing: 'وزن',
  delivery: 'تسليم',
  disposal: 'تخلص',
  recycling: 'تدوير',
  generator_handover: 'تسليم من المولد',
  transporter_pickup: 'استلام الناقل',
  transporter_delivery: 'تسليم الناقل',
  receiver_acceptance: 'قبول المستقبل',
};

const eventTypeColors: Record<string, string> = {
  pickup: 'bg-blue-500',
  in_transit: 'bg-amber-500',
  checkpoint: 'bg-purple-500',
  weighing: 'bg-cyan-500',
  delivery: 'bg-emerald-500',
  disposal: 'bg-red-500',
  recycling: 'bg-green-500',
  generator_handover: 'bg-blue-500',
  transporter_pickup: 'bg-amber-500',
  transporter_delivery: 'bg-emerald-500',
  receiver_acceptance: 'bg-green-500',
};

const ChainOfCustodyPanel = () => {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [viewMode, setViewMode] = useState<'aggregate' | 'single'>('aggregate');
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);

  // ── Aggregated: all chain_of_custody events for the org ──
  const { data: allChainEvents = [], isLoading: loadingChain } = useQuery({
    queryKey: ['custody-chain-all', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('chain_of_custody' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as unknown as CustodyEvent[];
    },
    enabled: !!orgId,
  });

  // ── QR handover events ──
  const { data: qrEvents = [], isLoading: loadingQr } = useQuery({
    queryKey: ['custody-qr-events', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('custody_chain_events')
        .select('*, actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name)')
        .eq('actor_organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        actor_org_name: d.actor_organization?.name || '',
      })) as QrHandoverEvent[];
    },
    enabled: !!orgId,
  });

  // ── Shipment numbers lookup ──
  const shipmentIds = useMemo(() => {
    const ids = new Set<string>();
    allChainEvents.forEach(e => ids.add(e.shipment_id));
    qrEvents.forEach(e => ids.add(e.shipment_id));
    return Array.from(ids);
  }, [allChainEvents, qrEvents]);

  const { data: shipmentMap = {} } = useQuery({
    queryKey: ['custody-shipment-nums', shipmentIds],
    queryFn: async () => {
      if (shipmentIds.length === 0) return {};
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit')
        .in('id', shipmentIds.slice(0, 100));
      const map: Record<string, { number: string; waste_type: string; quantity: number; unit: string }> = {};
      (data || []).forEach((s: any) => {
        map[s.id] = { number: s.shipment_number || s.id.substring(0, 8), waste_type: s.waste_type, quantity: s.quantity, unit: s.unit };
      });
      return map;
    },
    enabled: shipmentIds.length > 0,
  });

  const isLoading = loadingChain || loadingQr;

  // ── Grouped by shipment ──
  const groupedByShipment = useMemo(() => {
    const groups = new Map<string, { chainEvents: CustodyEvent[]; qrEvents: QrHandoverEvent[]; latestDate: string }>();

    allChainEvents.forEach(e => {
      const existing = groups.get(e.shipment_id) || { chainEvents: [], qrEvents: [], latestDate: e.created_at };
      existing.chainEvents.push(e);
      if (new Date(e.created_at) > new Date(existing.latestDate)) existing.latestDate = e.created_at;
      groups.set(e.shipment_id, existing);
    });

    qrEvents.forEach(e => {
      const existing = groups.get(e.shipment_id) || { chainEvents: [], qrEvents: [], latestDate: e.created_at };
      existing.qrEvents.push(e);
      if (new Date(e.created_at) > new Date(existing.latestDate)) existing.latestDate = e.created_at;
      groups.set(e.shipment_id, existing);
    });

    let entries = Array.from(groups.entries()).map(([id, data]) => ({ shipmentId: id, ...data }));

    // Filter by search
    if (shipmentSearch.trim()) {
      const s = shipmentSearch.toLowerCase();
      entries = entries.filter(e => {
        const num = shipmentMap[e.shipmentId]?.number || '';
        return num.toLowerCase().includes(s) || e.shipmentId.toLowerCase().includes(s);
      });
    }

    entries.sort((a, b) => sortDesc
      ? new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
      : new Date(a.latestDate).getTime() - new Date(b.latestDate).getTime()
    );

    return entries;
  }, [allChainEvents, qrEvents, shipmentSearch, shipmentMap, sortDesc]);

  // ── All events flat (for aggregate timeline) ──
  const allEventsSorted = useMemo(() => {
    type UnifiedEvent = { id: string; shipmentId: string; type: string; description: string; actor: string; role: string; location: string; weight?: number; hash?: string; qrHash?: string; date: string; verified?: boolean; source: 'chain' | 'qr' };

    const unified: UnifiedEvent[] = [];

    allChainEvents.forEach(e => {
      unified.push({
        id: e.id, shipmentId: e.shipment_id, type: e.event_type,
        description: e.event_description, actor: e.actor_name, role: e.actor_role,
        location: e.location_name, weight: e.weight_at_event, hash: e.custody_hash,
        date: e.created_at, verified: e.verified, source: 'chain',
      });
    });

    qrEvents.forEach(e => {
      unified.push({
        id: e.id, shipmentId: e.shipment_id, type: e.event_type,
        description: e.notes || '', actor: e.actor_org_name || '', role: '',
        location: e.gps_latitude ? `${e.gps_latitude}, ${e.gps_longitude}` : '',
        qrHash: e.qr_code_hash, date: e.created_at, source: 'qr',
      });
    });

    // Filter
    let filtered = selectedShipment ? unified.filter(e => e.shipmentId === selectedShipment) : unified;
    if (shipmentSearch.trim()) {
      const s = shipmentSearch.toLowerCase();
      filtered = filtered.filter(e => {
        const num = shipmentMap[e.shipmentId]?.number || '';
        return num.toLowerCase().includes(s) || e.shipmentId.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s);
      });
    }

    filtered.sort((a, b) => sortDesc
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return filtered;
  }, [allChainEvents, qrEvents, selectedShipment, shipmentSearch, shipmentMap, sortDesc]);

  const totalEvents = allChainEvents.length + qrEvents.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setSortDesc(!sortDesc)}>
                <ArrowUpDown className="w-3 h-3" />
                {sortDesc ? 'الأحدث' : 'الأقدم'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">سلسلة الحفظ (Chain of Custody)</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-2.5 text-center">
              <p className="text-lg font-bold">{shipmentIds.length}</p>
              <p className="text-[10px] text-muted-foreground">شحنة</p>
            </Card>
            <Card className="p-2.5 text-center">
              <p className="text-lg font-bold">{allChainEvents.length}</p>
              <p className="text-[10px] text-muted-foreground">حدث سلسلة</p>
            </Card>
            <Card className="p-2.5 text-center">
              <p className="text-lg font-bold">{qrEvents.length}</p>
              <p className="text-[10px] text-muted-foreground">حدث QR</p>
            </Card>
          </div>

          {/* View toggle + Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-0.5">
              <Button variant={viewMode === 'aggregate' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs gap-1" onClick={() => { setViewMode('aggregate'); setSelectedShipment(null); }}>
                <List className="w-3 h-3" /> مجمع
              </Button>
              <Button variant={viewMode === 'single' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs gap-1" onClick={() => { setViewMode('single'); setSelectedShipment(null); }}>
                <Package className="w-3 h-3" /> حسب الشحنة
              </Button>
            </div>
            {selectedShipment && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSelectedShipment(null)}>
                <Package className="w-3 h-3" />
                {shipmentMap[selectedShipment]?.number || selectedShipment.substring(0, 8)}
                <XCircle className="w-3 h-3" />
              </Badge>
            )}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الشحنة..."
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                className="pr-9"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : totalEvents === 0 ? (
        <Card className="p-8 text-center">
          <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">لا توجد أحداث في سلسلة الحفظ بعد</p>
          <p className="text-xs text-muted-foreground mt-1">ستظهر الأحداث تلقائياً عند إنشاء وتسليم الشحنات</p>
        </Card>
      ) : viewMode === 'single' && !selectedShipment ? (
        /* ── Shipment Cards (grouped view) ── */
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-right">{groupedByShipment.length} شحنة في سلسلة الحفظ</p>
          {groupedByShipment.map(group => {
            const info = shipmentMap[group.shipmentId];
            const totalGroupEvents = group.chainEvents.length + group.qrEvents.length;
            const allVerified = group.chainEvents.every(e => e.verified);
            return (
              <Card
                key={group.shipmentId}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer border-r-4 border-r-primary/30 hover:border-r-primary"
                onClick={() => setSelectedShipment(group.shipmentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Badge variant="outline" className="text-[10px]">{totalGroupEvents} حدث</Badge>
                    {allVerified && group.chainEvents.length > 0 && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" /> سليمة
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="font-medium text-sm">{info?.number || group.shipmentId.substring(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {info?.waste_type || ''} • {formatDistanceToNow(new Date(group.latestDate), { locale: arLocale, addSuffix: true })}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
                {/* Mini timeline preview */}
                <div className="flex items-center gap-1 mt-2 justify-end">
                  {[...group.chainEvents, ...group.qrEvents as any[]]
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .slice(0, 6)
                    .map((e, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${eventTypeColors[e.event_type] || 'bg-muted'}`} title={eventTypeLabels[e.event_type] || e.event_type} />
                    ))}
                  {totalGroupEvents > 6 && <span className="text-[9px] text-muted-foreground">+{totalGroupEvents - 6}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Timeline (aggregate or single shipment) ── */
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-right">
            {selectedShipment
              ? `أحداث الشحنة ${shipmentMap[selectedShipment]?.number || ''} (${allEventsSorted.length})`
              : `جميع الأحداث (${allEventsSorted.length})`}
          </p>
          <div className="relative">
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-3">
              {allEventsSorted.slice(0, 100).map((event) => {
                const shipInfo = shipmentMap[event.shipmentId];
                return (
                  <div key={event.id} className="relative pr-10">
                    <div className={`absolute right-2.5 w-3 h-3 rounded-full ${eventTypeColors[event.type] || 'bg-muted'} ring-2 ring-background`} />
                    <Card className="border">
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(event.date), { locale: arLocale, addSuffix: true })}
                          </div>
                          <div className="flex items-center gap-2">
                            {!selectedShipment && (
                              <Badge
                                variant="outline"
                                className="text-[10px] gap-0.5 cursor-pointer hover:bg-accent"
                                onClick={() => { setSelectedShipment(event.shipmentId); setViewMode('aggregate'); }}
                              >
                                <Package className="w-2.5 h-2.5" />
                                {shipInfo?.number || event.shipmentId.substring(0, 8)}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {eventTypeLabels[event.type] || event.type}
                            </Badge>
                            {event.source === 'qr' && (
                              <Badge variant="outline" className="text-[10px] gap-0.5">
                                <QrCode className="w-2.5 h-2.5" /> QR
                              </Badge>
                            )}
                            {event.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </div>

                        {event.description && <p className="text-sm text-right">{event.description}</p>}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-end">
                          {event.actor && <span>👤 {event.actor}{event.role ? ` (${event.role})` : ''}</span>}
                          {event.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                          )}
                          {event.weight && (
                            <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{event.weight} طن</span>
                          )}
                        </div>

                        {(event.hash || event.qrHash) && (
                          <div className="text-[10px] text-muted-foreground/50 font-mono truncate" dir="ltr">
                            {event.hash ? `Hash: ${event.hash}` : `QR: ${event.qrHash}`}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
              {allEventsSorted.length > 100 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  يتم عرض أحدث 100 حدث من إجمالي {allEventsSorted.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainOfCustodyPanel;
