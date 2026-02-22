import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PenTool, Stamp, Printer, Calendar, Building2, Filter, 
  Loader2, CheckCircle, Clock, XCircle, QrCode, ArrowRight,
  CheckSquare, Square
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
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface PrintableItem {
  id: string;
  tab: 'outgoing' | 'incoming' | 'signatures';
  data: any;
}

const SigningStatus = () => {
  const { organization, profile } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const [dateMode, setDateMode] = useState<'today' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  const fromISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom}T00:00:00.000Z`;
  const toISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo}T23:59:59.999Z`;

  // Fetch partner organizations from signing requests
  const { data: sigPartners } = useQuery({
    queryKey: ['signing-partners', orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: outReqs } = await supabase
        .from('signing_requests')
        .select('recipient_organization_id')
        .eq('sender_organization_id', orgId!);
      const { data: inReqs } = await supabase
        .from('signing_requests')
        .select('sender_organization_id')
        .eq('recipient_organization_id', orgId!);

      const ids = new Set<string>();
      (outReqs || []).forEach((r: any) => { if (r.recipient_organization_id) ids.add(r.recipient_organization_id); });
      (inReqs || []).forEach((r: any) => { if (r.sender_organization_id) ids.add(r.sender_organization_id); });

      if (ids.size === 0) return [];
      const { data } = await supabase.from('organizations').select('id, name, organization_type').in('id', Array.from(ids));
      return data || [];
    },
  });

  const { data: signingOut, isLoading: loadingOut } = useQuery({
    queryKey: ['signing-out', orgId, fromISO, toISO, selectedPartner],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from('signing_requests')
        .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, recipient_organization_id, recipient_org:organizations!signing_requests_recipient_organization_id_fkey(name)')
        .eq('sender_organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      if (selectedPartner !== 'all') q = q.eq('recipient_organization_id', selectedPartner);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: signingIn, isLoading: loadingIn } = useQuery({
    queryKey: ['signing-in', orgId, fromISO, toISO, selectedPartner],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from('signing_requests')
        .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, sender_organization_id, sender_org:organizations!signing_requests_sender_organization_id_fkey(name)')
        .eq('recipient_organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      if (selectedPartner !== 'all') q = q.eq('sender_organization_id', selectedPartner);
      const { data } = await q;
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const sigStatusHtml = (status: string) => {
    if (status === 'signed') return '<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">✅ موقّع</span>';
    if (status === 'rejected') return '<span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">❌ مرفوض</span>';
    return '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">⏳ قيد الانتظار</span>';
  };

  const printStyles = `
    @page { size: A4; margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
    .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .header-right h1 { font-size: 18px; color: #059669; }
    .header-right .sub { font-size: 11px; color: #666; }
    .header-left { text-align: left; font-size: 10px; color: #666; }
    h2 { font-size: 14px; color: #059669; margin: 14px 0 6px; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 10px; }
    th { background: #059669; color: white; padding: 6px 4px; text-align: right; }
    td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; text-align: right; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 20px; border-top: 2px solid #059669; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 70px; color: rgba(5,150,105,0.04); font-weight: bold; z-index: -1; }
    .page-break { page-break-before: always; }
  `;

  const buildHeader = (title: string) => {
    const now = new Date();
    return `<div class="header">
      <div class="header-right"><h1>${title}</h1><div class="sub">${organization?.name || ''}</div></div>
      <div class="header-left"><div><strong>التاريخ:</strong> ${format(now, 'yyyy/MM/dd')}</div><div><strong>الوقت:</strong> ${format(now, 'HH:mm:ss')}</div><div><strong>أعده:</strong> ${profile?.full_name || ''}</div></div>
    </div>`;
  };

  const buildFooter = () => `<div class="footer"><p>تقرير صادر من منصة iRecycle | ${format(new Date(), 'yyyy/MM/dd HH:mm')}</p></div>`;

  const buildOutgoingRow = (s: any, i: number) => `<tr>
    <td>${i + 1}</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td>
    <td>${(s.recipient_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td>
    <td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td>
    <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr>`;

  const buildIncomingRow = (s: any, i: number) => `<tr>
    <td>${i + 1}</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td>
    <td>${(s.sender_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td>
    <td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td>
    <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr>`;

  const buildSignatureRow = (s: any, i: number) => `<tr>
    <td>${i + 1}</td><td>${s.document_type || '-'}</td><td>${s.signer_name || '-'}</td><td>${s.signer_role || '-'}</td>
    <td>${s.signature_method || '-'}</td><td>${s.stamp_applied ? '✅ مختوم' : '—'}</td>
    <td>${s.platform_seal_number || '—'}</td><td style="font-size:8px;font-family:monospace;">${s.document_hash ? s.document_hash.substring(0, 16) + '...' : '—'}</td>
    <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`;

  const openPrintWindow = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const printSingleOutgoing = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلب توقيع مرسل</title><style>${printStyles}</style></head><body>
      <div class="watermark">iRecycle</div>${buildHeader('طلب توقيع مرسل')}
      <h2>📤 تفاصيل الطلب</h2>
      <table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المستلمة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
      <tbody>${buildOutgoingRow(s, 0)}</tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
    toast.success('تم تجهيز الطلب للطباعة');
  };

  const printSingleIncoming = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلب توقيع وارد</title><style>${printStyles}</style></head><body>
      <div class="watermark">iRecycle</div>${buildHeader('طلب توقيع وارد')}
      <h2>📥 تفاصيل الطلب</h2>
      <table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المرسلة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
      <tbody>${buildIncomingRow(s, 0)}</tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
    toast.success('تم تجهيز الطلب للطباعة');
  };

  const printSingleSignature = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>توقيع رقمي</title><style>${printStyles}</style></head><body>
      <div class="watermark">iRecycle</div>${buildHeader('توقيع رقمي')}
      <h2>🔐 تفاصيل التوقيع</h2>
      <table><thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>الطريقة</th><th>ختم</th><th>QR/كود</th><th>هاش SHA</th><th>التاريخ</th></tr></thead>
      <tbody>${buildSignatureRow(s, 0)}</tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
    toast.success('تم تجهيز التوقيع للطباعة');
  };

  const printBulk = useCallback(() => {
    if (selectedIds.size === 0) { toast.error('اختر عناصر للطباعة أولاً'); return; }

    const selOut = (signingOut || []).filter((s: any) => selectedIds.has(s.id));
    const selIn = (signingIn || []).filter((s: any) => selectedIds.has(s.id));
    const selSig = (docSignatures || []).filter((s: any) => selectedIds.has(s.id));

    let body = `<div class="watermark">iRecycle</div>${buildHeader('تقرير التوقيعات والأختام - طباعة مجمعة')}`;

    if (selOut.length > 0) {
      body += `<h2>📤 طلبات مرسلة (${selOut.length})</h2>
      <table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المستلمة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
      <tbody>${selOut.map((s: any, i: number) => buildOutgoingRow(s, i)).join('')}</tbody></table>`;
    }
    if (selIn.length > 0) {
      body += `<h2>📥 طلبات واردة (${selIn.length})</h2>
      <table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المرسلة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
      <tbody>${selIn.map((s: any, i: number) => buildIncomingRow(s, i)).join('')}</tbody></table>`;
    }
    if (selSig.length > 0) {
      body += `<h2>🔐 توقيعات رقمية (${selSig.length})</h2>
      <table><thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>الطريقة</th><th>ختم</th><th>QR/كود</th><th>هاش SHA</th><th>التاريخ</th></tr></thead>
      <tbody>${selSig.map((s: any, i: number) => buildSignatureRow(s, i)).join('')}</tbody></table>`;
    }

    body += buildFooter();
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طباعة مجمعة</title><style>${printStyles}</style></head><body>${body}</body></html>`;
    openPrintWindow(html);
    toast.success(`تم تجهيز ${selectedIds.size} عنصر للطباعة`);
  }, [selectedIds, signingOut, signingIn, docSignatures, organization, profile]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PenTool className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">حالة التوقيعات والأختام</h1>
            <p className="text-muted-foreground text-sm">متابعة التوقيعات الرقمية والأختام لكل جهة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button onClick={printBulk} className="gap-2">
              <Printer className="h-4 w-4" />
              طباعة المحدد ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> الفترة</Label>
              <Select value={dateMode} onValueChange={(v: 'today' | 'range') => setDateMode(v)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
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
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> الجهة</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="جميع الجهات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الجهات</SelectItem>
                  {(sigPartners || []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{outSigned + inSigned}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> تم التوقيع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-accent-foreground">{outPending + inPending}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-destructive">{outRejected + inRejected}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> مرفوض</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-secondary-foreground">{stamped}</div>
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

          {/* Outgoing */}
          <TabsContent value="outgoing">
            <Card>
              <CardContent className="pt-4">
                {(signingOut || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع مرسلة في هذه الفترة</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Button variant="outline" size="sm" onClick={() => toggleAll((signingOut || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                        {(signingOut || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        {(signingOut || []).every((s: any) => selectedIds.has(s.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-2 w-8"></th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">عنوان المستند</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة المستلمة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(signingOut || []).map((s: any, i: number) => (
                            <tr key={s.id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2"><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
                              <td className="py-2 px-2">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                              <td className="py-2 px-2">{s.document_type || '-'}</td>
                              <td className="py-2 px-2">{(s.recipient_org as any)?.name || '-'}</td>
                              <td className="py-2 px-2">{s.requires_stamp ? <Stamp className="w-4 h-4 text-primary" /> : '—'}</td>
                              <td className="py-2 px-2">{statusBadge(s.status)}</td>
                              <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                              <td className="py-2 px-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingleOutgoing(s)} title="طباعة">
                                  <Printer className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incoming */}
          <TabsContent value="incoming">
            <Card>
              <CardContent className="pt-4">
                {(signingIn || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع واردة في هذه الفترة</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Button variant="outline" size="sm" onClick={() => toggleAll((signingIn || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                        {(signingIn || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        {(signingIn || []).every((s: any) => selectedIds.has(s.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-2 w-8"></th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">عنوان المستند</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة المرسلة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(signingIn || []).map((s: any, i: number) => (
                            <tr key={s.id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2"><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
                              <td className="py-2 px-2">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                              <td className="py-2 px-2">{s.document_type || '-'}</td>
                              <td className="py-2 px-2">{(s.sender_org as any)?.name || '-'}</td>
                              <td className="py-2 px-2">{s.requires_stamp ? <Stamp className="w-4 h-4 text-primary" /> : '—'}</td>
                              <td className="py-2 px-2">{statusBadge(s.status)}</td>
                              <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                              <td className="py-2 px-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingleIncoming(s)} title="طباعة">
                                  <Printer className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signatures */}
          <TabsContent value="signatures">
            <Card>
              <CardContent className="pt-4">
                {(docSignatures || []).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد توقيعات رقمية في هذه الفترة</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Button variant="outline" size="sm" onClick={() => toggleAll((docSignatures || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                        {(docSignatures || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        {(docSignatures || []).every((s: any) => selectedIds.has(s.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-2 w-8"></th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">نوع المستند</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الموقّع</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الدور</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">الطريقة</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">ختم</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">QR/كود</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th>
                            <th className="py-2 px-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(docSignatures || []).map((s: any, i: number) => (
                            <tr key={s.id} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2"><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
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
                              <td className="py-2 px-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingleSignature(s)} title="طباعة">
                                  <Printer className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
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
