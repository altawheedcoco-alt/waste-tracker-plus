import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Recycle, Phone, Mail, MessageCircle, MapPin, Package, Image, Calendar } from "lucide-react";

const TYPE_MAP: Record<string, string> = {
  waste_offer: "عرض مخلفات",
  service_request: "طلب خدمة",
  inquiry: "استفسار",
  contact_request: "طلب تواصل",
  complaint: "شكوى",
};

export default function C2BPublicView() {
  const { code } = useParams<{ code: string }>();

  const { data: submission, isLoading, error } = useQuery({
    queryKey: ["c2b-public", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("c2b_submissions")
        .select("*")
        .eq("external_share_code", code)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
    </div>
  );

  if (error || !submission) return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <Recycle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">الرابط غير صالح</h2>
          <p className="text-muted-foreground">هذا الرابط غير موجود أو منتهي الصلاحية</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Recycle className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">iRecycle — طلب مشترك</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{submission.subject}</CardTitle>
              <Badge variant="secondary">{TYPE_MAP[submission.submission_type]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(submission.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">الاسم:</span> {submission.full_name}
              </div>
              {submission.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-primary" /><span dir="ltr">{submission.phone}</span></div>}
              {submission.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-primary" /><span dir="ltr">{submission.email}</span></div>}
              {submission.whatsapp_number && <div className="flex items-center gap-2 text-sm"><MessageCircle className="w-4 h-4 text-green-500" /><span dir="ltr">{submission.whatsapp_number}</span></div>}
              {submission.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-primary" />{submission.location}</div>}
            </div>

            {submission.waste_type && (
              <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 text-sm">
                <Package className="w-5 h-5 text-primary" />
                <span>نوع المخلفات: {submission.waste_type}</span>
                {submission.estimated_quantity && <span>• الكمية: {submission.estimated_quantity}</span>}
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">{submission.message}</p>
            </div>

            {submission.photo_urls?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2"><Image className="w-4 h-4" /> الصور</p>
                <div className="flex flex-wrap gap-3">
                  {submission.photo_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-28 h-28 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
