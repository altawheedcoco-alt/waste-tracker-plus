import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  MapPin, Phone, Clock, Package, User, CheckCircle2, Eye, 
  Loader2, Search, Filter, Navigation, MessageCircle, PhoneCall,
  Calendar, Home, Building, Banknote, Image as ImageIcon,
  Layers, TrendingUp, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'جديد', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertCircle },
  viewed: { label: 'تمت المشاهدة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Eye },
  accepted: { label: 'مقبول', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  in_progress: { label: 'جاري التجميع', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: Navigation },
  collected: { label: 'تم التجميع', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle },
};

const PROPERTY_LABELS: Record<string, string> = {
  individual: 'منزل / شقة',
  compound: 'كمبوند',
  building: 'مبنى',
  villa: 'فيلا',
  commercial: 'محل تجاري',
};

const B2CCollectionFeed = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Fetch all B2C collection requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['b2c-collection-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_requests')
        .select('*')
        .is('organization_id', null) // Only public B2C requests
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Realtime subscription for new requests
  useEffect(() => {
    const channel = supabase
      .channel('b2c-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collection_requests' }, (payload) => {
        if (!(payload.new as any).organization_id) {
          queryClient.invalidateQueries({ queryKey: ['b2c-collection-requests'] });
          toast.info(`📦 طلب تجميع جديد من ${(payload.new as any).customer_name}`, { duration: 5000 });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('collection_requests')
        .update({
          status: 'accepted',
          accepted_by_org_id: organization?.id,
          accepted_at: new Date().toISOString(),
        } as any)
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2c-collection-requests'] });
      toast.success('تم قبول الطلب بنجاح');
    },
    onError: () => toast.error('فشل في قبول الطلب'),
  });

  // Mark as viewed
  const markViewed = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (req?.status === 'pending') {
      await supabase.from('collection_requests').update({ status: 'viewed' } as any).eq('id', requestId);
      queryClient.invalidateQueries({ queryKey: ['b2c-collection-requests'] });
    }
    setSelectedRequest(requestId);
  };

  // Update status
  const updateStatus = async (requestId: string, newStatus: string) => {
    await supabase.from('collection_requests').update({ 
      status: newStatus,
      ...(newStatus === 'collected' ? { completed_at: new Date().toISOString() } : {}),
    } as any).eq('id', requestId);
    queryClient.invalidateQueries({ queryKey: ['b2c-collection-requests'] });
    toast.success(`تم تحديث الحالة إلى: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
  };

  // Cluster nearby requests
  const clusters = useMemo(() => {
    const geoRequests = requests.filter(r => r.pickup_latitude && r.pickup_longitude && ['pending', 'viewed', 'accepted'].includes(r.status));
    const clustered: Record<string, typeof requests> = {};
    
    geoRequests.forEach(req => {
      // Group by governorate + area for simplicity
      const key = `${(req as any).governorate || 'غير محدد'}_${(req as any).area_name || 'عام'}`;
      if (!clustered[key]) clustered[key] = [];
      clustered[key].push(req);
    });

    return Object.entries(clustered)
      .filter(([_, reqs]) => reqs.length >= 2)
      .map(([key, reqs]) => {
        const [gov, area] = key.split('_');
        return { key, governorate: gov, area, requests: reqs, count: reqs.length };
      });
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.customer_name?.toLowerCase().includes(s) ||
          r.customer_phone?.includes(s) ||
          (r as any).customer_address?.toLowerCase().includes(s) ||
          (r as any).area_name?.toLowerCase().includes(s) ||
          (r as any).governorate?.toLowerCase().includes(s) ||
          (r as any).compound_name?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [requests, statusFilter, search]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    collected: requests.filter(r => r.status === 'collected' || r.status === 'completed').length,
  }), [requests]);

  const selectedReq = selectedRequest ? requests.find(r => r.id === selectedRequest) : null;

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">طلبات التجميع السكني (B2C)</h1>
            <p className="text-sm text-muted-foreground">الطلبات الواردة من العملاء على الموقع</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الطلبات', value: stats.total, icon: Package, color: 'text-primary' },
            { label: 'طلبات جديدة', value: stats.pending, icon: AlertCircle, color: 'text-amber-600' },
            { label: 'مقبولة', value: stats.accepted, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'تم التجميع', value: stats.collected, icon: TrendingUp, color: 'text-green-600' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Route Clusters */}
        {clusters.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                مجموعات التجميع القريبة ({clusters.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-2">
                {clusters.map(c => (
                  <Badge key={c.key} variant="outline" className="gap-1 cursor-pointer hover:bg-primary/10" onClick={() => setSearch(c.area)}>
                    <MapPin className="w-3 h-3" />
                    {c.governorate} — {c.area} ({c.count} طلبات)
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                💡 طلبات في نفس المنطقة يمكن تجميعها في رحلة واحدة لتوفير الوقت والتكلفة
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="list">
          <div className="flex items-center gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="list">القائمة</TabsTrigger>
              <TabsTrigger value="detail" disabled={!selectedReq}>التفاصيل</TabsTrigger>
            </TabsList>
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو المنطقة..." className="pr-9 text-sm" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="list" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : filteredRequests.length === 0 ? (
              <Card><CardContent className="p-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد طلبات</p>
              </CardContent></Card>
            ) : (
              filteredRequests.map(req => {
                const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const reqAny = req as any;
                return (
                  <Card key={req.id} className={`cursor-pointer hover:shadow-md transition-shadow ${req.status === 'pending' ? 'border-amber-300 dark:border-amber-700' : ''}`} onClick={() => markViewed(req.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm truncate">{req.customer_name}</span>
                            <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                            {req.status === 'pending' && <Badge variant="destructive" className="text-[10px] animate-pulse">جديد</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {req.customer_phone && (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{req.customer_phone}</span>
                            )}
                            {reqAny.governorate && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reqAny.governorate} {reqAny.area_name ? `- ${reqAny.area_name}` : ''}</span>
                            )}
                            {reqAny.property_type && (
                              <span className="flex items-center gap-1"><Home className="w-3 h-3" />{PROPERTY_LABELS[reqAny.property_type] || reqAny.property_type}</span>
                            )}
                            {reqAny.compound_name && (
                              <span className="flex items-center gap-1"><Building className="w-3 h-3" />{reqAny.compound_name}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(reqAny.waste_types || []).map((wt: string) => (
                              <Badge key={wt} variant="outline" className="text-[10px]">{wt}</Badge>
                            ))}
                            {!reqAny.waste_types?.length && req.waste_type && (
                              <Badge variant="outline" className="text-[10px]">{req.waste_type}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-left text-[10px] text-muted-foreground shrink-0">
                          <p>{format(new Date(req.created_at), 'dd MMM', { locale: ar })}</p>
                          <p>{format(new Date(req.created_at), 'hh:mm a', { locale: ar })}</p>
                          {reqAny.suggested_price && (
                            <p className="font-bold text-primary mt-1">{reqAny.suggested_price} ج.م</p>
                          )}
                        </div>
                      </div>

                      {/* Quick actions */}
                      {(req.status === 'pending' || req.status === 'viewed') && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" variant="eco" className="flex-1 text-xs gap-1" onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(req.id); }} disabled={acceptMutation.isPending}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> قبول الطلب
                          </Button>
                          {req.customer_phone && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); window.open(`tel:${req.customer_phone}`); }}>
                                <PhoneCall className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${req.customer_phone.replace(/^0/, '20')}`); }}>
                                <MessageCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {req.status === 'accepted' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" className="flex-1 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, 'in_progress'); }}>
                            <Navigation className="w-3.5 h-3.5" /> بدء التجميع
                          </Button>
                          {req.customer_phone && (
                            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); window.open(`tel:${req.customer_phone}`); }}>
                              <PhoneCall className="w-3.5 h-3.5" /> اتصال
                            </Button>
                          )}
                        </div>
                      )}

                      {req.status === 'in_progress' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" variant="eco" className="flex-1 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, 'collected'); }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> تم التجميع
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="detail" className="mt-4">
            {selectedReq && (() => {
              const reqAny = selectedReq as any;
              const status = STATUS_CONFIG[selectedReq.status] || STATUS_CONFIG.pending;
              return (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{selectedReq.customer_name}</h3>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium" dir="ltr">{selectedReq.customer_phone}</span></div>
                      {selectedReq.customer_email && <div><span className="text-muted-foreground">البريد:</span> <span className="font-medium">{selectedReq.customer_email}</span></div>}
                      {reqAny.governorate && <div><span className="text-muted-foreground">المحافظة:</span> <span className="font-medium">{reqAny.governorate}</span></div>}
                      {reqAny.area_name && <div><span className="text-muted-foreground">المنطقة:</span> <span className="font-medium">{reqAny.area_name}</span></div>}
                      {reqAny.customer_address && <div className="col-span-2"><span className="text-muted-foreground">العنوان:</span> <span className="font-medium">{reqAny.customer_address}</span></div>}
                      {reqAny.property_type && <div><span className="text-muted-foreground">نوع المكان:</span> <span className="font-medium">{PROPERTY_LABELS[reqAny.property_type] || reqAny.property_type}</span></div>}
                      {reqAny.compound_name && <div><span className="text-muted-foreground">الكمبوند:</span> <span className="font-medium">{reqAny.compound_name}</span></div>}
                      <div><span className="text-muted-foreground">المخلفات:</span> <span className="font-medium">{selectedReq.waste_type}</span></div>
                      {selectedReq.estimated_weight_kg && <div><span className="text-muted-foreground">الكمية:</span> <span className="font-medium">{selectedReq.estimated_weight_kg} كجم</span></div>}
                      {reqAny.suggested_price && <div><span className="text-muted-foreground">السعر المقترح:</span> <span className="font-medium text-primary">{reqAny.suggested_price} ج.م</span></div>}
                      {selectedReq.preferred_date && <div><span className="text-muted-foreground">التاريخ:</span> <span className="font-medium">{selectedReq.preferred_date}</span></div>}
                      {selectedReq.preferred_time_slot && <div><span className="text-muted-foreground">الوقت:</span> <span className="font-medium">{selectedReq.preferred_time_slot}</span></div>}
                      {selectedReq.notes && <div className="col-span-2"><span className="text-muted-foreground">ملاحظات:</span> <span className="font-medium">{selectedReq.notes}</span></div>}
                    </div>

                    {/* Photos */}
                    {reqAny.photos?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1"><ImageIcon className="w-4 h-4" />صور المخلفات</p>
                        <div className="flex gap-2 flex-wrap">
                          {reqAny.photos.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover border cursor-pointer hover:opacity-80" onClick={() => window.open(url, '_blank')} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Communication buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      {selectedReq.customer_phone && (
                        <>
                          <Button variant="outline" className="gap-2 flex-1" onClick={() => window.open(`tel:${selectedReq.customer_phone}`)}>
                            <PhoneCall className="w-4 h-4" /> اتصال
                          </Button>
                          <Button variant="outline" className="gap-2 flex-1" onClick={() => window.open(`https://wa.me/${selectedReq.customer_phone?.replace(/^0/, '20')}`)}>
                            <MessageCircle className="w-4 h-4 text-green-600" /> واتساب
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Status actions */}
                    {selectedReq.status === 'pending' || selectedReq.status === 'viewed' ? (
                      <Button variant="eco" className="w-full gap-2" onClick={() => acceptMutation.mutate(selectedReq.id)} disabled={acceptMutation.isPending}>
                        <CheckCircle2 className="w-4 h-4" /> قبول الطلب
                      </Button>
                    ) : selectedReq.status === 'accepted' ? (
                      <Button className="w-full gap-2" onClick={() => updateStatus(selectedReq.id, 'in_progress')}>
                        <Navigation className="w-4 h-4" /> بدء التجميع
                      </Button>
                    ) : selectedReq.status === 'in_progress' ? (
                      <Button variant="eco" className="w-full gap-2" onClick={() => updateStatus(selectedReq.id, 'collected')}>
                        <CheckCircle2 className="w-4 h-4" /> تم التجميع بنجاح
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default B2CCollectionFeed;
