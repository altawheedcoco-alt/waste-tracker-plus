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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Lock, Unlock, Plus, Calendar, MapPin, Scale, DollarSign, ArrowLeftRight, Shield } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground' },
  proposed: { label: 'مقترح', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  active: { label: 'نشط', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  completed: { label: 'مكتمل', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  terminated: { label: 'منتهي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const TransportFuturesPanel: React.FC = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    counterparty_name: '', waste_type: '', route_from: '', route_to: '',
    distance_km: '', fixed_price_per_ton: '', volume_tons_per_month: '',
    contract_duration_months: '6', start_date: '', end_date: '',
    current_market_price: '', fuel_surcharge_cap: '',
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['transport-futures', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('transport_futures')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const contractNumber = `FUT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('transport_futures').insert({
        organization_id: organization!.id,
        contract_number: contractNumber,
        counterparty_name: form.counterparty_name,
        waste_type: form.waste_type,
        route_from: form.route_from,
        route_to: form.route_to,
        distance_km: Number(form.distance_km) || null,
        fixed_price_per_ton: Number(form.fixed_price_per_ton),
        volume_tons_per_month: Number(form.volume_tons_per_month),
        contract_duration_months: Number(form.contract_duration_months),
        start_date: form.start_date,
        end_date: form.end_date,
        current_market_price: Number(form.current_market_price) || null,
        price_difference: form.current_market_price ? Number(form.fixed_price_per_ton) - Number(form.current_market_price) : null,
        fuel_surcharge_cap: Number(form.fuel_surcharge_cap) || null,
        created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-futures'] });
      setShowNew(false);
      toast.success('تم إنشاء العقد الآجل');
    },
    onError: () => toast.error('فشل في إنشاء العقد'),
  });

  const totalContractValue = contracts.filter((c: any) => c.status === 'active').reduce((sum: number, c: any) => sum + (c.total_contract_value || 0), 0);
  const activeContracts = contracts.filter((c: any) => c.status === 'active').length;
  const totalVolume = contracts.filter((c: any) => c.status === 'active').reduce((sum: number, c: any) => sum + (c.volume_tons_per_month || 0), 0);

  const fixedPrice = Number(form.fixed_price_per_ton) || 0;
  const marketPrice = Number(form.current_market_price) || 0;
  const savings = marketPrice > 0 ? ((marketPrice - fixedPrice) / marketPrice * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'عقود نشطة', value: activeContracts, icon: Lock, color: 'text-emerald-500' },
          { label: 'قيمة العقود', value: `${(totalContractValue / 1000).toFixed(0)}K ج.م`, icon: DollarSign, color: 'text-blue-500' },
          { label: 'حجم شهري (طن)', value: totalVolume, icon: Scale, color: 'text-purple-500' },
          { label: 'إجمالي العقود', value: contracts.length, icon: ArrowLeftRight, color: 'text-muted-foreground' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-3 text-center">
              <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-1`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          العقود الآجلة للنقل
        </h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />عقد جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إنشاء عقد آجل</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <div><Label>الطرف المقابل *</Label><Input value={form.counterparty_name} onChange={e => setForm(p => ({ ...p, counterparty_name: e.target.value }))} /></div>
              <div><Label>نوع المخلفات *</Label><Input value={form.waste_type} onChange={e => setForm(p => ({ ...p, waste_type: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>من</Label><Input value={form.route_from} onChange={e => setForm(p => ({ ...p, route_from: e.target.value }))} /></div>
                <div><Label>إلى</Label><Input value={form.route_to} onChange={e => setForm(p => ({ ...p, route_to: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>السعر الثابت/طن (ج.م) *</Label><Input type="number" value={form.fixed_price_per_ton} onChange={e => setForm(p => ({ ...p, fixed_price_per_ton: e.target.value }))} /></div>
                <div><Label>الحجم الشهري (طن) *</Label><Input type="number" value={form.volume_tons_per_month} onChange={e => setForm(p => ({ ...p, volume_tons_per_month: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ البداية *</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div><Label>تاريخ النهاية *</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>سعر السوق الحالي/طن</Label><Input type="number" value={form.current_market_price} onChange={e => setForm(p => ({ ...p, current_market_price: e.target.value }))} /></div>
                <div><Label>سقف رسوم الوقود (%)</Label><Input type="number" value={form.fuel_surcharge_cap} onChange={e => setForm(p => ({ ...p, fuel_surcharge_cap: e.target.value }))} /></div>
              </div>

              {/* Savings Preview */}
              {marketPrice > 0 && fixedPrice > 0 && (
                <Card className={`border-${savings > 0 ? 'emerald' : 'red'}-500/30 bg-${savings > 0 ? 'emerald' : 'red'}-500/5`}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {savings > 0 ? <TrendingDown className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-red-500" />}
                      <span className="text-sm">{savings > 0 ? 'توفير' : 'تكلفة إضافية'}</span>
                    </div>
                    <span className={`font-bold ${savings > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {Math.abs(savings).toFixed(1)}%
                    </span>
                  </CardContent>
                </Card>
              )}

              <Button onClick={() => createMutation.mutate()} disabled={!form.counterparty_name || !form.waste_type || !form.fixed_price_per_ton || !form.volume_tons_per_month || !form.start_date || !form.end_date || createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء العقد'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts List */}
      <div className="space-y-2">
        {contracts.map((c: any) => {
          const st = STATUS_LABELS[c.status] || STATUS_LABELS.draft;
          const diff = c.price_difference;
          return (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{c.contract_number}</p>
                    <p className="text-xs text-muted-foreground">{c.counterparty_name} • {c.waste_type}</p>
                  </div>
                  <Badge className={st.color}>{st.label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-1">
                  <div><span className="text-muted-foreground">سعر ثابت:</span> <span className="font-bold">{c.fixed_price_per_ton?.toLocaleString()} ج.م/طن</span></div>
                  <div><span className="text-muted-foreground">حجم شهري:</span> <span className="font-bold">{c.volume_tons_per_month} طن</span></div>
                  <div>
                    <span className="text-muted-foreground">قيمة العقد:</span>{' '}
                    <span className="font-bold">{c.total_contract_value?.toLocaleString()} ج.م</span>
                  </div>
                </div>
                {c.route_from && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="w-3 h-3" />{c.route_from} → {c.route_to}
                    <span className="mr-2"><Calendar className="w-3 h-3 inline" /> {new Date(c.start_date).toLocaleDateString('ar-EG')} - {new Date(c.end_date).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
                {diff !== null && diff !== undefined && (
                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${diff < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {diff < 0 ? `توفير ${Math.abs(diff).toLocaleString()} ج.م/طن عن السوق` : `أعلى من السوق بـ ${diff.toLocaleString()} ج.م/طن`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {contracts.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد عقود آجلة</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default TransportFuturesPanel;
