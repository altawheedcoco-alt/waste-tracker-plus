import { useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';

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
  const { printContent } = usePDFExport({ filename: `permit-${permit.permitNumber}` });

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
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
