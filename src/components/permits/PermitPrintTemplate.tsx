import { useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PermitPrintData {
  permitNumber: string;
  orgName: string;
  orgAddress?: string;
  driverName: string;
  vehiclePlate: string;
  vehicleType?: string;
  cargoType?: string;
  purpose?: string;
  validFrom: string;
  validUntil: string;
  conditions?: string;
  scope?: { transport?: boolean; loading?: boolean; unloading?: boolean };
  issuedAt: string;
  logisticsManager?: string;
}

interface Props {
  permit: PermitPrintData;
  onClose?: () => void;
}

const PermitPrintTemplate = ({ permit, onClose }: Props) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تصريح دخول وتحميل - ${permit.permitNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            color: #1a1a1a;
            background: #fff;
            padding: 20mm 15mm;
            line-height: 1.8;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .header h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: 1px;
          }
          .header .subtitle {
            font-size: 13px;
            color: #555;
          }
          .org-info {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 20px;
          }
          .org-info p {
            font-size: 14px;
            margin-bottom: 4px;
          }
          .org-info strong { color: #111; }
          .permit-number {
            text-align: center;
            background: #1a1a1a;
            color: #fff;
            padding: 8px 20px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 20px;
            display: inline-block;
            width: 100%;
          }
          .body-text {
            font-size: 15px;
            line-height: 2;
            margin-bottom: 20px;
            text-align: justify;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .details-table td {
            padding: 10px 14px;
            border: 1px solid #ddd;
            font-size: 14px;
          }
          .details-table td:first-child {
            background: #f5f5f5;
            font-weight: 700;
            width: 35%;
            color: #333;
          }
          .details-table td:last-child {
            font-weight: 500;
          }
          .scope-badges {
            display: flex;
            gap: 10px;
          }
          .scope-badge {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 3px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .validity-section {
            background: #fff8e1;
            border: 1px solid #ffe082;
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 24px;
          }
          .validity-section h3 {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #f57f17;
          }
          .validity-section p {
            font-size: 14px;
            margin-bottom: 4px;
          }
          .conditions-section {
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 24px;
          }
          .conditions-section h3 {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .signature-box {
            flex: 1;
            text-align: center;
          }
          .signature-box p {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .signature-line {
            border-bottom: 1px solid #999;
            height: 50px;
            margin-bottom: 8px;
          }
          .signature-label {
            font-size: 12px;
            color: #777;
          }
          .stamp-box {
            width: 120px;
            height: 120px;
            border: 2px dashed #ccc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            color: #bbb;
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 12px;
          }
          .footer .timestamp {
            direction: ltr;
            unicode-bidi: embed;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تصريح دخول وتحميل بضائع (مرتجع)</h1>
          <p class="subtitle">صادر من نظام إدارة النقل والمخلفات الإلكتروني</p>
        </div>

        <div class="org-info">
          <p><strong>اسم المنشأة:</strong> ${permit.orgName}</p>
          ${permit.orgAddress ? `<p><strong>الموقع:</strong> ${permit.orgAddress}</p>` : ''}
          <p><strong>التاريخ:</strong> ${format(new Date(permit.issuedAt), 'dd MMMM yyyy', { locale: ar })}</p>
        </div>

        <div class="permit-number">رقم التصريح: ${permit.permitNumber}</div>

        <div class="body-text">
          يُصرح للسيد السائق المذكور أدناه بتحميل ونقل الشحنة المحددة من الجهة المعنية والتوجه بها إلى مقر المنشأة، وذلك وفق التفاصيل التالية:
        </div>

        <table class="details-table">
          <tr>
            <td>اسم السائق</td>
            <td>${permit.driverName}</td>
          </tr>
          <tr>
            <td>رقم السيارة</td>
            <td>${permit.vehiclePlate}</td>
          </tr>
          ${permit.vehicleType ? `<tr><td>نوع المركبة</td><td>${permit.vehicleType}</td></tr>` : ''}
          ${permit.cargoType ? `<tr><td>نوع الحمولة</td><td>${permit.cargoType}</td></tr>` : ''}
          ${permit.purpose ? `<tr><td>الغرض من النقل</td><td>${permit.purpose}</td></tr>` : ''}
          <tr>
            <td>نطاق التصريح</td>
            <td>
              <div class="scope-badges">
                ${permit.scope?.transport ? '<span class="scope-badge">نقل</span>' : ''}
                ${permit.scope?.loading ? '<span class="scope-badge">تحميل</span>' : ''}
                ${permit.scope?.unloading ? '<span class="scope-badge">تفريغ</span>' : ''}
              </div>
            </td>
          </tr>
        </table>

        <div class="validity-section">
          <h3>صلاحية التصريح:</h3>
          <p><strong>تاريخ الصدور:</strong> ${format(new Date(permit.validFrom), 'dd/MM/yyyy')}</p>
          <p><strong>تاريخ الانتهاء:</strong> ${format(new Date(permit.validUntil), 'dd/MM/yyyy')}</p>
          <p>ينتهي مفعول هذا التصريح فور وصول الشحنة وتسليمها بمقر المنشأة أو بانتهاء التاريخ المحدد أعلاه، أيهما أسبق.</p>
        </div>

        ${permit.conditions ? `
        <div class="conditions-section">
          <h3>شروط خاصة:</h3>
          <p>${permit.conditions}</p>
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <p>مدير اللوجيستيات</p>
            <div class="signature-line"></div>
            <span class="signature-label">التوقيع</span>
          </div>
          <div class="signature-box">
            <p>ختم المنشأة</p>
            <div class="stamp-box">ختم</div>
          </div>
          <div class="signature-box">
            <p>اعتماد الإدارة</p>
            <div class="signature-line"></div>
            <span class="signature-label">التوقيع</span>
          </div>
        </div>

        <div class="footer">
          <p>هذا المستند صادر إلكترونياً من منصة إدارة النقل والمخلفات - لا يحتاج إلى توقيع يدوي إلا في حالة الطباعة</p>
          <p class="timestamp">تاريخ الإصدار: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div ref={printRef} className="bg-white border rounded-lg p-8 space-y-6 text-sm" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-double pb-4">
          <h2 className="text-xl font-bold">تصريح دخول وتحميل بضائع (مرتجع)</h2>
          <p className="text-xs text-muted-foreground">صادر من نظام إدارة النقل والمخلفات الإلكتروني</p>
        </div>

        {/* Org Info */}
        <div className="bg-muted/50 rounded p-4 space-y-1">
          <p><strong>اسم المنشأة:</strong> {permit.orgName}</p>
          {permit.orgAddress && <p><strong>الموقع:</strong> {permit.orgAddress}</p>}
          <p><strong>التاريخ:</strong> {format(new Date(permit.issuedAt), 'dd MMMM yyyy', { locale: ar })}</p>
        </div>

        {/* Permit Number */}
        <div className="bg-foreground text-background text-center py-2 rounded font-bold tracking-widest">
          رقم التصريح: {permit.permitNumber}
        </div>

        {/* Body */}
        <p className="leading-relaxed">
          يُصرح للسيد السائق المذكور أدناه بتحميل ونقل الشحنة المحددة من الجهة المعنية والتوجه بها إلى مقر المنشأة، وذلك وفق التفاصيل التالية:
        </p>

        {/* Details Table */}
        <table className="w-full border-collapse">
          <tbody>
            {[
              ['اسم السائق', permit.driverName],
              ['رقم السيارة', permit.vehiclePlate],
              ...(permit.vehicleType ? [['نوع المركبة', permit.vehicleType]] : []),
              ...(permit.cargoType ? [['نوع الحمولة', permit.cargoType]] : []),
              ...(permit.purpose ? [['الغرض من النقل', permit.purpose]] : []),
            ].map(([label, value], i) => (
              <tr key={i} className="border">
                <td className="bg-muted/50 font-bold p-3 w-1/3">{label}</td>
                <td className="p-3">{value}</td>
              </tr>
            ))}
            <tr className="border">
              <td className="bg-muted/50 font-bold p-3">نطاق التصريح</td>
              <td className="p-3 flex gap-2">
                {permit.scope?.transport && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">نقل</span>}
                {permit.scope?.loading && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">تحميل</span>}
                {permit.scope?.unloading && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">تفريغ</span>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Validity */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-bold text-yellow-800 mb-2">صلاحية التصريح:</h3>
          <p><strong>تاريخ الصدور:</strong> {format(new Date(permit.validFrom), 'dd/MM/yyyy')}</p>
          <p><strong>تاريخ الانتهاء:</strong> {format(new Date(permit.validUntil), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-yellow-700 mt-1">ينتهي مفعول هذا التصريح فور وصول الشحنة وتسليمها بمقر المنشأة أو بانتهاء التاريخ المحدد أعلاه.</p>
        </div>

        {/* Conditions */}
        {permit.conditions && (
          <div className="border rounded p-4">
            <h3 className="font-bold mb-1">شروط خاصة:</h3>
            <p>{permit.conditions}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-10 pt-6">
          <div className="text-center">
            <p className="font-bold mb-2">مدير اللوجيستيات</p>
            <div className="border-b h-12 mb-1" />
            <p className="text-xs text-muted-foreground">التوقيع</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-2">ختم المنشأة</p>
            <div className="w-24 h-24 border-2 border-dashed rounded-full mx-auto flex items-center justify-center text-xs text-muted-foreground">
              ختم
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold mb-2">اعتماد الإدارة</p>
            <div className="border-b h-12 mb-1" />
            <p className="text-xs text-muted-foreground">التوقيع</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        )}
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          طباعة التصريح
        </Button>
      </div>
    </div>
  );
};

export default PermitPrintTemplate;
