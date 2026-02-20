import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Truck, Star, Phone, Package, Plus,
  CheckCircle2, XCircle, UserCheck, Navigation, Calendar,
  Timer, AlertTriangle, Repeat
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  accepted: { label: 'مقبول', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  assigned: { label: 'تم التعيين', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: UserCheck },
  en_route: { label: 'في الطريق', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Navigation },
  arrived: { label: 'وصل', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: MapPin },
  collecting: { label: 'جاري الجمع', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Package },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const TIME_SLOTS: Record<string, string> = {
  morning: 'صباحاً (8-12)',
  afternoon: 'ظهراً (12-5)',
  evening: 'مساءً (5-9)',
  anytime: 'أي وقت',
};

const CollectionRequestManager: React.FC = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    waste_type: '', waste_description: '', estimated_weight_kg: '',
    pickup_address: '', preferred_date: '', preferred_time_slot: 'anytime',
    request_type: 'one_time', schedule_frequency: '', notes: '',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['collection-requests', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_requests')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('collection_requests').insert({
        organization_id: organization!.id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        customer_email: form.customer_email || null,
        waste_type: form.waste_type,
        waste_description: form.waste_description || null,
        estimated_weight_kg: form.estimated_weight_kg ? Number(form.estimated_weight_kg) : null,
        pickup_address: form.pickup_address,
        preferred_date: form.preferred_date || null,
        preferred_time_slot: form.preferred_time_slot,
        request_type: form.request_type as any,
        schedule_frequency: form.request_type === 'scheduled' ? form.schedule_frequency : null,
        notes: form.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-requests'] });
      setShowNewRequest(false);
      toast.success('تم إنشاء طلب الجمع بنجاح');
      setForm({ customer_name: '', customer_phone: '', customer_email: '', waste_type: '', waste_description: '', estimated_weight_kg: '', pickup_address: '', preferred_date: '', preferred_time_slot: 'anytime', request_type: 'one_time', schedule_frequency: '', notes: '' });
    },
    onError: () => toast.error('فشل في إنشاء الطلب'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from('collection_requests').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-requests'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const filtered = activeTab === 'all' ? requests :
    activeTab === 'active' ? requests.filter((r: any) => !['completed', 'cancelled', 'rejected'].includes(r.status)) :
    activeTab === 'scheduled' ? requests.filter((r: any) => r.request_type === 'scheduled') :
    requests.filter((r: any) => r.status === activeTab);

  const stats = {
    total: requests.length,
    pending: requests.filter((r: any) => r.status === 'pending').length,
    active: requests.filter((r: any) => ['accepted', 'assigned', 'en_route', 'arrived', 'collecting'].includes(r.status)).length,
    completed: requests.filter((r: any) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, icon: Package, color: 'text-primary' },
          { label: 'في الانتظار', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: 'نشطة', value: stats.active, icon: Truck, color: 'text-blue-500' },
          { label: 'مكتملة', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-3 text-center">
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-1`} />
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          طلبات الجمع
        </h2>
        <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />طلب جمع جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>طلب جمع مخلفات جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>اسم العميل *</Label><Input fieldContext="customer_name" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} /></div>
                <div><Label>الهاتف</Label><Input fieldContext="phone" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} dir="ltr" /></div>
              </div>
              <div><Label>البريد الإلكتروني</Label><Input fieldContext="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} dir="ltr" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع المخلفات *</Label>
                  <Select value={form.waste_type} onValueChange={v => setForm(p => ({ ...p, waste_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      {['بلاستيك', 'حديد', 'ورق وكرتون', 'زجاج', 'ألمنيوم', 'نحاس', 'إطارات', 'إلكترونيات', 'مخلفات خطرة', 'مخلفات عضوية', 'مخلفات بناء', 'أخرى'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>الوزن التقديري (كجم)</Label><Input type="number" value={form.estimated_weight_kg} onChange={e => setForm(p => ({ ...p, estimated_weight_kg: e.target.value }))} /></div>
              </div>
              <div><Label>عنوان الاستلام *</Label><Input fieldContext="pickup_address" value={form.pickup_address} onChange={e => setForm(p => ({ ...p, pickup_address: e.target.value }))} /></div>
              <div><Label>وصف إضافي</Label><Textarea value={form.waste_description} onChange={e => setForm(p => ({ ...p, waste_description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التاريخ المفضل</Label><Input type="date" value={form.preferred_date} onChange={e => setForm(p => ({ ...p, preferred_date: e.target.value }))} /></div>
                <div>
                  <Label>الفترة</Label>
                  <Select value={form.preferred_time_slot} onValueChange={v => setForm(p => ({ ...p, preferred_time_slot: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIME_SLOTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>نوع الطلب</Label>
                <Select value={form.request_type} onValueChange={v => setForm(p => ({ ...p, request_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">مرة واحدة</SelectItem>
                    <SelectItem value="scheduled">جدولة دورية</SelectItem>
                    <SelectItem value="emergency">طوارئ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.request_type === 'scheduled' && (
                <div>
                  <Label>تكرار الجدولة</Label>
                  <Select value={form.schedule_frequency} onValueChange={v => setForm(p => ({ ...p, schedule_frequency: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="biweekly">كل أسبوعين</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              <Button onClick={() => createMutation.mutate()} disabled={!form.customer_name || !form.waste_type || !form.pickup_address || createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء طلب الجمع'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل ({requests.length})</TabsTrigger>
          <TabsTrigger value="active">نشطة ({stats.active})</TabsTrigger>
          <TabsTrigger value="scheduled">مجدولة</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد طلبات</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((req: any) => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                  <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={cfg.color + ' gap-1'}>
                              <Icon className="w-3 h-3" />{cfg.label}
                            </Badge>
                            {req.request_type === 'scheduled' && (
                              <Badge variant="outline" className="gap-1 text-[10px]">
                                <Repeat className="w-3 h-3" />جدولة
                              </Badge>
                            )}
                            {req.request_type === 'emergency' && (
                              <Badge variant="destructive" className="gap-1 text-[10px]">
                                <AlertTriangle className="w-3 h-3" />طوارئ
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Package className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-medium">{req.customer_name}</span>
                          </div>
                          {req.customer_phone && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                              <span dir="ltr">{req.customer_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">{req.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{req.waste_type} {req.estimated_weight_kg ? `• ${req.estimated_weight_kg} كجم` : ''}</span>
                          </div>
                        </div>

                        {req.preferred_date && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(req.preferred_date).toLocaleDateString('ar-EG')} - {TIME_SLOTS[req.preferred_time_slot] || req.preferred_time_slot}
                          </div>
                        )}

                        {req.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= req.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                            ))}
                            {req.rating_comment && <span className="text-xs text-muted-foreground mr-2">{req.rating_comment}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'accepted' })}>قبول</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}>رفض</Button>
                          </div>
                        )}
                        {req.status === 'accepted' && (
                          <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'assigned' })}>تعيين سائق</Button>
                        )}
                        {['assigned', 'en_route', 'arrived', 'collecting'].includes(req.status) && (
                          <div className="flex gap-2 mt-2">
                            {req.status === 'assigned' && <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'en_route' })}>في الطريق</Button>}
                            {req.status === 'en_route' && <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'arrived' })}>وصل</Button>}
                            {req.status === 'arrived' && <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'collecting' })}>بدأ الجمع</Button>}
                            {req.status === 'collecting' && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'completed' })}>اكتمل</Button>}
                            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'cancelled' })}>إلغاء</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollectionRequestManager;
