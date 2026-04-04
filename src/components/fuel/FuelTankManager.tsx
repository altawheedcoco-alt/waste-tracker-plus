import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Container, Plus, AlertTriangle, Droplets } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const FuelTankManager = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [selectedTank, setSelectedTank] = useState<string>('');
  const [tankForm, setTankForm] = useState({ tank_name: '', fuel_type: 'diesel', capacity_liters: '', location: '' });
  const [txForm, setTxForm] = useState({ transaction_type: 'fill', liters: '', notes: '' });

  const { data: tanks = [] } = useQuery({
    queryKey: ['fuel-tanks', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('fuel_tanks').select('*').eq('organization_id', organization!.id).eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addTank = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('fuel_tanks').insert({
        organization_id: organization!.id,
        tank_name: tankForm.tank_name,
        fuel_type: tankForm.fuel_type,
        capacity_liters: parseFloat(tankForm.capacity_liters),
        location: tankForm.location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      toast.success('تم إضافة التانك');
      setAddOpen(false);
      setTankForm({ tank_name: '', fuel_type: 'diesel', capacity_liters: '', location: '' });
    },
  });

  const addTransaction = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('fuel_tank_transactions').insert({
        tank_id: selectedTank,
        organization_id: organization!.id,
        transaction_type: txForm.transaction_type,
        liters: parseFloat(txForm.liters),
        notes: txForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      toast.success(txForm.transaction_type === 'fill' ? 'تم تعبئة التانك' : 'تم السحب');
      setTxOpen(false);
      setTxForm({ transaction_type: 'fill', liters: '', notes: '' });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Container className="h-4 w-4 text-primary" />
            التانكات الداخلية
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-3 h-3 me-1" />إضافة تانك</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إضافة تانك وقود داخلي</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>اسم التانك</Label><Input value={tankForm.tank_name} onChange={e => setTankForm(f => ({ ...f, tank_name: e.target.value }))} placeholder="تانك المصنع الرئيسي" /></div>
                <div><Label>السعة (لتر)</Label><Input type="number" value={tankForm.capacity_liters} onChange={e => setTankForm(f => ({ ...f, capacity_liters: e.target.value }))} /></div>
                <div><Label>الموقع</Label><Input value={tankForm.location} onChange={e => setTankForm(f => ({ ...f, location: e.target.value }))} placeholder="البوابة الخلفية" /></div>
                <Button className="w-full" onClick={() => addTank.mutate()} disabled={!tankForm.tank_name || !tankForm.capacity_liters}>إضافة</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tanks.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">لا توجد تانكات داخلية مسجلة</p>
        ) : (
          <div className="space-y-3">
            {tanks.map((tank: any) => {
              const pct = tank.capacity_liters > 0 ? (tank.current_level / tank.capacity_liters) * 100 : 0;
              const isLow = pct <= tank.low_level_threshold;
              return (
                <div key={tank.id} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{tank.tank_name}</span>
                      {isLow && <Badge variant="destructive" className="text-[9px]"><AlertTriangle className="h-2.5 w-2.5 me-1" />منخفض</Badge>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setSelectedTank(tank.id); setTxOpen(true); }}>
                      تعبئة/سحب
                    </Button>
                  </div>
                  <Progress value={pct} className={`h-2 ${isLow ? '[&>div]:bg-destructive' : ''}`} />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{Math.round(tank.current_level)} / {tank.capacity_liters} لتر</span>
                    <span>{Math.round(pct)}%</span>
                    {tank.location && <span>📍 {tank.location}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={txOpen} onOpenChange={setTxOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>عملية على التانك</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>نوع العملية</Label>
                <Select value={txForm.transaction_type} onValueChange={v => setTxForm(f => ({ ...f, transaction_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fill">تعبئة (إضافة)</SelectItem>
                    <SelectItem value="withdraw">سحب (خروج)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الكمية (لتر)</Label><Input type="number" value={txForm.liters} onChange={e => setTxForm(f => ({ ...f, liters: e.target.value }))} /></div>
              <div><Label>ملاحظات</Label><Input value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={() => addTransaction.mutate()} disabled={!txForm.liters}>تنفيذ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FuelTankManager;
