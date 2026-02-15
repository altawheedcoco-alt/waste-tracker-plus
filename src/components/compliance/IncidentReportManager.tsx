import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, Plus, MapPin, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  incident_at: string;
  immediate_actions: string | null;
  authority_notified: boolean;
  status: string;
  created_at: string;
}

const INCIDENT_TYPES: Record<string, string> = {
  spill: 'انسكاب مواد',
  accident: 'حادث مروري',
  breakdown: 'عطل ميكانيكي',
  route_deviation: 'انحراف عن المسار',
  other: 'أخرى',
};

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'مرتفع', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800' },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'مفتوح', color: 'bg-red-100 text-red-800' },
  investigating: { label: 'قيد التحقيق', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800' },
  closed: { label: 'مغلق', color: 'bg-gray-100 text-gray-800' },
};

const IncidentReportManager = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    incident_type: 'spill',
    severity: 'medium',
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    location_address: '',
    immediate_actions: '',
    authority_notified: false,
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['transport-incidents', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_incidents')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('incident_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Incident[];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('transport_incidents').insert({
        organization_id: organization!.id,
        incident_type: data.incident_type,
        severity: data.severity,
        title: data.title,
        description: data.description || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        location_address: data.location_address || null,
        immediate_actions: data.immediate_actions || null,
        authority_notified: data.authority_notified,
        reported_by: profile?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-incidents'] });
      toast.success('تم تسجيل الحادث بنجاح');
      setShowDialog(false);
      setFormData({ incident_type: 'spill', severity: 'medium', title: '', description: '', latitude: '', longitude: '', location_address: '', immediate_actions: '', authority_notified: false });
    },
    onError: () => toast.error('خطأ في تسجيل الحادث'),
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFormData(p => ({
          ...p,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        setGettingLocation(false);
        toast.success('تم تحديد الموقع');
      },
      () => {
        setGettingLocation(false);
        toast.error('فشل في تحديد الموقع');
      }
    );
  };

  const stats = {
    open: incidents.filter(i => i.status === 'open').length,
    critical: incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
    total: incidents.length,
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Alert banner for critical */}
      {stats.critical > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-3 flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-bold">{stats.critical} حوادث حرجة مفتوحة تتطلب تدخل فوري</span>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" /> سجل الحوادث والانسكابات
        </h3>
        <Button size="sm" variant="destructive" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 ml-1" /> تقرير حادث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الحوادث</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-xs text-muted-foreground">مفتوحة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
          <p className="text-xs text-muted-foreground">حرجة</p>
        </CardContent></Card>
      </div>

      {/* Incidents */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
      ) : incidents.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>لا توجد حوادث مسجلة</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const sev = SEVERITY_MAP[inc.severity] || SEVERITY_MAP.medium;
            const st = STATUS_MAP[inc.status] || STATUS_MAP.open;
            return (
              <Card key={inc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">{inc.title}</p>
                      <p className="text-sm text-muted-foreground">{INCIDENT_TYPES[inc.incident_type]}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={sev.color}>{sev.label}</Badge>
                      <Badge className={st.color}>{st.label}</Badge>
                    </div>
                  </div>
                  {inc.description && <p className="text-sm mb-2">{inc.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(inc.incident_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                    </span>
                    {inc.latitude && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {inc.latitude.toFixed(4)}, {inc.longitude?.toFixed(4)}
                      </span>
                    )}
                    {inc.authority_notified && (
                      <Badge variant="outline" className="text-xs">تم إبلاغ الجهات</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> تقرير حادث / انسكاب
            </DialogTitle>
            <DialogDescription>توثيق الحادث فوراً مع تحديد الموقع</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>عنوان الحادث *</Label>
              <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="وصف مختصر للحادث" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نوع الحادث</Label>
                <Select value={formData.incident_type} onValueChange={v => setFormData(p => ({ ...p, incident_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCIDENT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الخطورة</Label>
                <Select value={formData.severity} onValueChange={v => setFormData(p => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>تفاصيل الحادث</Label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" /> الموقع الجغرافي</Label>
                <Button type="button" size="sm" variant="outline" onClick={getCurrentLocation} disabled={gettingLocation}>
                  {gettingLocation ? 'جاري التحديد...' : 'تحديد موقعي'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="خط العرض" value={formData.latitude} onChange={e => setFormData(p => ({ ...p, latitude: e.target.value }))} />
                <Input placeholder="خط الطول" value={formData.longitude} onChange={e => setFormData(p => ({ ...p, longitude: e.target.value }))} />
              </div>
              <Input placeholder="العنوان" value={formData.location_address} onChange={e => setFormData(p => ({ ...p, location_address: e.target.value }))} />
            </div>

            <div>
              <Label>الإجراءات الفورية المتخذة</Label>
              <Textarea value={formData.immediate_actions} onChange={e => setFormData(p => ({ ...p, immediate_actions: e.target.value }))} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.authority_notified}
                onChange={e => setFormData(p => ({ ...p, authority_notified: e.target.checked }))} />
              <Label className="text-sm">تم إبلاغ الجهات الرقابية (وزارة البيئة / الحماية المدنية)</Label>
            </div>

            <Button className="w-full" variant="destructive" onClick={() => addMutation.mutate(formData)}
              disabled={!formData.title || addMutation.isPending}>
              {addMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الحادث'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentReportManager;
