import { useState, useCallback } from 'react';
import { 
  PenTool, Stamp, Printer, Calendar, Building2, Filter, 
  Loader2, CheckCircle, Clock, XCircle, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const SigningStatus = () => {
  const { organization, profile } = useAuth();
  const orgId = organization?.id;

  const [dateMode, setDateMode] = useState<'today' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fromISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom}T00:00:00.000Z`;
  const toISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo}T23:59:59.999Z`;

  const { data: signingOut, isLoading: loadingOut } = useQuery({
    queryKey: ['signing-out', orgId, fromISO, toISO],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('signing_requests')
        .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, recipient_organization_id, recipient_org:organizations!signing_requests_recipient_organization_id_fkey(name)')
        .eq('sender_organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: signingIn, isLoading: loadingIn } = useQuery({
    queryKey: ['signing-in', orgId, fromISO, toISO],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('signing_requests')
        .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, sender_organization_id, sender_org:organizations!signing_requests_sender_organization_id_fkey(name)')
        .eq('recipient_organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: docSignatures, isLoading: loadingSigs } = useQuery({
    queryKey: ['doc-signatures', orgId, fromISO, toISO],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('document_signatures')
        .select('id, document_type, document_id, signer_name, signer_role, signature_method, stamp_applied, platform_seal_number, document_hash, status, created_at')
        .eq('organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const isLoading = loadingOut || loadingIn || loadingSigs;

  // Stats
  const outSigned = (signingOut || []).filter((s: any) => s.status === 'signed').length;
  const outPending = (signingOut || []).filter((s: any) => s.status === 'pending').length;
  const outRejected = (signingOut || []).filter((s: any) => s.status === 'rejected').length;
  const inSigned = (signingIn || []).filter((s: any) => s.status === 'signed').length;
  const inPending = (signingIn || []).filter((s: any) => s.status === 'pending').length;
  const inRejected = (signingIn || []).filter((s: any) => s.status === 'rejected').length;
  const stamped = (docSignatures || []).filter((s: any) => s.stamp_applied).length;
  const withQR = (docSignatures || []).filter((s: any) => s.platform_seal_number).length;

  const statusBadge = (status: string) => {
    if (status === 'signed') return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" /> موقّع</Badge>;
    if (status === 'rejected') return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>;
    return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</Badge>;
  };

  const handlePrint = useCallback(() => {
    // Print the signing status report
    const sigStatusBadge = (status: string) => {
      if (status === 'signed') return '<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">✅ موقّع</span>';
      if (status === 'rejected') return '<span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">❌ مرفوض</span>';
      return '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">⏳ قيد الانتظار</span>';
    };

    const now = new Date();
    const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
    const timeStr = format(now, 'HH:mm:ss');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير حالة التوقيعات والأختام</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
  .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .header-right h1 { font-size: 20px; color: #059669; }
  .header-right .sub { font-size: 12px; color: #666; }
  .header-left { text-align: left; font-size: 10px; color: #666; }
  h2 { font-size: 14px; color: #059669; margin: 16px 0 6px; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 10px; }
  th { background: #059669; color: white; padding: 6px 4px; text-align: right; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; text-align: right; }
  tr:nth-child(even) { background: #f9fafb; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 12px 0; }
  .sum-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; text-align: center; }
  .sum-val { font-size: 20px; font-weight: bold; color: #059669; }
  .sum-lbl { font-size: 10px; color: #666; margin-top: 2px; }
  .footer { margin-top: 20px; border-top: 2px solid #059669; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
  .empty { color: #999; padding: 8px; font-style: italic; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 70px; color: rgba(5,150,105,0.04); font-weight: bold; z-index: -1; }
</style>
</head>
<body>
<div class="watermark">iRecycle</div>

<div class="header">
  <div class="header-right">
    <h1>✍️ تقرير حالة التوقيعات والأختام</h1>
    <div class="sub">${organization?.name || ''}</div>
  </div>
  <div class="header-left">
    <div><strong>التاريخ:</strong> ${dateStr}</div>
    <div><strong>الوقت:</strong> ${timeStr}</div>
    <div><strong>أعده:</strong> ${profile?.full_name || ''}</div>
  </div>
</div>

<div class="summary">
  <div class="sum-card" style="border-color:#bbf7d0;"><div class="sum-val" style="color:#16a34a;">${outSigned + inSigned}</div><div class="sum-lbl">✅ تم التوقيع</div></div>
  <div class="sum-card" style="border-color:#fde68a;"><div class="sum-val" style="color:#d97706;">${outPending + inPending}</div><div class="sum-lbl">⏳ قيد الانتظار</div></div>
  <div class="sum-card" style="border-color:#fecaca;"><div class="sum-val" style="color:#dc2626;">${outRejected + inRejected}</div><div class="sum-lbl">❌ مرفوض</div></div>
  <div class="sum-card" style="border-color:#c4b5fd;"><div class="sum-val" style="color:#7c3aed;">${stamped}</div><div class="sum-lbl">🔏 مختوم</div></div>
</div>

${(signingOut || []).length > 0 ? `
<h2>📤 طلبات التوقيع المرسلة (${(signingOut || []).length})</h2>
<table>
<thead><tr><th>#</th><th>عنوان المستند</th><th>النوع</th><th>الجهة المستلمة</th><th>يتطلب ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
<tbody>
${(signingOut || []).map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.document_title || '-'}</td>
  <td>${s.document_type || '-'}</td>
  <td>${(s.recipient_org as any)?.name || '-'}</td>
  <td>${s.requires_stamp ? '🔏 نعم' : '—'}</td>
  <td>${sigStatusBadge(s.status)}</td>
  <td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td>
  <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${(signingIn || []).length > 0 ? `
<h2>📥 طلبات التوقيع الواردة (${(signingIn || []).length})</h2>
<table>
<thead><tr><th>#</th><th>عنوان المستند</th><th>النوع</th><th>الجهة المرسلة</th><th>يتطلب ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
<tbody>
${(signingIn || []).map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.document_title || '-'}</td>
  <td>${s.document_type || '-'}</td>
  <td>${(s.sender_org as any)?.name || '-'}</td>
  <td>${s.requires_stamp ? '🔏 نعم' : '—'}</td>
  <td>${sigStatusBadge(s.status)}</td>
  <td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td>
  <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${(docSignatures || []).length > 0 ? `
<h2>🔐 التوقيعات الرقمية والأختام (${(docSignatures || []).length})</h2>
<table>
<thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>طريقة التوقيع</th><th>ختم</th><th>QR/رقم كودي</th><th>هاش SHA</th><th>التاريخ</th></tr></thead>
<tbody>
${(docSignatures || []).map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.document_type || '-'}</td>
  <td>${s.signer_name || '-'}</td>
  <td>${s.signer_role || '-'}</td>
  <td>${s.signature_method || '-'}</td>
  <td>${s.stamp_applied ? '✅ مختوم' : '—'}</td>
  <td>${s.platform_seal_number || '—'}</td>
  <td style="font-size:8px;font-family:monospace;">${s.document_hash ? s.document_hash.substring(0, 16) + '...' : '—'}</td>
  <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

<div class="footer">
  <p>تقرير صادر من منصة iRecycle لإدارة المخلفات | ${dateStr} - ${timeStr}</p>
  <p>هذا التقرير آلي ولا يحتاج إلى توقيع</p>
</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
    toast.success('تم تجهيز التقرير للطباعة');
  }, [organization, profile, signingOut, signingIn, docSignatures, outSigned, inSigned, outPending, inPending, outRejected, inRejected, stamped]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PenTool className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">حالة التوقيعات والأختام</h1>
            <p className="text-muted-foreground text-sm">متابعة التوقيعات الرقمية والأختام لكل جهة</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة التقرير
        </Button>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> الفترة</Label>
              <Select value={dateMode} onValueChange={(v: 'today' | 'range') => setDateMode(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="range">فترة محددة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateMode === 'range' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">من</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[160px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">إلى</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[160px]" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{outSigned + inSigned}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> تم التوقيع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{outPending + inPending}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-red-600">{outRejected + inRejected}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> مرفوض</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{stamped}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Stamp className="w-3 h-3" /> مختوم</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="outgoing" dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="outgoing" className="gap-1">📤 مرسلة ({(signingOut || []).length})</TabsTrigger>
            <TabsTrigger value="incoming" className="gap-1">📥 واردة ({(signingIn || []).length})</TabsTrigger>
            <TabsTrigger value="signatures" className="gap-1">🔐 توقيعات ({(docSignatures || []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="outgoing">
            <Card>
              <CardContent className="pt-4">
                {(signingOut || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع مرسلة في هذه الفترة</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">عنوان المستند</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة المستلمة</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(signingOut || []).map((s: any, i: number) => (
                          <tr key={s.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">{i + 1}</td>
                            <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                            <td className="py-2 px-2">{s.document_type || '-'}</td>
                            <td className="py-2 px-2">{(s.recipient_org as any)?.name || '-'}</td>
                            <td className="py-2 px-2">{s.requires_stamp ? <Stamp className="w-4 h-4 text-violet-500" /> : '—'}</td>
                            <td className="py-2 px-2">{statusBadge(s.status)}</td>
                            <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming">
            <Card>
              <CardContent className="pt-4">
                {(signingIn || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع واردة في هذه الفترة</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">عنوان المستند</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة المرسلة</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(signingIn || []).map((s: any, i: number) => (
                          <tr key={s.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">{i + 1}</td>
                            <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                            <td className="py-2 px-2">{s.document_type || '-'}</td>
                            <td className="py-2 px-2">{(s.sender_org as any)?.name || '-'}</td>
                            <td className="py-2 px-2">{s.requires_stamp ? <Stamp className="w-4 h-4 text-violet-500" /> : '—'}</td>
                            <td className="py-2 px-2">{statusBadge(s.status)}</td>
                            <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signatures">
            <Card>
              <CardContent className="pt-4">
                {(docSignatures || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد توقيعات رقمية في هذه الفترة</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">نوع المستند</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الموقّع</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الدور</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">الطريقة</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">QR/كود</th>
                          <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(docSignatures || []).map((s: any, i: number) => (
                          <tr key={s.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">{i + 1}</td>
                            <td className="py-2 px-2">{s.document_type || '-'}</td>
                            <td className="py-2 px-2 font-medium">{s.signer_name || '-'}</td>
                            <td className="py-2 px-2">{s.signer_role || '-'}</td>
                            <td className="py-2 px-2">{s.signature_method || '-'}</td>
                            <td className="py-2 px-2">
                              {s.stamp_applied ? <Badge variant="default" className="gap-1"><Stamp className="w-3 h-3" /> مختوم</Badge> : '—'}
                            </td>
                            <td className="py-2 px-2">
                              {s.platform_seal_number ? <span className="flex items-center gap-1"><QrCode className="w-3 h-3 text-primary" /> {s.platform_seal_number}</span> : '—'}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SigningStatus;
