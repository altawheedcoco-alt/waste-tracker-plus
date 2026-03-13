import { useState, useCallback } from 'react';
import { generateDigitalVerificationStamp } from '@/lib/digitalVerificationStamp';
import { 
  FileText, Printer, Download, Calendar, Building2, Filter, 
  Loader2, FileStack, ClipboardList, Award, Receipt, Package,
  PenTool, Stamp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

type DocType = 'declarations' | 'certificates' | 'manifests' | 'invoices' | 'receipts' | 'signing' | 'all';

const DOC_TYPES: { id: DocType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'جميع المستندات', icon: <FileStack className="h-4 w-4" /> },
  { id: 'declarations', label: 'إقرارات التسليم', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'certificates', label: 'شهادات إعادة التدوير', icon: <Award className="h-4 w-4" /> },
  { id: 'manifests', label: 'المانيفست الموحد', icon: <FileText className="h-4 w-4" /> },
  { id: 'invoices', label: 'الفواتير', icon: <Receipt className="h-4 w-4" /> },
  { id: 'receipts', label: 'إيصالات الاستلام', icon: <Package className="h-4 w-4" /> },
  { id: 'signing', label: 'حالة التوقيعات والأختام', icon: <PenTool className="h-4 w-4" /> },
];

const BulkDocumentPrintDialog = () => {
  const { organization, profile } = useAuth();
  const orgId = organization?.id;

  const [open, setOpen] = useState(false);
  const [dateMode, setDateMode] = useState<'today' | 'range'>('today');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocType[]>(['all']);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch partners
  const { data: partners } = useQuery({
    queryKey: ['bulk-print-partners', orgId],
    enabled: !!orgId && open,
    staleTime: 60_000,
    queryFn: async () => {
      // Get unique partner IDs from shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .limit(500);

      const ids = new Set<string>();
      (shipments || []).forEach((s: any) => {
        if (s.generator_id && s.generator_id !== orgId) ids.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== orgId) ids.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== orgId) ids.add(s.recycler_id);
      });

      if (ids.size === 0) return [];
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', Array.from(ids));
      return data || [];
    },
  });

  const orgTypeLabel = (t: string) => {
    const map: Record<string, string> = { generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص' };
    return map[t] || t;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      new: 'جديدة', pending: 'معلقة', approved: 'معتمدة', collecting: 'قيد الجمع',
      in_transit: 'في الطريق', delivered: 'تم التسليم',
      confirmed: 'مؤكدة', cancelled: 'ملغاة', completed: 'مكتملة',
    };
    return map[s] || s;
  };

  const toggleDocType = (docType: DocType) => {
    if (docType === 'all') {
      setSelectedDocTypes(['all']);
      return;
    }
    let updated: DocType[] = selectedDocTypes.filter(d => d !== 'all');
    if (updated.includes(docType)) {
      updated = updated.filter(d => d !== docType);
    } else {
      updated.push(docType);
    }
    if (updated.length === 0) updated = ['all'];
    setSelectedDocTypes(updated);
  };

  const handlePrint = useCallback(async () => {
    if (!orgId || !organization) return;
    setIsPrinting(true);

    try {
      const fromDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom;
      const toDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo;
      const fromISO = `${fromDate}T00:00:00.000Z`;
      const toISO = `${toDate}T23:59:59.999Z`;

      const isAll = selectedDocTypes.includes('all');

      // Fetch shipments for the period
      let shipmentQuery = supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, weighbridge_net_weight, created_at, pickup_address, delivery_address, manual_vehicle_plate, manual_driver_name, generator_id, transporter_id, recycler_id, notes')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });

      if (selectedPartner !== 'all') {
        shipmentQuery = shipmentQuery.or(`generator_id.eq.${selectedPartner},transporter_id.eq.${selectedPartner},recycler_id.eq.${selectedPartner}` as any);
      }

      const [shipmentsRes, invoicesRes, receiptsRes, reportsRes, signingOutRes, signingInRes, docSigsRes] = await Promise.all([
        shipmentQuery,
        (isAll || selectedDocTypes.includes('invoices'))
          ? supabase.from('invoices').select('id, invoice_number, status, total_amount, created_at, due_date, partner_name')
              .eq('organization_id', orgId)
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        (isAll || selectedDocTypes.includes('receipts'))
          ? supabase.from('shipment_receipts').select('id, receipt_number, status, receipt_type, actual_weight, unit, created_at, shipment_id')
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        (isAll || selectedDocTypes.includes('certificates'))
          ? supabase.from('recycling_reports').select('id, report_number, created_at, shipment_id')
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        // Signing requests sent by us
        (isAll || selectedDocTypes.includes('signing'))
          ? supabase.from('signing_requests')
              .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, recipient_organization_id, recipient_org:organizations!signing_requests_recipient_organization_id_fkey(name)')
              .eq('sender_organization_id', orgId)
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        // Signing requests received by us
        (isAll || selectedDocTypes.includes('signing'))
          ? supabase.from('signing_requests')
              .select('id, document_title, document_type, status, signed_at, created_at, requires_stamp, signature_id, sender_organization_id, sender_org:organizations!signing_requests_sender_organization_id_fkey(name)')
              .eq('recipient_organization_id', orgId)
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        // Document signatures from our org
        (isAll || selectedDocTypes.includes('signing'))
          ? supabase.from('document_signatures')
              .select('id, document_type, document_id, signer_name, signer_role, signature_method, stamp_applied, platform_seal_number, document_hash, status, created_at')
              .eq('organization_id', orgId)
              .gte('created_at', fromISO).lte('created_at', toISO)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const shipments = (shipmentsRes.data || []) as any[];
      const invoices = ((invoicesRes as any).data || []) as any[];
      const receipts = ((receiptsRes as any).data || []) as any[];
      const reports = ((reportsRes as any).data || []) as any[];
      const signingOut = ((signingOutRes as any).data || []) as any[];
      const signingIn = ((signingInRes as any).data || []) as any[];
      const docSignatures = ((docSigsRes as any).data || []) as any[];

      // Get partner names
      const partnerIds = new Set<string>();
      shipments.forEach(s => {
        [s.generator_id, s.transporter_id, s.recycler_id].forEach(id => {
          if (id && id !== orgId) partnerIds.add(id);
        });
      });

      let partnerMap: Record<string, string> = {};
      if (partnerIds.size > 0) {
        const { data } = await supabase.from('organizations').select('id, name').in('id', Array.from(partnerIds));
        (data || []).forEach((p: any) => { partnerMap[p.id] = p.name; });
      }

      const selectedPartnerName = selectedPartner !== 'all'
        ? (partners?.find(p => p.id === selectedPartner)?.name || '')
        : 'جميع الجهات';

      const now = new Date();
      const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
      const timeStr = format(now, 'HH:mm:ss');
      const periodLabel = dateMode === 'today' 
        ? `يوم ${format(new Date(), 'EEEE yyyy/MM/dd', { locale: ar })}`
        : `من ${fromDate} إلى ${toDate}`;

      const showDeclarations = isAll || selectedDocTypes.includes('declarations');
      const showCertificates = isAll || selectedDocTypes.includes('certificates');
      const showManifests = isAll || selectedDocTypes.includes('manifests');
      const showInvoices = isAll || selectedDocTypes.includes('invoices');
      const showReceipts = isAll || selectedDocTypes.includes('receipts');
      const showSigning = isAll || selectedDocTypes.includes('signing');

      // Signing stats
      const sigOutSigned = signingOut.filter((s: any) => s.status === 'signed').length;
      const sigOutPending = signingOut.filter((s: any) => s.status === 'pending').length;
      const sigOutRejected = signingOut.filter((s: any) => s.status === 'rejected').length;
      const sigInSigned = signingIn.filter((s: any) => s.status === 'signed').length;
      const sigInPending = signingIn.filter((s: any) => s.status === 'pending').length;
      const sigInRejected = signingIn.filter((s: any) => s.status === 'rejected').length;
      const stamped = docSignatures.filter((s: any) => s.stamp_applied).length;
      const withQR = docSignatures.filter((s: any) => s.platform_seal_number).length;
      const withHash = docSignatures.filter((s: any) => s.document_hash).length;

      const sigStatusBadge = (status: string) => {
        if (status === 'signed') return '<span class="badge badge-s">✅ موقّع</span>';
        if (status === 'rejected') return '<span class="badge badge-d">❌ مرفوض</span>';
        return '<span class="badge badge-w">⏳ قيد الانتظار</span>';
      };

      const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير مستندات مجمع</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
  .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .header-right h1 { font-size: 20px; color: #059669; }
  .header-right .sub { font-size: 12px; color: #666; }
  .header-left { text-align: left; font-size: 10px; color: #666; }
  .filters { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap; }
  .filter-item { display: flex; align-items: center; gap: 4px; }
  .filter-label { font-weight: bold; color: #059669; }
  h2 { font-size: 14px; color: #059669; margin: 16px 0 6px; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 10px; }
  th { background: #059669; color: white; padding: 6px 4px; text-align: right; }
  td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; text-align: right; }
  tr:nth-child(even) { background: #f9fafb; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
  .badge-s { background: #dcfce7; color: #166534; }
  .badge-w { background: #fef3c7; color: #92400e; }
  .badge-i { background: #dbeafe; color: #1e40af; }
  .badge-d { background: #fee2e2; color: #991b1b; }
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
    <h1>📋 تقرير المستندات المجمع</h1>
    <div class="sub">${organization.name || ''}</div>
  </div>
  <div class="header-left">
    <div><strong>التاريخ:</strong> ${dateStr}</div>
    <div><strong>الوقت:</strong> ${timeStr}</div>
    <div><strong>أعده:</strong> ${profile?.full_name || ''}</div>
  </div>
</div>

<div class="filters">
  <div class="filter-item"><span class="filter-label">📅 الفترة:</span> ${periodLabel}</div>
  <div class="filter-item"><span class="filter-label">🏢 الجهة:</span> ${selectedPartnerName}</div>
  <div class="filter-item"><span class="filter-label">📄 المستندات:</span> ${isAll ? 'الكل' : selectedDocTypes.map(d => DOC_TYPES.find(dt => dt.id === d)?.label).join('، ')}</div>
</div>

<div class="summary" style="grid-template-columns: repeat(5, 1fr);">
  <div class="sum-card"><div class="sum-val">${shipments.length}</div><div class="sum-lbl">شحنات</div></div>
  <div class="sum-card"><div class="sum-val">${invoices.length}</div><div class="sum-lbl">فواتير</div></div>
  <div class="sum-card"><div class="sum-val">${receipts.length}</div><div class="sum-lbl">إيصالات</div></div>
  <div class="sum-card"><div class="sum-val">${reports.length}</div><div class="sum-lbl">شهادات</div></div>
  <div class="sum-card"><div class="sum-val">${signingOut.length + signingIn.length}</div><div class="sum-lbl">طلبات توقيع</div></div>
</div>

${(showDeclarations || showManifests) && shipments.length > 0 ? `
<h2>🚛 ${showManifests ? 'المانيفست / ' : ''}${showDeclarations ? 'إقرارات التسليم' : 'الشحنات'} (${shipments.length})</h2>
<table>
<thead><tr><th>#</th><th>رقم الشحنة</th><th>نوع المخلفات</th><th>الوزن</th><th>المركبة</th><th>السائق</th><th>الحالة</th><th>التاريخ</th></tr></thead>
<tbody>
${shipments.map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.shipment_number || '-'}</td>
  <td>${s.waste_type || '-'}</td>
  <td>${s.weighbridge_net_weight || s.quantity || 0} كجم</td>
  <td>${s.manual_vehicle_plate || '-'}</td>
  <td>${s.manual_driver_name || '-'}</td>
  <td><span class="badge ${s.status === 'delivered' || s.status === 'confirmed' ? 'badge-s' : s.status === 'in_transit' ? 'badge-i' : 'badge-w'}">${statusLabel(s.status || '')}</span></td>
  <td>${s.created_at ? format(new Date(s.created_at), 'MM/dd HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${showCertificates && reports.length > 0 ? `
<h2>🏅 شهادات إعادة التدوير (${reports.length})</h2>
<table>
<thead><tr><th>#</th><th>رقم الشهادة</th><th>رقم الشحنة</th><th>التاريخ</th></tr></thead>
<tbody>
${reports.map((r: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${r.report_number || '-'}</td>
  <td>${r.shipment_id ? r.shipment_id.substring(0, 8) : '-'}</td>
  <td>${r.created_at ? format(new Date(r.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${showInvoices && invoices.length > 0 ? `
<h2>🧾 الفواتير (${invoices.length})</h2>
<table>
<thead><tr><th>#</th><th>رقم الفاتورة</th><th>الجهة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead>
<tbody>
${invoices.map((inv: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${inv.invoice_number || '-'}</td>
  <td>${inv.partner_name || '-'}</td>
  <td>${(inv.total_amount || 0).toLocaleString('ar-EG')} ج.م</td>
  <td><span class="badge ${inv.status === 'paid' ? 'badge-s' : 'badge-w'}">${inv.status || '-'}</span></td>
  <td>${inv.created_at ? format(new Date(inv.created_at), 'yyyy/MM/dd') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${showReceipts && receipts.length > 0 ? `
<h2>📦 إيصالات الاستلام (${receipts.length})</h2>
<table>
<thead><tr><th>#</th><th>رقم الإيصال</th><th>النوع</th><th>الوزن</th><th>الحالة</th><th>التاريخ</th></tr></thead>
<tbody>
${receipts.map((r: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${r.receipt_number || '-'}</td>
  <td>${r.receipt_type || '-'}</td>
  <td>${r.actual_weight || '-'} ${r.unit || ''}</td>
  <td><span class="badge ${r.status === 'confirmed' ? 'badge-s' : 'badge-w'}">${r.status || '-'}</span></td>
  <td>${r.created_at ? format(new Date(r.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${showSigning ? `
<h2>✍️ حالة التوقيعات والأختام</h2>

<div class="summary" style="grid-template-columns: repeat(3, 1fr);">
  <div class="sum-card"><div class="sum-val">${signingOut.length}</div><div class="sum-lbl">طلبات مرسلة (مني)</div></div>
  <div class="sum-card"><div class="sum-val">${signingIn.length}</div><div class="sum-lbl">طلبات واردة (إليّ)</div></div>
  <div class="sum-card"><div class="sum-val">${docSignatures.length}</div><div class="sum-lbl">توقيعات رقمية</div></div>
</div>

<div class="summary" style="grid-template-columns: repeat(4, 1fr);">
  <div class="sum-card" style="border-color:#bbf7d0;"><div class="sum-val" style="color:#16a34a;">${sigOutSigned + sigInSigned}</div><div class="sum-lbl">✅ تم التوقيع</div></div>
  <div class="sum-card" style="border-color:#fde68a;"><div class="sum-val" style="color:#d97706;">${sigOutPending + sigInPending}</div><div class="sum-lbl">⏳ قيد الانتظار</div></div>
  <div class="sum-card" style="border-color:#fecaca;"><div class="sum-val" style="color:#dc2626;">${sigOutRejected + sigInRejected}</div><div class="sum-lbl">❌ مرفوض</div></div>
  <div class="sum-card" style="border-color:#c4b5fd;"><div class="sum-val" style="color:#7c3aed;">${stamped}</div><div class="sum-lbl">🔏 مختوم</div></div>
</div>

${signingOut.length > 0 ? `
<h2 style="font-size:12px;">📤 طلبات التوقيع المرسلة (مني) - ${signingOut.length}</h2>
<table>
<thead><tr><th>#</th><th>عنوان المستند</th><th>النوع</th><th>الجهة المستلمة</th><th>يتطلب ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
<tbody>
${signingOut.map((s: any, i: number) => `<tr>
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

${signingIn.length > 0 ? `
<h2 style="font-size:12px;">📥 طلبات التوقيع الواردة (إليّ) - ${signingIn.length}</h2>
<table>
<thead><tr><th>#</th><th>عنوان المستند</th><th>النوع</th><th>الجهة المرسلة</th><th>يتطلب ختم</th><th>الحالة</th><th>تاريخ التوقيع</th><th>التاريخ</th></tr></thead>
<tbody>
${signingIn.map((s: any, i: number) => `<tr>
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

${docSignatures.length > 0 ? `
<h2 style="font-size:12px;">🔐 التوقيعات الرقمية والأختام - ${docSignatures.length}</h2>
<table>
<thead><tr><th>#</th><th>نوع المستند</th><th>الموقّع</th><th>الدور</th><th>طريقة التوقيع</th><th>ختم</th><th>QR/رقم كودي</th><th>هاش SHA</th><th>التاريخ</th></tr></thead>
<tbody>
${docSignatures.map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.document_type || '-'}</td>
  <td>${s.signer_name || '-'}</td>
  <td>${s.signer_role || '-'}</td>
  <td>${s.signature_method || '-'}</td>
  <td>${s.stamp_applied ? '<span class="badge badge-s">✅ مختوم</span>' : '<span class="badge badge-w">—</span>'}</td>
  <td>${s.platform_seal_number || '—'}</td>
  <td style="font-size:8px;font-family:monospace;">${s.document_hash ? s.document_hash.substring(0, 16) + '...' : '—'}</td>
  <td>${s.created_at ? format(new Date(s.created_at), 'yyyy/MM/dd HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>
` : ''}

${(signingOut.length === 0 && signingIn.length === 0 && docSignatures.length === 0) ? '<p class="empty">لا توجد طلبات توقيع أو أختام في هذه الفترة</p>' : ''}
` : ''}

${generateDigitalVerificationStamp({
  referenceNumber: `RPT-${dateStr.replace(/\//g, '')}`,
  documentType: 'report',
  entityName: selectedPartnerName,
  accentColor: '#059669',
})}

<div class="footer">
  <p>تقرير صادر من منصة iRecycle لإدارة المخلفات | ${dateStr} - ${timeStr}</p>
  <p>الفترة: ${periodLabel} | الجهة: ${selectedPartnerName}</p>
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
    } catch (error) {
      console.error('Bulk print error:', error);
      toast.error('حدث خطأ أثناء تجهيز التقرير');
    } finally {
      setIsPrinting(false);
    }
  }, [orgId, organization, profile, dateMode, dateFrom, dateTo, selectedPartner, selectedDocTypes, partners]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileStack className="h-4 w-4" />
          مركز الطباعة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-primary" />
            مركز طباعة المستندات المجمعة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              الفترة الزمنية
            </Label>
            <Select value={dateMode} onValueChange={(v: 'today' | 'range') => setDateMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="range">فترة محددة (من - إلى)</SelectItem>
              </SelectContent>
            </Select>
            {dateMode === 'range' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">من</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">إلى</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Partner Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              الجهة
            </Label>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الجهة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الجهات</SelectItem>
                {(partners || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({orgTypeLabel(p.organization_type)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              نوع المستندات
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map(dt => (
                <label
                  key={dt.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedDocTypes.includes(dt.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                >
                  <Checkbox
                    checked={selectedDocTypes.includes(dt.id)}
                    onCheckedChange={() => toggleDocType(dt.id)}
                  />
                  {dt.icon}
                  <span className="text-xs">{dt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handlePrint} disabled={isPrinting} className="flex-1 gap-2">
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              طباعة التقرير المجمع
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDocumentPrintDialog;
