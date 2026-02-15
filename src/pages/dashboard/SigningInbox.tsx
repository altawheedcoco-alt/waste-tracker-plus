import { useState } from 'react';
import { useSigningInbox, SigningRequest } from '@/hooks/useSigningInbox';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Send, Inbox, FileSignature, Clock, CheckCircle2, XCircle, Eye,
  Loader2, AlertTriangle, Stamp, ArrowLeft, Building2, User, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'في الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  viewed: { label: 'تمت المشاهدة', icon: Eye, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  signed: { label: 'تم التوقيع', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  expired: { label: 'منتهي الصلاحية', icon: AlertTriangle, color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'عادي', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'عاجل', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'طارئ', color: 'bg-red-100 text-red-800' },
};

function RequestCard({ request, type, onSign, onReject, onView }: {
  request: SigningRequest;
  type: 'incoming' | 'outgoing';
  onSign: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
}) {
  const sc = statusConfig[request.status] || statusConfig.pending;
  const pc = priorityConfig[request.priority] || priorityConfig.normal;
  const StatusIcon = sc.icon;

  return (
    <Card className="hover:shadow-md transition-shadow border-r-4" style={{
      borderRightColor: request.priority === 'urgent' ? 'hsl(var(--destructive))' :
        request.priority === 'high' ? 'hsl(var(--warning, 38 92% 50%))' : 'transparent'
    }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2 flex-shrink-0">
            {type === 'incoming' && request.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => onSign(request.id)} className="gap-1">
                  <FileSignature className="w-3 h-3" /> وقّع
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(request.id)} className="gap-1 text-destructive">
                  <XCircle className="w-3 h-3" /> ارفض
                </Button>
              </>
            )}
            {type === 'incoming' && request.status === 'viewed' && (
              <Button size="sm" onClick={() => onSign(request.id)} className="gap-1">
                <FileSignature className="w-3 h-3" /> وقّع
              </Button>
            )}
          </div>

          <div className="flex-1 text-right space-y-2">
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Badge className={pc.color} variant="secondary">{pc.label}</Badge>
              <Badge className={sc.color} variant="secondary">
                <StatusIcon className="w-3 h-3 ml-1" />
                {sc.label}
              </Badge>
              {request.requires_stamp && (
                <Badge variant="outline" className="gap-1"><Stamp className="w-3 h-3" /> يتطلب ختم</Badge>
              )}
              <h3 className="font-semibold text-base">{request.document_title}</h3>
            </div>

            {request.document_description && (
              <p className="text-sm text-muted-foreground">{request.document_description}</p>
            )}

            {request.message && (
              <div className="bg-muted/50 rounded-lg p-2 text-sm">
                <span className="text-muted-foreground">💬 </span>{request.message}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground justify-end flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {type === 'incoming' ? `من: ${request.sender_org?.name || '—'}` : `إلى: ${request.recipient_org?.name || '—'}`}
              </span>
              {request.sender_profile && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {request.sender_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(request.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
              </span>
              {request.deadline && (
                <span className="flex items-center gap-1 text-destructive">
                  <Clock className="w-3 h-3" />
                  موعد نهائي: {format(new Date(request.deadline), 'dd MMM yyyy', { locale: ar })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SigningInbox() {
  const { incoming, outgoing, isLoading, sendRequest, updateStatus } = useSigningInbox();
  const { profile } = useAuth();
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({
    recipient_organization_id: '',
    document_title: '',
    document_description: '',
    message: '',
    priority: 'normal',
    requires_stamp: false,
    document_type: 'general',
  });

  // Fetch partner organizations
  const { data: partners } = useQuery({
    queryKey: ['partner-orgs-for-signing', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data } = await supabase
        .from('partner_links')
        .select('partner_organization_id, organizations!partner_links_partner_organization_id_fkey(id, name)')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');
      
      // Also get reverse links
      const { data: reverseData } = await supabase
        .from('partner_links')
        .select('organization_id, organizations!partner_links_organization_id_fkey(id, name)')
        .eq('partner_organization_id', profile.organization_id)
        .eq('status', 'active');

      const orgs: { id: string; name: string }[] = [];
      const seen = new Set<string>();

      (data || []).forEach((d: any) => {
        const org = d.organizations;
        if (org && !seen.has(org.id)) { orgs.push(org); seen.add(org.id); }
      });
      (reverseData || []).forEach((d: any) => {
        const org = d.organizations;
        if (org && !seen.has(org.id)) { orgs.push(org); seen.add(org.id); }
      });

      return orgs;
    },
    enabled: !!profile?.organization_id,
  });

  const handleSend = () => {
    if (!form.recipient_organization_id || !form.document_title) {
      toast.error('اختر الجهة وعنوان المستند');
      return;
    }
    sendRequest.mutate(form, {
      onSuccess: () => {
        setSendOpen(false);
        setForm({ recipient_organization_id: '', document_title: '', document_description: '', message: '', priority: 'normal', requires_stamp: false, document_type: 'general' });
      },
    });
  };

  const handleSign = (id: string) => {
    updateStatus.mutate({ id, status: 'signed' }, {
      onSuccess: () => toast.success('تم التوقيع بنجاح ✅'),
    });
  };

  const handleReject = () => {
    if (!rejectOpen) return;
    updateStatus.mutate({ id: rejectOpen, status: 'rejected', rejection_reason: rejectReason }, {
      onSuccess: () => {
        toast.success('تم رفض الطلب');
        setRejectOpen(null);
        setRejectReason('');
      },
    });
  };

  // Mark as viewed when viewing incoming pending
  const handleMarkViewed = (id: string) => {
    const req = incoming.find(r => r.id === id);
    if (req && req.status === 'pending') {
      updateStatus.mutate({ id, status: 'viewed' });
    }
  };

  const pendingCount = incoming.filter(r => r.status === 'pending' || r.status === 'viewed').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" /> إرسال طلب توقيع
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" /> إرسال مستند للتوقيع
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>الجهة المستلمة *</Label>
                <Select value={form.recipient_organization_id} onValueChange={v => setForm(p => ({ ...p, recipient_organization_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الجهة الشريكة..." /></SelectTrigger>
                  <SelectContent>
                    {(partners || []).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عنوان المستند *</Label>
                <Input value={form.document_title} onChange={e => setForm(p => ({ ...p, document_title: e.target.value }))} placeholder="مثال: إقرار استلام مخلفات" className="text-right" />
              </div>
              <div>
                <Label>نوع المستند</Label>
                <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="receipt">إيصال استلام</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="certificate">شهادة</SelectItem>
                    <SelectItem value="permit">تصريح</SelectItem>
                    <SelectItem value="declaration">إقرار</SelectItem>
                    <SelectItem value="invoice">فاتورة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>وصف المستند</Label>
                <Textarea value={form.document_description} onChange={e => setForm(p => ({ ...p, document_description: e.target.value }))} placeholder="وصف مختصر..." className="text-right" rows={2} />
              </div>
              <div>
                <Label>رسالة للمستلم</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="أرجو التكرم بالتوقيع على..." className="text-right" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="high">عاجل</SelectItem>
                      <SelectItem value="urgent">طارئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id="require-stamp"
                      checked={form.requires_stamp}
                      onCheckedChange={v => setForm(p => ({ ...p, requires_stamp: !!v }))}
                    />
                    <label htmlFor="require-stamp" className="text-sm cursor-pointer flex items-center gap-1">
                      <Stamp className="w-4 h-4" /> يتطلب ختم رسمي
                    </label>
                  </div>
                </div>
              </div>
              <Button onClick={handleSend} disabled={sendRequest.isPending} className="w-full gap-2">
                {sendRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                إرسال الطلب
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-right">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            صندوق التوقيعات
            <FileSignature className="w-7 h-7 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm">إرسال واستقبال المستندات للتوقيع بين الجهات الشريكة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Inbox className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{incoming.length}</p>
            <p className="text-xs text-muted-foreground">واردة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{outgoing.length}</p>
            <p className="text-xs text-muted-foreground">صادرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">بانتظار التوقيع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{incoming.filter(r => r.status === 'signed').length + outgoing.filter(r => r.status === 'signed').length}</p>
            <p className="text-xs text-muted-foreground">موقّعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming" dir="rtl">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="w-4 h-4" /> الواردة
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <Send className="w-4 h-4" /> الصادرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3 mt-4">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد طلبات واردة</p>
                <p className="text-sm text-muted-foreground/70">ستظهر هنا المستندات المرسلة إليك للتوقيع</p>
              </CardContent>
            </Card>
          ) : (
            incoming.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                type="incoming"
                onSign={handleSign}
                onReject={id => setRejectOpen(id)}
                onView={handleMarkViewed}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-3 mt-4">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Send className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد طلبات صادرة</p>
                <p className="text-sm text-muted-foreground/70">أرسل مستنداً لجهة شريكة للتوقيع عليه</p>
              </CardContent>
            </Card>
          ) : (
            outgoing.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                type="outgoing"
                onSign={() => {}}
                onReject={() => {}}
                onView={() => {}}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={v => { if (!v) { setRejectOpen(null); setRejectReason(''); } }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="اذكر سبب رفض التوقيع..."
              className="text-right"
              rows={3}
            />
            <Button onClick={handleReject} variant="destructive" className="w-full gap-2" disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              تأكيد الرفض
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
