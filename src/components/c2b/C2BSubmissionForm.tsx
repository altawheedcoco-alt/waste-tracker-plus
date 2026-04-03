import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/inputSanitizer";
import {
  Recycle, Send, Camera, X, CheckCircle2, Loader2,
  Phone, Mail, MessageCircle, MapPin, Package, User,
  Home, Building, Clock, Calendar, Banknote, Navigation
} from "lucide-react";

const WASTE_TYPES = [
  { value: "plastic", label: "بلاستيك", emoji: "♳" },
  { value: "paper", label: "ورق وكرتون", emoji: "📦" },
  { value: "metal", label: "معادن وألومنيوم", emoji: "🔩" },
  { value: "glass", label: "زجاج", emoji: "🫙" },
  { value: "electronics", label: "إلكترونيات", emoji: "📱" },
  { value: "organic", label: "مخلفات عضوية", emoji: "🥬" },
  { value: "textile", label: "أقمشة وملابس", emoji: "👕" },
  { value: "wood", label: "أخشاب", emoji: "🪵" },
  { value: "rubber", label: "مطاط وإطارات", emoji: "🛞" },
  { value: "mixed", label: "مخلفات مختلطة", emoji: "🗑️" },
  { value: "hazardous", label: "مخلفات خطرة", emoji: "☣️" },
  { value: "construction", label: "مخلفات بناء", emoji: "🧱" },
  { value: "oil", label: "زيوت مستعملة", emoji: "🛢️" },
  { value: "other", label: "أخرى", emoji: "📋" },
];

const PROPERTY_TYPES = [
  { value: "individual", label: "منزل / شقة", icon: Home },
  { value: "compound", label: "كمبوند سكني", icon: Building },
  { value: "building", label: "مبنى / عمارة", icon: Building },
  { value: "villa", label: "فيلا", icon: Home },
  { value: "commercial", label: "محل تجاري", icon: Building },
];

const TIME_SLOTS = [
  { value: "morning", label: "صباحاً (8ص - 12ظ)" },
  { value: "afternoon", label: "ظهراً (12ظ - 4م)" },
  { value: "evening", label: "مساءً (4م - 8م)" },
  { value: "anytime", label: "أي وقت" },
];

interface FormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  area_name: string;
  governorate: string;
  property_type: string;
  compound_name: string;
  waste_description: string;
  estimated_quantity: string;
  preferred_date: string;
  preferred_time_slot: string;
  suggested_price: string;
  notes: string;
}

const initialForm: FormData = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  area_name: "",
  governorate: "",
  property_type: "individual",
  compound_name: "",
  waste_description: "",
  estimated_quantity: "",
  preferred_date: "",
  preferred_time_slot: "anytime",
  suggested_price: "",
  notes: "",
};

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية",
  "الدقهلية", "البحيرة", "المنوفية", "الغربية", "كفر الشيخ",
  "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء",
  "جنوب سيناء", "البحر الأحمر", "الوادي الجديد", "مطروح", "الفيوم",
  "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان",
];

export default function C2BSubmissionForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [selectedWastes, setSelectedWastes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleWaste = (value: string) => {
    setSelectedWastes(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
        toast.success("تم تحديد موقعك بنجاح");
      },
      () => {
        setGettingLocation(false);
        toast.error("فشل تحديد الموقع — يرجى إدخال العنوان يدوياً");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) { toast.error("الحد الأقصى 5 صور"); return; }
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) toast.warning("تم تجاهل ملفات أكبر من 5 ميجا");
    setPhotos(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { toast.error("يرجى إدخال الاسم"); return; }
    if (!form.customer_phone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    if (!form.customer_address.trim() && !coords) { toast.error("يرجى إدخال العنوان أو تحديد الموقع"); return; }
    if (selectedWastes.length === 0) { toast.error("يرجى اختيار نوع مخلفات واحد على الأقل"); return; }

    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `collection-requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("c2b-photos").upload(path, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("c2b-photos").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("collection_requests").insert({
        customer_name: sanitizeText(form.customer_name),
        customer_phone: sanitizePhone(form.customer_phone),
        customer_email: form.customer_email ? sanitizeEmail(form.customer_email) : null,
        customer_address: sanitizeText(form.customer_address) || null,
        pickup_address: sanitizeText(form.customer_address) || 'غير محدد',
        area_name: form.area_name ? sanitizeText(form.area_name) : null,
        governorate: form.governorate || null,
        property_type: form.property_type,
        compound_name: form.compound_name ? sanitizeText(form.compound_name) : null,
        waste_type: selectedWastes.join(', '),
        waste_types: selectedWastes,
        waste_description: form.waste_description ? sanitizeText(form.waste_description) : null,
        estimated_weight_kg: form.estimated_quantity ? parseFloat(form.estimated_quantity) || null : null,
        preferred_date: form.preferred_date || null,
        preferred_time_slot: form.preferred_time_slot,
        suggested_price: form.suggested_price ? parseFloat(form.suggested_price) || null : null,
        notes: form.notes ? sanitizeText(form.notes) : null,
        photos: photoUrls,
        pickup_latitude: coords?.lat || null,
        pickup_longitude: coords?.lng || null,
        source: 'website',
        status: 'pending',
        ip_address: null,
        user_agent: navigator.userAgent,
      } as any);

      if (error) throw error;

      // Also save to c2b_submissions for admin tracking
      await supabase.from("c2b_submissions").insert({
        full_name: sanitizeText(form.customer_name),
        phone: sanitizePhone(form.customer_phone),
        email: form.customer_email ? sanitizeEmail(form.customer_email) : null,
        submission_type: 'service_request',
        subject: `طلب تجميع سكني — ${selectedWastes.map(w => WASTE_TYPES.find(t => t.value === w)?.label).join('، ')}`,
        message: form.notes || form.waste_description || 'طلب تجميع من الصفحة الرئيسية',
        waste_type: selectedWastes.join(', '),
        estimated_quantity: form.estimated_quantity || null,
        location: form.customer_address || form.area_name || form.governorate || null,
        photo_urls: photoUrls,
      }).catch(() => { /* ignore secondary insert failure */ });

      setSubmitted(true);
      toast.success("تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center py-16 px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground mb-3">تم استلام طلبك بنجاح! 🎉</h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          سيتم إرسال طلبك للجهات الناقلة في منطقتك وسيتم التواصل معك في أقرب وقت.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-8">
          شكراً لمساهمتك مع <span className="text-primary font-semibold">iRecycle</span> في بناء مستقبل أنظف ♻️
        </p>
        <Button onClick={() => { setSubmitted(false); setForm(initialForm); setSelectedWastes([]); setPhotos([]); setPhotoPreviews([]); setCoords(null); }} variant="outline" size="lg">
          إرسال طلب آخر
        </Button>
      </motion.div>
    );
  }

  const showCompound = form.property_type === 'compound';

  return (
    <section id="c2b-form" className="py-16 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Recycle className="w-4 h-4" />
            طلب تجميع سكني
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            عندك مخلفات في البيت؟ اطلب تجميع الآن!
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            أرسل طلبك بدون تسجيل — وسنوصلك بأقرب جهة ناقلة في منطقتك
          </p>
        </motion.div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-5 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><User className="w-4 h-4 text-primary" />بياناتك</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">الاسم <span className="text-destructive">*</span></Label>
                    <Input value={form.customer_name} onChange={e => handleChange("customer_name", e.target.value)} placeholder="الاسم الكامل" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الهاتف <span className="text-destructive">*</span></Label>
                    <Input value={form.customer_phone} onChange={e => handleChange("customer_phone", e.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" dir="ltr" required />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">البريد الإلكتروني (اختياري)</Label>
                    <Input type="email" value={form.customer_email} onChange={e => handleChange("customer_email", e.target.value)} placeholder="example@email.com" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />الموقع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">المحافظة</Label>
                    <Select value={form.governorate} onValueChange={v => handleChange("governorate", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                      <SelectContent>
                        {GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">المنطقة / الحي</Label>
                    <Input value={form.area_name} onChange={e => handleChange("area_name", e.target.value)} placeholder="مثال: حدائق أكتوبر" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs">العنوان التفصيلي <span className="text-destructive">*</span></Label>
                    <Input value={form.customer_address} onChange={e => handleChange("customer_address", e.target.value)} placeholder="الشارع، المبنى، الشقة..." />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={gettingLocation} className="gap-2">
                      {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      {coords ? '✓ تم تحديد الموقع' : 'تحديد موقعي تلقائياً'}
                    </Button>
                    {coords && <span className="text-[10px] text-muted-foreground mr-2">({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</span>}
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Home className="w-4 h-4 text-primary" />نوع المكان</h3>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button key={pt.value} type="button" onClick={() => handleChange("property_type", pt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        form.property_type === pt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                      <pt.icon className="w-3.5 h-3.5" />
                      {pt.label}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showCompound && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                      <Input value={form.compound_name} onChange={e => handleChange("compound_name", e.target.value)} placeholder="اسم الكمبوند (مثال: بيت المصرية)" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Waste Types */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" />نوع المخلفات <span className="text-destructive text-xs">*</span></h3>
                <div className="flex flex-wrap gap-2">
                  {WASTE_TYPES.map(wt => (
                    <button key={wt.value} type="button" onClick={() => toggleWaste(wt.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        selectedWastes.includes(wt.value)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                      <span>{wt.emoji}</span>
                      {wt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Package className="w-3 h-3" />الكمية التقريبية (كجم)</Label>
                  <Input type="number" value={form.estimated_quantity} onChange={e => handleChange("estimated_quantity", e.target.value)} placeholder="مثال: 50" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />التاريخ المفضل</Label>
                  <Input type="date" value={form.preferred_date} onChange={e => handleChange("preferred_date", e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />الوقت المفضل</Label>
                  <Select value={form.preferred_time_slot} onValueChange={v => handleChange("preferred_time_slot", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(ts => <SelectItem key={ts.value} value={ts.value}>{ts.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional: price & notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Banknote className="w-3 h-3" />السعر المقترح (ج.م) — اختياري</Label>
                  <Input type="number" value={form.suggested_price} onChange={e => handleChange("suggested_price", e.target.value)} placeholder="اقتراح سعر" inputMode="numeric" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ملاحظات إضافية</Label>
                  <Input value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="أي تفاصيل إضافية..." />
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-xs"><Camera className="w-4 h-4 text-primary" />صور المخلفات (اختياري — حتى 5 صور)</Label>
                <div className="flex flex-wrap gap-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <Camera className="w-5 h-5" /><span className="text-[10px]">إضافة</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
              </div>

              {/* Submit */}
              <Button type="submit" variant="eco" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>) : (<><Send className="w-5 h-5" /> إرسال طلب التجميع</>)}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">
                بإرسال الطلب، سيتم مشاركة بياناتك مع جهات النقل المسجلة للتواصل معك
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
