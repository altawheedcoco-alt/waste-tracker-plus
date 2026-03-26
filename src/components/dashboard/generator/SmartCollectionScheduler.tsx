import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Plus, Clock, CheckCircle2, AlertCircle, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const SmartCollectionScheduler = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    waste_type: '',
    frequency: 'weekly',
    preferred_day: 'sunday',
    preferred_time: '08:00',
    quantity_estimate: '',
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['collection-schedules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('scheduled_collections')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Upcoming collection requests
  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-collections', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('collection_requests')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['pending', 'accepted'])
        .order('preferred_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const handleCreateSchedule = async () => {
    if (!organization?.id || !formData.waste_type) return;
    const { error } = await supabase.from('scheduled_collections').insert({
      generator_id: organization.id,
      waste_type: formData.waste_type,
      frequency: formData.frequency,
      preferred_day: formData.preferred_day,
      preferred_time: formData.preferred_time,
      quantity_estimate: formData.quantity_estimate ? parseFloat(formData.quantity_estimate) : null,
      is_active: true,
    });
    if (error) {
      toast.error('فشل في إنشاء الجدولة');
    } else {
      toast.success('تم إنشاء جدولة الجمع');
      queryClient.invalidateQueries({ queryKey: ['collection-schedules'] });
      setShowDialog(false);
      setFormData({ waste_type: '', frequency: 'weekly', preferred_day: 'sunday', preferred_time: '08:00', quantity_estimate: '' });
    }
  };

  const dayNames: Record<string, string> = {
    sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
  };

  const freqNames: Record<string, string> = {
    daily: 'يومي', weekly: 'أسبوعي', biweekly: 'كل أسبوعين', monthly: 'شهري',
  };

  if (isLoading) return <Skeleton className="h-[250px]" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                جدولة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء جدولة جمع دورية</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نوع المخلفات</Label>
                  <Input value={formData.waste_type} onChange={e => setFormData(p => ({ ...p, waste_type: e.target.value }))} placeholder="بلاستيك، خشب، حديد..." />
                </div>
                <div>
                  <Label>التكرار</Label>
                  <Select value={formData.frequency} onValueChange={v => setFormData(p => ({ ...p, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="biweekly">كل أسبوعين</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>اليوم المفضل</Label>
                  <Select value={formData.preferred_day} onValueChange={v => setFormData(p => ({ ...p, preferred_day: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(dayNames).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الكمية التقديرية (طن)</Label>
                  <Input type="number" value={formData.quantity_estimate} onChange={e => setFormData(p => ({ ...p, quantity_estimate: e.target.value }))} placeholder="اختياري" />
                </div>
                <Button onClick={handleCreateSchedule} className="w-full">إنشاء الجدولة</Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <CalendarDays className="w-5 h-5" />
              جدولة الجمع الذكية
            </CardTitle>
            <CardDescription>مواعيد جمع دورية تلقائية</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active schedules */}
        {schedules && schedules.length > 0 ? (
          schedules.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 ml-1" />
                {freqNames[s.frequency] || s.frequency} — {dayNames[s.preferred_day] || s.preferred_day}
              </Badge>
              <div className="text-right">
                <span className="text-sm font-medium">{s.waste_type}</span>
                {s.quantity_estimate && <span className="text-xs text-muted-foreground mr-2">({s.quantity_estimate} طن)</span>}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد جدولات دورية</p>
            <p className="text-xs">أنشئ جدولة لتنظيم عمليات الجمع</p>
          </div>
        )}

        {/* Pending requests */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right">طلبات جمع معلقة</h4>
            {pendingRequests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1">
                <Badge variant={r.status === 'accepted' ? 'default' : 'secondary'} className="text-xs">
                  {r.status === 'accepted' ? 'مقبول' : 'معلق'}
                </Badge>
                <span>{r.waste_type} — {new Date(r.preferred_date).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartCollectionScheduler;
