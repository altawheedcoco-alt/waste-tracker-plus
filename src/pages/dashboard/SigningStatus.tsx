import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PenTool, Stamp, Printer, Calendar, Building2, Filter,
  Loader2, CheckCircle, Clock, XCircle, QrCode, ArrowRight,
  CheckSquare, Square, Shield, Users, Fingerprint, Settings2,
  Eye, Hash, BarChart3, FileText, Zap, Download, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

// Sub-components
import SignatoryCard from '@/components/signatories/SignatoryCard';
import AutoSignatureSettings from '@/components/signatories/AutoSignatureSettings';
import { SignaturesStampsManager } from '@/components/endorsement';
import OrganizationSignatureSettings from '@/components/signature/OrganizationSignatureSettings';

const SigningStatus = () => {
  const { organization, profile, user } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const [activeTab, setActiveTab] = useState('overview');
  const [dateMode, setDateMode] = useState<'today' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPartner, setSelectedPartner] = useState<string>('all');

  const fromISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom}T00:00:00.000Z`;
  const toISO = `${dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo}T23:59:59.999Z`;

  // === DATA QUERIES ===

  // Organization signatures & stamps
  const { data: orgSignatures = [], isLoading: loadingOrgSigs } = useQuery({
    queryKey: ['org-signatures', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_signatures')
        .select('*')
        .eq('organization_id', orgId!)
        .order('is_primary', { ascending: false });
      return data || [];
    },
  });

  const { data: orgStamps = [], isLoading: loadingOrgStamps } = useQuery({
    queryKey: ['org-stamps', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_stamps')
        .select('*')
        .eq('organization_id', orgId!)
        .order('is_primary', { ascending: false });
      return data || [];
    },
  });

  // Authorized signatories
  const { data: signatories = [], isLoading: loadingSignatories } = useQuery({
    queryKey: ['signatories', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('authorized_signatories')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Partner organizations
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

  // Signing requests
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

  // Document signatures
  const { data: docSignatures, isLoading: loadingSigs } = useQuery({
    queryKey: ['doc-signatures', orgId, fromISO, toISO],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('document_signatures')
        .select('id, document_type, document_id, signer_name, signer_role, signer_title, signature_method, signature_image_url, stamp_applied, stamp_image_url, platform_seal_number, document_hash, signature_hash, status, created_at')
        .eq('organization_id', orgId!)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Audit log
  const { data: auditLog = [] } = useQuery({
    queryKey: ['sig-audit-log', orgId],
    enabled: !!orgId && activeTab === 'overview',
    queryFn: async () => {
      const { data } = await (supabase.from('signature_audit_log') as any)
        .select('id, action, actor_name, document_type, document_id, created_at, details')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const isLoading = loadingOut || loadingIn || loadingSigs;

  // === COMPUTED STATS ===
  const stats = useMemo(() => {
    const outSigned = (signingOut || []).filter((s: any) => s.status === 'signed').length;
    const outPending = (signingOut || []).filter((s: any) => s.status === 'pending').length;
    const outRejected = (signingOut || []).filter((s: any) => s.status === 'rejected').length;
    const inSigned = (signingIn || []).filter((s: any) => s.status === 'signed').length;
    const inPending = (signingIn || []).filter((s: any) => s.status === 'pending').length;
    const inRejected = (signingIn || []).filter((s: any) => s.status === 'rejected').length;
    const stamped = (docSignatures || []).filter((s: any) => s.stamp_applied).length;
    const withQR = (docSignatures || []).filter((s: any) => s.platform_seal_number).length;
    const activeSignatories = signatories.filter((s: any) => s.is_active).length;
    const activeSigs = orgSignatures.filter((s: any) => s.is_active).length;
    const activeStamps = orgStamps.filter((s: any) => s.is_active).length;

    return {
      totalSigned: outSigned + inSigned,
      totalPending: outPending + inPending,
      totalRejected: outRejected + inRejected,
      stamped, withQR, activeSignatories, activeSigs, activeStamps,
      totalDocSigs: (docSignatures || []).length,
    };
  }, [signingOut, signingIn, docSignatures, signatories, orgSignatures, orgStamps]);

  // === HELPERS ===
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

  // Print helpers
  const printStyles = `@page{size:A4;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;direction:rtl}.header{border-bottom:3px solid #059669;padding-bottom:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}.header-right h1{font-size:18px;color:#059669}.header-right .sub{font-size:11px;color:#666}.header-left{text-align:left;font-size:10px;color:#666}h2{font-size:14px;color:#059669;margin:14px 0 6px;border-bottom:1px solid #d1d5db;padding-bottom:3px}table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:10px}th{background:#059669;color:white;padding:6px 4px;text-align:right}td{padding:5px 4px;border-bottom:1px solid #e5e7eb;text-align:right}tr:nth-child(even){background:#f9fafb}.footer{margin-top:20px;border-top:2px solid #059669;padding-top:8px;font-size:9px;color:#999;text-align:center}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:70px;color:rgba(5,150,105,0.04);font-weight:bold;z-index:-1}`;

  const openPrintWindow = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const buildHeader = (title: string) => {
    const now = new Date();
    return `<div class="header"><div class="header-right"><h1>${title}</h1><div class="sub">${organization?.name || ''}</div></div><div class="header-left"><div><strong>التاريخ:</strong> ${format(now, 'yyyy/MM/dd')}</div><div><strong>الوقت:</strong> ${format(now, 'HH:mm:ss')}</div><div><strong>أعده:</strong> ${profile?.full_name || ''}</div></div></div>`;
  };

  const buildFooter = () => `<div class="footer"><p>تقرير صادر من منصة iRecycle | ${format(new Date(), 'yyyy/MM/dd HH:mm')}</p></div>`;

  const sigStatusHtml = (status: string) => {
    if (status === 'signed') return '<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">✅ موقّع</span>';
    if (status === 'rejected') return '<span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">❌ مرفوض</span>';
    return '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">⏳ قيد الانتظار</span>';
  };

  const printSingleOutgoing = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلب توقيع مرسل</title><style>${printStyles}</style></head><body><div class="watermark">iRecycle</div>${buildHeader('طلب توقيع مرسل')}<h2>📤 تفاصيل الطلب</h2><table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المستلمة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead><tbody><tr><td>1</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td><td>${(s.recipient_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td><td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr></tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
  };

  const printSingleIncoming = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طلب توقيع وارد</title><style>${printStyles}</style></head><body><div class="watermark">iRecycle</div>${buildHeader('طلب توقيع وارد')}<h2>📥 تفاصيل الطلب</h2><table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المرسلة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead><tbody><tr><td>1</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td><td>${(s.sender_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td><td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr></tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
  };

  const printSingleSignature = (s: any) => {
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>توقيع رقمي</title><style>${printStyles}</style></head><body><div class="watermark">iRecycle</div>${buildHeader('توقيع رقمي')}<h2>🔐 تفاصيل التوقيع</h2><table><thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>الطريقة</th><th>ختم</th><th>QR/كود</th><th>هاش SHA</th><th>التاريخ</th></tr></thead><tbody><tr><td>1</td><td>${s.document_type || '-'}</td><td>${s.signer_name || '-'}</td><td>${s.signer_role || '-'}</td><td>${s.signature_method || '-'}</td><td>${s.stamp_applied ? '✅ مختوم' : '—'}</td><td>${s.platform_seal_number || '—'}</td><td style="font-size:8px;font-family:monospace;">${s.document_hash ? s.document_hash.substring(0, 16) + '...' : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td></tr></tbody></table>${buildFooter()}</body></html>`;
    openPrintWindow(html);
  };

  const printBulk = useCallback(() => {
    if (selectedIds.size === 0) { toast.error('اختر عناصر للطباعة أولاً'); return; }
    const selOut = (signingOut || []).filter((s: any) => selectedIds.has(s.id));
    const selIn = (signingIn || []).filter((s: any) => selectedIds.has(s.id));
    const selSig = (docSignatures || []).filter((s: any) => selectedIds.has(s.id));
    let body = `<div class="watermark">iRecycle</div>${buildHeader('تقرير الهوية الرقمية - طباعة مجمعة')}`;
    if (selOut.length > 0) {
      body += `<h2>📤 طلبات مرسلة (${selOut.length})</h2><table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المستلمة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead><tbody>${selOut.map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td><td>${(s.recipient_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td><td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr>`).join('')}</tbody></table>`;
    }
    if (selIn.length > 0) {
      body += `<h2>📥 طلبات واردة (${selIn.length})</h2><table><thead><tr><th>#</th><th>العنوان</th><th>النوع</th><th>الجهة المرسلة</th><th>ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead><tbody>${selIn.map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.document_title || '-'}</td><td>${s.document_type || '-'}</td><td>${(s.sender_org as any)?.name || '-'}</td><td>${s.requires_stamp ? '🔏 نعم' : '—'}</td><td>${sigStatusHtml(s.status)}</td><td>${s.signed_at ? format(new Date(s.signed_at), 'yyyy/MM/dd HH:mm') : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td></tr>`).join('')}</tbody></table>`;
    }
    if (selSig.length > 0) {
      body += `<h2>🔐 توقيعات رقمية (${selSig.length})</h2><table><thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>الطريقة</th><th>ختم</th><th>QR/كود</th><th>هاش SHA</th><th>التاريخ</th></tr></thead><tbody>${selSig.map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.document_type || '-'}</td><td>${s.signer_name || '-'}</td><td>${s.signer_role || '-'}</td><td>${s.signature_method || '-'}</td><td>${s.stamp_applied ? '✅ مختوم' : '—'}</td><td>${s.platform_seal_number || '—'}</td><td style="font-size:8px;font-family:monospace;">${s.document_hash ? s.document_hash.substring(0, 16) + '...' : '—'}</td><td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}</tbody></table>`;
    }
    body += buildFooter();
    openPrintWindow(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طباعة مجمعة</title><style>${printStyles}</style></head><body>${body}</body></html>`);
    toast.success(`تم تجهيز ${selectedIds.size} عنصر للطباعة`);
  }, [selectedIds, signingOut, signingIn, docSignatures, organization, profile]);

  const verificationBaseUrl = window.location.origin;

  // === ORG IDENTITY CARD ===
  const orgVerifyCode = (organization as any)?.organization_code || orgId?.slice(0, 8) || 'N/A';
  const orgQRValue = `${verificationBaseUrl}/qr-verify?type=entity_certificate&code=${orgVerifyCode}`;

  // === RENDER ===
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">المنظومة المركزية للهوية الرقمية</h1>
            <p className="text-muted-foreground text-sm">إدارة التوقيعات والأختام والباركود ورموز QR ورموز التحقق لكل جهة وموظف ومفوض</p>
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="w-3.5 h-3.5" /> نظرة عامة</TabsTrigger>
          <TabsTrigger value="identity" className="gap-1 text-xs"><Building2 className="w-3.5 h-3.5" /> هوية الجهة</TabsTrigger>
          <TabsTrigger value="signatories" className="gap-1 text-xs"><Users className="w-3.5 h-3.5" /> المفوضون</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1 text-xs"><FileText className="w-3.5 h-3.5" /> الطلبات</TabsTrigger>
          <TabsTrigger value="doc-sigs" className="gap-1 text-xs"><PenTool className="w-3.5 h-3.5" /> التوقيعات</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs"><Settings2 className="w-3.5 h-3.5" /> الإعدادات</TabsTrigger>
        </TabsList>

        {/* === TAB: OVERVIEW === */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'توقيعات نشطة', value: stats.activeSigs, icon: PenTool, color: 'text-blue-600' },
              { label: 'أختام نشطة', value: stats.activeStamps, icon: Stamp, color: 'text-violet-600' },
              { label: 'مفوضون نشطون', value: stats.activeSignatories, icon: Shield, color: 'text-emerald-600' },
              { label: 'مستندات موقعة', value: stats.totalDocSigs, icon: FileText, color: 'text-primary' },
              { label: 'تم التوقيع', value: stats.totalSigned, icon: CheckCircle, color: 'text-green-600' },
              { label: 'قيد الانتظار', value: stats.totalPending, icon: Clock, color: 'text-amber-600' },
              { label: 'مختوم', value: stats.stamped, icon: Stamp, color: 'text-purple-600' },
              { label: 'مع QR', value: stats.withQR, icon: QrCode, color: 'text-teal-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-3 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Organization Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                بطاقة الهوية الرقمية للجهة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Org Info */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">{organization?.name || '—'}</h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>كود الجهة: <span className="font-mono font-bold text-foreground">{orgVerifyCode}</span></p>
                    <p>النوع: <Badge variant="outline">{organization?.organization_type || '—'}</Badge></p>
                  </div>
                  {/* Primary Signature */}
                  {orgSignatures.find((s: any) => s.is_primary && s.is_active) && (
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">التوقيع الأساسي</p>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-14 border rounded bg-background flex items-center justify-center overflow-hidden">
                          <img
                            src={(orgSignatures.find((s: any) => s.is_primary) as any)?.signature_image_url}
                            alt="التوقيع"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{(orgSignatures.find((s: any) => s.is_primary) as any)?.signer_name}</p>
                          <p className="text-xs text-muted-foreground">{(orgSignatures.find((s: any) => s.is_primary) as any)?.signer_position}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Primary Stamp */}
                  {orgStamps.find((s: any) => s.is_primary && s.is_active) && (
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2">الختم الأساسي</p>
                      <div className="w-16 h-16 border rounded-full bg-background flex items-center justify-center overflow-hidden mx-auto">
                        <img
                          src={(orgStamps.find((s: any) => s.is_primary) as any)?.stamp_image_url}
                          alt="الختم"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="text-sm font-semibold text-muted-foreground">رمز QR للتحقق</p>
                  <QRCodeSVG value={orgQRValue} size={160} level="H" includeMargin />
                  <p className="text-[9px] text-muted-foreground text-center max-w-[200px]">
                    امسح الرمز للتحقق من هوية الجهة وصلاحيات التوقيع
                  </p>
                </div>

                {/* Barcode */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="text-sm font-semibold text-muted-foreground">الباركود</p>
                  <Barcode
                    value={orgVerifyCode}
                    width={1.5}
                    height={60}
                    fontSize={12}
                    margin={4}
                    displayValue
                  />
                  <p className="text-[9px] text-muted-foreground">رمز التحقق الثابت (VRF): <span className="font-mono font-bold">{orgVerifyCode}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                آخر إجراءات التوقيع والختم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">لا توجد إجراءات حديثة</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {auditLog.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {log.action === 'sign' ? <PenTool className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{log.actor_name || 'نظام'}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.action === 'sign' ? 'وقّع' : log.action === 'stamp' ? 'ختم' : log.action} — {log.document_type || ''}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {log.created_at ? format(new Date(log.created_at), 'MM/dd HH:mm') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB: IDENTITY (Signatures & Stamps Management) === */}
        <TabsContent value="identity" className="space-y-6 mt-4">
          <SignaturesStampsManager />
        </TabsContent>

        {/* === TAB: SIGNATORIES === */}
        <TabsContent value="signatories" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{signatories.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي المفوضين</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{signatories.filter((s: any) => s.is_active).length}</p>
              <p className="text-xs text-muted-foreground">نشط</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{signatories.filter((s: any) => !s.is_active).length}</p>
              <p className="text-xs text-muted-foreground">غير نشط</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{signatories.filter((s: any) => s.authority_level === 'executive' || s.authority_level === 'ceo').length}</p>
              <p className="text-xs text-muted-foreground">سلطة تنفيذية</p>
            </CardContent></Card>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={() => navigate('/dashboard/authorized-signatories')} className="gap-2">
              <Plus className="w-4 h-4" />
              إدارة المفوضين
            </Button>
          </div>

          {loadingSignatories ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : signatories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">لا يوجد مفوضون</h3>
                <p className="text-sm text-muted-foreground mt-1">أضف مفوضين معتمدين لمنحهم صلاحية التوقيع</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {signatories.map((sig: any) => (
                <SignatoryCard
                  key={sig.id}
                  signatory={sig}
                  organizationName={organization?.name || ''}
                  verificationBaseUrl={verificationBaseUrl}
                  onEdit={() => navigate('/dashboard/authorized-signatories')}
                  onDelete={() => {}}
                  onToggleActive={() => {}}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* === TAB: REQUESTS === */}
        <TabsContent value="requests" className="space-y-6 mt-4">
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
            <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{stats.totalSigned}</div><p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> تم التوقيع</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-accent-foreground">{stats.totalPending}</div><p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-destructive">{stats.totalRejected}</div><p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> مرفوض</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-secondary-foreground">{stats.stamped}</div><p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Stamp className="w-3 h-3" /> مختوم</p></CardContent></Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : (
            <Tabs defaultValue="outgoing" dir="rtl">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="outgoing" className="gap-1">📤 مرسلة ({(signingOut || []).length})</TabsTrigger>
                <TabsTrigger value="incoming" className="gap-1">📥 واردة ({(signingIn || []).length})</TabsTrigger>
              </TabsList>

              <TabsContent value="outgoing">
                <Card><CardContent className="pt-4">
                  {(signingOut || []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع مرسلة</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Button variant="outline" size="sm" onClick={() => toggleAll((signingOut || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                          {(signingOut || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          تحديد الكل
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b"><th className="py-2 px-2 w-8"></th><th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">العنوان</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th><th className="py-2 px-2 w-10"></th></tr></thead>
                          <tbody>
                            {(signingOut || []).map((s: any, i: number) => (
                              <tr key={s.id} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2"><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
                                <td className="py-2 px-2">{i + 1}</td>
                                <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                                <td className="py-2 px-2">{s.document_type || '-'}</td>
                                <td className="py-2 px-2">{(s.recipient_org as any)?.name || '-'}</td>
                                <td className="py-2 px-2">{statusBadge(s.status)}</td>
                                <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                                <td className="py-2 px-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingleOutgoing(s)}><Printer className="w-3.5 h-3.5" /></Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="incoming">
                <Card><CardContent className="pt-4">
                  {(signingIn || []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد طلبات توقيع واردة</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Button variant="outline" size="sm" onClick={() => toggleAll((signingIn || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                          {(signingIn || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          تحديد الكل
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b"><th className="py-2 px-2 w-8"></th><th className="text-right py-2 px-2 font-medium text-muted-foreground">#</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">العنوان</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">الجهة</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">الحالة</th><th className="text-right py-2 px-2 font-medium text-muted-foreground">التاريخ</th><th className="py-2 px-2 w-10"></th></tr></thead>
                          <tbody>
                            {(signingIn || []).map((s: any, i: number) => (
                              <tr key={s.id} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2"><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
                                <td className="py-2 px-2">{i + 1}</td>
                                <td className="py-2 px-2 font-medium">{s.document_title || '-'}</td>
                                <td className="py-2 px-2">{s.document_type || '-'}</td>
                                <td className="py-2 px-2">{(s.sender_org as any)?.name || '-'}</td>
                                <td className="py-2 px-2">{statusBadge(s.status)}</td>
                                <td className="py-2 px-2 text-muted-foreground">{s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd') : '-'}</td>
                                <td className="py-2 px-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingleIncoming(s)}><Printer className="w-3.5 h-3.5" /></Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* === TAB: DOCUMENT SIGNATURES === */}
        <TabsContent value="doc-sigs" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                التوقيعات الرقمية على المستندات
              </CardTitle>
              <CardDescription>جميع التوقيعات والأختام المطبقة على مستندات الجهة مع بصمة التحقق الرقمية</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSigs ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : (docSignatures || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد توقيعات رقمية</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={() => toggleAll((docSignatures || []).map((s: any) => s.id))} className="gap-1.5 text-xs">
                      {(docSignatures || []).every((s: any) => selectedIds.has(s.id)) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      تحديد الكل
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {(docSignatures || []).map((s: any) => (
                      <Card key={s.id} className="border-muted">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Signature Image */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                              {s.signature_image_url ? (
                                <div className="w-20 h-14 border rounded bg-background flex items-center justify-center overflow-hidden">
                                  <img src={s.signature_image_url} alt="sig" className="max-w-full max-h-full object-contain" />
                                </div>
                              ) : (
                                <div className="w-20 h-14 border rounded bg-muted/50 flex items-center justify-center">
                                  <PenTool className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              {s.stamp_applied && s.stamp_image_url && (
                                <div className="w-14 h-14 border rounded-full bg-background flex items-center justify-center overflow-hidden">
                                  <img src={s.stamp_image_url} alt="stamp" className="max-w-full max-h-full object-contain" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{s.signer_name || 'غير معروف'}</span>
                                {s.signer_title && <span className="text-xs text-muted-foreground">• {s.signer_title}</span>}
                                {statusBadge(s.status)}
                                {s.stamp_applied && <Badge variant="secondary" className="gap-1 text-xs"><Stamp className="w-3 h-3" /> مختوم</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {s.document_type} • {s.signature_method} • {s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : ''}
                              </p>
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                {s.platform_seal_number && (
                                  <span className="flex items-center gap-1 text-primary font-mono">
                                    <QrCode className="w-3 h-3" /> {s.platform_seal_number}
                                  </span>
                                )}
                                {s.document_hash && (
                                  <span className="flex items-center gap-1 text-muted-foreground font-mono">
                                    <Hash className="w-3 h-3" /> SHA: {s.document_hash.substring(0, 16)}...
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printSingleSignature(s)} title="طباعة">
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB: SETTINGS === */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <OrganizationSignatureSettings />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  التوقيع التلقائي
                </CardTitle>
                <CardDescription>ضبط التوقيع والختم التلقائي عند إصدار المستندات</CardDescription>
              </CardHeader>
              <CardContent>
                <AutoSignatureSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SigningStatus;
