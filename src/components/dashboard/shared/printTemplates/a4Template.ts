import { format } from 'date-fns';
import { generateDigitalVerificationStamp } from '@/lib/digitalVerificationStamp';
interface A4Data {
  orgName: string;
  orgId?: string;
  dateStr: string;
  timeStr: string;
  userName: string;
  shipments: any[];
  ledger: any[];
  notifications: any[];
  totalWeight: number;
  totalRevenue: number;
  totalExpenses: number;
  statusLabel: (s: string) => string;
  wasteTypeLabel: (w: string) => string;
}

export const generateA4Template = (data: A4Data): string => {
  const { orgName, dateStr, timeStr, userName, shipments, ledger, notifications, totalWeight, totalRevenue, totalExpenses, statusLabel, wasteTypeLabel } = data;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير النظام المفصل</title>
<style>
  @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: #1a1a1a; direction: rtl; padding: 15mm 15mm 20mm 15mm; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
  .header-right { text-align: right; }
  .header-left { text-align: left; font-size: 11px; color: #666; }
  h1 { font-size: 22px; color: #059669; }
  h2 { font-size: 16px; color: #059669; margin: 18px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }
  .subtitle { font-size: 13px; color: #666; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .stat-card { background: rgba(240,253,244,0.55); border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
  .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; background: transparent !important; }
  th { background: rgba(5,150,105,0.85) !important; color: white; padding: 8px 6px; text-align: right; }
  td { padding: 6px; border-bottom: 1px solid #e5e7eb; text-align: right; background: transparent !important; }
  tr:nth-child(even) { background: rgba(249,250,251,0.35) !important; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
  .badge-success { background: rgba(220,252,231,0.6); color: #166534; }
  .badge-warning { background: rgba(254,243,199,0.6); color: #92400e; }
  .badge-info { background: rgba(219,234,254,0.6); color: #1e40af; }
  .badge-danger { background: rgba(254,226,226,0.6); color: #991b1b; }
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
  <div class="stat-card"><div class="stat-value">${shipments.length}</div><div class="stat-label">شحنات اليوم</div></div>
  <div class="stat-card"><div class="stat-value">${totalWeight.toLocaleString('ar-EG')}</div><div class="stat-label">إجمالي الوزن (كجم)</div></div>
  <div class="stat-card"><div class="stat-value">${totalRevenue.toLocaleString('ar-EG')}</div><div class="stat-label">الإيرادات (ج.م)</div></div>
  <div class="stat-card"><div class="stat-value">${(totalRevenue - totalExpenses).toLocaleString('ar-EG')}</div><div class="stat-label">صافي اليوم (ج.م)</div></div>
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

${generateDigitalVerificationStamp({
  referenceNumber: `RPT-${dateStr.replace(/\//g, '')}`,
  documentType: 'report',
  entityName: orgName,
  accentColor: '#059669',
})}

<div class="footer">
  <p>تقرير صادر من منصة iRecycle لإدارة المخلفات | ${dateStr} - ${timeStr}</p>
  <p>هذا التقرير آلي ولا يحتاج إلى توقيع</p>
</div>
</body>
</html>`;
};
