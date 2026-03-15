import { format } from 'date-fns';

interface ComprehensiveData {
  orgName: string;
  orgType: string;
  dateStr: string;
  timeStr: string;
  dayName: string;
  userName: string;
  shipments: any[];
  ledger: any[];
  notifications: any[];
  drivers: any[];
  receipts: any[];
  partners: any[];
  totalWeight: number;
  totalRevenue: number;
  totalExpenses: number;
  statusCounts: Record<string, number>;
  wasteTypeCounts: Record<string, { count: number; weight: number }>;
  statusLabel: (s: string) => string;
  wasteTypeLabel: (w: string) => string;
  orgTypeLabel: (t: string) => string;
}

export const generateComprehensiveTemplate = (data: ComprehensiveData): string => {
  const {
    orgName, orgType, dateStr, timeStr, dayName, userName,
    shipments, ledger, notifications, drivers, receipts, partners,
    totalWeight, totalRevenue, totalExpenses, statusCounts, wasteTypeCounts,
    statusLabel, wasteTypeLabel, orgTypeLabel,
  } = data;

  const statusRows = Object.entries(statusCounts).map(([status, count]) =>
    `<tr><td>${statusLabel(status)}</td><td>${count}</td><td>${shipments.length > 0 ? ((count as number / shipments.length) * 100).toFixed(1) : 0}%</td></tr>`
  ).join('');

  const wasteRows = Object.entries(wasteTypeCounts).map(([wt, d]) =>
    `<tr><td>${wasteTypeLabel(wt)}</td><td>${(d as any).count}</td><td>${(d as any).weight.toLocaleString('ar-EG')} كجم</td></tr>`
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

  const categoryBreakdown: Record<string, { credit: number; debit: number }> = {};
  ledger.forEach((l: any) => {
    const cat = l.entry_category || 'أخرى';
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { credit: 0, debit: 0 };
    if (l.entry_type === 'credit') categoryBreakdown[cat].credit += l.amount;
    else categoryBreakdown[cat].debit += l.amount;
  });
  const categoryRows = Object.entries(categoryBreakdown).map(([cat, d]) =>
    `<tr><td>${cat}</td><td class="green">${(d as any).credit.toLocaleString('ar-EG')}</td><td class="red">${(d as any).debit.toLocaleString('ar-EG')}</td><td>${((d as any).credit - (d as any).debit).toLocaleString('ar-EG')}</td></tr>`
  ).join('');

  return `
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
  .summary-item { background: rgba(240,253,244,0.55); border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; }
  .summary-item.financial { background: rgba(239,246,255,0.55); border-color: #bfdbfe; }
  .summary-item.alert { background: rgba(254,243,199,0.55); border-color: #fde68a; }
  .summary-value { font-size: 22px; font-weight: 800; color: #059669; }
  .summary-item.financial .summary-value { color: #1d4ed8; }
  .summary-item.alert .summary-value { color: #92400e; }
  .summary-label { font-size: 9px; color: #666; margin-top: 2px; }
  .section { margin: 16px 0; page-break-inside: avoid; }
  .section-header { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 6px 0; background: transparent !important; }
  th { background: rgba(5,150,105,0.85) !important; color: white; padding: 7px 5px; text-align: right; font-size: 10px; }
  td { padding: 5px; border-bottom: 1px solid #e5e7eb; text-align: right; background: transparent !important; }
  tr:nth-child(even) { background: rgba(249,250,251,0.35) !important; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: bold; }
  .badge-success { background: rgba(220,252,231,0.6); color: #166534; }
  .badge-warning { background: rgba(254,243,199,0.6); color: #92400e; }
  .badge-info { background: rgba(219,234,254,0.6); color: #1e40af; }
  .badge-danger { background: rgba(254,226,226,0.6); color: #991b1b; }
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

<div class="cover-header">
  <h1>📋 التقرير اليومي الشامل</h1>
  <div class="subtitle">${orgName} — ${dayName} ${dateStr}</div>
  <div class="cover-meta">
    <span>🕐 وقت الإصدار: ${timeStr}</span>
    <span>👤 أعده: ${userName}</span>
    <span>📊 نوع: ${orgTypeLabel(orgType)}</span>
  </div>
</div>

<div class="summary-bar">
  <div class="summary-item"><div class="summary-value">${shipments.length}</div><div class="summary-label">شحنات اليوم</div></div>
  <div class="summary-item"><div class="summary-value">${totalWeight.toLocaleString('ar-EG')}</div><div class="summary-label">إجمالي الأوزان (كجم)</div></div>
  <div class="summary-item financial"><div class="summary-value">${totalRevenue.toLocaleString('ar-EG')}</div><div class="summary-label">الإيرادات (ج.م)</div></div>
  <div class="summary-item financial"><div class="summary-value">${totalExpenses.toLocaleString('ar-EG')}</div><div class="summary-label">المصروفات (ج.م)</div></div>
  <div class="summary-item ${totalRevenue - totalExpenses >= 0 ? '' : 'alert'}"><div class="summary-value">${(totalRevenue - totalExpenses).toLocaleString('ar-EG')}</div><div class="summary-label">صافي اليوم (ج.م)</div></div>
  <div class="summary-item"><div class="summary-value">${receipts.length}</div><div class="summary-label">الإيصالات</div></div>
</div>

<div class="two-col">
  <div class="section">
    <div class="section-header">📈 توزيع حالات الشحنات</div>
    ${Object.keys(statusCounts).length > 0 ? `<table><thead><tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr></thead><tbody>${statusRows}</tbody></table>` : '<div class="no-data">لا توجد شحنات</div>'}
  </div>
  <div class="section">
    <div class="section-header">♻ توزيع أنواع المخلفات</div>
    ${Object.keys(wasteTypeCounts).length > 0 ? `<table><thead><tr><th>النوع</th><th>العدد</th><th>الوزن</th></tr></thead><tbody>${wasteRows}</tbody></table>` : '<div class="no-data">لا توجد بيانات</div>'}
  </div>
</div>

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

${receipts.length > 0 ? `
<div class="section">
  <div class="section-header">🧾 إيصالات اليوم (${receipts.length})</div>
  <table><thead><tr><th>#</th><th>رقم الإيصال</th><th>الحالة</th><th>الوزن الفعلي</th><th>الوقت</th></tr></thead><tbody>${receiptRows}</tbody></table>
</div>` : ''}

${drivers.length > 0 ? `
<div class="section">
  <div class="section-header">🧑‍✈️ السائقين المسجلين (${drivers.length})</div>
  <table><thead><tr><th>#</th><th>الاسم</th><th>رقم الرخصة</th><th>لوحة المركبة</th><th>نوع المركبة</th><th>الهاتف</th></tr></thead><tbody>${driverRows}</tbody></table>
</div>` : ''}

${partners.length > 0 ? `
<div class="section">
  <div class="section-header">🤝 الجهات المرتبطة (${partners.length})</div>
  <table><thead><tr><th>#</th><th>الاسم</th><th>النوع</th><th>المدينة</th><th>الهاتف</th></tr></thead><tbody>${partnerRows}</tbody></table>
</div>` : ''}

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

<div class="footer">
  <div class="footer-logo">♻ iRecycle - نظام إدارة المخلفات</div>
  <p>التقرير اليومي الشامل | ${dayName} ${dateStr} | وقت الإصدار: ${timeStr}</p>
  <p>أعده: ${userName} | هذا التقرير آلي وصادر من المنصة ولا يحتاج إلى توقيع</p>
  <p style="margin-top:4px;">صفحة 1 من 1</p>
</div>
</body>
</html>`;
};
