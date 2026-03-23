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
import { toast } from 'sonner';
import { Plus, Play, CheckCircle2, Camera, MapPin, Clock, Truck, Scale, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface CollectionTrip {
  id: string;
  trip_date: string;
  status: string;
  bins_collected: number;
  total_bins: number;
  weight_tons: number | null;
  distance_km: number | null;
  actual_start: string | null;
  actual_end: string | null;
  completion_percent: number;
  driver_id: string | null;
  route_id: string | null;
  issues: string | null;
  notes: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'في الانتظار', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'جارية', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'مكتملة', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-800' },
  incomplete: { label: 'غير مكتملة', color: 'bg-amber-100 text-amber-800' },
};

const CollectionTripsPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ route_id: '', driver_id: '', total_bins: '', notes: '' });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-trips', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_routes').select('id, route_name').eq('organization_id', organization!.id).eq('status', 'active');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-trips', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('profiles').select('id, full_name').eq('organization_id', organization!.id).eq('role', 'driver').eq('is_active', true);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['collection-trips', organization?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('collection_trips').select('*')
        .eq('organization_id', organization!.id).eq('trip_date', selectedDate)
        .order('actual_start', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as CollectionTrip[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('collection_trips').insert({
        organization_id: organization!.id,
        route_id: form.route_id || null,
        driver_id: form.driver_id || null,
        trip_date: selectedDate,
        total_bins: parseInt(form.total_bins) || 0,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-trips'] });
      toast.success('تم إنشاء الرحلة');
      setDialogOpen(false);
      setForm({ route_id: '', driver_id: '', total_bins: '', notes: '' });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await (supabase as any).from('collection_trips').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-trips'] });
      toast.success('تم التحديث');
    },
  });

  const startTrip = (id: string) => updateTrip.mutate({ id, updates: { status: 'in_progress', actual_start: new Date().toISOString() } });
  const completeTrip = (id: string, binsCollected: number, totalBins: number) => {
    updateTrip.mutate({ id, updates: {
      status: binsCollected >= totalBins ? 'completed' : 'incomplete',
      actual_end: new Date().toISOString(),
      bins_collected: binsCollected,
      completion_percent: totalBins > 0 ? Math.round((binsCollected / totalBins) * 100) : 100,
    }});
  };

  const totalBinsToday = trips.reduce((s, t) => s + t.total_bins, 0);
  const collectedToday = trips.reduce((s, t) => s + t.bins_collected, 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" />رحلات الجمع</h1>
            <p className="text-sm text-muted-foreground">{completedTrips}/{trips.length} مكتملة • {collectedToday}/{totalBinsToday} صندوق</p>
          </div>
          <div className="flex gap-2">
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-36" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 me-1" />رحلة جديدة</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إنشاء رحلة جمع</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>المسار</Label>
                    <Select value={form.route_id} onValueChange={v => setForm(f => ({ ...f, route_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المسار" /></SelectTrigger>
                      <SelectContent>{routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>السائق</Label>
                    <Select value={form.driver_id} onValueChange={v => setForm(f => ({ ...f, driver_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر السائق" /></SelectTrigger>
                      <SelectContent>{drivers.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>عدد الصناديق المستهدف</Label><Input type="number" value={form.total_bins} onChange={e => setForm(f => ({ ...f, total_bins: e.target.value }))} /></div>
                  <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>إنشاء</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : trips.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد رحلات لهذا اليوم</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {trips.map(trip => (
              <Card key={trip.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-[10px] ${STATUS_CONFIG[trip.status]?.color}`}>{STATUS_CONFIG[trip.status]?.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {trip.actual_start ? format(new Date(trip.actual_start), 'HH:mm') : '—'}
                      {trip.actual_end ? ` → ${format(new Date(trip.actual_end), 'HH:mm')}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{trip.bins_collected}/{trip.total_bins} صندوق</span>
                        <span className="font-bold text-primary">{trip.completion_percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${trip.completion_percent >= 100 ? 'bg-emerald-500' : trip.completion_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(trip.completion_percent, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {trip.weight_tons && <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{trip.weight_tons} طن</span>}
                    {trip.distance_km && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.distance_km} كم</span>}
                  </div>
                  {trip.issues && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{trip.issues}</p>}

                  <div className="flex gap-1.5 mt-2">
                    {trip.status === 'pending' && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => startTrip(trip.id)}>
                        <Play className="w-3 h-3 me-1" />بدء الرحلة
                      </Button>
                    )}
                    {trip.status === 'in_progress' && (
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => completeTrip(trip.id, trip.total_bins, trip.total_bins)}>
                        <CheckCircle2 className="w-3 h-3 me-1" />إنهاء (مكتملة)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CollectionTripsPage;
