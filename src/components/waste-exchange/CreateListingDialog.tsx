import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateListingDialogProps {
  isRTL: boolean;
  organizationId: string;
  onCreated: () => void;
}

const WASTE_TYPES = [
  { value: 'metals', ar: 'معادن', en: 'Metals' },
  { value: 'paper', ar: 'ورق/كرتون', en: 'Paper/Cardboard' },
  { value: 'plastics', ar: 'بلاستيك', en: 'Plastics' },
  { value: 'wood', ar: 'خشب', en: 'Wood' },
  { value: 'organic', ar: 'عضوي', en: 'Organic' },
  { value: 'glass', ar: 'زجاج', en: 'Glass' },
  { value: 'textiles', ar: 'منسوجات', en: 'Textiles' },
  { value: 'rdf', ar: 'وقود بديل RDF', en: 'RDF' },
];

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'المنوفية',
  'القليوبية', 'البحيرة', 'الغربية', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء',
];

export const CreateListingDialog = ({ isRTL, organizationId, onCreated }: CreateListingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    listing_type: 'sell' as 'sell' | 'buy',
    waste_type: '',
    waste_subtype: '',
    title: '',
    description: '',
    quantity_tons: '',
    min_quantity_tons: '',
    price_per_ton: '',
    price_negotiable: true,
    location_governorate: '',
    location_city: '',
    quality_grade: 'standard',
    pickup_available: false,
    delivery_available: false,
    available_until: '',
  });

  const handleSubmit = async () => {
    if (!form.title || !form.waste_type || !form.quantity_tons) {
      toast.error(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('waste_exchange_listings').insert({
        organization_id: organizationId,
        listing_type: form.listing_type,
        waste_type: form.waste_type,
        waste_subtype: form.waste_subtype || null,
        title: form.title,
        description: form.description || null,
        quantity_tons: parseFloat(form.quantity_tons),
        min_quantity_tons: form.min_quantity_tons ? parseFloat(form.min_quantity_tons) : null,
        price_per_ton: form.price_per_ton ? parseFloat(form.price_per_ton) : null,
        price_negotiable: form.price_negotiable,
        location_governorate: form.location_governorate || null,
        location_city: form.location_city || null,
        quality_grade: form.quality_grade,
        pickup_available: form.pickup_available,
        delivery_available: form.delivery_available,
        available_until: form.available_until || null,
        created_by: user?.id,
        status: 'active',
      } as any);
      if (error) throw error;
      toast.success(isRTL ? 'تم نشر العرض بنجاح' : 'Listing published successfully');
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? 'نشر عرض جديد' : 'New Listing'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? 'نشر عرض في البورصة' : 'Publish Exchange Listing'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? 'نوع العرض *' : 'Listing Type *'}</Label>
              <Select value={form.listing_type} onValueChange={v => updateForm('listing_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">{isRTL ? '🏷️ بيع' : '🏷️ Sell'}</SelectItem>
                  <SelectItem value="buy">{isRTL ? '🛒 شراء' : '🛒 Buy'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'نوع المخلف *' : 'Waste Type *'}</Label>
              <Select value={form.waste_type} onValueChange={v => updateForm('waste_type', v)}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {WASTE_TYPES.map(w => (
                    <SelectItem key={w.value} value={w.value}>{isRTL ? w.ar : w.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>{isRTL ? 'عنوان العرض *' : 'Title *'}</Label>
            <Input value={form.title} onChange={e => updateForm('title', e.target.value)}
              placeholder={isRTL ? 'مثال: حديد سكراب نظيف - 50 طن' : 'e.g. Clean scrap iron - 50 tons'} />
          </div>

          {/* Description */}
          <div>
            <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
            <Textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
              placeholder={isRTL ? 'تفاصيل إضافية عن المخلف...' : 'Additional details...'} rows={3} />
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{isRTL ? 'الكمية (طن) *' : 'Quantity (tons) *'}</Label>
              <Input type="number" value={form.quantity_tons} onChange={e => updateForm('quantity_tons', e.target.value)} />
            </div>
            <div>
              <Label>{isRTL ? 'الحد الأدنى (طن)' : 'Min Qty (tons)'}</Label>
              <Input type="number" value={form.min_quantity_tons} onChange={e => updateForm('min_quantity_tons', e.target.value)} />
            </div>
            <div>
              <Label>{isRTL ? 'السعر/طن (ج.م)' : 'Price/Ton (EGP)'}</Label>
              <Input type="number" value={form.price_per_ton} onChange={e => updateForm('price_per_ton', e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? 'المحافظة' : 'Governorate'}</Label>
              <Select value={form.location_governorate} onValueChange={v => updateForm('location_governorate', v)}>
                <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {GOVERNORATES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'المدينة' : 'City'}</Label>
              <Input value={form.location_city} onChange={e => updateForm('location_city', e.target.value)} />
            </div>
          </div>

          {/* Quality & Availability */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? 'درجة الجودة' : 'Quality Grade'}</Label>
              <Select value={form.quality_grade} onValueChange={v => updateForm('quality_grade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">{isRTL ? 'ممتاز' : 'Premium'}</SelectItem>
                  <SelectItem value="standard">{isRTL ? 'قياسي' : 'Standard'}</SelectItem>
                  <SelectItem value="economy">{isRTL ? 'اقتصادي' : 'Economy'}</SelectItem>
                  <SelectItem value="mixed">{isRTL ? 'مختلط' : 'Mixed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'متاح حتى' : 'Available Until'}</Label>
              <Input type="date" value={form.available_until} onChange={e => updateForm('available_until', e.target.value)} />
            </div>
          </div>

          {/* Switches */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={form.price_negotiable} onCheckedChange={v => updateForm('price_negotiable', v)} />
              <Label>{isRTL ? 'السعر قابل للتفاوض' : 'Price Negotiable'}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.pickup_available} onCheckedChange={v => updateForm('pickup_available', v)} />
              <Label>{isRTL ? 'استلام من الموقع' : 'Pickup Available'}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.delivery_available} onCheckedChange={v => updateForm('delivery_available', v)} />
              <Label>{isRTL ? 'توصيل متاح' : 'Delivery Available'}</Label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRTL ? 'نشر العرض' : 'Publish Listing'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
