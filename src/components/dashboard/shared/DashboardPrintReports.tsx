import { memo, useState, useCallback } from 'react';
import { Printer, FileText, Receipt, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

/** Shared print reports button for all dashboard headers */
const DashboardPrintReports = memo(() => {
  const { organization, profile } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);

  const orgId = organization?.id;

  // Fetch today's data
  const { data: todayData } = useQuery({
    queryKey: ['dashboard-print-today', orgId],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [shipmentsRes, ledgerRes, notifRes, driversRes, receiptsRes]: any[] = await Promise.all([
        supabase
          .from('shipments')
          .select('id, shipment_number, status, waste_type, quantity, unit, weighbridge_net_weight, created_at, pickup_address, delivery_address, manual_vehicle_plate, manual_driver_name, hazard_level, packaging_method, disposal_method, notes, generator_id, recycler_id, transporter_id, driver_id, approved_at, in_transit_at, delivered_at, confirmed_at')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('accounting_ledger')
          .select('id, entry_type, entry_category, amount, description, entry_date, reference_number, verified')
          .eq('organization_id', orgId!)
          .gte('entry_date', todayStart.toISOString().split('T')[0])
          .lte('entry_date', todayEnd.toISOString().split('T')[0])
          .order('entry_date', { ascending: false }),

        supabase
          .from('notifications' as any)
          .select('id, title, message, created_at, type')
          .eq('organization_id', orgId!)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(20),

        supabase
          .from('drivers')
          .select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)')
          .eq('organization_id', orgId!),

        supabase
          .from('shipment_receipts')
          .select('id, receipt_number, status, receipt_type, actual_weight, unit, created_at, shipment_id')
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),
      ]);

      const shipments = shipmentsRes.data || [];
      const ledger = ledgerRes.data || [];
      const notifications = notifRes.data || [];
      const drivers = (driversRes.data || []).map((d: any) => ({
        ...d,
        profile: Array.isArray(d.profile) ? d.profile[0] : d.profile,
      }));
      const receipts = receiptsRes.data || [];

      // Collect partner org IDs
      const partnerIds = [...new Set([
        ...shipments.map((s: any) => s.generator_id).filter(Boolean),
        ...shipments.map((s: any) => s.recycler_id).filter(Boolean),
        ...shipments.map((s: any) => s.transporter_id).filter(Boolean),
      ].filter((id: string) => id !== orgId))] as string[];

      let partners: any[] = [];
      if (partnerIds.length > 0) {
        const { data } = await supabase
          .from('organizations')
          .select('id, name, organization_type, city, phone')
          .in('id', partnerIds);
        partners = data || [];
      }

      const totalWeight = shipments.reduce((s: number, sh: any) => s + (sh.weighbridge_net_weight || sh.quantity || 0), 0);
      const totalRevenue = ledger.filter((l: any) => l.entry_type === 'credit').reduce((s: number, l: any) => s + l.amount, 0);
      const totalExpenses = ledger.filter((l: any) => l.entry_type === 'debit').reduce((s: number, l: any) => s + l.amount, 0);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      shipments.forEach((s: any) => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });

      // Waste type breakdown
      const wasteTypeCounts: Record<string, { count: number; weight: number }> = {};
      shipments.forEach((s: any) => {
        const wt = s.waste_type || 'غير محدد';
        if (!wasteTypeCounts[wt]) wasteTypeCounts[wt] = { count: 0, weight: 0 };
        wasteTypeCounts[wt].count += 1;
        wasteTypeCounts[wt].weight += (s.weighbridge_net_weight || s.quantity || 0);
      });

      return {
        shipments, ledger, notifications, drivers, receipts, partners,
        totalWeight, totalRevenue, totalExpenses,
        statusCounts, wasteTypeCounts,
      };
    },
  });

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      new: 'جديدة', pending: 'معلقة', approved: 'معتمدة', collecting: 'قيد الجمع',
      in_transit: 'في الطريق', delivered: 'تم التسليم',
      confirmed: 'مؤكدة', cancelled: 'ملغاة', completed: 'مكتملة',
    };
    return map[s] || s;
  };

  const wasteTypeLabel = (w: string) => {
    const map: Record<string, string> = {
      plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
      chemical: 'كيميائي', organic: 'عضوي', electronic: 'إلكتروني',
      hazardous: 'خطر', medical: 'طبي', construction: 'مخلفات بناء',
    };
    return map[w] || w;
  };

  const orgTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص نهائي',
    };
    return map[t] || t;
  };

  const printReport = useCallback((type: 'receipt' | 'a4' | 'comprehensive') => {
    if (!todayData || !organization) {
      toast.error('لا توجد بيانات متاحة');
      return;
    }
    setIsPrinting(true);

    const now = new Date();
    const dateStr = format(now, 'yyyy/MM/dd', { locale: ar });
    const timeStr = format(now, 'HH:mm:ss');
    const dayName = format(now, 'EEEE', { locale: ar });
    const orgName = organization.name || 'المنظمة';
    const userName = profile?.full_name || 'المستخدم';
    const { shipments, ledger, totalWeight, totalRevenue, totalExpenses, statusCounts, wasteTypeCounts, drivers, receipts, partners, notifications } = todayData;

    let html = '';

    if (type === 'receipt') {
      // Receipt-style thermal printer report
      html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير يومي - إيصال</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 76mm; padding: 2mm; color: #000; direction: rtl; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .dbl-line { border-top: 2px solid #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  .title { font-size: 14px; font-weight: bold; }
  .section-title { font-size: 12px; font-weight: bold; margin: 6px 0 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  td, th { padding: 2px 1px; text-align: right; }
  th { border-bottom: 1px solid #000; }
  .footer { margin-top: 8px; font-size: 9px; text-align: center; color: #666; }
</style>
</head>
<body>
<div class="center title">♻ iRecycle</div>
<div class="center" style="font-size:10px;">${orgName}</div>
<div class="dbl-line"></div>
<div class="center bold">تقرير عمليات اليوم</div>
<div class="row"><span>${dateStr}</span><span>${timeStr}</span></div>
<div class="row"><span>المستخدم:</span><span>${userName}</span></div>
<div class="line"></div>

<div class="section-title">📊 ملخص اليوم</div>
<div class="row"><span>عدد الشحنات:</span><span>${shipments.length}</span></div>
<div class="row"><span>إجمالي الوزن:</span><span>${totalWeight.toLocaleString('ar-EG')} كجم</span></div>
<div class="row"><span>الإيرادات:</span><span>${totalRevenue.toLocaleString('ar-EG')} ج.م</span></div>
<div class="row"><span>المصروفات:</span><span>${totalExpenses.toLocaleString('ar-EG')} ج.م</span></div>
<div class="row bold"><span>الصافي:</span><span>${(totalRevenue - totalExpenses).toLocaleString('ar-EG')} ج.م</span></div>
<div class="line"></div>

${shipments.length > 0 ? `
<div class="section-title">🚛 الشحنات (${shipments.length})</div>
<table>
<tr><th>#</th><th>الرقم</th><th>الحالة</th><th>الوزن</th></tr>
${shipments.map((s: any, i: number) => `<tr><td>${i + 1}</td><td>${s.shipment_number || '-'}</td><td>${statusLabel(s.status || '')}</td><td>${s.weighbridge_net_weight || s.quantity || 0}</td></tr>`).join('')}
</table>
<div class="line"></div>
` : ''}

${ledger.length > 0 ? `
<div class="section-title">💰 الحركات المالية (${ledger.length})</div>
<table>
<tr><th>النوع</th><th>الوصف</th><th>المبلغ</th></tr>
${ledger.map((l: any) => `<tr><td>${l.entry_type === 'credit' ? '⬆' : '⬇'}</td><td>${(l.description || l.entry_category || '').substring(0, 20)}</td><td>${l.amount.toLocaleString('ar-EG')}</td></tr>`).join('')}
</table>
<div class="line"></div>
` : ''}

<div class="dbl-line"></div>
<div class="footer">
  تم الطباعة في ${timeStr} - ${dateStr}<br/>
  منصة iRecycle لإدارة المخلفات<br/>
  *** نهاية التقرير ***
</div>
</body>
</html>`;
    } else if (type === 'a4') {
      // Full A4 report
      html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير النظام المفصل</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: #1a1a1a; direction: rtl; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
  .header-right { text-align: right; }
  .header-left { text-align: left; font-size: 11px; color: #666; }
  h1 { font-size: 22px; color: #059669; }
  h2 { font-size: 16px; color: #059669; margin: 18px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }
  .subtitle { font-size: 13px; color: #666; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
  .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
  th { background: #059669; color: white; padding: 8px 6px; text-align: right; }
  td { padding: 6px; border-bottom: 1px solid #e5e7eb; text-align: right; }
  tr:nth-child(even) { background: #f9fafb; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #059669; font-size: 10px; color: #999; text-align: center; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(5,150,105,0.04); font-weight: bold; pointer-events: none; z-index: -1; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
<div class="watermark">iRecycle</div>

<div class="header">
  <div class="header-right">
    <h1>♻ تقرير النظام المفصل</h1>
    <div class="subtitle">${orgName}</div>
  </div>
  <div class="header-left">
    <div><strong>التاريخ:</strong> ${dateStr}</div>
    <div><strong>الوقت:</strong> ${timeStr}</div>
    <div><strong>أعده:</strong> ${userName}</div>
  </div>
</div>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value">${shipments.length}</div>
    <div class="stat-label">شحنات اليوم</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">${totalWeight.toLocaleString('ar-EG')}</div>
    <div class="stat-label">إجمالي الوزن (كجم)</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">${totalRevenue.toLocaleString('ar-EG')}</div>
    <div class="stat-label">الإيرادات (ج.م)</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">${(totalRevenue - totalExpenses).toLocaleString('ar-EG')}</div>
    <div class="stat-label">صافي اليوم (ج.م)</div>
  </div>
</div>

<h2>🚛 شحنات اليوم</h2>
${shipments.length > 0 ? `
<table>
<thead><tr><th>#</th><th>رقم الشحنة</th><th>المصدر</th><th>الوجهة</th><th>نوع المخلفات</th><th>الوزن</th><th>المركبة</th><th>الحالة</th><th>الوقت</th></tr></thead>
<tbody>
${shipments.map((s: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${s.shipment_number || '-'}</td>
  <td>${s.pickup_address || '-'}</td>
  <td>${s.delivery_address || '-'}</td>
  <td>${wasteTypeLabel(s.waste_type || '')}</td>
  <td>${s.weighbridge_net_weight || s.quantity || 0} كجم</td>
  <td>${s.manual_vehicle_plate || '-'}</td>
  <td><span class="badge ${s.status === 'delivered' || s.status === 'confirmed' ? 'badge-success' : s.status === 'in_transit' ? 'badge-info' : 'badge-warning'}">${statusLabel(s.status || '')}</span></td>
  <td>${s.created_at ? format(new Date(s.created_at), 'HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>` : '<p style="color:#999;padding:10px;">لا توجد شحنات اليوم</p>'}

<h2>💰 الحركات المالية</h2>
${ledger.length > 0 ? `
<table>
<thead><tr><th>#</th><th>النوع</th><th>التصنيف</th><th>الوصف</th><th>المبلغ (ج.م)</th><th>التاريخ</th></tr></thead>
<tbody>
${ledger.map((l: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td><span class="badge ${l.entry_type === 'credit' ? 'badge-success' : 'badge-danger'}">${l.entry_type === 'credit' ? 'إيراد' : 'مصروف'}</span></td>
  <td>${l.entry_category || '-'}</td>
  <td>${l.description || '-'}</td>
  <td>${l.amount.toLocaleString('ar-EG')}</td>
  <td>${l.entry_date || '-'}</td>
</tr>`).join('')}
</tbody>
</table>` : '<p style="color:#999;padding:10px;">لا توجد حركات مالية اليوم</p>'}

${notifications.length > 0 ? `
<h2>🔔 آخر الإشعارات</h2>
<table>
<thead><tr><th>#</th><th>العنوان</th><th>الرسالة</th><th>الوقت</th></tr></thead>
<tbody>
${notifications.map((n: any, i: number) => `<tr>
  <td>${i + 1}</td>
  <td>${n.title || '-'}</td>
  <td>${(n.message || '').substring(0, 60)}</td>
  <td>${n.created_at ? format(new Date(n.created_at), 'HH:mm') : '-'}</td>
</tr>`).join('')}
</tbody>
</table>` : ''}

<div class="footer">
  <p>تقرير صادر من منصة iRecycle لإدارة المخلفات | ${dateStr} - ${timeStr}</p>
  <p>هذا التقرير آلي ولا يحتاج إلى توقيع</p>
</div>
</body>
</html>`;
    } else {
      // ===== COMPREHENSIVE DAILY REPORT =====
      const statusRows = Object.entries(statusCounts).map(([status, count]) =>
        `<tr><td>${statusLabel(status)}</td><td>${count}</td><td>${shipments.length > 0 ? ((count as number / shipments.length) * 100).toFixed(1) : 0}%</td></tr>`
      ).join('');

      const wasteRows = Object.entries(wasteTypeCounts).map(([wt, data]) =>
        `<tr><td>${wasteTypeLabel(wt)}</td><td>${(data as any).count}</td><td>${(data as any).weight.toLocaleString('ar-EG')} كجم</td></tr>`
      ).join('');

      const driverRows = drivers.map((d: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${d.profile?.full_name || '-'}</td><td>${d.license_number || '-'}</td><td>${d.vehicle_plate || '-'}</td><td>${d.vehicle_type || '-'}</td><td>${d.profile?.phone || '-'}</td></tr>`
      ).join('');

      const receiptRows = receipts.map((r: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${r.receipt_number || '-'}</td><td><span class="badge ${r.status === 'confirmed' ? 'badge-success' : 'badge-warning'}">${r.status === 'confirmed' ? 'مؤكد' : r.status}</span></td><td>${r.actual_weight || '-'}</td><td>${r.created_at ? format(new Date(r.created_at), 'HH:mm') : '-'}</td></tr>`
      ).join('');

      const partnerRows = partners.map((p: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${p.name || '-'}</td><td>${orgTypeLabel(p.organization_type || '')}</td><td>${p.city || '-'}</td><td>${p.phone || '-'}</td></tr>`
      ).join('');

      // Ledger category breakdown
      const categoryBreakdown: Record<string, { credit: number; debit: number }> = {};
      ledger.forEach((l: any) => {
        const cat = l.entry_category || 'أخرى';
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { credit: 0, debit: 0 };
        if (l.entry_type === 'credit') categoryBreakdown[cat].credit += l.amount;
        else categoryBreakdown[cat].debit += l.amount;
      });
      const categoryRows = Object.entries(categoryBreakdown).map(([cat, data]) =>
        `<tr><td>${cat}</td><td class="green">${(data as any).credit.toLocaleString('ar-EG')}</td><td class="red">${(data as any).debit.toLocaleString('ar-EG')}</td><td>${((data as any).credit - (data as any).debit).toLocaleString('ar-EG')}</td></tr>`
      ).join('');

      html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>التقرير اليومي الشامل - ${dateStr}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
  
  .cover-header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; }
  .cover-header h1 { font-size: 26px; margin-bottom: 4px; }
  .cover-header .subtitle { font-size: 14px; opacity: 0.9; }
  .cover-meta { display: flex; gap: 24px; margin-top: 12px; font-size: 12px; opacity: 0.85; }
  
  .summary-bar { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 16px 0; }
  .summary-item { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; }
  .summary-item.financial { background: #eff6ff; border-color: #bfdbfe; }
  .summary-item.alert { background: #fef3c7; border-color: #fde68a; }
  .summary-value { font-size: 22px; font-weight: 800; color: #059669; }
  .summary-item.financial .summary-value { color: #1d4ed8; }
  .summary-item.alert .summary-value { color: #92400e; }
  .summary-label { font-size: 9px; color: #666; margin-top: 2px; }
  
  .section { margin: 16px 0; page-break-inside: avoid; }
  .section-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 10px; }
  
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 6px 0; }
  th { background: #059669; color: white; padding: 7px 5px; text-align: right; font-size: 10px; }
  td { padding: 5px; border-bottom: 1px solid #e5e7eb; text-align: right; }
  tr:nth-child(even) { background: #f9fafb; }
  
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: bold; }
  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef3c7; color: #92400e; }
  .badge-info { background: #dbeafe; color: #1e40af; }
  .badge-danger { background: #fee2e2; color: #991b1b; }
  
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .green { color: #059669; font-weight: 600; }
  .red { color: #dc2626; font-weight: 600; }
  
  .footer { margin-top: 24px; padding-top: 10px; border-top: 3px solid #059669; font-size: 9px; color: #999; text-align: center; }
  .footer-logo { font-size: 14px; color: #059669; font-weight: bold; }
  
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(5,150,105,0.03); font-weight: bold; pointer-events: none; z-index: -1; }
  
  .no-data { color: #9ca3af; padding: 8px; font-style: italic; text-align: center; }
  @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="watermark">iRecycle</div>

<!-- COVER HEADER -->
<div class="cover-header">
  <h1>📋 التقرير اليومي الشامل</h1>
  <div class="subtitle">${orgName} — ${dayName} ${dateStr}</div>
  <div class="cover-meta">
    <span>🕐 وقت الإصدار: ${timeStr}</span>
    <span>👤 أعده: ${userName}</span>
    <span>📊 نوع: ${orgTypeLabel(organization.organization_type || '')}</span>
  </div>
</div>

<!-- SUMMARY BAR -->
<div class="summary-bar">
  <div class="summary-item">
    <div class="summary-value">${shipments.length}</div>
    <div class="summary-label">شحنات اليوم</div>
  </div>
  <div class="summary-item">
    <div class="summary-value">${totalWeight.toLocaleString('ar-EG')}</div>
    <div class="summary-label">إجمالي الأوزان (كجم)</div>
  </div>
  <div class="summary-item financial">
    <div class="summary-value">${totalRevenue.toLocaleString('ar-EG')}</div>
    <div class="summary-label">الإيرادات (ج.م)</div>
  </div>
  <div class="summary-item financial">
    <div class="summary-value">${totalExpenses.toLocaleString('ar-EG')}</div>
    <div class="summary-label">المصروفات (ج.م)</div>
  </div>
  <div class="summary-item ${totalRevenue - totalExpenses >= 0 ? '' : 'alert'}">
    <div class="summary-value">${(totalRevenue - totalExpenses).toLocaleString('ar-EG')}</div>
    <div class="summary-label">صافي اليوم (ج.م)</div>
  </div>
  <div class="summary-item">
    <div class="summary-value">${receipts.length}</div>
    <div class="summary-label">الإيصالات</div>
  </div>
</div>

<!-- BREAKDOWNS -->
<div class="two-col">
  <div class="section">
    <div class="section-header">📈 توزيع حالات الشحنات</div>
    ${Object.keys(statusCounts).length > 0 ? `
    <table>
      <thead><tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr></thead>
      <tbody>${statusRows}</tbody>
    </table>` : '<div class="no-data">لا توجد شحنات</div>'}
  </div>
  <div class="section">
    <div class="section-header">♻ توزيع أنواع المخلفات</div>
    ${Object.keys(wasteTypeCounts).length > 0 ? `
    <table>
      <thead><tr><th>النوع</th><th>العدد</th><th>الوزن</th></tr></thead>
      <tbody>${wasteRows}</tbody>
    </table>` : '<div class="no-data">لا توجد بيانات</div>'}
  </div>
</div>

<!-- SHIPMENTS DETAIL -->
<div class="section">
  <div class="section-header">🚛 تفاصيل شحنات اليوم (${shipments.length})</div>
  ${shipments.length > 0 ? `
  <table>
    <thead><tr><th>#</th><th>رقم الشحنة</th><th>نوع المخلف</th><th>الكمية</th><th>المصدر</th><th>الوجهة</th><th>السائق</th><th>المركبة</th><th>الحالة</th><th>الوقت</th></tr></thead>
    <tbody>
    ${shipments.map((s: any, i: number) => `<tr>
      <td>${i + 1}</td>
      <td>${s.shipment_number || '-'}</td>
      <td>${wasteTypeLabel(s.waste_type || '')}</td>
      <td>${(s.weighbridge_net_weight || s.quantity || 0).toLocaleString('ar-EG')} ${s.unit || 'كجم'}</td>
      <td>${(s.pickup_address || '-').substring(0, 25)}</td>
      <td>${(s.delivery_address || '-').substring(0, 25)}</td>
      <td>${s.manual_driver_name || '-'}</td>
      <td>${s.manual_vehicle_plate || '-'}</td>
      <td><span class="badge ${s.status === 'delivered' || s.status === 'confirmed' ? 'badge-success' : s.status === 'in_transit' || s.status === 'collecting' ? 'badge-info' : s.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">${statusLabel(s.status || '')}</span></td>
      <td>${s.created_at ? format(new Date(s.created_at), 'HH:mm') : '-'}</td>
    </tr>`).join('')}
    </tbody>
  </table>` : '<div class="no-data">لا توجد شحنات مسجلة اليوم</div>'}
</div>

<!-- FINANCIAL DETAIL -->
<div class="section">
  <div class="section-header">💰 التفاصيل المالية</div>
  <div class="two-col">
    <div>
      <h3 style="font-size:12px;margin-bottom:6px;">تفصيل حسب التصنيف</h3>
      ${Object.keys(categoryBreakdown).length > 0 ? `
      <table>
        <thead><tr><th>التصنيف</th><th>إيرادات</th><th>مصروفات</th><th>الصافي</th></tr></thead>
        <tbody>${categoryRows}</tbody>
        <tfoot><tr style="font-weight:bold;border-top:2px solid #059669;">
          <td>الإجمالي</td>
          <td class="green">${totalRevenue.toLocaleString('ar-EG')}</td>
          <td class="red">${totalExpenses.toLocaleString('ar-EG')}</td>
          <td>${(totalRevenue - totalExpenses).toLocaleString('ar-EG')}</td>
        </tr></tfoot>
      </table>` : '<div class="no-data">لا توجد حركات</div>'}
    </div>
    <div>
      <h3 style="font-size:12px;margin-bottom:6px;">سجل الحركات (${ledger.length})</h3>
      ${ledger.length > 0 ? `
      <table>
        <thead><tr><th>النوع</th><th>الوصف</th><th>المبلغ</th><th>موثق</th></tr></thead>
        <tbody>${ledger.map((l: any) => `<tr>
          <td><span class="badge ${l.entry_type === 'credit' ? 'badge-success' : 'badge-danger'}">${l.entry_type === 'credit' ? 'إيراد' : 'مصروف'}</span></td>
          <td>${(l.description || l.entry_category || '-').substring(0, 30)}</td>
          <td>${l.amount.toLocaleString('ar-EG')} ج.م</td>
          <td>${l.verified ? '✅' : '⏳'}</td>
        </tr>`).join('')}</tbody>
      </table>` : '<div class="no-data">لا توجد حركات مالية</div>'}
    </div>
  </div>
</div>

<!-- RECEIPTS -->
${receipts.length > 0 ? `
<div class="section">
  <div class="section-header">🧾 إيصالات اليوم (${receipts.length})</div>
  <table>
    <thead><tr><th>#</th><th>رقم الإيصال</th><th>الحالة</th><th>الوزن الفعلي</th><th>الوقت</th></tr></thead>
    <tbody>${receiptRows}</tbody>
  </table>
</div>` : ''}

<!-- DRIVERS -->
${drivers.length > 0 ? `
<div class="section">
  <div class="section-header">🧑‍✈️ السائقين المسجلين (${drivers.length})</div>
  <table>
    <thead><tr><th>#</th><th>الاسم</th><th>رقم الرخصة</th><th>لوحة المركبة</th><th>نوع المركبة</th><th>الهاتف</th></tr></thead>
    <tbody>${driverRows}</tbody>
  </table>
</div>` : ''}

<!-- PARTNERS -->
${partners.length > 0 ? `
<div class="section">
  <div class="section-header">🤝 الجهات المرتبطة (${partners.length})</div>
  <table>
    <thead><tr><th>#</th><th>الاسم</th><th>النوع</th><th>المدينة</th><th>الهاتف</th></tr></thead>
    <tbody>${partnerRows}</tbody>
  </table>
</div>` : ''}

<!-- NOTIFICATIONS -->
${notifications.length > 0 ? `
<div class="section">
  <div class="section-header">🔔 إشعارات اليوم (${notifications.length})</div>
  <table>
    <thead><tr><th>#</th><th>العنوان</th><th>الرسالة</th><th>الوقت</th></tr></thead>
    <tbody>
    ${notifications.map((n: any, i: number) => `<tr>
      <td>${i + 1}</td>
      <td>${n.title || '-'}</td>
      <td>${(n.message || '').substring(0, 50)}</td>
      <td>${n.created_at ? format(new Date(n.created_at), 'HH:mm') : '-'}</td>
    </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<!-- FOOTER -->
<div class="footer">
  <div class="footer-logo">♻ iRecycle - نظام إدارة المخلفات</div>
  <p>التقرير اليومي الشامل | ${dayName} ${dateStr} | وقت الإصدار: ${timeStr}</p>
  <p>أعده: ${userName} | هذا التقرير آلي وصادر من المنصة ولا يحتاج إلى توقيع</p>
  <p style="margin-top:4px;">صفحة 1 من 1</p>
</div>
</body>
</html>`;
    }

    const printWindow = window.open('', '_blank', type === 'receipt' ? 'width=320,height=600' : 'width=900,height=1100');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    } else {
      toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
      setIsPrinting(false);
    }
  }, [todayData, organization, profile]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isPrinting}>
          {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          <span className="hidden sm:inline">طباعة</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => printReport('comprehensive')} className="gap-2 cursor-pointer">
          <ClipboardList className="w-4 h-4 text-primary" />
          <div>
            <div className="font-medium">التقرير اليومي الشامل</div>
            <div className="text-xs text-muted-foreground">تقرير مفصل بكل عمليات وبيانات اليوم</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printReport('a4')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          <div>
            <div className="font-medium">تقرير A4</div>
            <div className="text-xs text-muted-foreground">تقرير مع جداول وإحصائيات</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printReport('receipt')} className="gap-2 cursor-pointer">
          <Receipt className="w-4 h-4" />
          <div>
            <div className="font-medium">إيصال حراري</div>
            <div className="text-xs text-muted-foreground">ملخص سريع لطابعة الإيصالات</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

DashboardPrintReports.displayName = 'DashboardPrintReports';

export default DashboardPrintReports;
