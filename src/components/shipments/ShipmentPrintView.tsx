import { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';

interface ShipmentData {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  created_at: string;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    activity_type?: string | null;
  } | null;
  transporter: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    activity_type?: string | null;
  } | null;
  recycler: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    commercial_register?: string | null;
    environmental_license?: string | null;
    activity_type?: string | null;
  } | null;
  driver: {
    license_number: string;
    vehicle_type: string | null;
    vehicle_plate: string | null;
    profile: {
      full_name: string;
      phone: string | null;
    };
  } | null;
}

interface ShipmentPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ShipmentData | null;
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
  construction: 'بناء',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'جاري التجميع',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مكتمل',
};

const hazardLabels: Record<string, string> = {
  hazardous: 'خطرة',
  non_hazardous: 'غير خطرة',
};

const packagingLabels: Record<string, string> = {
  packaged: 'معبأة',
  unpackaged: 'سائبة',
  containerized: 'في حاويات',
};

const disposalLabels: Record<string, string> = {
  recycling: 'إعادة تدوير',
  incineration: 'حرق',
  landfill: 'دفن',
  treatment: 'معالجة',
};

const ShipmentPrintView = ({ isOpen, onClose, shipment }: ShipmentPrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');

  // Generate shipment URL for QR code
  const shipmentUrl = shipment ? `${window.location.origin}/dashboard/shipments?highlight=${shipment.id}` : '';

  // Convert QR canvas to data URL for printing
  useEffect(() => {
    if (qrRef.current && shipment) {
      const dataUrl = qrRef.current.toDataURL('image/png');
      setQrDataUrl(dataUrl);
    }
  }, [shipment?.id]);

  // Convert Barcode SVG to data URL for printing
  useEffect(() => {
    if (barcodeRef.current && shipment) {
      const svgElement = barcodeRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setBarcodeDataUrl(canvas.toDataURL('image/png'));
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    }
  }, [shipment?.id]);

  if (!shipment) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>نموذج تتبع الشحنة - ${shipment.shipment_number}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 9pt;
            direction: rtl;
            background: white;
            color: #1a1a1a;
            line-height: 1.3;
          }
          .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            position: relative;
          }
          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #16a34a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .header-right {
            text-align: right;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .header-left {
            text-align: left;
          }
          .main-title {
            font-size: 16pt;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 2px;
          }
          .sub-title {
            font-size: 10pt;
            color: #666;
          }
          .shipment-number-box {
            background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 11pt;
            font-weight: bold;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
            margin-top: 4px;
          }
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            text-align: right;
            font-size: 8pt;
          }
          th {
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
            font-weight: 600;
            color: #374151;
          }
          .section-header {
            background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
            color: white;
            font-weight: bold;
            font-size: 9pt;
            text-align: center;
          }
          .label-cell {
            background: #f9fafb;
            font-weight: 600;
            color: #4b5563;
            width: 20%;
          }
          .value-cell {
            background: white;
          }
          .highlight-value {
            font-weight: bold;
            color: #16a34a;
          }
          /* Three column party table */
          .party-table td {
            width: 33.33%;
            vertical-align: top;
          }
          .party-header {
            font-weight: bold;
            font-size: 9pt;
            padding: 4px;
            text-align: center;
          }
          .party-generator { background: #dbeafe; color: #1e40af; }
          .party-transporter { background: #fef3c7; color: #92400e; }
          .party-recycler { background: #dcfce7; color: #166534; }
          .party-content {
            font-size: 8pt;
            padding: 6px;
          }
          .party-name {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 3px;
          }
          .party-detail {
            color: #6b7280;
            margin-bottom: 2px;
          }
          .client-code {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 7pt;
            font-family: monospace;
          }
          /* Timeline */
          .timeline-table td {
            text-align: center;
            font-size: 7pt;
          }
          .timeline-label {
            background: #f3f4f6;
            font-weight: 600;
          }
          .timeline-value {
            font-family: monospace;
            font-size: 7pt;
          }
          /* Signatures */
          .signature-table {
            margin-top: 12px;
          }
          .signature-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            height: 50px;
            border: none;
            border-top: 1px dashed #9ca3af;
          }
          .signature-label {
            font-size: 8pt;
            color: #6b7280;
            padding-top: 4px;
          }
          /* Footer */
          .footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 7pt;
            color: #9ca3af;
          }
          .qr-code {
            width: 60px;
            height: 60px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          .qr-label {
            font-size: 6pt;
            color: #6b7280;
            text-align: center;
            margin-top: 2px;
          }
          .barcode-container {
            text-align: center;
          }
          .barcode-img {
            max-height: 35px;
            width: auto;
          }
          .barcode-label {
            font-size: 6pt;
            color: #6b7280;
            text-align: center;
            margin-top: 2px;
          }
          .codes-section {
            display: flex;
            gap: 10px;
            align-items: flex-start;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ar });
  };

  const driverName = shipment.driver?.profile?.full_name || shipment.manual_driver_name || '-';
  const vehiclePlate = shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate || '-';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>طباعة نموذج تتبع الشحنة</span>
            <Printer className="w-5 h-5" />
          </DialogTitle>
        </DialogHeader>

        {/* Print Preview - A4 Optimized */}
        <div 
          ref={printRef}
          className="bg-white p-4 rounded-lg border text-foreground text-sm"
          style={{ direction: 'rtl' }}
        >
          <div className="page">
            {/* Hidden QR Code for data URL generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <QRCodeCanvas
                ref={qrRef}
                value={shipmentUrl}
                size={60}
                level="M"
                includeMargin={false}
              />
            </div>
            
            {/* Hidden Barcode for data URL generation */}
            <div ref={barcodeRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <Barcode
                value={shipment.shipment_number}
                format="CODE128"
                width={1.2}
                height={35}
                displayValue={false}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>

            {/* Header - iRecycle Branding */}
            <div style={{ marginBottom: '15px', borderBottom: '3px solid #16a34a', paddingBottom: '10px', position: 'relative' }}>
              {/* QR Code - Top Right */}
              <div style={{ position: 'absolute', top: '0', right: '0', textAlign: 'center' }}>
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code" 
                    style={{ width: '60px', height: '60px', border: '1px solid #e5e7eb', borderRadius: '4px' }} 
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#9ca3af', borderRadius: '4px' }}>
                    QR
                  </div>
                )}
                <div style={{ fontSize: '6pt', color: '#6b7280', marginTop: '2px' }}>امسح للتتبع</div>
              </div>

              {/* Center Content */}
              <div style={{ textAlign: 'center', paddingTop: '5px' }}>
                <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
                  آي ريسايكل - iRecycle
                </div>
                <div style={{ fontSize: '11pt', color: '#374151', marginBottom: '2px' }}>
                  نظام إدارة وتتبع المخلفات
                </div>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', color: '#1e40af' }}>
                  نموذج تتبع المخلفات
                </div>
              </div>

              {/* Barcode - Top Left with Shipment Info */}
              <div style={{ position: 'absolute', top: '0', left: '0', textAlign: 'center' }}>
                {barcodeDataUrl ? (
                  <img 
                    src={barcodeDataUrl} 
                    alt="Barcode" 
                    style={{ maxHeight: '35px', width: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '3px', background: 'white' }} 
                  />
                ) : (
                  <div style={{ width: '90px', height: '35px', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#9ca3af', borderRadius: '4px' }}>
                    Barcode
                  </div>
                )}
                <div style={{ 
                  fontSize: '9pt', 
                  color: '#000000', 
                  marginTop: '3px', 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {shipment.shipment_number}
                </div>
                <div style={{ fontSize: '6pt', color: '#374151', marginTop: '2px', fontWeight: '600' }}>
                  إصدارات موثقة ومؤمنة وذكية
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '10px', fontSize: '7pt', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>
                    {statusLabels[shipment.status] || shipment.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Generator Organization Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
              <tr>
                  <th colSpan={4} style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '10pt', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db' }}>
                    بيانات الجهة المولدة للمخلفات
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>اسم الجهة:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontWeight: 'bold' }}>{shipment.generator?.name || '-'}</td>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>كود العميل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontFamily: 'monospace' }}>{shipment.generator?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>السجل التجاري:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.commercial_register || '-'}</td>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>رقم الموافقة البيئية:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>النشاط المسجل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.activity_type || '-'}</td>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>المدينة:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.city || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>العنوان:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.address || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>الهاتف:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.generator?.phone || '-'}</td>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>البريد الإلكتروني:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.generator?.email || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>ممثل الجهة:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.generator?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Transporter Organization Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
              <tr>
                  <th colSpan={4} style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '10pt', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db' }}>
                    بيانات الجهة الناقلة
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>اسم جهة النقل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontWeight: 'bold' }}>{shipment.transporter?.name || '-'}</td>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>كود العميل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontFamily: 'monospace' }}>{shipment.transporter?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>السجل التجاري:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.commercial_register || '-'}</td>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>رقم الموافقة البيئية:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>النشاط المسجل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.activity_type || '-'}</td>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>المدينة:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.city || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>العنوان:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.address || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>الهاتف:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.transporter?.phone || '-'}</td>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>البريد الإلكتروني:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.transporter?.email || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: 600, color: '#92400e', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>ممثل الجهة:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.transporter?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Recycler Organization Details */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
              <tr>
                  <th colSpan={4} style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '10pt', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db' }}>
                    بيانات الجهة المدورة
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>اسم جهة التدوير:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontWeight: 'bold' }}>{shipment.recycler?.name || '-'}</td>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', width: '18%', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>كود العميل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt', fontFamily: 'monospace' }}>{shipment.recycler?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>السجل التجاري:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.commercial_register || '-'}</td>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>رقم الموافقة البيئية:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>النشاط المسجل:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.activity_type || '-'}</td>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>المدينة:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.city || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>العنوان:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.address || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>الهاتف:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.recycler?.phone || '-'}</td>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>البريد الإلكتروني:</td>
                  <td style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }} dir="ltr">{shipment.recycler?.email || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>ممثل الجهة:</td>
                  <td colSpan={3} style={{ background: 'white', border: '1px solid #d1d5db', padding: '5px 8px', fontSize: '8pt' }}>{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Shipment Info Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
              <tr>
                  <th colSpan={6} className="section-header" style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px', border: '1px solid #d1d5db' }}>
                    معلومات الشحنة الأساسية
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', width: '15%', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>نوع المخلفات</td>
                  <td className="value-cell highlight-value" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt', fontWeight: 'bold', color: '#16a34a' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', width: '15%', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>الكمية</td>
                  <td className="value-cell highlight-value" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt', fontWeight: 'bold', color: '#16a34a' }}>{shipment.quantity} {shipment.unit}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', width: '15%', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>مستوى الخطورة</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{hazardLabels[shipment.hazard_level || ''] || shipment.hazard_level || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>طريقة التغليف</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{packagingLabels[shipment.packaging_method || ''] || shipment.packaging_method || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>طريقة التخلص</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{disposalLabels[shipment.disposal_method || ''] || shipment.disposal_method || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>السائق</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{driverName}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>لوحة المركبة</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{vehiclePlate}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>تاريخ الاستلام</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{formatDate(shipment.pickup_date)}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>التسليم المتوقع</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{formatDate(shipment.expected_delivery_date)}</td>
                </tr>
                {shipment.waste_description && (
                  <tr>
                    <td className="label-cell" style={{ background: '#f9fafb', fontWeight: 600, color: '#4b5563', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>وصف المخلفات</td>
                    <td colSpan={5} className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>{shipment.waste_description}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Addresses Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
              <tr>
                  <th colSpan={4} className="section-header" style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px', border: '1px solid #d1d5db' }}>
                    عناوين الشحنة
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label-cell" style={{ background: '#dbeafe', fontWeight: 600, color: '#1e40af', width: '15%', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>عنوان الاستلام</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt', width: '35%' }}>{shipment.pickup_address}</td>
                  <td className="label-cell" style={{ background: '#dcfce7', fontWeight: 600, color: '#166534', width: '15%', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt' }}>عنوان التسليم</td>
                  <td className="value-cell" style={{ background: 'white', border: '1px solid #d1d5db', padding: '4px 6px', fontSize: '8pt', width: '35%' }}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>


            {/* Timeline Table */}
            <table className="timeline-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
              <thead>
              <tr>
                  <th colSpan={6} className="section-header" style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px', border: '1px solid #d1d5db' }}>
                    سجل الحالات الزمني
                  </th>
                </tr>
                <tr>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>تاريخ الإنشاء</th>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>تاريخ الاعتماد</th>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>بدء التجميع</th>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>في الطريق</th>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>تم التسليم</th>
                  <th style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db' }}>التأكيد</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.created_at)}</td>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.approved_at)}</td>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.collection_started_at)}</td>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.in_transit_at)}</td>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.delivered_at)}</td>
                  <td style={{ fontSize: '7pt', padding: '4px', textAlign: 'center', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{formatDateTime(shipment.confirmed_at)}</td>
                </tr>
              </tbody>
            </table>

            {/* Notes Table */}
            {(shipment.notes || shipment.generator_notes || shipment.recycler_notes) && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
                <thead>
                  <tr>
                    <th colSpan={3} className="section-header" style={{ background: '#f9fafb', color: '#000000', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px', border: '1px solid #d1d5db' }}>
                      الملاحظات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {shipment.notes && (
                      <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: '8pt', verticalAlign: 'top' }}>
                        <strong style={{ color: '#4b5563' }}>ملاحظات عامة:</strong><br />{shipment.notes}
                      </td>
                    )}
                    {shipment.generator_notes && (
                      <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: '8pt', verticalAlign: 'top' }}>
                        <strong style={{ color: '#4b5563' }}>ملاحظات المولد:</strong><br />{shipment.generator_notes}
                      </td>
                    )}
                    {shipment.recycler_notes && (
                      <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: '8pt', verticalAlign: 'top' }}>
                        <strong style={{ color: '#4b5563' }}>ملاحظات المدور:</strong><br />{shipment.recycler_notes}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            )}

            {/* Signatures Table */}
            <table className="signature-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #9ca3af', paddingTop: '4px' }}>
                    <div style={{ height: '40px' }}></div>
                    <div className="signature-label" style={{ fontSize: '8pt', color: '#6b7280' }}>توقيع وختم الجهة المولدة</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #9ca3af', paddingTop: '4px' }}>
                    <div style={{ height: '40px' }}></div>
                    <div className="signature-label" style={{ fontSize: '8pt', color: '#6b7280' }}>توقيع وختم الجهة الناقلة</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #9ca3af', paddingTop: '4px' }}>
                    <div style={{ height: '40px' }}></div>
                    <div className="signature-label" style={{ fontSize: '8pt', color: '#6b7280' }}>توقيع وختم الجهة المدورة</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="footer" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #d1d5db', textAlign: 'center', fontSize: '7pt', color: '#374151' }}>
              <div>تم إنشاء هذا المستند إلكترونياً طبقاً للبيانات المدخلة والواردة إلينا على النظام بتاريخ {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })} • نظام إدارة المخلفات الإلكتروني</div>
              <div style={{ marginTop: '2px' }}>هذا المستند صالح للاستخدام الرسمي ويحتوي على رقم تتبع فريد: {shipment.shipment_number}</div>
              <div style={{ marginTop: '4px', fontSize: '6pt', color: '#6b7280', fontStyle: 'italic' }}>
                إخلاء مسؤولية: هذا المستند تم إنشاؤه آلياً بناءً على البيانات المدخلة من قِبَل الأطراف المعنية، ودون أدنى مسؤولية على النظام. المنصة غير مسؤولة عن صحة أو دقة المعلومات الواردة فيه.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <Download className="w-4 h-4" />
            تصدير PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentPrintView;
