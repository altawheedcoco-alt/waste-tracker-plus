/**
 * واجهة إنشاء مهمة خارجية + توليد رابط مؤقت للسائق المؤجر
 * تُستخدم من قبل الجهة الناقلة
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Link2, MapPin, Truck, User, Phone } from 'lucide-react';

interface CreateExternalMissionProps {
  organizationId: string;
  onCreated?: () => void;
}

const CreateExternalMission = ({ organizationId, onCreated }: CreateExternalMissionProps) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const [form, setForm] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    wasteType: '',
    estimatedWeight: '',
    notes: '',
    driverName: '',
    driverPhone: '',
  });

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.pickupAddress || !form.deliveryAddress) {
      toast.error('يرجى إدخال نقطة التحميل والتسليم');
      return;
    }
    if (!profile?.id) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('external_missions')
        .insert({
          organization_id: organizationId,
          created_by: profile.id,
          pickup_address: form.pickupAddress,
          delivery_address: form.deliveryAddress,
          waste_type: form.wasteType || null,
          estimated_weight: form.estimatedWeight ? parseFloat(form.estimatedWeight) : null,
          notes: form.notes || null,
          driver_name: form.driverName || null,
          driver_phone: form.driverPhone || null,
          status: 'sent',
        })
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/mission/${data.token}`;
      setGeneratedLink(link);
      toast.success('تم إنشاء الرابط المؤقت بنجاح');
      onCreated?.();
    } catch (err: any) {
      toast.error('فشل إنشاء المهمة');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('تم نسخ الرابط');
    }
  };

  const resetForm = () => {
    setForm({ pickupAddress: '', deliveryAddress: '', wasteType: '', estimatedWeight: '', notes: '', driverName: '', driverPhone: '' });
    setGeneratedLink(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="w-4 h-4" />
          رابط مهمة خارجية
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            إنشاء مهمة لسائق خارجي
          </DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">✅ تم إنشاء الرابط المؤقت</p>
              <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                <input
                  readOnly
                  value={generatedLink}
                  className="flex-1 text-xs bg-transparent outline-none text-foreground"
                  dir="ltr"
                />
                <Button size="sm" variant="ghost" onClick={copyLink}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                أرسل هذا الرابط للسائق — صالح لمدة 48 ساعة ولمرة واحدة فقط
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1" onClick={copyLink}>
                <Copy className="w-3.5 h-3.5" /> نسخ
              </Button>
              <Button variant="outline" className="flex-1 gap-1" asChild>
                <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> فتح
                </a>
              </Button>
            </div>
            <Button className="w-full" onClick={() => { resetForm(); }}>
              إنشاء مهمة جديدة
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3 text-emerald-600" /> نقطة التحميل *
              </Label>
              <Input
                placeholder="العنوان الكامل لنقطة التحميل"
                value={form.pickupAddress}
                onChange={(e) => updateField('pickupAddress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3 text-red-500" /> نقطة التسليم *
              </Label>
              <Input
                placeholder="العنوان الكامل لنقطة التسليم"
                value={form.deliveryAddress}
                onChange={(e) => updateField('deliveryAddress', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">نوع النفاية</Label>
                <Input
                  placeholder="مثال: بلاستيك"
                  value={form.wasteType}
                  onChange={(e) => updateField('wasteType', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">الوزن التقديري (كجم)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={form.estimatedWeight}
                  onChange={(e) => updateField('estimatedWeight', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-xs text-muted-foreground font-medium">بيانات السائق (اختياري)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <User className="w-3 h-3" /> اسم السائق
                  </Label>
                  <Input
                    placeholder="الاسم"
                    value={form.driverName}
                    onChange={(e) => updateField('driverName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Phone className="w-3 h-3" /> رقم الهاتف
                  </Label>
                  <Input
                    placeholder="01xxxxxxxxx"
                    value={form.driverPhone}
                    onChange={(e) => updateField('driverPhone', e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea
                placeholder="تعليمات إضافية للسائق..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </div>

            <Button className="w-full h-11 font-bold gap-2" onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              إنشاء الرابط المؤقت
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateExternalMission;
