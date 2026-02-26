import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, CheckCircle2, AlertCircle, ArrowLeft, Send, Camera,
  MapPin, Image as ImageIcon
} from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';
import { QuickLinkField } from '@/hooks/useQuickShipmentLinks';

interface LinkData {
  id: string;
  organization_id: string;
  link_name: string;
  description: string | null;
  is_active: boolean;
  requires_approval: boolean;
  auto_capture_gps: boolean;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  org_name?: string;
}

const QuickShip = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [fields, setFields] = useState<QuickLinkField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, File>>({});
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'expired' | 'maxed' | 'submitted'>('loading');
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    loadLink();
  }, [code]);

  // Auto GPS
  useEffect(() => {
    if (linkData?.auto_capture_gps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [linkData?.auto_capture_gps]);

  const loadLink = async () => {
    if (!code) { setStatus('notfound'); setLoading(false); return; }

    try {
      // Load link
      const { data: link, error } = await supabase
        .from('quick_shipment_links')
        .select('*')
        .eq('link_code', code)
        .eq('is_active', true)
        .single();

      if (error || !link) { setStatus('notfound'); setLoading(false); return; }
      const l = link as any;

      if (l.expires_at && new Date(l.expires_at) < new Date()) { setStatus('expired'); setLoading(false); return; }
      if (l.max_uses && l.current_uses >= l.max_uses) { setStatus('maxed'); setLoading(false); return; }

      // Load org name
      const { data: org } = await supabase.from('organizations').select('name').eq('id', l.organization_id).single();

      // Load fields
      const { data: fieldRows } = await supabase
        .from('quick_link_fields')
        .select('*')
        .eq('link_id', l.id)
        .order('sort_order');

      const parsedFields: QuickLinkField[] = (fieldRows as any[] || []).map(f => ({
        ...f,
        allowed_values: f.allowed_values ? (typeof f.allowed_values === 'string' ? JSON.parse(f.allowed_values) : f.allowed_values) : null,
      }));

      setLinkData({ ...l, org_name: org?.name });
      setFields(parsedFields);

      // Set defaults
      const defaults: Record<string, string> = {};
      parsedFields.forEach(f => {
        if (f.field_mode === 'fixed' && f.fixed_value) {
          defaults[f.field_name] = f.fixed_value;
        } else if (f.default_value) {
          defaults[f.field_name] = f.default_value;
        }
      });
      setFormValues(defaults);
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('notfound');
    } finally {
      setLoading(false);
    }
  };

  const setValue = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoto = (fieldName: string, file: File) => {
    setPhotos(prev => ({ ...prev, [fieldName]: file }));
    const reader = new FileReader();
    reader.onload = e => {
      setPhotoPreviews(prev => ({ ...prev, [fieldName]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!linkData) return;

    // Validate required fields
    const visibleFields = fields.filter(f => f.is_visible && f.field_mode !== 'fixed');
    for (const f of visibleFields) {
      if (f.is_required && !formValues[f.field_name] && f.field_type !== 'photo' && f.field_type !== 'gps') {
        toast.error(`يرجى ملء حقل: ${f.field_label}`);
        return;
      }
      if (f.is_required && f.field_type === 'photo' && !photos[f.field_name]) {
        toast.error(`يرجى رفع: ${f.field_label}`);
        return;
      }
    }

    // Validate driver name & phone from formValues
    if (!formValues['driver_name']?.trim()) {
      toast.error('يرجى إدخال اسم السائق');
      return;
    }
    if (!formValues['driver_phone']?.trim()) {
      toast.error('يرجى إدخال رقم هاتف السائق');
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const [fieldName, file] of Object.entries(photos)) {
        const ext = file.name.split('.').pop();
        const path = `quick-submissions/${linkData.organization_id}/${Date.now()}-${fieldName}.${ext}`;
        const { error: upErr } = await supabase.storage.from('shipment-photos').upload(path, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('shipment-photos').getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Submit
      const { data: sub, error } = await supabase
        .from('quick_link_submissions')
        .insert({
          link_id: linkData.id,
          organization_id: linkData.organization_id,
          driver_name: formValues['driver_name'],
          driver_phone: formValues['driver_phone'],
          form_data: formValues,
          photo_urls: photoUrls.length > 0 ? photoUrls : null,
          gps_lat: gpsCoords?.lat || null,
          gps_lng: gpsCoords?.lng || null,
          status: linkData.requires_approval ? 'pending' : 'approved',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Increment usage
      await supabase
        .from('quick_shipment_links')
        .update({ current_uses: linkData.current_uses + 1 } as any)
        .eq('id', linkData.id);

      setSubmissionId((sub as any)?.id);
      setStatus('submitted');
      toast.success('🎉 تم إرسال البيانات بنجاح!');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء الإرسال');
    } finally {
      setSubmitting(false);
    }
  };

  // Status screens
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'notfound' || status === 'expired' || status === 'maxed') {
    const messages = {
      notfound: { title: 'الرابط غير موجود', desc: 'عذراً، هذا الرابط غير صالح أو تم حذفه' },
      expired: { title: 'انتهت صلاحية الرابط', desc: 'يرجى التواصل مع شركة النقل للحصول على رابط جديد' },
      maxed: { title: 'تم الوصول للحد الأقصى', desc: 'تم استخدام هذا الرابط العدد الأقصى المسموح' },
    };
    const msg = messages[status];
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/5 via-background to-destructive/5">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">{msg.title}</h1>
            <p className="text-muted-foreground mb-6">{msg.desc}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/10 via-background to-primary/10">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
          <Card className="text-center border-emerald-200">
            <CardContent className="pt-8 pb-6">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2 text-emerald-700">تم الإرسال بنجاح!</h1>
              <p className="text-muted-foreground mb-4">
                {linkData?.requires_approval
                  ? `تم استلام البيانات وسيتم مراجعتها من قبل ${linkData?.org_name || 'شركة النقل'}`
                  : `تم تسجيل الشحنة لدى ${linkData?.org_name || 'شركة النقل'}`
                }
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('ready');
                  setFormValues({});
                  setPhotos({});
                  setPhotoPreviews({});
                  // Re-apply defaults
                  const defaults: Record<string, string> = {};
                  fields.forEach(f => {
                    if (f.field_mode === 'fixed' && f.fixed_value) defaults[f.field_name] = f.fixed_value;
                    else if (f.default_value) defaults[f.field_name] = f.default_value;
                  });
                  setFormValues(defaults);
                }}
              >
                إرسال شحنة أخرى
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main form
  const visibleFields = fields.filter(f => f.is_visible && f.field_mode !== 'fixed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 pb-20" dir="rtl">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <PlatformLogo size="sm" />
          <h1 className="text-xl font-bold mt-3">{linkData?.link_name}</h1>
          {linkData?.org_name && (
            <p className="text-sm text-muted-foreground mt-1">{linkData.org_name}</p>
          )}
          {linkData?.description && (
            <p className="text-xs text-muted-foreground mt-1">{linkData.description}</p>
          )}
        </div>

        {/* Form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {visibleFields.map(field => (
              <div key={field.field_name} className="space-y-1.5">
                <Label className="text-sm">
                  {field.field_label}
                  {field.is_required && <span className="text-destructive mr-1">*</span>}
                </Label>

                {/* Text input */}
                {field.field_type === 'text' && field.field_mode === 'free_input' && (
                  field.field_name === 'notes' ? (
                    <Textarea
                      value={formValues[field.field_name] || ''}
                      onChange={e => setValue(field.field_name, e.target.value)}
                      placeholder={field.field_label}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={formValues[field.field_name] || ''}
                      onChange={e => setValue(field.field_name, e.target.value)}
                      placeholder={field.field_label}
                      type={field.field_name === 'driver_phone' ? 'tel' : 'text'}
                    />
                  )
                )}

                {/* Number input */}
                {field.field_type === 'number' && field.field_mode === 'free_input' && (
                  <Input
                    type="number"
                    value={formValues[field.field_name] || ''}
                    onChange={e => setValue(field.field_name, e.target.value)}
                    placeholder={field.field_label}
                    min={field.min_value ?? undefined}
                    max={field.max_value ?? undefined}
                    step="0.01"
                  />
                )}

                {/* Restricted list (select) */}
                {field.field_mode === 'restricted_list' && field.allowed_values && (
                  <Select value={formValues[field.field_name] || ''} onValueChange={v => setValue(field.field_name, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`اختر ${field.field_label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.allowed_values.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Select type with free input */}
                {field.field_type === 'select' && field.field_mode === 'free_input' && (
                  <Input
                    value={formValues[field.field_name] || ''}
                    onChange={e => setValue(field.field_name, e.target.value)}
                    placeholder={field.field_label}
                  />
                )}

                {/* Photo */}
                {field.field_type === 'photo' && (
                  <div>
                    {photoPreviews[field.field_name] ? (
                      <div className="relative">
                        <img src={photoPreviews[field.field_name]} alt="" className="w-full h-40 object-cover rounded-lg" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 left-2"
                          onClick={() => {
                            setPhotos(prev => { const n = { ...prev }; delete n[field.field_name]; return n; });
                            setPhotoPreviews(prev => { const n = { ...prev }; delete n[field.field_name]; return n; });
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <Camera className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">التقط صورة</span>
                          </div>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(field.field_name, e.target.files[0])} />
                        </label>
                        <label className="flex-1">
                          <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">اختر صورة</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(field.field_name, e.target.files[0])} />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* GPS */}
                {field.field_type === 'gps' && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    {gpsCoords ? (
                      <span className="text-emerald-600">تم التقاط الموقع ✓</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.geolocation?.getCurrentPosition(
                            pos => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            () => toast.error('لم نتمكن من تحديد الموقع')
                          );
                        }}
                      >
                        تحديد الموقع
                      </Button>
                    )}
                  </div>
                )}

                {/* Show constraints hint for numbers */}
                {field.field_type === 'number' && (field.min_value != null || field.max_value != null) && (
                  <p className="text-[10px] text-muted-foreground">
                    {field.min_value != null && `الحد الأدنى: ${field.min_value}`}
                    {field.min_value != null && field.max_value != null && ' — '}
                    {field.max_value != null && `الحد الأقصى: ${field.max_value}`}
                  </p>
                )}
              </div>
            ))}

            {/* Fixed fields summary */}
            {fields.filter(f => f.field_mode === 'fixed' && f.fixed_value).length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">بيانات محددة مسبقاً:</p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.filter(f => f.field_mode === 'fixed' && f.fixed_value).map(f => (
                    <Badge key={f.field_name} variant="secondary" className="text-[10px]">
                      {f.field_label}: {f.fixed_value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'جاري الإرسال...' : 'إرسال البيانات'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground">
          مدعوم من منصة iRecycle لإدارة المخلفات
        </p>
      </div>
    </div>
  );
};

export default QuickShip;
