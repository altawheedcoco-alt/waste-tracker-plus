interface ReceiptData {
  orgName: string;
  dateStr: string;
  timeStr: string;
  userName: string;
  shipments: any[];
  ledger: any[];
  totalWeight: number;
  totalRevenue: number;
  totalExpenses: number;
  statusLabel: (s: string) => string;
}

export const generateReceiptTemplate = (data: ReceiptData): string => {
  const { orgName, dateStr, timeStr, userName, shipments, ledger, totalWeight, totalRevenue, totalExpenses, statusLabel } = data;

  return `
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
};
