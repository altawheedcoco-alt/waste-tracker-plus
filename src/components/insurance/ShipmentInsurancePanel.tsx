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
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, DollarSign, FileText, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const COVERAGE_CONFIG: Record<string, { label: string; multiplier: number; color: string }> = {
  basic: { label: 'أساسي', multiplier: 0.005, color: 'text-muted-foreground' },
  standard: { label: 'قياسي', multiplier: 0.01, color: 'text-blue-500' },
  comprehensive: { label: 'شامل', multiplier: 0.02, color: 'text-emerald-500' },
  hazardous: { label: 'مواد خطرة', multiplier: 0.04, color: 'text-red-500' },
};

const calculatePremium = (params: {
  coverageType: string;
  shipmentValue: number;
  distanceKm: number;
  weightKg: number;
  driverRiskScore: number;
  hazardLevel: string;
}) => {
  const base = COVERAGE_CONFIG[params.coverageType]?.multiplier || 0.01;
  let premium = params.shipmentValue * base;
  
  // Distance factor
  if (params.distanceKm > 200) premium *= 1.3;
  else if (params.distanceKm > 100) premium *= 1.15;
  
  // Weight factor
  if (params.weightKg > 10000) premium *= 1.2;
  
  // Driver risk
  if (params.driverRiskScore > 70) premium *= 0.85; // good driver discount
  else if (params.driverRiskScore < 30) premium *= 1.4; // risky driver surcharge
  
  // Hazardous surcharge
  if (params.hazardLevel === 'hazardous') premium *= 2.5;
  else if (params.hazardLevel === 'slightly_hazardous') premium *= 1.5;
  
  return Math.round(premium * 100) / 100;
};

const ShipmentInsurancePanel: React.FC = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    waste_type: '', coverage_type: 'standard', shipment_value: '',
    distance_km: '', weight_kg: '', driver_risk_score: '50',
    hazard_level: 'non_hazardous',
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['insurance-policies', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipment_insurance')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization,
  });

  const estimatedPremium = calculatePremium({
    coverageType: form.coverage_type,
    shipmentValue: Number(form.shipment_value) || 0,
    distanceKm: Number(form.distance_km) || 0,
    weightKg: Number(form.weight_kg) || 0,
    driverRiskScore: Number(form.driver_risk_score) || 50,
    hazardLevel: form.hazard_level,
  });

  const coverageAmount = (Number(form.shipment_value) || 0) * (form.coverage_type === 'comprehensive' ? 1.5 : form.coverage_type === 'hazardous' ? 2 : 1);

  const createMutation = useMutation({
    mutationFn: async () => {
      const policyNumber = `INS-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('shipment_insurance').insert({
        organization_id: organization!.id,
        policy_number: policyNumber,
        waste_type: form.waste_type,
        coverage_type: form.coverage_type,
        waste_hazard_level: form.hazard_level,
        distance_km: Number(form.distance_km) || null,
        shipment_weight_kg: Number(form.weight_kg) || null,
        shipment_value: Number(form.shipment_value) || 0,
        driver_risk_score: Number(form.driver_risk_score) || 50,
        premium_amount: estimatedPremium,
        coverage_amount: coverageAmount,
        deductible_amount: estimatedPremium * 0.1,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-policies'] });
      setShowNew(false);
      toast.success('تم إنشاء وثيقة التأمين');
    },
    onError: () => toast.error('فشل في إنشاء الوثيقة'),
  });

  const activeCount = policies.filter((p: any) => p.status === 'active').length;
  const totalPremiums = policies.reduce((sum: number, p: any) => sum + (p.premium_amount || 0), 0);
  const totalCoverage = policies.filter((p: any) => p.status === 'active').reduce((sum: number, p: any) => sum + (p.coverage_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'وثائق نشطة', value: activeCount, icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'إجمالي الأقساط', value: `${totalPremiums.toLocaleString()} ج.م`, icon: DollarSign, color: 'text-blue-500' },
          { label: 'إجمالي التغطية', value: `${totalCoverage.toLocaleString()} ج.م`, icon: Shield, color: 'text-purple-500' },
          { label: 'مطالبات', value: policies.filter((p: any) => p.claim_status).length, icon: FileText, color: 'text-yellow-500' },
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
          <Shield className="w-5 h-5 text-primary" />
          التأمين الذكي على الشحنات
        </h2>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />وثيقة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>إنشاء وثيقة تأمين</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <div><Label>نوع المخلفات *</Label><Input value={form.waste_type} onChange={e => setForm(p => ({ ...p, waste_type: e.target.value }))} /></div>
              <div>
                <Label>نوع التغطية</Label>
                <Select value={form.coverage_type} onValueChange={v => setForm(p => ({ ...p, coverage_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COVERAGE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label} ({(v.multiplier * 100).toFixed(1)}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>مستوى الخطورة</Label>
                <Select value={form.hazard_level} onValueChange={v => setForm(p => ({ ...p, hazard_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_hazardous">غير خطرة</SelectItem>
                    <SelectItem value="slightly_hazardous">خطرة قليلاً</SelectItem>
                    <SelectItem value="hazardous">خطرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>قيمة الشحنة (ج.م)</Label><Input type="number" value={form.shipment_value} onChange={e => setForm(p => ({ ...p, shipment_value: e.target.value }))} /></div>
                <div><Label>المسافة (كم)</Label><Input type="number" value={form.distance_km} onChange={e => setForm(p => ({ ...p, distance_km: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الوزن (كجم)</Label><Input type="number" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} /></div>
                <div><Label>تقييم السائق (0-100)</Label><Input type="number" value={form.driver_risk_score} onChange={e => setForm(p => ({ ...p, driver_risk_score: e.target.value }))} /></div>
              </div>

              {/* Premium Preview */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">القسط المحسوب</span>
                    <span className="text-lg font-bold text-primary">{estimatedPremium.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>مبلغ التغطية</span>
                    <span>{coverageAmount.toLocaleString()} ج.م</span>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => createMutation.mutate()} disabled={!form.waste_type || !form.shipment_value || createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إصدار الوثيقة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policies List */}
      <div className="space-y-2">
        {policies.map((p: any) => {
          const cov = COVERAGE_CONFIG[p.coverage_type] || COVERAGE_CONFIG.standard;
          return (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{p.policy_number}</p>
                    <p className="text-xs text-muted-foreground">{p.waste_type} • {cov.label}</p>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                    {p.status === 'active' ? 'نشطة' : p.status === 'claimed' ? 'مطالبة' : p.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">القسط:</span> <span className="font-bold">{p.premium_amount?.toLocaleString()} ج.م</span></div>
                  <div><span className="text-muted-foreground">التغطية:</span> <span className="font-bold">{p.coverage_amount?.toLocaleString()} ج.م</span></div>
                  <div><span className="text-muted-foreground">حتى:</span> <span>{new Date(p.valid_until).toLocaleDateString('ar-EG')}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {policies.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد وثائق تأمين</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default ShipmentInsurancePanel;
