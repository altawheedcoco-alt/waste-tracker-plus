import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/inputSanitizer";
import {
  Recycle, Send, Camera, X, CheckCircle2, Loader2,
  Phone, Mail, MessageCircle, MapPin, Package, User
} from "lucide-react";

const SUBMISSION_TYPES = [
  { value: "waste_offer", label: "عرض مخلفات للبيع/التخلص", icon: Package },
  { value: "service_request", label: "طلب خدمة نقل أو تدوير", icon: Recycle },
  { value: "inquiry", label: "استفسار عام", icon: MessageCircle },
  { value: "contact_request", label: "طلب التواصل معي", icon: Phone },
  { value: "complaint", label: "شكوى أو ملاحظة", icon: Mail },
];

interface C2BFormData {
  full_name: string;
  phone: string;
  email: string;
  whatsapp_number: string;
  submission_type: string;
  subject: string;
  message: string;
  waste_type: string;
  estimated_quantity: string;
  location: string;
}

const initialForm: C2BFormData = {
  full_name: "",
  phone: "",
  email: "",
  whatsapp_number: "",
  submission_type: "inquiry",
  subject: "",
  message: "",
  waste_type: "",
  estimated_quantity: "",
  location: "",
};

export default function C2BSubmissionForm() {
  const [form, setForm] = useState<C2BFormData>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof C2BFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error("الحد الأقصى 5 صور");
      return;
    }
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
    if (!form.full_name.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("يرجى ملء الحقول المطلوبة: الاسم، الموضوع، والرسالة");
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("c2b-photos").upload(path, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("c2b-photos").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("c2b_submissions").insert({
        full_name: sanitizeText(form.full_name),
        phone: sanitizePhone(form.phone),
        email: sanitizeEmail(form.email),
        whatsapp_number: sanitizePhone(form.whatsapp_number),
        submission_type: form.submission_type,
        subject: sanitizeText(form.subject),
        message: sanitizeText(form.message),
        waste_type: form.waste_type ? sanitizeText(form.waste_type) : null,
        estimated_quantity: form.estimated_quantity ? sanitizeText(form.estimated_quantity) : null,
        location: form.location ? sanitizeText(form.location) : null,
        photo_urls: photoUrls,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("تم إرسال طلبك بنجاح!");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-16 px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          شكراً لتواصلك معنا! 🎉
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-2">
          تم استلام طلبك بنجاح وسيتم متابعته من فريقنا المتخصص في أقرب وقت.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-8">
          سعداء بتواصلك مع منصة <span className="text-primary font-semibold">iRecycle</span> — معاً نبني مستقبلاً أنظف وأكثر استدامة ♻️
        </p>
        <Button
          onClick={() => { setSubmitted(false); setForm(initialForm); setPhotos([]); setPhotoPreviews([]); }}
          variant="outline"
          size="lg"
        >
          إرسال طلب آخر
        </Button>
      </motion.div>
    );
  }

  const isWaste = form.submission_type === "waste_offer";

  return (
    <section id="c2b-form" className="py-16 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Recycle className="w-4 h-4" />
            تواصل معنا
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            عندك مخلفات أو تحتاج خدمة؟
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            أرسل لنا طلبك وسنتواصل معك — سواء كنت فرداً أو شركة
          </p>
        </motion.div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    الاسم الكامل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={e => handleChange("full_name", e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    رقم الهاتف
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => handleChange("phone", e.target.value)}
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange("email", e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    رقم الواتساب
                  </Label>
                  <Input
                    value={form.whatsapp_number}
                    onChange={e => handleChange("whatsapp_number", e.target.value)}
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Submission Type */}
              <div className="space-y-2">
                <Label>نوع الطلب <span className="text-destructive">*</span></Label>
                <Select value={form.submission_type} onValueChange={v => handleChange("submission_type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBMISSION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Waste-specific fields */}
              <AnimatePresence>
                {isWaste && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label>نوع المخلفات</Label>
                      <Input
                        value={form.waste_type}
                        onChange={e => handleChange("waste_type", e.target.value)}
                        placeholder="بلاستيك، ورق، إلكترونيات..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الكمية التقريبية</Label>
                      <Input
                        value={form.estimated_quantity}
                        onChange={e => handleChange("estimated_quantity", e.target.value)}
                        placeholder="مثال: 50 كجم"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        الموقع
                      </Label>
                      <Input
                        value={form.location}
                        onChange={e => handleChange("location", e.target.value)}
                        placeholder="المدينة أو المنطقة"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subject & Message */}
              <div className="space-y-2">
                <Label>الموضوع <span className="text-destructive">*</span></Label>
                <Input
                  value={form.subject}
                  onChange={e => handleChange("subject", e.target.value)}
                  placeholder="عنوان مختصر لطلبك"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الرسالة <span className="text-destructive">*</span></Label>
                <Textarea
                  value={form.message}
                  onChange={e => handleChange("message", e.target.value)}
                  placeholder="اكتب تفاصيل طلبك أو رسالتك هنا..."
                  rows={5}
                  required
                />
              </div>

              {/* Photos */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  صور المخلفات (اختياري — حتى 5 صور)
                </Label>
                <div className="flex flex-wrap gap-3">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px]">إضافة</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="eco"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>
                ) : (
                  <><Send className="w-5 h-5" /> إرسال الطلب</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
