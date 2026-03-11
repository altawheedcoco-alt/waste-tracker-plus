import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateB2BListing } from '@/hooks/useB2BMarketplace';
import {
  LISTING_CATEGORIES, ALLOWED_TARGETS, DEFAULT_TARGET_AUDIENCE,
  DELIVERY_OPTIONS, UNITS, ORG_TYPE_LABELS,
  type OrgType,
} from './B2BVisibilityEngine';

interface CreateB2BListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateB2BListingDialog = ({ open, onOpenChange }: CreateB2BListingDialogProps) => {
  const { organization } = useAuth();
  const myOrgType = (organization?.organization_type as OrgType) || 'generator';
  const createListing = useCreateB2BListing();

  const [form, setForm] = useState({
    title: '',
    waste_type: '',
    waste_description: '',
    quantity: '',
    unit: 'ton',
    price_per_unit: '',
    is_negotiable: true,
    pickup_address: '',
    pickup_city: '',
    delivery_option: 'pickup',
    contact_name: organization?.representative_name || '',
    contact_phone: organization?.phone || '',
    special_requirements: '',
    hazardous: false,
    target_audience: [...DEFAULT_TARGET_AUDIENCE[myOrgType]],
    deadline: '',
  });

  const allowedTargets = ALLOWED_TARGETS[myOrgType];
  const categories = LISTING_CATEGORIES[myOrgType] || LISTING_CATEGORIES.generator;

  const toggleTarget = (target: OrgType) => {
    setForm(prev => ({
      ...prev,
      target_audience: prev.target_audience.includes(target)
        ? prev.target_audience.filter(t => t !== target)
        : [...prev.target_audience, target],
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.waste_type || !form.quantity) return;
    createListing.mutate(
      {
        title: form.title,
        waste_type: form.waste_type,
        waste_description: form.waste_description || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        price_per_unit: form.price_per_unit ? Number(form.price_per_unit) : undefined,
        is_negotiable: form.is_negotiable,
        pickup_address: form.pickup_address || undefined,
        pickup_city: form.pickup_city || undefined,
        delivery_option: form.delivery_option,
        contact_name: form.contact_name || undefined,
        contact_phone: form.contact_phone || undefined,
        special_requirements: form.special_requirements || undefined,
        hazardous: form.hazardous,
        target_audience: form.target_audience,
        deadline: form.deadline || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            title: '', waste_type: '', waste_description: '', quantity: '', unit: 'ton',
            price_per_unit: '', is_negotiable: true, pickup_address: '', pickup_city: '',
            delivery_option: 'pickup', contact_name: organization?.representative_name || '',
            contact_phone: organization?.phone || '', special_requirements: '', hazardous: false,
            target_audience: [...DEFAULT_TARGET_AUDIENCE[myOrgType]], deadline: '',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            نشر عرض جديد في السوق
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            أنت تنشر كـ <Badge variant="outline" className="mx-1">{ORG_TYPE_LABELS[myOrgType]}</Badge>
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div>
            <Label>عنوان العرض *</Label>
            <Input
              placeholder="مثال: حبيبات بلاستيك PET معاد تدويرها - درجة أولى"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Category + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>التصنيف *</Label>
              <Select value={form.waste_type} onValueChange={v => setForm(p => ({ ...p, waste_type: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>وحدة القياس</Label>
              <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity + Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الكمية المتاحة *</Label>
              <Input
                type="number"
                placeholder="50"
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div>
              <Label>السعر لكل وحدة (ج.م)</Label>
              <Input
                type="number"
                placeholder="اتركه فارغاً للتفاوض"
                value={form.price_per_unit}
                onChange={e => setForm(p => ({ ...p, price_per_unit: e.target.value }))}
              />
            </div>
          </div>

          {/* Negotiable + Hazardous */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_negotiable}
                onCheckedChange={v => setForm(p => ({ ...p, is_negotiable: v }))}
              />
              <Label className="text-sm">قابل للتفاوض</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.hazardous}
                onCheckedChange={v => setForm(p => ({ ...p, hazardous: v }))}
              />
              <Label className="text-sm">مادة خطرة</Label>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>وصف تفصيلي</Label>
            <Textarea
              placeholder="أضف مواصفات تفصيلية، معايير الجودة، شروط خاصة..."
              value={form.waste_description}
              onChange={e => setForm(p => ({ ...p, waste_description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Location + Delivery */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المدينة</Label>
              <Input
                placeholder="القاهرة"
                value={form.pickup_city}
                onChange={e => setForm(p => ({ ...p, pickup_city: e.target.value }))}
              />
            </div>
            <div>
              <Label>طريقة التسليم</Label>
              <Select value={form.delivery_option} onValueChange={v => setForm(p => ({ ...p, delivery_option: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERY_OPTIONS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>العنوان التفصيلي</Label>
            <Input
              placeholder="العنوان الكامل لموقع الاستلام"
              value={form.pickup_address}
              onChange={e => setForm(p => ({ ...p, pickup_address: e.target.value }))}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>اسم جهة الاتصال</Label>
              <Input
                value={form.contact_name}
                onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>رقم التواصل</Label>
              <Input
                value={form.contact_phone}
                onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label>آخر موعد للتقديم</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
            />
          </div>

          {/* Target Audience — the key feature */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <Label className="text-sm font-semibold">مَن يرى هذا العرض؟</Label>
            <p className="text-xs text-muted-foreground">
              {myOrgType === 'transporter'
                ? 'كناقل، عروضك تظهر للمدورين وجهات التخلص فقط (لا تظهر للمولدين)'
                : 'حدد أنواع الجهات التي تريد عرض العرض لها'}
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {allowedTargets.map(target => (
                <div key={target} className="flex items-center gap-2">
                  <Checkbox
                    checked={form.target_audience.includes(target)}
                    onCheckedChange={() => toggleTarget(target)}
                  />
                  <Label className="text-sm cursor-pointer">{ORG_TYPE_LABELS[target]}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Special requirements */}
          <div>
            <Label>متطلبات خاصة</Label>
            <Textarea
              placeholder="شهادات مطلوبة، شروط نقل، معايير جودة..."
              value={form.special_requirements}
              onChange={e => setForm(p => ({ ...p, special_requirements: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!form.title || !form.waste_type || !form.quantity || createListing.isPending}
            className="w-full"
            size="lg"
          >
            {createListing.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            نشر العرض في السوق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateB2BListingDialog;
