import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, CalendarDays, MapPin, Clock, User, Truck, CheckCircle2, XCircle, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TripSchedule {
  id: string;
  driver_id: string | null;
  trip_date: string;
  start_time: string | null;
  end_time: string | null;
  route_description: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  driver?: { full_name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; color: string; icon: any }> = {
  scheduled: { label: 'مجدولة', labelEn: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: CalendarDays },
  in_progress: { label: 'جارية', labelEn: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: Play },
  completed: { label: 'مكتملة', labelEn: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', labelEn: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const DriverTripSchedule = () => {
  const { isRTL } = useLanguage();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState({ driver_id: '', trip_date: format(new Date(), 'yyyy-MM-dd'), start_time: '08:00', end_time: '16:00', route_description: '', notes: '' });

  const { data: drivers = [] } = useQuery({
    queryKey: ['org-drivers', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', organization!.id)
        .eq('role', 'driver')
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trip-schedules', organization?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_trip_schedules')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('trip_date', selectedDate)
        .order('start_time');
      if (error) throw error;
      // Enrich with driver names
      const driverIds = [...new Set((data || []).map(t => t.driver_id).filter(Boolean))];
      let driverMap: Record<string, string> = {};
      if (driverIds.length) {
        const { data: drvs } = await supabase.from('profiles').select('id, full_name').in('id', driverIds);
        driverMap = Object.fromEntries((drvs || []).map(d => [d.id, d.full_name]));
      }
      return (data || []).map(t => ({ ...t, driver: t.driver_id ? { full_name: driverMap[t.driver_id] || '—' } : null })) as TripSchedule[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('driver_trip_schedules').insert({
        organization_id: organization!.id,
        driver_id: form.driver_id || null,
        trip_date: form.trip_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        route_description: form.route_description || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-schedules'] });
      toast.success(isRTL ? 'تمت جدولة الرحلة' : 'Trip scheduled');
      setDialogOpen(false);
      setForm({ driver_id: '', trip_date: selectedDate, start_time: '08:00', end_time: '16:00', route_description: '', notes: '' });
    },
    onError: () => toast.error(isRTL ? 'حدث خطأ' : 'Error'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('driver_trip_schedules').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-schedules'] });
      toast.success(isRTL ? 'تم التحديث' : 'Updated');
    },
  });

  const statusCounts = trips.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold">{isRTL ? 'جدولة رحلات السائقين' : 'Driver Trip Schedule'}</h1>
            <div className="flex gap-2 mt-1">
              {Object.entries(statusCounts).map(([s, c]) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[s]?.color || ''}`}>
                  {isRTL ? STATUS_CONFIG[s]?.label : STATUS_CONFIG[s]?.labelEn}: {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-40" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 me-1" />{isRTL ? 'جدولة رحلة' : 'Schedule Trip'}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{isRTL ? 'جدولة رحلة جديدة' : 'Schedule New Trip'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>{isRTL ? 'السائق' : 'Driver'}</Label>
                    <Select value={form.driver_id} onValueChange={v => setForm(f => ({ ...f, driver_id: v }))}>
                      <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر سائقاً' : 'Select driver'} /></SelectTrigger>
                      <SelectContent>
                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{isRTL ? 'التاريخ' : 'Date'}</Label><Input type="date" value={form.trip_date} onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>{isRTL ? 'بداية' : 'Start'}</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
                    <div><Label>{isRTL ? 'نهاية' : 'End'}</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
                  </div>
                  <div><Label>{isRTL ? 'وصف المسار' : 'Route Description'}</Label><Textarea value={form.route_description} onChange={e => setForm(f => ({ ...f, route_description: e.target.value }))} placeholder={isRTL ? 'مثال: من المنطقة الصناعية إلى مصنع التدوير' : 'e.g. Industrial zone to recycling plant'} /></div>
                  <div><Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {isRTL ? 'جدولة' : 'Schedule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : trips.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />{isRTL ? 'لا توجد رحلات مجدولة لهذا اليوم' : 'No trips scheduled for this day'}</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {trips.map(trip => {
              const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.scheduled;
              const Icon = cfg.icon;
              return (
                <Card key={trip.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-semibold text-sm">{trip.driver?.full_name || (isRTL ? 'غير محدد' : 'Unassigned')}</span>
                          </div>
                          {trip.start_time && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="w-3 h-3" />
                              {trip.start_time?.slice(0, 5)} — {trip.end_time?.slice(0, 5) || '?'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {trip.status === 'scheduled' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: trip.id, status: 'in_progress' })}>
                            <Play className="w-3 h-3 me-1" />{isRTL ? 'بدء' : 'Start'}
                          </Button>
                        )}
                        {trip.status === 'in_progress' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: trip.id, status: 'completed' })}>
                            <CheckCircle2 className="w-3 h-3 me-1" />{isRTL ? 'إنهاء' : 'Complete'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {trip.route_description && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />{trip.route_description}
                      </p>
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

export default DriverTripSchedule;
