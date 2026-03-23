import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, MessageSquareWarning, Phone, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Complaint {
  id: string;
  complaint_number: string;
  citizen_name: string | null;
  citizen_phone: string | null;
  complaint_type: string;
  description: string | null;
  location_text: string | null;
  priority: string;
  status: string;
  source: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

const COMPLAINT_TYPES: Record<string, string> = {
  missed_collection: 'عدم جمع القمامة',
  overflowing_bin: 'صندوق ممتلئ / فائض',
  damaged_bin: 'صندوق تالف',
  street_dirty: 'شارع غير نظيف',
  bad_smell: 'رائحة كريهة',
  illegal_dumping: 'إلقاء غير قانوني',
  noise: 'ضوضاء',
  worker_behavior: 'سلوك العمال',
  schedule_change: 'تغيير موعد الجمع',
  other: 'أخرى',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'متوسطة', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'عالية', color: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'عاجلة', color: 'bg-red-100 text-red-800' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'مفتوحة', color: 'text-red-600', icon: AlertTriangle },
  assigned: { label: 'مُعيّنة', color: 'text-amber-600', icon: User },
  in_progress: { label: 'جارية', color: 'text-blue-600', icon: Clock },
  resolved: { label: 'تم الحل', color: 'text-emerald-600', icon: CheckCircle2 },
  closed: { label: 'مغلقة', color: 'text-gray-500', icon: CheckCircle2 },
  rejected: { label: 'مرفوضة', color: 'text-red-400', icon: XCircle },
};

const SOURCE_LABELS: Record<string, string> = {
  platform: 'المنصة', hotline: 'خط ساخن', field: 'ميداني', government: 'جهة حكومية', social_media: 'سوشيال ميديا',
};

const CitizenComplaintsPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    citizen_name: '', citizen_phone: '', complaint_type: 'missed_collection',
    description: '', location_text: '', priority: 'medium', source: 'platform', zone_id: '',
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones-complaints', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name').eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['citizen-complaints', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('citizen_complaints').select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as Complaint[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('citizen_complaints').insert({
        organization_id: organization!.id,
        citizen_name: form.citizen_name || null, citizen_phone: form.citizen_phone || null,
        complaint_type: form.complaint_type, description: form.description || null,
        location_text: form.location_text || null, priority: form.priority, source: form.source,
        zone_id: form.zone_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-complaints'] });
      toast.success('تم تسجيل الشكوى');
      setDialogOpen(false);
      setForm({ citizen_name: '', citizen_phone: '', complaint_type: 'missed_collection', description: '', location_text: '', priority: 'medium', source: 'platform', zone_id: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      const { error } = await (supabase as any).from('citizen_complaints').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-complaints'] });
      toast.success('تم التحديث');
    },
  });

  const filtered = statusFilter === 'all' ? complaints : complaints.filter(c => c.status === statusFilter);
  const openCount = complaints.filter(c => c.status === 'open').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-primary" />
              شكاوى المواطنين
            </h1>
            <p className="text-sm text-muted-foreground">
              {openCount} مفتوحة • {resolvedCount} محلولة • {complaints.length} إجمالي
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />تسجيل شكوى</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>تسجيل شكوى مواطن</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>اسم المواطن</Label><Input value={form.citizen_name} onChange={e => setForm(f => ({ ...f, citizen_name: e.target.value }))} /></div>
                  <div><Label>رقم الهاتف</Label><Input value={form.citizen_phone} onChange={e => setForm(f => ({ ...f, citizen_phone: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>نوع الشكوى</Label>
                  <Select value={form.complaint_type} onValueChange={v => setForm(f => ({ ...f, complaint_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(COMPLAINT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="تفاصيل الشكوى..." /></div>
                <div><Label>الموقع</Label><Input value={form.location_text} onChange={e => setForm(f => ({ ...f, location_text: e.target.value }))} placeholder="شارع ... أمام ..." /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>الأولوية</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المصدر</Label>
                    <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(SOURCE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>المنطقة</Label>
                  <Select value={form.zone_id} onValueChange={v => setForm(f => ({ ...f, zone_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>{zones.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.zone_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  تسجيل الشكوى
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[{ k: 'all', l: 'الكل' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ k, l: v.label }))].map(f => (
            <Button key={f.k} size="sm" variant={statusFilter === f.k ? 'default' : 'outline'} className="text-xs whitespace-nowrap"
              onClick={() => setStatusFilter(f.k)}>{f.l}</Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquareWarning className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد شكاوى</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map(c => {
              const sCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.open;
              const Icon = sCfg.icon;
              return (
                <Card key={c.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${sCfg.color}`} />
                        <span className="font-mono text-xs text-muted-foreground">{c.complaint_number}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PRIORITY_CONFIG[c.priority]?.color}`}>
                          {PRIORITY_CONFIG[c.priority]?.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { locale: ar, addSuffix: true })}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{COMPLAINT_TYPES[c.complaint_type]}</p>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {c.citizen_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.citizen_name}</span>}
                      {c.citizen_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.citizen_phone}</span>}
                      {c.location_text && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location_text}</span>}
                    </div>
                    {c.status === 'open' && (
                      <div className="flex gap-1.5 mt-2">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus.mutate({ id: c.id, status: 'in_progress' })}>
                          بدء المعالجة
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus.mutate({ id: c.id, status: 'resolved' })}>
                          تم الحل
                        </Button>
                      </div>
                    )}
                    {c.status === 'in_progress' && (
                      <Button size="sm" variant="outline" className="text-xs h-7 mt-2" onClick={() => updateStatus.mutate({ id: c.id, status: 'resolved' })}>
                        <CheckCircle2 className="w-3 h-3 me-1" />تم الحل
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CitizenComplaintsPage;
