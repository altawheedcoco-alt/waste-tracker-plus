import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, Zap, Clock, Calendar, AlertTriangle,
  Plus, Save, Trash2, BarChart3, ArrowUpDown, Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PricingRule {
  id?: string;
  waste_type: string;
  base_price: number;
  distance_multiplier: number;
  weight_multiplier: number;
  peak_hour_surcharge: number;
  weekend_surcharge: number;
  urgent_surcharge: number;
  low_demand_discount: number;
  min_price: number;
  max_price: number | null;
  is_active: boolean;
}

const WASTE_TYPES = [
  'نفايات عامة', 'نفايات خطرة', 'نفايات طبية', 'نفايات إلكترونية',
  'نفايات بناء', 'نفايات صناعية', 'نفايات زراعية', 'خردة معدنية',
  'ورق وكرتون', 'بلاستيك', 'زجاج', 'خشب'
];

const DynamicPricingEngine = () => {
  const { organization } = useAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [simulationResult, setSimulationResult] = useState<number | null>(null);
  const [simDistance, setSimDistance] = useState(50);
  const [simWeight, setSimWeight] = useState(5);
  const [simUrgent, setSimUrgent] = useState(false);
  const [simPeakHour, setSimPeakHour] = useState(false);

  useEffect(() => {
    if (organization?.id) fetchRules();
  }, [organization?.id]);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dynamic_pricing_rules')
      .select('*')
      .eq('organization_id', organization!.id)
      .order('waste_type');
    if (!error && data) setRules(data as PricingRule[]);
    setLoading(false);
  };

  const saveRule = async (rule: PricingRule) => {
    setSaving(true);
    const payload = { ...rule, organization_id: organization!.id };
    delete (payload as any).id;

    if (rule.id) {
      const { error } = await supabase
        .from('dynamic_pricing_rules')
        .update(payload)
        .eq('id', rule.id);
      if (error) toast.error('فشل في تحديث القاعدة');
      else toast.success('تم تحديث قاعدة التسعير');
    } else {
      const { error } = await supabase
        .from('dynamic_pricing_rules')
        .insert(payload);
      if (error) toast.error('فشل في إنشاء القاعدة');
      else toast.success('تم إنشاء قاعدة تسعير جديدة');
    }
    setSaving(false);
    setEditingRule(null);
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('dynamic_pricing_rules')
      .delete()
      .eq('id', id);
    if (!error) {
      toast.success('تم حذف القاعدة');
      fetchRules();
    }
  };

  const simulatePrice = (rule: PricingRule) => {
    let price = rule.base_price;
    price *= (1 + (simDistance / 100) * (rule.distance_multiplier - 1));
    price *= (1 + (simWeight / 10) * (rule.weight_multiplier - 1));
    if (simPeakHour) price += rule.peak_hour_surcharge;
    if (simUrgent) price += rule.urgent_surcharge;
    const now = new Date();
    if (now.getDay() === 5 || now.getDay() === 6) price += rule.weekend_surcharge;
    price = Math.max(price, rule.min_price);
    if (rule.max_price) price = Math.min(price, rule.max_price);
    setSimulationResult(Math.round(price * 100) / 100);
  };

  const newRule = (): PricingRule => ({
    waste_type: WASTE_TYPES[0],
    base_price: 100,
    distance_multiplier: 1.5,
    weight_multiplier: 1.2,
    peak_hour_surcharge: 20,
    weekend_surcharge: 15,
    urgent_surcharge: 50,
    low_demand_discount: 10,
    min_price: 50,
    max_price: 500,
    is_active: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold">محرك التسعير الديناميكي</h2>
                  <p className="text-sm text-muted-foreground">
                    تسعير ذكي يتكيف مع المسافة والوزن والطلب والوقت
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setEditingRule(newRule())}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Plus className="w-4 h-4" />
                قاعدة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Simulator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
            محاكاة السعر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">المسافة (كم)</Label>
              <div className="flex items-center gap-2">
                <Slider value={[simDistance]} onValueChange={v => setSimDistance(v[0])} min={1} max={500} step={5} />
                <span className="text-sm font-mono w-12 text-left">{simDistance}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">الوزن (طن)</Label>
              <div className="flex items-center gap-2">
                <Slider value={[simWeight]} onValueChange={v => setSimWeight(v[0])} min={0.5} max={50} step={0.5} />
                <span className="text-sm font-mono w-12 text-left">{simWeight}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={simPeakHour} onCheckedChange={setSimPeakHour} />
              <Label className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" /> ساعة ذروة
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={simUrgent} onCheckedChange={setSimUrgent} />
              <Label className="text-xs flex items-center gap-1">
                <Zap className="w-3 h-3" /> عاجل
              </Label>
            </div>
          </div>
          {simulationResult !== null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center"
            >
              <p className="text-sm text-muted-foreground">السعر المحسوب</p>
              <p className="text-3xl font-bold text-amber-600">{simulationResult} ر.س</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="grid gap-4">
        {loading ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">جارٍ التحميل...</CardContent></Card>
        ) : rules.length === 0 && !editingRule ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>لا توجد قواعد تسعير بعد</p>
              <p className="text-sm">أنشئ أول قاعدة لبدء التسعير الديناميكي</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {rules.map((rule, idx) => (
              <motion.div
                key={rule.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`transition-all ${!rule.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.waste_type}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {rule.base_price} ر.س
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => simulatePrice(rule)}>
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingRule(rule)}>
                          <ArrowUpDown className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => rule.id && deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> مسافة: ×{rule.distance_multiplier}
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" /> وزن: ×{rule.weight_multiplier}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ذروة: +{rule.peak_hour_surcharge}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> عطلة: +{rule.weekend_surcharge}
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> عاجل: +{rule.urgent_surcharge}
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> أدنى: {rule.min_price}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Edit/Create Dialog (inline) */}
      <AnimatePresence>
        {editingRule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingRule.id ? 'تعديل قاعدة التسعير' : 'قاعدة تسعير جديدة'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">نوع النفايات</Label>
                    <Select
                      value={editingRule.waste_type}
                      onValueChange={v => setEditingRule({ ...editingRule, waste_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WASTE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">السعر الأساسي (ر.س)</Label>
                    <Input
                      type="number"
                      value={editingRule.base_price}
                      onChange={e => setEditingRule({ ...editingRule, base_price: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">مضاعف المسافة</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingRule.distance_multiplier}
                      onChange={e => setEditingRule({ ...editingRule, distance_multiplier: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">مضاعف الوزن</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingRule.weight_multiplier}
                      onChange={e => setEditingRule({ ...editingRule, weight_multiplier: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">رسوم ساعة الذروة</Label>
                    <Input
                      type="number"
                      value={editingRule.peak_hour_surcharge}
                      onChange={e => setEditingRule({ ...editingRule, peak_hour_surcharge: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">رسوم العطلة</Label>
                    <Input
                      type="number"
                      value={editingRule.weekend_surcharge}
                      onChange={e => setEditingRule({ ...editingRule, weekend_surcharge: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">رسوم الاستعجال</Label>
                    <Input
                      type="number"
                      value={editingRule.urgent_surcharge}
                      onChange={e => setEditingRule({ ...editingRule, urgent_surcharge: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الحد الأدنى</Label>
                    <Input
                      type="number"
                      value={editingRule.min_price}
                      onChange={e => setEditingRule({ ...editingRule, min_price: +e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الحد الأقصى</Label>
                    <Input
                      type="number"
                      value={editingRule.max_price || ''}
                      onChange={e => setEditingRule({ ...editingRule, max_price: e.target.value ? +e.target.value : null })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingRule.is_active}
                    onCheckedChange={v => setEditingRule({ ...editingRule, is_active: v })}
                  />
                  <Label className="text-sm">مفعّلة</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingRule(null)}>إلغاء</Button>
                  <Button
                    onClick={() => saveRule(editingRule)}
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DynamicPricingEngine;
