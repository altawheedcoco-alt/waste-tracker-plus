import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Globe, Briefcase, DollarSign, Calendar, Plus, X, 
  Loader2, Save, MessageSquare, Phone as PhoneIcon, 
  ShoppingBag, ExternalLink, Mail, Link2
} from 'lucide-react';

interface BusinessProfileSettingsProps {
  organizationId: string;
  organizationType: string;
  data: any;
  isEditable: boolean;
  onUpdate: () => void;
}

const CTA_OPTIONS = [
  { value: 'contact', label: 'تواصل معنا', icon: '📞' },
  { value: 'message', label: 'ارسل رسالة', icon: '💬' },
  { value: 'call', label: 'اتصل الآن', icon: '📱' },
  { value: 'shop', label: 'تسوق الآن', icon: '🛒' },
  { value: 'visit', label: 'زيارة الموقع', icon: '🌐' },
  { value: 'quote', label: 'اطلب عرض سعر', icon: '💰' },
  { value: 'book', label: 'احجز موعد', icon: '📅' },
];

const PRICE_RANGES = [
  { value: '', label: 'غير محدد' },
  { value: '$', label: '$ - اقتصادي' },
  { value: '$$', label: '$$ - متوسط' },
  { value: '$$$', label: '$$$ - مرتفع' },
  { value: '$$$$', label: '$$$$ - فاخر' },
];

const getServicesForType = (type: string) => {
  switch (type) {
    case 'generator':
      return [
        'إنتاج مخلفات صناعية', 'إنتاج مخلفات خطرة', 'إنتاج مخلفات عضوية',
        'إنتاج مخلفات بناء وهدم', 'إنتاج نفايات إلكترونية', 'إنتاج مخلفات بلاستيكية',
        'إنتاج مخلفات ورقية', 'إنتاج مخلفات معدنية', 'إنتاج مخلفات كيميائية',
        'إنتاج مخلفات غذائية', 'إنتاج مخلفات طبية', 'إنتاج مخلفات زراعية',
      ];
    case 'transporter':
      return [
        'نقل مخلفات صناعية', 'نقل مخلفات خطرة', 'نقل مخلفات سائلة',
        'نقل مخلفات بناء وهدم', 'نقل نفايات إلكترونية', 'نقل حاويات',
        'نقل بالشاحنات الثقيلة', 'نقل بالسيارات الصغيرة', 'خدمات لوجستية متكاملة',
        'تخزين مؤقت', 'نقل دولي', 'نقل مبرّد',
      ];
    case 'recycler':
      return [
        'تدوير بلاستيك', 'تدوير ورق وكرتون', 'تدوير معادن',
        'تدوير إلكترونيات', 'تدوير زجاج', 'تدوير مخلفات عضوية',
        'إنتاج سماد عضوي', 'إنتاج وقود بديل RDF', 'معالجة مخلفات خطرة',
        'تكرير زيوت مستعملة', 'فرز وتصنيف نفايات', 'طمر صحي آمن',
      ];
    default:
      return [];
  }
};

const BusinessProfileSettings = ({ organizationId, organizationType, data, isEditable, onUpdate }: BusinessProfileSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: data?.bio || '',
    website_url: data?.website_url || '',
    price_range: data?.price_range || '',
    cta_type: data?.cta_type || 'contact',
    services: (data?.services as string[]) || [],
    founded_year: data?.founded_year || '',
    business_email: data?.business_email || '',
    social_links: (data?.social_links as Record<string, string>) || {},
  });
  const [newService, setNewService] = useState('');

  const suggestedServices = getServicesForType(organizationType);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          bio: formData.bio || null,
          website_url: formData.website_url || null,
          price_range: formData.price_range || null,
          cta_type: formData.cta_type,
          services: formData.services,
          founded_year: formData.founded_year ? Number(formData.founded_year) : null,
          business_email: formData.business_email || null,
          social_links: formData.social_links,
        })
        .eq('id', organizationId);

      if (error) throw error;
      toast.success('تم حفظ بيانات الملف التجاري');
      onUpdate();
    } catch (error) {
      console.error('Error saving business profile:', error);
      toast.error('حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addService = (service: string) => {
    if (service && !formData.services.includes(service)) {
      setFormData({ ...formData, services: [...formData.services, service] });
    }
    setNewService('');
  };

  const removeService = (service: string) => {
    setFormData({ ...formData, services: formData.services.filter((s: string) => s !== service) });
  };

  const updateSocialLink = (key: string, value: string) => {
    setFormData({ ...formData, social_links: { ...formData.social_links, [key]: value } });
  };

  return (
    <div className="space-y-6">
      {/* Bio & Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            الهوية التجارية
          </CardTitle>
          <CardDescription>المعلومات التعريفية الأساسية للصفحة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>السيرة الذاتية (Bio)</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditable}
              placeholder="نبذة مختصرة عن المنشأة (حتى 300 حرف)"
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{formData.bio.length}/300</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                سنة التأسيس
              </Label>
              <Input
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                disabled={!isEditable}
                placeholder="مثال: 2010"
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                نطاق الأسعار
              </Label>
              <select
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                disabled={!isEditable}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            زر الإجراء والتواصل
          </CardTitle>
          <CardDescription>حدد الإجراء الرئيسي الذي تريده من الزوار</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>زر الإجراء (CTA)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {CTA_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => isEditable && setFormData({ ...formData, cta_type: opt.value })}
                  disabled={!isEditable}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    formData.cta_type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  } disabled:opacity-50`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                البريد الإلكتروني التجاري
              </Label>
              <Input
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                disabled={!isEditable}
                placeholder="info@company.com"
                type="email"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                الموقع الإلكتروني
              </Label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                disabled={!isEditable}
                placeholder="https://www.example.com"
                dir="ltr"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              روابط التواصل الاجتماعي
            </Label>
            {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'].map(platform => (
              <div key={platform} className="flex items-center gap-2">
                <span className="w-20 text-sm text-muted-foreground capitalize">{platform}</span>
                <Input
                  value={formData.social_links[platform] || ''}
                  onChange={(e) => updateSocialLink(platform, e.target.value)}
                  disabled={!isEditable}
                  placeholder={`https://${platform}.com/...`}
                  dir="ltr"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            الخدمات المقدمة
          </CardTitle>
          <CardDescription>حدد الخدمات التي تقدمها منشأتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current services */}
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service: string) => (
              <Badge key={service} variant="secondary" className="gap-1 py-1.5 px-3">
                {service}
                {isEditable && (
                  <button onClick={() => removeService(service)}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {formData.services.length === 0 && (
              <p className="text-sm text-muted-foreground">لم يتم إضافة خدمات بعد</p>
            )}
          </div>

          {isEditable && (
            <>
              {/* Add custom */}
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="أضف خدمة جديدة..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService(newService))}
                />
                <Button variant="outline" size="icon" onClick={() => addService(newService)} disabled={!newService}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggested services */}
              {suggestedServices.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">خدمات مقترحة:</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedServices
                      .filter(s => !formData.services.includes(s))
                      .map(s => (
                        <button
                          key={s}
                          onClick={() => addService(s)}
                          className="text-xs px-2.5 py-1 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition"
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isEditable && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ الملف التجاري
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessProfileSettings;
