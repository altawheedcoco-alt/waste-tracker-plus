import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  CheckCircle2,
  Settings,
} from 'lucide-react';

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const RecyclerTimeslotManager = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: '0',
    start_time: '08:00',
    end_time: '09:00',
    max_capacity: '3',
  });

  const orgId = organization?.id;

  const { data: timeslots = [], isLoading } = useQuery({
    queryKey: ['recycler-timeslots', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('recycler_timeslots')
        .select('*')
        .eq('organization_id', orgId)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('recycler_timeslots').insert({
        organization_id: orgId,
        day_of_week: parseInt(newSlot.day_of_week),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        max_capacity: parseInt(newSlot.max_capacity),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycler-timeslots'] });
      setShowAddDialog(false);
      toast.success('تم إضافة الفترة الزمنية');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('recycler_timeslots')
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycler-timeslots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recycler_timeslots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycler-timeslots'] });
      toast.success('تم حذف الفترة');
    },
  });

  const grouped = useMemo(() => {
    const map: Record<number, typeof timeslots> = {};
    timeslots.forEach(s => {
      if (!map[s.day_of_week]) map[s.day_of_week] = [];
      map[s.day_of_week].push(s);
    });
    return map;
  }, [timeslots]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">إدارة مواعيد الاستقبال</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة فترة
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>لم يتم إعداد فترات زمنية بعد</p>
            <p className="text-sm">أضف فترات لتنظيم مواعيد استقبال الشحنات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map(day => {
            const slots = grouped[day];
            if (!slots?.length) return null;
            return (
              <Card key={day}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {DAYS_AR[day]}
                    <Badge variant="secondary" className="text-xs">{slots.length} فترة</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg border text-sm',
                        slot.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(slot.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => toggleMutation.mutate({ id: slot.id, is_active: !slot.is_active })}
                        >
                          {slot.is_active ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          سعة: {slot.max_capacity}
                        </Badge>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{slot.start_time?.slice(0, 5)}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{slot.end_time?.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>إضافة فترة زمنية</DialogTitle>
            <DialogDescription>حدد يوم وساعة ومتاح الاستقبال</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اليوم</Label>
              <Select value={newSlot.day_of_week} onValueChange={v => setNewSlot(p => ({ ...p, day_of_week: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_AR.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>من الساعة</Label>
                <Input type="time" value={newSlot.start_time} onChange={e => setNewSlot(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <Label>إلى الساعة</Label>
                <Input type="time" value={newSlot.end_time} onChange={e => setNewSlot(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>السعة القصوى (عدد الشحنات)</Label>
              <Input type="number" min="1" max="50" value={newSlot.max_capacity} onChange={e => setNewSlot(p => ({ ...p, max_capacity: e.target.value }))} />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="w-full gap-2">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecyclerTimeslotManager;
