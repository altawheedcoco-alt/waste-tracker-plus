import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
  Building2,
  Truck,
  Recycle,
  CheckCircle2,
  FileText,
  Scale,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Hash,
  Leaf,
} from 'lucide-react';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  disposal_method?: string;
  pickup_address?: string;
  delivery_address?: string;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  generator?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  transporter?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  recycler?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
  } | null;
}

interface RecyclerOrg {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  commercial_register?: string;
  environmental_license?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  representative_name?: string | null;
}

interface RecyclingCertificatePrintProps {
  shipment: Shipment;
  template: string;
  customNotes: string;
  processingDetails: string;
  openingDeclaration?: string;
  closingDeclaration?: string;
  recyclerOrg: RecyclerOrg | null;
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

const templateTitles: Record<string, string> = {
  standard: 'شهادة إعادة التدوير',
  detailed: 'تقرير إعادة التدوير التفصيلي',
  environmental: 'تقرير الامتثال البيئي',
  custom: 'شهادة إعادة التدوير',
};

const RecyclingCertificatePrint = ({
  shipment,
  template,
  customNotes,
  processingDetails,
  openingDeclaration,
  closingDeclaration,
  recyclerOrg,
}: RecyclingCertificatePrintProps) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const deliveryDate = shipment.delivered_at
    ? format(new Date(shipment.delivered_at), 'PP', { locale: ar })
    : '-';

  return (
    <div className="p-8 bg-white text-black print:p-4" dir="rtl" style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}>
      {/* Header with QR and Barcode */}
      <div className="flex items-start justify-between mb-6 border-b-2 border-emerald-600 pb-4">
        {/* QR Code */}
        <div className="text-center">
          <QRCodeSVG
            value={`RECYCLING-CERT-${shipment.shipment_number}`}
            size={80}
            level="M"
          />
          <p className="text-xs mt-1 text-gray-600">رمز التحقق</p>
        </div>

        {/* Title */}
        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-700">{templateTitles[template]}</h1>
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">إدارة المخلفات وإعادة التدوير</p>
          <div className="mt-2 inline-block bg-emerald-50 border border-emerald-200 rounded px-3 py-1">
            <span className="text-sm">رقم الشهادة: </span>
            <span className="font-mono font-bold text-emerald-700">{shipment.shipment_number}</span>
          </div>
        </div>

        {/* Barcode */}
        <div className="text-center">
          <Barcode
            value={shipment.shipment_number}
            width={1.2}
            height={40}
            fontSize={10}
            displayValue={false}
          />
          <p className="text-xs mt-1 font-mono">{shipment.shipment_number}</p>
        </div>
      </div>

      {/* Opening Declaration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          إقرار رسمي
        </h2>
        <p className="text-sm leading-relaxed text-blue-900">
          إلى السادة / <strong>{shipment.generator?.name || 'الجهة المولدة'}</strong> - الجهة المولدة للمخلفات
          <br />
          وإلى السادة / <strong>{shipment.transporter?.name || 'جهة النقل'}</strong> - جهة الجمع والنقل
          <br /><br />
          تحية طيبة وبعد،
          <br />
          {openingDeclaration || `نفيدكم علماً بأن شركة ${recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'} المرخصة في مجال إعادة تدوير المخلفات قد تسلمت الشحنة المشار إليها أعلاه وتم معالجتها وفقاً للإجراءات المعتمدة.`}
        </p>
      </div>

      {/* Shipment Details Table */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
          <Scale className="w-5 h-5 text-emerald-600" />
          بيانات الشحنة
        </h3>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-2 bg-gray-50 font-semibold w-1/4">رقم الشحنة</td>
              <td className="p-2 font-mono">{shipment.shipment_number}</td>
              <td className="p-2 bg-gray-50 font-semibold w-1/4">تاريخ الاستلام</td>
              <td className="p-2">{deliveryDate}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 bg-gray-50 font-semibold">نوع المخلفات</td>
              <td className="p-2">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
              <td className="p-2 bg-gray-50 font-semibold">الكمية</td>
              <td className="p-2 font-bold">{shipment.quantity} {shipment.unit || 'كجم'}</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 bg-gray-50 font-semibold">طريقة التخلص</td>
              <td className="p-2">{shipment.disposal_method || 'إعادة التدوير'}</td>
              <td className="p-2 bg-gray-50 font-semibold">وصف المخلفات</td>
              <td className="p-2">{shipment.waste_description || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Parties Section */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Generator */}
        <div className="border rounded-lg p-3">
          <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-1 text-sm border-b pb-2">
            <Building2 className="w-4 h-4" />
            الجهة المولدة
          </h4>
          <div className="text-xs space-y-1">
            <p className="font-semibold">{shipment.generator?.name || '-'}</p>
            <p className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3 h-3" />
              {shipment.generator?.city || '-'}
            </p>
            {shipment.generator?.commercial_register && (
              <p className="flex items-center gap-1 text-gray-600">
                <Hash className="w-3 h-3" />
                س.ت: {shipment.generator.commercial_register}
              </p>
            )}
          </div>
        </div>

        {/* Transporter */}
        <div className="border rounded-lg p-3">
          <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-1 text-sm border-b pb-2">
            <Truck className="w-4 h-4" />
            جهة النقل
          </h4>
          <div className="text-xs space-y-1">
            <p className="font-semibold">{shipment.transporter?.name || '-'}</p>
            <p className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3 h-3" />
              {shipment.transporter?.city || '-'}
            </p>
            {shipment.transporter?.commercial_register && (
              <p className="flex items-center gap-1 text-gray-600">
                <Hash className="w-3 h-3" />
                س.ت: {shipment.transporter.commercial_register}
              </p>
            )}
          </div>
        </div>

        {/* Recycler */}
        <div className="border rounded-lg p-3 bg-emerald-50">
          <h4 className="font-bold text-emerald-700 mb-2 flex items-center gap-1 text-sm border-b pb-2">
            <Recycle className="w-4 h-4" />
            جهة التدوير
          </h4>
          <div className="text-xs space-y-1">
            <p className="font-semibold">{recyclerOrg?.name || shipment.recycler?.name || '-'}</p>
            <p className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-3 h-3" />
              {recyclerOrg?.city || shipment.recycler?.city || '-'}
            </p>
            {(recyclerOrg?.commercial_register || shipment.recycler?.commercial_register) && (
              <p className="flex items-center gap-1 text-gray-600">
                <Hash className="w-3 h-3" />
                س.ت: {recyclerOrg?.commercial_register || shipment.recycler?.commercial_register}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Processing Details (if provided) */}
      {processingDetails && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
            <Recycle className="w-5 h-5 text-emerald-600" />
            تفاصيل عملية المعالجة والتدوير
          </h3>
          <div className="border rounded p-3 text-sm leading-relaxed bg-gray-50">
            {processingDetails}
          </div>
        </div>
      )}

      {/* Custom Notes (if provided) */}
      {customNotes && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded">
            <FileText className="w-5 h-5 text-emerald-600" />
            ملاحظات إضافية
          </h3>
          <div className="border rounded p-3 text-sm leading-relaxed bg-gray-50">
            {customNotes}
          </div>
        </div>
      )}

      {/* Closing Declaration */}
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-4 mb-6">
        <h2 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6" />
          إقرار استلام ومعالجة
        </h2>
        {closingDeclaration ? (
          <p className="text-sm leading-loose text-emerald-900 whitespace-pre-wrap">
            {closingDeclaration}
          </p>
        ) : (
          <>
            <p className="text-sm leading-loose text-emerald-900">
              نقر نحن شركة <strong>{recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير'}</strong> بأنه قد تم استلام الشحنة رقم <strong className="font-mono">{shipment.shipment_number}</strong> 
              بتاريخ <strong>{deliveryDate}</strong> بكامل محتوياتها المكونة من <strong>{shipment.quantity} {shipment.unit || 'كجم'}</strong> من مخلفات <strong>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</strong> وبحالة سليمة.
              <br /><br />
              كما نقر بأنه تمت إعادة تدوير ومعالجة هذه المخلفات بالكامل وفقاً للمعايير والمتطلبات التالية:
            </p>
            <ul className="text-sm mt-2 mr-4 space-y-1 text-emerald-800">
              <li>✓ المتطلبات البيئية المنظمة لنشاط إدارة المخلفات وإعادة التدوير</li>
              <li>✓ المتطلبات القانونية والتشريعية السارية</li>
              <li>✓ المعايير الصناعية والفنية المعتمدة</li>
              <li>✓ اشتراطات الصحة والسلامة المهنية</li>
            </ul>
          </>
        )}
      </div>

      {/* Signature Section */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="grid grid-cols-2 gap-8">
          {/* Empty space for balance */}
          <div />

          {/* Recycler Signature */}
          <div className="text-center">
            <p className="font-bold text-gray-800 mb-2">التوقيع والختم</p>
            <p className="text-sm text-gray-600 mb-4">{recyclerOrg?.name || shipment.recycler?.name}</p>
            
            <div className="flex justify-center gap-6 mt-4">
              {/* Signature */}
              <div className="text-center">
                {recyclerOrg?.signature_url || shipment.recycler?.signature_url ? (
                  <img
                    src={recyclerOrg?.signature_url || shipment.recycler?.signature_url || ''}
                    alt="التوقيع"
                    className="h-16 mx-auto mb-1 object-contain"
                  />
                ) : (
                  <div className="h-16 w-32 border-b-2 border-gray-400 mx-auto mb-1" />
                )}
                <p className="text-xs text-gray-500">التوقيع</p>
              </div>

              {/* Stamp */}
              <div className="text-center">
                {recyclerOrg?.stamp_url || shipment.recycler?.stamp_url ? (
                  <img
                    src={recyclerOrg?.stamp_url || shipment.recycler?.stamp_url || ''}
                    alt="الختم"
                    className="h-16 mx-auto mb-1 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-400 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <span className="text-xs text-gray-400">الختم</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">الختم</p>
              </div>
            </div>

            <p className="text-sm mt-4">
              الممثل القانوني: {recyclerOrg?.representative_name || shipment.recycler?.representative_name || '________________'}
            </p>
            <p className="text-sm mt-1">
              التاريخ: {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>هذه الشهادة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير</p>
        <p className="mt-1">تاريخ الإصدار: {currentDate} | رقم المرجع: {shipment.shipment_number}</p>
        <p className="mt-2 text-gray-400">
          هذه الوثيقة تم إنشاؤها آلياً طبقاً للبيانات المدخلة والواردة إلينا على النظام - دون أدنى مسؤولية على النظام
        </p>
      </div>
    </div>
  );
};

export default RecyclingCertificatePrint;
