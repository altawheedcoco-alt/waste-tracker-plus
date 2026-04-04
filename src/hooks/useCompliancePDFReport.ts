/**
 * useCompliancePDFReport — Generates a printable compliance report for any org
 */

import { useCallback } from 'react';
import { useSoftComplianceAnalyzer, CATEGORY_LABELS, type StandardCategory } from '@/hooks/useSoftComplianceAnalyzer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCompliancePDFReport() {
  const { organization } = useAuth();
  const { data: report } = useSoftComplianceAnalyzer();

  const generateReport = useCallback(() => {
    if (!report || !organization) {
      toast.error('لا توجد بيانات لإنشاء التقرير');
      return;
    }

    const levelLabels: Record<string, string> = {
      excellent: 'ممتاز', good: 'جيد', acceptable: 'مقبول', needs_improvement: 'يحتاج تحسين', poor: 'ضعيف',
    };

    const statusLabels: Record<string, string> = {
      met: '✅ مستوفى', partial: '⚠️ جزئي', not_met: '❌ غير مستوفى', not_applicable: '➖ لا ينطبق',
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة');
      return;
    }

    const categoriesHtml = Object.entries(report.categories).map(([key, cat]) => {
      const checksHtml = cat.checks.map(c => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;">${c.label}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${statusLabels[c.status]}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${c.score}%</td>
          <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:11px;color:#666;">${c.recommendation || '—'}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-bottom:20px;">
          <h3 style="color:#16a34a;border-bottom:2px solid #16a34a;padding-bottom:5px;">
            ${CATEGORY_LABELS[key as StandardCategory]} — ${cat.score}%
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f3f4f6;">
              <th style="padding:8px 10px;text-align:right;">المعيار</th>
              <th style="padding:8px 10px;text-align:center;">الحالة</th>
              <th style="padding:8px 10px;text-align:center;">النتيجة</th>
              <th style="padding:8px 10px;text-align:right;">التوصية</th>
            </tr></thead>
            <tbody>${checksHtml}</tbody>
          </table>
        </div>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تقرير الامتثال — ${organization.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; }
    h1 { color: #16a34a; margin-bottom: 5px; }
    .header { border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 25px; }
    .score-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .score-number { font-size: 48px; font-weight: bold; color: #16a34a; }
    .disclaimer { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-top: 30px; font-size: 12px; color: #1e40af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 تقرير تحليل الامتثال</h1>
    <p style="color:#666;margin:0;">${organization.name} — ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p style="color:#999;font-size:12px;margin:5px 0 0;">تقرير استشاري غير ملزم — منصة iRecycle</p>
  </div>

  <div class="score-box">
    <div class="score-number">${report.overallScore}%</div>
    <div style="font-size:18px;color:#333;margin-top:5px;">المستوى العام: <strong>${levelLabels[report.overallLevel]}</strong></div>
  </div>

  ${report.strengths.length > 0 ? `
    <h2 style="color:#16a34a;">✅ نقاط القوة</h2>
    <ul>${report.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
  ` : ''}

  ${report.recommendations.length > 0 ? `
    <h2 style="color:#f59e0b;">⚠️ التوصيات</h2>
    <ul>${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
  ` : ''}

  <h2 style="color:#333;">📊 التفاصيل حسب الفئة</h2>
  ${categoriesHtml}

  <div class="disclaimer">
    ⚠️ <strong>إخلاء مسؤولية:</strong> هذا التقرير لأغراض استشارية فقط ولا يُعد بديلاً عن التدقيق القانوني المتخصص. 
    لا يمنع أو يقيد أي عمليات تشغيلية. تم إنشاؤه تلقائياً بتاريخ ${new Date().toLocaleString('ar-EG')}.
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
    toast.success('تم إنشاء تقرير الامتثال');
  }, [report, organization]);

  return { generateReport, hasData: !!report };
}
