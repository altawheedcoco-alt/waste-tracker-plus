import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  pickup_address?: string;
  delivery_address?: string;
  created_at?: string;
  delivered_at?: string | null;
  generator?: {
    name: string;
    city?: string;
  } | null;
  transporter?: {
    name: string;
    city?: string;
  } | null;
  recycler?: {
    name: string;
    city?: string;
  } | null;
}

interface AggregateReceiptsPrintProps {
  shipments: Shipment[];
  transporterOrg: {
    name: string;
    stamp_url?: string | null;
    signature_url?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    address?: string;
    city?: string;
  } | null;
  reportNumber: string;
  includeStamp?: boolean;
  includeSignature?: boolean;
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

const AggregateReceiptsPrint = ({
  shipments,
  transporterOrg,
  reportNumber,
  includeStamp = true,
  includeSignature = true,
}: AggregateReceiptsPrintProps) => {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ar });
  const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  
  // Group shipments by waste type
  const groupedByWasteType = shipments.reduce((acc, shipment) => {
    const type = shipment.waste_type;
    if (!acc[type]) {
      acc[type] = { shipments: [], totalQuantity: 0 };
    }
    acc[type].shipments.push(shipment);
    acc[type].totalQuantity += shipment.quantity || 0;
    return acc;
  }, {} as Record<string, { shipments: Shipment[]; totalQuantity: number }>);

  // Group by generator
  const groupedByGenerator = shipments.reduce((acc, shipment) => {
    const name = shipment.generator?.name || 'غير محدد';
    if (!acc[name]) {
      acc[name] = { shipments: [], totalQuantity: 0 };
    }
    acc[name].shipments.push(shipment);
    acc[name].totalQuantity += shipment.quantity || 0;
    return acc;
  }, {} as Record<string, { shipments: Shipment[]; totalQuantity: number }>);

  return (
    <div 
      className="bg-white p-6 mx-auto print:p-4 print:shadow-none" 
      style={{ 
        maxWidth: '210mm',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        fontSize: '9pt',
        lineHeight: '1.4'
      }}
    >
      {/* Header */}
      <div className="text-center mb-4 pb-3" style={{ borderBottom: '2px solid #2563eb' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-right" style={{ width: '30%' }}>
            <Barcode 
              value={reportNumber} 
              width={1.2} 
              height={35} 
              fontSize={8}
              displayValue={true}
            />
          </div>
          <div className="text-center flex-1">
            <h1 className="font-bold text-blue-700" style={{ fontSize: '16pt', marginBottom: '4px' }}>
              شهادة استلام شحنات مجمعة
            </h1>
            <p style={{ fontSize: '10pt', color: '#666' }}>إدارة نقل المخلفات</p>
            <p style={{ fontSize: '9pt', color: '#888', marginTop: '2px' }}>
              رقم الشهادة: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{reportNumber}</span>
            </p>
          </div>
          <div style={{ width: '30%' }} className="flex justify-end">
            <QRCodeSVG 
              value={`${window.location.origin}/qr-verify?type=report&code=${encodeURIComponent(reportNumber)}`}
              size={70}
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
        <h2 className="font-bold mb-2 flex items-center gap-2" style={{ fontSize: '11pt', color: '#1e40af' }}>
          ✓ ملخص الشهادة المجمعة
        </h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-2 bg-white rounded" style={{ border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2563eb' }}>{shipments.length}</p>
            <p style={{ fontSize: '8pt', color: '#666' }}>عدد الشحنات</p>
          </div>
          <div className="p-2 bg-white rounded" style={{ border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2563eb' }}>{totalQuantity.toLocaleString()}</p>
            <p style={{ fontSize: '8pt', color: '#666' }}>الوزن الإجمالي (كجم)</p>
          </div>
          <div className="p-2 bg-white rounded" style={{ border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2563eb' }}>{Object.keys(groupedByGenerator).length}</p>
            <p style={{ fontSize: '8pt', color: '#666' }}>الجهات المولدة</p>
          </div>
          <div className="p-2 bg-white rounded" style={{ border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#2563eb' }}>{currentDate}</p>
            <p style={{ fontSize: '8pt', color: '#666' }}>تاريخ الإصدار</p>
          </div>
        </div>
      </div>

      {/* Transporter Info */}
      <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <h3 className="font-bold mb-2" style={{ fontSize: '10pt', color: '#1e40af' }}>
          🚚 جهة النقل المُصدِرة
        </h3>
        <div className="grid grid-cols-2 gap-3" style={{ fontSize: '8pt' }}>
          <div>
            <span style={{ color: '#666' }}>اسم الجهة:</span>
            <span className="font-bold mr-1">{transporterOrg?.name || '-'}</span>
          </div>
          <div>
            <span style={{ color: '#666' }}>المدينة:</span>
            <span className="mr-1">{transporterOrg?.city || '-'}</span>
          </div>
          {transporterOrg?.commercial_register && (
            <div>
              <span style={{ color: '#666' }}>السجل التجاري:</span>
              <span className="mr-1">{transporterOrg.commercial_register}</span>
            </div>
          )}
          {transporterOrg?.environmental_license && (
            <div>
              <span style={{ color: '#666' }}>الترخيص البيئي:</span>
              <span className="mr-1">{transporterOrg.environmental_license}</span>
            </div>
          )}
        </div>
      </div>

      {/* Waste Type Summary */}
      <div className="mb-4">
        <h3 className="font-bold mb-2" style={{ fontSize: '10pt', color: '#1f2937' }}>
          📊 ملخص حسب نوع المخلفات
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>نوع المخلفات</th>
              <th style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>عدد الشحنات</th>
              <th style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>الكمية (كجم)</th>
              <th style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>النسبة</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedByWasteType).map(([type, data]) => (
              <tr key={type}>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>
                  {wasteTypeLabels[type] || type}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>
                  {data.shipments.length}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>
                  {data.totalQuantity.toLocaleString()}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>
                  {((data.totalQuantity / totalQuantity) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#dbeafe', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>الإجمالي</td>
              <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{shipments.length}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{totalQuantity.toLocaleString()}</td>
              <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Shipments List */}
      <div className="mb-4">
        <h3 className="font-bold mb-2" style={{ fontSize: '10pt', color: '#1f2937' }}>
          📋 تفاصيل الشحنات
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#2563eb', color: 'white' }}>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'center' }}>#</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'right' }}>رقم الشحنة</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'right' }}>الجهة المولدة</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'right' }}>موقع الاستلام</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'center' }}>النوع</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'center' }}>الكمية</th>
              <th style={{ border: '1px solid #1d4ed8', padding: '4px', textAlign: 'center' }}>تاريخ الاستلام</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment, index) => (
              <tr key={shipment.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', fontFamily: 'monospace', fontSize: '7pt' }}>
                  {shipment.shipment_number}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px' }}>
                  {shipment.generator?.name || '-'}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shipment.pickup_address || '-'}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                  {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                  {shipment.quantity} {shipment.unit || 'كجم'}
                </td>
                <td style={{ border: '1px solid #d1d5db', padding: '4px', textAlign: 'center' }}>
                  {shipment.delivered_at 
                    ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy', { locale: ar })
                    : format(new Date(), 'dd/MM/yyyy', { locale: ar })
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Declaration */}
      <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd' }}>
        <h3 className="font-bold mb-2" style={{ fontSize: '10pt', color: '#1e40af' }}>
          ✓ إقرار استلام ونقل
        </h3>
        <p style={{ fontSize: '8pt', color: '#1e40af', lineHeight: '1.6' }}>
          نقر نحن <strong>{transporterOrg?.name || 'جهة النقل'}</strong> بأنه قد تم استلام جميع الشحنات المذكورة أعلاه 
          (عددها {shipments.length} شحنة بإجمالي وزن {totalQuantity.toLocaleString()} كجم) بكامل محتوياتها وبحالة سليمة، 
          وسيتم نقلها وفقاً للمعايير والمتطلبات البيئية والقانونية المنظمة لنشاط نقل المخلفات، 
          وذلك طبقاً للأنظمة واللوائح المعمول بها.
        </p>
      </div>

      {/* Signature Section */}
      <div className="pt-3 mt-3" style={{ borderTop: '1px solid #d1d5db' }}>
        <div className="flex justify-start" style={{ direction: 'ltr' }}>
          <div className="text-center" style={{ width: '50%' }}>
            <p className="font-bold mb-2" style={{ color: '#1f2937', fontSize: '9pt' }}>التوقيع والختم</p>
            <p style={{ fontSize: '8pt', color: '#6b7280', marginBottom: '8px' }}>{transporterOrg?.name}</p>
            
            <div className="flex items-center justify-center gap-4">
              {includeStamp && transporterOrg?.stamp_url && (
                <div className="text-center">
                  <img 
                    src={transporterOrg.stamp_url} 
                    alt="ختم جهة النقل" 
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      objectFit: 'contain',
                      opacity: 0.9
                    }}
                    crossOrigin="anonymous"
                  />
                  <p style={{ fontSize: '6pt', color: '#9ca3af' }}>الختم</p>
                </div>
              )}
              
              {includeSignature && transporterOrg?.signature_url && (
                <div className="text-center">
                  <img 
                    src={transporterOrg.signature_url} 
                    alt="توقيع جهة النقل" 
                    style={{ 
                      width: '80px', 
                      height: '40px', 
                      objectFit: 'contain' 
                    }}
                    crossOrigin="anonymous"
                  />
                  <p style={{ fontSize: '6pt', color: '#9ca3af' }}>التوقيع</p>
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '8px' }}>
              تاريخ الإصدار: {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 text-center" style={{ borderTop: '1px dashed #d1d5db', fontSize: '7pt', color: '#9ca3af' }}>
        <p>هذه الشهادة صادرة إلكترونياً من نظام إدارة المخلفات ونقلها</p>
        <p>يمكن التحقق من صحة هذه الشهادة عبر مسح رمز QR أو الباركود</p>
      </div>
    </div>
  );
};

export default AggregateReceiptsPrint;
