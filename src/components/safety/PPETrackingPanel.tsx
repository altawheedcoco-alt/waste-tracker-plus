import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePPEAssignments } from '@/hooks/useSafetySystem';
import { Plus, HardHat, Loader2, X, Shield, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const PPE_TYPES = [
  { id: 'helmet', ar: 'خوذة حماية', icon: '⛑️' },
  { id: 'gloves', ar: 'قفازات', icon: '🧤' },
  { id: 'goggles', ar: 'نظارات واقية', icon: '🥽' },
  { id: 'mask', ar: 'كمامة/قناع', icon: '😷' },
  { id: 'vest', ar: 'سترة عاكسة', icon: '🦺' },
  { id: 'boots', ar: 'حذاء أمان', icon: '👢' },
  { id: 'ear_protection', ar: 'واقي أذن', icon: '🎧' },
  { id: 'face_shield', ar: 'واقي وجه', icon: '🛡️' },
  { id: 'respirator', ar: 'جهاز تنفس', icon: '💨' },
  { id: 'full_body_suit', ar: 'بدلة كاملة', icon: '🥼' },
];

const PPETrackingPanel = memo(() => {
  const { assignments, isLoading, add } = usePPEAssignments();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ is_registered_worker: true });
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const ppeType = PPE_TYPES.find(p => p.id === form.ppe_type);
    if (!form.ppe_type) return;
    add.mutate({ ...form, ppe_type_ar: ppeType?.ar || form.ppe_type }, {
      onSuccess: () => { setShowForm(false); setForm({ is_registered_worker: true }); },
    });
  };

  const expiringSoon = assignments.filter((a: any) => a.expiry_date && new Date(a.expiry_date) <= new Date(Date.now() + 30 * 86400000));
  const damaged = assignments.filter((a: any) => a.condition === 'damaged' || a.condition === 'expired');

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">تتبع معدات الوقاية الشخصية (PPE)</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'تسليم معدة'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{assignments.length}</p>
          <p className="text-[11px] text-muted-foreground">إجمالي المعدات</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{expiringSoon.length}</p>
          <p className="text-[11px] text-muted-foreground">قرب الانتهاء</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{damaged.length}</p>
          <p className="text-[11px] text-muted-foreground">تالفة/منتهية</p>
        </Card>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Switch checked={form.is_registered_worker} onCheckedChange={v => u('is_registered_worker', v)} />
                  <Label>{form.is_registered_worker ? 'عامل مسجل في المنصة' : 'عامل غير مسجل (خارجي)'}</Label>
                </div>

                {!form.is_registered_worker && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>اسم العامل</Label><Input value={form.external_worker_name || ''} onChange={e => u('external_worker_name', e.target.value)} /></div>
                    <div><Label>رقم الهاتف</Label><Input value={form.external_worker_phone || ''} onChange={e => u('external_worker_phone', e.target.value)} /></div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>نوع المعدة *</Label>
                    <Select value={form.ppe_type || ''} onValueChange={v => u('ppe_type', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر المعدة" /></SelectTrigger>
                      <SelectContent>{PPE_TYPES.map(p => <SelectItem key={p.id} value={p.id}>{p.icon} {p.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المقاس</Label>
                    <Select value={form.size || ''} onValueChange={v => u('size', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الرقم التسلسلي</Label><Input value={form.serial_number || ''} onChange={e => u('serial_number', e.target.value)} /></div>
                  <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date || ''} onChange={e => u('expiry_date', e.target.value)} /></div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    تسليم وتسجيل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PPE Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {assignments.map((a: any) => {
          const ppeInfo = PPE_TYPES.find(p => p.id === a.ppe_type);
          const isExpired = a.expiry_date && new Date(a.expiry_date) < new Date();
          return (
            <Card key={a.id} className={`hover:shadow-sm transition-shadow ${isExpired ? 'border-red-200 dark:border-red-800' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-2xl">{ppeInfo?.icon || '🛡️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.ppe_type_ar || ppeInfo?.ar}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {a.external_worker_name || 'مسجل'} {a.serial_number ? `• ${a.serial_number}` : ''}
                  </p>
                </div>
                <Badge variant={a.condition === 'good' ? 'default' : a.condition === 'damaged' ? 'destructive' : 'secondary'} className="text-[9px]">
                  {a.condition === 'good' ? 'جيدة' : a.condition === 'fair' ? 'مقبولة' : a.condition === 'damaged' ? 'تالفة' : a.condition}
                </Badge>
                {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isLoading && assignments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">لم يتم تسليم معدات وقاية بعد</div>
      )}
    </div>
  );
});

PPETrackingPanel.displayName = 'PPETrackingPanel';
export default PPETrackingPanel;
