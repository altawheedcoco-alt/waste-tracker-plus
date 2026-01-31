import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Building2,
  Truck,
  Recycle,
  FileText,
  Scale,
  Calendar,
  Package,
  Leaf,
  Stamp,
  PenTool,
} from 'lucide-react';

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  pickup_date: string | null;
  delivered_at: string | null;
  generator: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
  transporter: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
  recycler: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
}

interface OrganizationInfo {
  id: string;
  name: string;
  logo_url?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  commercial_register?: string;
  environmental_license?: string;
  representative_name?: string | null;
}

interface AggregateReportPrintProps {
  shipments: ShipmentData[];
  organization: OrganizationInfo | null;
  includeStamps: boolean;
  includeSignatures: boolean;
  reportTitle?: string;
  dateRange?: { start?: string; end?: string };
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'جاري التجميع',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

const AggregateReportPrint = ({
  shipments,
  organization,
  includeStamps,
  includeSignatures,
  reportTitle = 'التقرير المجمع للشحنات',
  dateRange,
}: AggregateReportPrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const currentDateTime = format(new Date(), 'PPpp', { locale: ar });
  
  const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const confirmedCount = shipments.filter(s => s.status === 'confirmed').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length;

  // Generate unique report number
  const reportNumber = `AGR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  // Get unique organizations
  const uniqueGenerators = shipments
    .map(s => s.generator)
    .filter((g, i, arr) => g?.id && arr.findIndex(x => x?.id === g.id) === i);
  
  const uniqueTransporters = shipments
    .map(s => s.transporter)
    .filter((t, i, arr) => t?.id && arr.findIndex(x => x?.id === t.id) === i);
  
  const uniqueRecyclers = shipments
    .map(s => s.recycler)
    .filter((r, i, arr) => r?.id && arr.findIndex(x => x?.id === r.id) === i);

  return (
    <div className="p-8 bg-white text-black" dir="rtl" style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}>
      {/* Header with QR and Barcode */}
      <div className="flex items-start justify-between mb-6 border-b-2 border-primary pb-4">
        {/* QR Code */}
        <div className="text-center">
          <QRCodeSVG
            value={`AGGREGATE-REPORT-${reportNumber}`}
            size={80}
            level="M"
          />
          <p className="text-xs mt-1 text-gray-600">رمز التحقق</p>
        </div>

        {/* Title */}
        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">{reportTitle}</h1>
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-gray-600">نظام إدارة المخلفات وإعادة التدوير</p>
          <div className="mt-2 inline-block bg-primary/10 border border-primary/30 rounded px-3 py-1">
            <span className="text-sm">رقم التقرير: </span>
            <span className="font-mono font-bold text-primary">{reportNumber}</span>
          </div>
        </div>

        {/* Barcode */}
        <div className="text-center">
          <Barcode
            value={reportNumber}
            width={1.2}
            height={40}
            fontSize={10}
            displayValue={false}
          />
          <p className="text-xs mt-1 font-mono">{reportNumber}</p>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">الجهة المصدرة:</span>
            <span className="font-bold mr-2">{organization?.name || '-'}</span>
          </div>
          <div>
            <span className="text-gray-600">تاريخ الإصدار:</span>
            <span className="font-bold mr-2">{currentDate}</span>
          </div>
          {dateRange?.start && (
            <div>
              <span className="text-gray-600">الفترة من:</span>
              <span className="font-bold mr-2">{formatDate(dateRange.start)}</span>
            </div>
          )}
          {dateRange?.end && (
            <div>
              <span className="text-gray-600">الفترة إلى:</span>
              <span className="font-bold mr-2">{formatDate(dateRange.end)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
          <Scale className="w-5 h-5 text-primary" />
          ملخص التقرير
        </h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="border rounded-lg p-3 bg-primary/5">
            <Package className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold text-primary">{shipments.length}</p>
            <p className="text-xs text-gray-600">إجمالي الشحنات</p>
          </div>
          <div className="border rounded-lg p-3 bg-emerald-50">
            <Scale className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
            <p className="text-xl font-bold text-emerald-600">{totalQuantity.toLocaleString()}</p>
            <p className="text-xs text-gray-600">الكمية الإجمالية (كجم)</p>
          </div>
          <div className="border rounded-lg p-3 bg-blue-50">
            <FileText className="w-6 h-6 mx-auto text-blue-600 mb-1" />
            <p className="text-xl font-bold text-blue-600">{confirmedCount}</p>
            <p className="text-xs text-gray-600">شحنات مؤكدة</p>
          </div>
          <div className="border rounded-lg p-3 bg-amber-50">
            <Truck className="w-6 h-6 mx-auto text-amber-600 mb-1" />
            <p className="text-xl font-bold text-amber-600">{inTransitCount + deliveredCount}</p>
            <p className="text-xs text-gray-600">شحنات منجزة</p>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
          <Package className="w-5 h-5 text-primary" />
          تفاصيل الشحنات
        </h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1.5 text-right">#</th>
              <th className="border p-1.5 text-right">رقم الشحنة</th>
              <th className="border p-1.5 text-right">النوع</th>
              <th className="border p-1.5 text-right">الكمية</th>
              <th className="border p-1.5 text-right">الحالة</th>
              <th className="border p-1.5 text-right">المولد</th>
              <th className="border p-1.5 text-right">الناقل</th>
              <th className="border p-1.5 text-right">المدور</th>
              <th className="border p-1.5 text-right">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment, index) => (
              <tr key={shipment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-1.5 text-center">{index + 1}</td>
                <td className="border p-1.5 font-mono">{shipment.shipment_number}</td>
                <td className="border p-1.5">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                <td className="border p-1.5">{shipment.quantity} {shipment.unit || 'كجم'}</td>
                <td className="border p-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200">
                    {statusLabels[shipment.status] || shipment.status}
                  </span>
                </td>
                <td className="border p-1.5">{shipment.generator?.name || '-'}</td>
                <td className="border p-1.5">{shipment.transporter?.name || '-'}</td>
                <td className="border p-1.5">{shipment.recycler?.name || '-'}</td>
                <td className="border p-1.5">{formatDate(shipment.created_at)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border p-1.5 text-right">الإجمالي</td>
              <td className="border p-1.5">{totalQuantity.toLocaleString()} كجم</td>
              <td colSpan={5} className="border p-1.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Parties Summary */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
          <Building2 className="w-5 h-5 text-primary" />
          الجهات المشاركة
        </h3>
        <div className="grid grid-cols-3 gap-4 text-xs">
          {/* Generators */}
          <div className="border rounded-lg p-3">
            <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-1 border-b pb-2">
              <Building2 className="w-4 h-4" />
              الجهات المولدة ({uniqueGenerators.length})
            </h4>
            <ul className="space-y-1">
              {uniqueGenerators.slice(0, 5).map((g, i) => (
                <li key={i} className="truncate">{g?.name || '-'}</li>
              ))}
              {uniqueGenerators.length > 5 && (
                <li className="text-gray-500">+{uniqueGenerators.length - 5} جهات أخرى</li>
              )}
            </ul>
          </div>

          {/* Transporters */}
          <div className="border rounded-lg p-3">
            <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-1 border-b pb-2">
              <Truck className="w-4 h-4" />
              جهات النقل ({uniqueTransporters.length})
            </h4>
            <ul className="space-y-1">
              {uniqueTransporters.slice(0, 5).map((t, i) => (
                <li key={i} className="truncate">{t?.name || '-'}</li>
              ))}
              {uniqueTransporters.length > 5 && (
                <li className="text-gray-500">+{uniqueTransporters.length - 5} جهات أخرى</li>
              )}
            </ul>
          </div>

          {/* Recyclers */}
          <div className="border rounded-lg p-3 bg-emerald-50">
            <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-1 border-b pb-2">
              <Recycle className="w-4 h-4" />
              جهات التدوير ({uniqueRecyclers.length})
            </h4>
            <ul className="space-y-1">
              {uniqueRecyclers.slice(0, 5).map((r, i) => (
                <li key={i} className="truncate">{r?.name || '-'}</li>
              ))}
              {uniqueRecyclers.length > 5 && (
                <li className="text-gray-500">+{uniqueRecyclers.length - 5} جهات أخرى</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Stamps and Signatures */}
      {(includeStamps || includeSignatures) && (
        <div className="border-t-2 border-gray-300 pt-6 mt-8">
          <h4 className="font-semibold mb-4 text-center">التوثيق والاعتماد</h4>
          <div className="grid grid-cols-3 gap-6">
            {/* Generator stamp/signature from first shipment */}
            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <Building2 className="w-4 h-4" />
                الجهة المولدة
              </div>
              <p className="text-xs font-medium mb-3">{shipments[0]?.generator?.name || '-'}</p>
              <div className="flex justify-center gap-4 min-h-[60px]">
                {includeStamps && (
                  <div className="text-center">
                    {shipments[0]?.generator?.stamp_url ? (
                      <img 
                        src={shipments[0].generator.stamp_url} 
                        alt="ختم" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <Stamp className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">الختم</p>
                  </div>
                )}
                {includeSignatures && (
                  <div className="text-center">
                    {shipments[0]?.generator?.signature_url ? (
                      <img 
                        src={shipments[0].generator.signature_url} 
                        alt="توقيع" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <PenTool className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">التوقيع</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transporter stamp/signature */}
            <div className="text-center border rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-700 mb-2">
                <Truck className="w-4 h-4" />
                جهة النقل
              </div>
              <p className="text-xs font-medium mb-3">{shipments[0]?.transporter?.name || '-'}</p>
              <div className="flex justify-center gap-4 min-h-[60px]">
                {includeStamps && (
                  <div className="text-center">
                    {shipments[0]?.transporter?.stamp_url ? (
                      <img 
                        src={shipments[0].transporter.stamp_url} 
                        alt="ختم" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <Stamp className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">الختم</p>
                  </div>
                )}
                {includeSignatures && (
                  <div className="text-center">
                    {shipments[0]?.transporter?.signature_url ? (
                      <img 
                        src={shipments[0].transporter.signature_url} 
                        alt="توقيع" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <PenTool className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">التوقيع</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recycler stamp/signature */}
            <div className="text-center border rounded-lg p-4 bg-emerald-50">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 mb-2">
                <Recycle className="w-4 h-4" />
                جهة التدوير
              </div>
              <p className="text-xs font-medium mb-3">{shipments[0]?.recycler?.name || '-'}</p>
              <div className="flex justify-center gap-4 min-h-[60px]">
                {includeStamps && (
                  <div className="text-center">
                    {shipments[0]?.recycler?.stamp_url ? (
                      <img 
                        src={shipments[0].recycler.stamp_url} 
                        alt="ختم" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <Stamp className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">الختم</p>
                  </div>
                )}
                {includeSignatures && (
                  <div className="text-center">
                    {shipments[0]?.recycler?.signature_url ? (
                      <img 
                        src={shipments[0].recycler.signature_url} 
                        alt="توقيع" 
                        className="w-16 h-16 object-contain border rounded mx-auto"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center bg-gray-50 mx-auto">
                        <PenTool className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">التوقيع</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>هذا التقرير صادر إلكترونياً من نظام إدارة المخلفات وإعادة التدوير</p>
        <p className="mt-1">تاريخ الإصدار: {currentDateTime} | رقم المرجع: {reportNumber}</p>
        <p className="mt-2 text-gray-400">
          هذه الوثيقة تم إنشاؤها آلياً طبقاً للبيانات المدخلة والواردة إلينا على النظام
        </p>
      </div>
    </div>
  );
};

export default AggregateReportPrint;
