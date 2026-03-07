import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Search, Truck, Factory, Building2, ArrowLeft, AlertTriangle, CheckCircle, Clock, Package, MapPin, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-700', icon: Clock },
  in_transit: { label: 'في الطريق', color: 'bg-blue-500/10 text-blue-700', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-500/10 text-emerald-700', icon: CheckCircle },
  completed: { label: 'مكتمل', color: 'bg-green-500/10 text-green-700', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-700', icon: AlertTriangle },
};

const WASTE_CLASS_LABELS: Record<string, string> = {
  hazardous: 'خطرة', non_hazardous: 'غير خطرة', medical: 'طبية', electronic: 'إلكترونية',
  construction: 'مخلفات بناء', organic: 'عضوية', recyclable: 'قابلة للتدوير',
};

const ChainOfCustodyPanel = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  // Fetch recent shipments across all orgs
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['regulator-shipments', statusFilter],
    queryFn: async () => {
      const baseQuery = supabase
        .from('shipments')
        .select(`
          id, manifest_number, status, waste_type, waste_classification, 
          estimated_weight, actual_weight, pickup_date, delivery_date,
          created_at,
          generator:organizations!shipments_generator_id_fkey(id, name, organization_type),
          transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type),
          receiver:organizations!shipments_receiver_id_fkey(id, name, organization_type)
        ` as any)
        .order('created_at', { ascending: false })
        .limit(100) as any;

      const finalQuery = statusFilter !== 'all' 
        ? baseQuery.eq('status', statusFilter)
        : baseQuery;

      const { data } = await finalQuery;
      return (data as any[]) || [];
    },
  });

  // Fetch shipment events for selected shipment
  const { data: shipmentEvents = [] } = useQuery({
    queryKey: ['shipment-events', selectedShipment?.id],
    queryFn: async () => {
      if (!selectedShipment?.id) return [];
      const { data } = await supabase
        .from('wmis_events' as any)
        .select('*')
        .eq('shipment_id', selectedShipment.id)
        .order('created_at', { ascending: true });
      return (data as any[]) || [];
    },
    enabled: !!selectedShipment?.id,
  });

  // Stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s: any) => s.status === 'in_transit').length,
    completed: shipments.filter((s: any) => s.status === 'completed' || s.status === 'delivered').length,
    hazardous: shipments.filter((s: any) => s.waste_classification === 'hazardous').length,
  };

  const filtered = shipments.filter((s: any) => {
    if (!search) return true;
    return s.manifest_number?.includes(search) ||
      s.generator?.name?.includes(search) ||
      s.transporter?.name?.includes(search) ||
      s.receiver?.name?.includes(search);
  });

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Truck className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold">{stats.inTransit}</p>
          <p className="text-xs text-muted-foreground">في الطريق</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-2xl font-bold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">مكتملة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{stats.hazardous}</p>
          <p className="text-xs text-muted-foreground">مخلفات خطرة</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5 text-primary" />
            تتبع سلسلة الحيازة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث برقم المانيفست أو اسم المنظمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="in_transit">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shipments list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد شحنات</p>
            ) : filtered.map((s: any) => {
              const st = STATUS_MAP[s.status] || STATUS_MAP.pending;
              const StIcon = st.icon;
              const isSelected = selectedShipment?.id === s.id;

              return (
                <div key={s.id}>
                  <Card className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/30'}`} onClick={() => setSelectedShipment(isSelected ? null : s)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold">{s.manifest_number || 'بدون مانيفست'}</span>
                            <Badge className={`text-[10px] ${st.color}`}>
                              <StIcon className="w-3 h-3 ml-1" />{st.label}
                            </Badge>
                            {s.waste_classification === 'hazardous' && (
                              <Badge variant="destructive" className="text-[10px]">⚠️ خطرة</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.waste_type || 'نوع غير محدد'}
                            {s.actual_weight ? ` • ${s.actual_weight} كجم` : s.estimated_weight ? ` • ~${s.estimated_weight} كجم` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(s.created_at), 'yyyy/MM/dd HH:mm')}
                        </span>
                      </div>

                      {/* Chain visual */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-700">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{s.generator?.name || '—'}</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-700">
                          <Truck className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{s.transporter?.name || '—'}</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-700">
                          <Factory className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{s.receiver?.name || '—'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expanded events timeline */}
                  {isSelected && (
                    <Card className="mt-1 border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          سجل أحداث الشحنة
                        </h4>
                        {shipmentEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">لا توجد أحداث مسجلة</p>
                        ) : (
                          <div className="relative pr-4">
                            <div className="absolute right-1.5 top-0 bottom-0 w-0.5 bg-border" />
                            {shipmentEvents.map((event: any, i: number) => (
                              <div key={event.id} className="relative flex items-start gap-3 pb-4">
                                <div className="absolute right-0 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                                <div className="mr-5 flex-1">
                                  <p className="text-sm font-medium">{event.event_type_ar || event.event_type}</p>
                                  {event.event_data && (
                                    <p className="text-xs text-muted-foreground">{typeof event.event_data === 'string' ? event.event_data : JSON.stringify(event.event_data)}</p>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(event.event_timestamp), 'yyyy/MM/dd HH:mm')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Shipment details */}
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t text-xs">
                          {s.pickup_date && <div><span className="text-muted-foreground">تاريخ الاستلام:</span> <span className="font-medium">{format(new Date(s.pickup_date), 'yyyy/MM/dd')}</span></div>}
                          {s.delivery_date && <div><span className="text-muted-foreground">تاريخ التسليم:</span> <span className="font-medium">{format(new Date(s.delivery_date), 'yyyy/MM/dd')}</span></div>}
                          {s.waste_classification && <div><span className="text-muted-foreground">التصنيف:</span> <span className="font-medium">{WASTE_CLASS_LABELS[s.waste_classification] || s.waste_classification}</span></div>}
                          {s.actual_weight && <div><span className="text-muted-foreground">الوزن الفعلي:</span> <span className="font-medium">{s.actual_weight} كجم</span></div>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChainOfCustodyPanel;
