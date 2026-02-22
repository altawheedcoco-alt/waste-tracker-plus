import { useState, useCallback, useMemo } from 'react';
import { 
  FileText, Printer, Calendar, Building2, Filter, 
  Loader2, FileStack, ClipboardList, Award, Receipt, Package,
  Eye, Download, CheckSquare, Square, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

type DocType = 'declarations' | 'certificates' | 'manifests' | 'invoices' | 'receipts' | 'all';

const DOC_TYPES: { id: DocType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'جميع المستندات', icon: <FileStack className="h-4 w-4" /> },
  { id: 'declarations', label: 'إقرارات التسليم', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'certificates', label: 'شهادات إعادة التدوير', icon: <Award className="h-4 w-4" /> },
  { id: 'manifests', label: 'المانيفست الموحد', icon: <FileText className="h-4 w-4" /> },
  { id: 'invoices', label: 'الفواتير', icon: <Receipt className="h-4 w-4" /> },
  { id: 'receipts', label: 'إيصالات الاستلام', icon: <Package className="h-4 w-4" /> },
];

interface DocumentItem {
  id: string;
  type: DocType;
  typeLabel: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  rawData: any;
}

const PrintCenter = () => {
  const { organization, profile } = useAuth();
  const orgId = organization?.id;

  const [dateMode, setDateMode] = useState<'today' | 'range'>('today');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocType[]>(['all']);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fromDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateFrom;
  const toDate = dateMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : dateTo;
  const fromISO = `${fromDate}T00:00:00.000Z`;
  const toISO = `${toDate}T23:59:59.999Z`;
  const isAll = selectedDocTypes.includes('all');

  const { data: partners } = useQuery({
    queryKey: ['print-center-partners', orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
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

  // Fetch actual documents
  const { data: documents, isLoading: docsLoading, refetch } = useQuery({
    queryKey: ['print-center-docs', orgId, fromISO, toISO, selectedPartner, selectedDocTypes],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      const items: DocumentItem[] = [];

      // Shipments (declarations + manifests)
      if (isAll || selectedDocTypes.includes('declarations') || selectedDocTypes.includes('manifests')) {
        let q = supabase
          .from('shipments')
          .select('id, shipment_number, status, waste_type, quantity, unit, weighbridge_net_weight, created_at, manual_vehicle_plate, manual_driver_name, generator_id, transporter_id, recycler_id')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        if (selectedPartner !== 'all') {
          q = q.or(`generator_id.eq.${selectedPartner},transporter_id.eq.${selectedPartner},recycler_id.eq.${selectedPartner}`);
        }

        const { data } = await q;
        (data || []).forEach((s: any) => {
          if (isAll || selectedDocTypes.includes('declarations')) {
            items.push({
              id: `decl-${s.id}`,
              type: 'declarations',
              typeLabel: 'إقرار تسليم',
              title: `إقرار - ${s.shipment_number || s.id.substring(0, 8)}`,
              subtitle: `${s.waste_type || 'غير محدد'} • ${s.weighbridge_net_weight || s.quantity || 0} كجم`,
              date: s.created_at,
              status: s.status || 'new',
              rawData: s,
            });
          }
          if (isAll || selectedDocTypes.includes('manifests')) {
            items.push({
              id: `manf-${s.id}`,
              type: 'manifests',
              typeLabel: 'مانيفست',
              title: `مانيفست - ${s.shipment_number || s.id.substring(0, 8)}`,
              subtitle: `سائق: ${s.manual_driver_name || '-'} • مركبة: ${s.manual_vehicle_plate || '-'}`,
              date: s.created_at,
              status: s.status || 'new',
              rawData: s,
            });
          }
        });
      }

      // Invoices
      if (isAll || selectedDocTypes.includes('invoices')) {
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_amount, created_at, partner_name')
          .eq('organization_id', orgId!)
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (data || []).forEach((inv: any) => {
          items.push({
            id: `inv-${inv.id}`,
            type: 'invoices',
            typeLabel: 'فاتورة',
            title: `فاتورة - ${inv.invoice_number || inv.id.substring(0, 8)}`,
            subtitle: `${inv.partner_name || '-'} • ${(inv.total_amount || 0).toLocaleString('ar-EG')} ج.م`,
            date: inv.created_at,
            status: inv.status || 'draft',
            rawData: inv,
          });
        });
      }

      // Receipts
      if (isAll || selectedDocTypes.includes('receipts')) {
        const { data } = await supabase
          .from('shipment_receipts')
          .select('id, receipt_number, status, receipt_type, actual_weight, unit, created_at, shipment_id')
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (data || []).forEach((r: any) => {
          items.push({
            id: `rcpt-${r.id}`,
            type: 'receipts',
            typeLabel: 'إيصال استلام',
            title: `إيصال - ${r.receipt_number || r.id.substring(0, 8)}`,
            subtitle: `${r.receipt_type || '-'} • ${r.actual_weight || '-'} ${r.unit || ''}`,
            date: r.created_at,
            status: r.status || 'pending',
            rawData: r,
          });
        });
      }

      // Certificates
      if (isAll || selectedDocTypes.includes('certificates')) {
        const { data } = await supabase
          .from('recycling_reports')
          .select('id, report_number, created_at, shipment_id')
          .gte('created_at', fromISO)
          .lte('created_at', toISO)
          .order('created_at', { ascending: false });

        (data || []).forEach((r: any) => {
          items.push({
            id: `cert-${r.id}`,
            type: 'certificates',
            typeLabel: 'شهادة تدوير',
            title: `شهادة - ${r.report_number || r.id.substring(0, 8)}`,
            subtitle: `شحنة: ${r.shipment_id ? r.shipment_id.substring(0, 8) : '-'}`,
            date: r.created_at,
            status: 'completed',
            rawData: r,
          });
        });
      }

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  const orgTypeLabel = (t: string) => {
    const map: Record<string, string> = { generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص' };
    return map[t] || t;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      new: 'جديدة', pending: 'معلقة', approved: 'معتمدة', collecting: 'قيد الجمع',
      in_transit: 'في الطريق', delivered: 'تم التسليم', draft: 'مسودة',
      confirmed: 'مؤكدة', cancelled: 'ملغاة', completed: 'مكتملة', paid: 'مدفوعة',
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (['delivered', 'confirmed', 'completed', 'paid'].includes(s)) return 'default';
    if (['cancelled'].includes(s)) return 'destructive';
    return 'secondary';
  };

  const typeIcon = (type: DocType) => {
    const dt = DOC_TYPES.find(d => d.id === type);
    return dt?.icon || <FileText className="h-4 w-4" />;
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!documents) return;
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  // Print single document
  const printSingle = useCallback((doc: DocumentItem) => {
    const html = generateDocHtml([doc]);
    openPrintWindow(html);
    toast.success(`تم تجهيز "${doc.title}" للطباعة`);
  }, [organization, profile]);

  // Print selected/all
  const printBulk = useCallback(() => {
    if (!documents || documents.length === 0) return;
    setIsPrinting(true);
    try {
      const toPrint = selectedIds.size > 0
        ? documents.filter(d => selectedIds.has(d.id))
        : documents;
      const html = generateDocHtml(toPrint);
      openPrintWindow(html);
      toast.success(`تم تجهيز ${toPrint.length} مستند للطباعة`);
    } finally {
      setIsPrinting(false);
    }
  }, [documents, selectedIds, organization, profile]);

  const openPrintWindow = (html: string) => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  const generateDocHtml = (docs: DocumentItem[]) => {
    const now = new Date();
    const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
    const timeStr = format(now, 'HH:mm:ss');

    // Group by type
    const grouped: Record<string, DocumentItem[]> = {};
    docs.forEach(d => {
      if (!grouped[d.type]) grouped[d.type] = [];
      grouped[d.type].push(d);
    });

    let tablesHtml = '';
    
    for (const [type, items] of Object.entries(grouped)) {
      const label = DOC_TYPES.find(d => d.id === type)?.label || type;
      
      if (type === 'declarations' || type === 'manifests') {
        tablesHtml += `<h2>${type === 'declarations' ? '📋' : '🚛'} ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>الرقم</th><th>نوع المخلفات</th><th>الوزن</th><th>المركبة</th><th>السائق</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.shipment_number || '-'}</td><td>${d.rawData.waste_type || '-'}</td><td>${d.rawData.weighbridge_net_weight || d.rawData.quantity || 0} كجم</td><td>${d.rawData.manual_vehicle_plate || '-'}</td><td>${d.rawData.manual_driver_name || '-'}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'invoices') {
        tablesHtml += `<h2>🧾 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الفاتورة</th><th>الجهة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.invoice_number || '-'}</td><td>${d.rawData.partner_name || '-'}</td><td>${(d.rawData.total_amount || 0).toLocaleString('ar-EG')} ج.م</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'receipts') {
        tablesHtml += `<h2>📦 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الإيصال</th><th>النوع</th><th>الوزن</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.receipt_number || '-'}</td><td>${d.rawData.receipt_type || '-'}</td><td>${d.rawData.actual_weight || '-'} ${d.rawData.unit || ''}</td><td><span class="badge badge-s">${statusLabel(d.status)}</span></td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      } else if (type === 'certificates') {
        tablesHtml += `<h2>🏅 ${label} (${items.length})</h2>
        <table><thead><tr><th>#</th><th>رقم الشهادة</th><th>رقم الشحنة</th><th>التاريخ</th></tr></thead><tbody>
        ${items.map((d, i) => `<tr><td>${i+1}</td><td>${d.rawData.report_number || '-'}</td><td>${d.rawData.shipment_id ? d.rawData.shipment_id.substring(0, 8) : '-'}</td><td>${d.date ? format(new Date(d.date), 'yyyy/MM/dd HH:mm') : '-'}</td></tr>`).join('')}
        </tbody></table>`;
      }
    }

    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>طباعة مستندات</title>
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
      .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 9px; font-weight: bold; }
      .badge-s { background: #dcfce7; color: #166534; }
      .footer { margin-top: 20px; border-top: 2px solid #059669; padding-top: 8px; font-size: 9px; color: #999; text-align: center; }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 70px; color: rgba(5,150,105,0.04); font-weight: bold; z-index: -1; }
    </style></head><body>
    <div class="watermark">iRecycle</div>
    <div class="header">
      <div class="header-right"><h1>📋 ${docs.length === 1 ? docs[0].title : `تقرير مستندات (${docs.length})`}</h1><div class="sub">${organization?.name || ''}</div></div>
      <div class="header-left"><div><strong>التاريخ:</strong> ${dateStr}</div><div><strong>الوقت:</strong> ${timeStr}</div><div><strong>أعده:</strong> ${profile?.full_name || ''}</div></div>
    </div>
    ${tablesHtml}
    <div class="footer"><p>تقرير صادر من منصة iRecycle | ${dateStr} - ${timeStr}</p></div>
    </body></html>`;
  };

  const docCounts = useMemo(() => {
    if (!documents) return {};
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return counts;
  }, [documents]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileStack className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مركز الطباعة</h1>
            <p className="text-muted-foreground text-sm">عرض وطباعة المستندات - مفردة أو مجمعة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              {selectedIds.size} محدد
            </Badge>
          )}
          <Button onClick={printBulk} disabled={isPrinting || !documents?.length} className="gap-2">
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {selectedIds.size > 0 ? `طباعة المحدد (${selectedIds.size})` : 'طباعة الكل'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {DOC_TYPES.filter(d => d.id !== 'all').map(dt => (
          <Card key={dt.id} className={`cursor-pointer transition-all ${
            selectedDocTypes.includes(dt.id) || selectedDocTypes.includes('all') ? 'ring-2 ring-primary/30' : 'opacity-60'
          }`} onClick={() => toggleDocType(dt.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {dt.icon}
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{docCounts[dt.id] || 0}</p>
                <p className="text-xs text-muted-foreground">{dt.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                الفترة
              </Label>
              <Select value={dateMode} onValueChange={(v: 'today' | 'range') => setDateMode(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="range">فترة محددة</SelectItem>
                </SelectContent>
              </Select>
              {dateMode === 'range' && (
                <div className="space-y-1.5">
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" />
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                الجهة
              </Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="اختر" />
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                نوع المستند
              </Label>
              <div className="space-y-1">
                {DOC_TYPES.map(dt => (
                  <label
                    key={dt.id}
                    className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      selectedDocTypes.includes(dt.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedDocTypes.includes(dt.id)}
                      onCheckedChange={() => toggleDocType(dt.id)}
                      className="h-3.5 w-3.5"
                    />
                    {dt.icon}
                    <span>{dt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={() => refetch()} variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Filter className="h-3.5 w-3.5" />
              تحديث النتائج
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileStack className="h-4 w-4" />
                المستندات ({documents?.length || 0})
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={toggleSelectAll}>
                {documents && selectedIds.size === documents.length ? (
                  <><CheckSquare className="h-3.5 w-3.5" /> إلغاء تحديد الكل</>
                ) : (
                  <><Square className="h-3.5 w-3.5" /> تحديد الكل</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileStack className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد مستندات</p>
                <p className="text-xs mt-1">جرب تغيير الفلاتر أو الفترة الزمنية</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                      selectedIds.has(doc.id) ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                    />
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {typeIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{doc.typeLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{doc.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor(doc.status) as any} className="text-[10px]">
                        {statusLabel(doc.status)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {doc.date ? format(new Date(doc.date), 'MM/dd HH:mm') : '-'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printSingle(doc)} title="طباعة">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintCenter;
