import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Inbox, Eye, Forward, Share2, MessageCircle, Copy,
  CheckCircle2, Clock, AlertCircle, Search, ExternalLink,
  Phone, Mail, Image, MapPin, Package, Send
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "جديد", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Inbox },
  in_review: { label: "قيد المراجعة", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  forwarded: { label: "تم التحويل", color: "bg-purple-500/10 text-purple-600 border-purple-200", icon: Forward },
  responded: { label: "تم الرد", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2 },
  closed: { label: "مغلق", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
};

const TYPE_MAP: Record<string, string> = {
  waste_offer: "عرض مخلفات",
  service_request: "طلب خدمة",
  inquiry: "استفسار",
  contact_request: "طلب تواصل",
  complaint: "شكوى",
};

export default function AdminC2BPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forwardDialog, setForwardDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [forwardOrgId, setForwardOrgId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["c2b-submissions", filterStatus],
    queryFn: async () => {
      let q = supabase
        .from("c2b_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["all-orgs-for-forward"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("id, name, name_ar").limit(200);
      return data || [];
    },
  });

  const selected = submissions.find((s: any) => s.id === selectedId);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (notes) update.admin_notes = notes;
      if (status === "in_review") update.admin_notes = notes || "قيد المراجعة";
      const { error } = await supabase.from("c2b_submissions").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["c2b-submissions"] }); toast.success("تم تحديث الحالة"); },
  });

  const forwardSubmission = useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await supabase.from("c2b_submissions").update({
        status: "forwarded",
        forwarded_to_org_id: orgId,
        forwarded_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["c2b-submissions"] });
      setForwardDialog(false);
      toast.success("تم تحويل الطلب للجهة المحددة");
    },
  });

  const generateShareLink = useMutation({
    mutationFn: async (id: string) => {
      const code = Math.random().toString(36).slice(2, 10);
      const { error } = await supabase.from("c2b_submissions").update({
        external_share_code: code,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      const url = `${window.location.origin}/c2b/${code}`;
      navigator.clipboard.writeText(url);
      qc.invalidateQueries({ queryKey: ["c2b-submissions"] });
      toast.success("تم نسخ رابط المشاركة!");
    },
  });

  const filtered = submissions.filter((s: any) =>
    !search || s.full_name?.includes(search) || s.subject?.includes(search) || s.phone?.includes(search)
  );

  const stats = {
    total: submissions.length,
    new: submissions.filter((s: any) => s.status === "new").length,
    inReview: submissions.filter((s: any) => s.status === "in_review").length,
    forwarded: submissions.filter((s: any) => s.status === "forwarded").length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الطلبات", value: stats.total, icon: Inbox, color: "text-primary" },
          { label: "جديد", value: stats.new, icon: AlertCircle, color: "text-blue-500" },
          { label: "قيد المراجعة", value: stats.inReview, icon: Clock, color: "text-yellow-500" },
          { label: "محوّل", value: stats.forwarded, icon: Forward, color: "text-purple-500" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الموضوع أو الهاتف..."
            className="pr-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="in_review">قيد المراجعة</SelectItem>
            <SelectItem value="forwarded">محوّل</SelectItem>
            <SelectItem value="responded">تم الرد</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
          ) : filtered.map((s: any) => {
            const st = STATUS_MAP[s.status] || STATUS_MAP.new;
            return (
              <Card
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedId === s.id ? "ring-2 ring-primary" : ""}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{s.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{s.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(s.created_at), "dd MMM yyyy • HH:mm", { locale: ar })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] ${st.color}`}>
                        {st.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {TYPE_MAP[s.submission_type] || s.submission_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selected.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      من: {selected.full_name} • {format(new Date(selected.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_MAP[selected.status]?.color}>
                    {STATUS_MAP[selected.status]?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Contact Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <span dir="ltr">{selected.phone}</span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <span dir="ltr" className="truncate">{selected.email}</span>
                    </div>
                  )}
                  {selected.whatsapp_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span dir="ltr">{selected.whatsapp_number}</span>
                    </div>
                  )}
                  {selected.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{selected.location}</span>
                    </div>
                  )}
                </div>

                {/* Waste Info */}
                {selected.waste_type && (
                  <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-lg p-3">
                    <Package className="w-5 h-5 text-primary" />
                    <span>نوع: {selected.waste_type}</span>
                    {selected.estimated_quantity && <span>• الكمية: {selected.estimated_quantity}</span>}
                  </div>
                )}

                {/* Message */}
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                </div>

                {/* Photos */}
                {selected.photo_urls?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Image className="w-4 h-4" /> الصور المرفقة ({selected.photo_urls.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {selected.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`صورة ${i + 1}`}
                            className="w-24 h-24 rounded-lg object-cover border border-border hover:ring-2 ring-primary transition-all"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {selected.admin_notes && (
                  <div className="bg-yellow-500/5 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>ملاحظات:</strong> {selected.admin_notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {selected.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ id: selected.id, status: "in_review" })}
                    >
                      <Eye className="w-4 h-4" /> بدء المراجعة
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setAdminNotes(""); setForwardDialog(true); }}
                  >
                    <Forward className="w-4 h-4" /> تحويل لجهة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateShareLink.mutate(selected.id)}
                  >
                    <Share2 className="w-4 h-4" /> إنشاء رابط مشاركة
                  </Button>
                  {selected.external_share_code && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/c2b/${selected.external_share_code}`);
                        toast.success("تم نسخ الرابط");
                      }}
                    >
                      <Copy className="w-4 h-4" /> نسخ الرابط
                    </Button>
                  )}
                  {selected.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: selected.id, status: "closed" })}
                    >
                      <CheckCircle2 className="w-4 h-4" /> إغلاق
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">اختر طلباً لعرض تفاصيله</p>
            </Card>
          )}
        </div>
      </div>

      {/* Forward Dialog */}
      <Dialog open={forwardDialog} onOpenChange={setForwardDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تحويل الطلب لجهة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={forwardOrgId} onValueChange={setForwardOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الجهة" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name_ar || o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="ملاحظات للجهة (اختياري)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => selected && forwardSubmission.mutate({ id: selected.id, orgId: forwardOrgId })}
              disabled={!forwardOrgId || forwardSubmission.isPending}
            >
              <Send className="w-4 h-4" /> تحويل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
