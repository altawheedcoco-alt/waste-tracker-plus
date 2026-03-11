import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateB2BRequest } from '@/hooks/useB2BMarketplace';
import {
  LISTING_CATEGORIES, ALLOWED_TARGETS, DEFAULT_TARGET_AUDIENCE,
  UNITS, ORG_TYPE_LABELS, type OrgType,
} from './B2BVisibilityEngine';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const URGENCY_OPTIONS = [
  { id: 'low', label: 'منخفضة' },
  { id: 'normal', label: 'عادية' },
  { id: 'high', label: 'مستعجلة' },
  { id: 'critical', label: 'طارئة' },
];

const CreateB2BRequestDialog = ({ open, onOpenChange }: Props) => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';
  const createRequest = useCreateB2BRequest();

  const [form, setForm] = useState({
    title: '', waste_type: '', description: '', quantity: '', unit: 'ton',
    budget_min: '', budget_max: '', location_city: '', urgency: 'normal',
    deadline: '', target_audience: [...DEFAULT_TARGET_AUDIENCE[myOrgType]],
  });

  const categories = LISTING_CATEGORIES[myOrgType] || LISTING_CATEGORIES.generator;
  const allowedTargets = ALLOWED_TARGETS[myOrgType];

  const toggleTarget = (t: OrgType) => {
    setForm(p => ({
      ...p,
      target_audience: p.target_audience.includes(t)
        ? p.target_audience.filter(x => x !== t)
        : [...p.target_audience, t],
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.waste_type || !form.quantity) return;
    createRequest.mutate(
      {
        title: form.title, waste_type: form.waste_type, quantity: Number(form.quantity),
        unit: form.unit, description: form.description || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        location_city: form.location_city || undefined, urgency: form.urgency,
        deadline: form.deadline || undefined, target_audience: form.target_audience,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            title: '', waste_type: '', description: '', quantity: '', unit: 'ton',
            budget_min: '', budget_max: '', location_city: '', urgency: 'normal',
            deadline: '', target_audience: [...DEFAULT_TARGET_AUDIENCE[myOrgType]],
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            نشر طلب شراء / خدمة
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            أنت تطلب كـ <Badge variant="outline" className="mx-1">{ORG_TYPE_LABELS[myOrgType]}</Badge>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>عنوان الطلب *</Label>
            <Input placeholder="مثال: أحتاج 10 أطنان بلاستيك PET نظيف" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>التصنيف *</Label>
              <Select value={form.waste_type} onValueChange={v => setForm(p => ({ ...p, waste_type: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الاستعجال</Label>
              <Select value={form.urgency} onValueChange={v => setForm(p => ({ ...p, urgency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map(u => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الكمية المطلوبة *</Label>
              <Input type="number" placeholder="10" value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div>
              <Label>الوحدة</Label>
              <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ميزانية (من)</Label>
              <Input type="number" placeholder="ج.م" value={form.budget_min}
                onChange={e => setForm(p => ({ ...p, budget_min: e.target.value }))} />
            </div>
            <div>
              <Label>ميزانية (إلى)</Label>
              <Input type="number" placeholder="ج.م" value={form.budget_max}
                onChange={e => setForm(p => ({ ...p, budget_max: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>تفاصيل إضافية</Label>
            <Textarea placeholder="مواصفات، معايير جودة، شروط..." value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المدينة</Label>
              <Input placeholder="القاهرة" value={form.location_city}
                onChange={e => setForm(p => ({ ...p, location_city: e.target.value }))} />
            </div>
            <div>
              <Label>آخر موعد</Label>
              <Input type="date" value={form.deadline}
                onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <Label className="text-sm font-semibold">مَن يرى هذا الطلب؟</Label>
            <div className="flex flex-wrap gap-3">
              {allowedTargets.map(target => (
                <div key={target} className="flex items-center gap-2">
                  <Checkbox checked={form.target_audience.includes(target)}
                    onCheckedChange={() => toggleTarget(target)} />
                  <Label className="text-sm cursor-pointer">{ORG_TYPE_LABELS[target]}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg"
            disabled={!form.title || !form.waste_type || !form.quantity || createRequest.isPending}>
            {createRequest.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            نشر الطلب في السوق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateB2BRequestDialog;
