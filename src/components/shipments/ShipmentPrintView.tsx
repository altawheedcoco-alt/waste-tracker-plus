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

  const shipmentUrl = shipment ? `${window.location.origin}/verify?type=shipment&code=${shipment.shipment_number}` : '';

  useEffect(() => {
    if (qrRef.current && shipment) {
      const dataUrl = qrRef.current.toDataURL('image/png');
      setQrDataUrl(dataUrl);
    }
  }, [shipment?.id]);

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
          @page { size: A4; margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 9pt;
            direction: rtl;
            background: white;
            color: #000;
            line-height: 1.3;
          }
          .page { width: 100%; max-width: 210mm; margin: 0 auto; }
          
          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .main-title {
            font-size: 14pt;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 2px;
          }
          .sub-title { font-size: 10pt; color: #333; }
          .shipment-badge {
            display: inline-block;
            background: #16a34a;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 10pt;
            font-weight: bold;
            margin-top: 4px;
          }
          .status-badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8pt;
            font-weight: 600;
            margin-top: 4px;
          }
          .qr-box, .barcode-box {
            text-align: center;
          }
          .qr-box img { width: 55px; height: 55px; }
          .barcode-box img { max-height: 30px; }
          .code-label { font-size: 6pt; color: #666; margin-top: 2px; }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th, td {
            border: 1px solid #999;
            padding: 4px 6px;
            text-align: right;
            font-size: 8pt;
            vertical-align: top;
          }
          .section-title {
            background: #f5f5f5;
            font-weight: bold;
            font-size: 9pt;
            text-align: center;
            padding: 5px;
          }
          .label { background: #f9f9f9; font-weight: 600; width: 18%; color: #333; }
          .value { background: white; }
          .highlight { font-weight: bold; color: #16a34a; }
          
          /* Colored labels for parties */
          .label-generator { background: #dbeafe; color: #1e40af; }
          .label-transporter { background: #fef3c7; color: #92400e; }
          .label-recycler { background: #dcfce7; color: #166534; }
          
          /* Timeline */
          .timeline-header { background: #f3f4f6; font-weight: 600; font-size: 7pt; text-align: center; }
          .timeline-value { font-family: monospace; font-size: 7pt; text-align: center; }
          
          /* Signatures */
          .signature-row td {
            text-align: center;
            height: 50px;
            border: none;
            border-top: 1px dashed #999;
            padding-top: 35px;
            font-size: 8pt;
            color: #666;
          }
          
          /* Footer */
          .footer {
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 7pt;
            color: #555;
          }
          .disclaimer {
            font-size: 6pt;
            color: #888;
            font-style: italic;
            margin-top: 4px;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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

        <div 
          ref={printRef}
          className="bg-white p-4 rounded-lg border text-foreground text-sm"
          style={{ direction: 'rtl' }}
        >
          <div className="page">
            {/* Hidden QR & Barcode for data URL */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <QRCodeCanvas ref={qrRef} value={shipmentUrl} size={55} level="M" includeMargin={false} />
            </div>
            <div ref={barcodeRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <Barcode value={shipment.shipment_number} format="CODE128" width={1.2} height={30} displayValue={false} background="#ffffff" lineColor="#000000" />
            </div>

            {/* Header */}
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #16a34a', paddingBottom: '8px', marginBottom: '10px' }}>
              {/* QR Code */}
              <div className="qr-box" style={{ textAlign: 'center' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" style={{ width: '55px', height: '55px' }} />
                ) : (
                  <div style={{ width: '55px', height: '55px', border: '1px dashed #ccc', fontSize: '6pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>QR</div>
                )}
                <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>امسح للتتبع</div>
              </div>

              {/* Center Title */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#16a34a' }}>نموذج تتبع المخلفات</div>
                <div style={{ fontSize: '10pt', color: '#333', marginBottom: '4px' }}>آي ريسايكل - iRecycle</div>
                <div style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '3px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10pt', fontWeight: 'bold' }}>
                  {shipment.shipment_number}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '8pt', fontWeight: 600 }}>
                    {statusLabels[shipment.status] || shipment.status}
                  </span>
                </div>
              </div>

              {/* Barcode */}
              <div className="barcode-box" style={{ textAlign: 'center' }}>
                {barcodeDataUrl ? (
                  <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '30px' }} />
                ) : (
                  <div style={{ width: '80px', height: '30px', border: '1px dashed #ccc', fontSize: '6pt', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Barcode</div>
                )}
                <div style={{ fontSize: '7pt', fontFamily: 'monospace', marginTop: '2px' }}>{shipment.shipment_number}</div>
              </div>
            </div>

            {/* Generator Table */}
            <table>
              <thead>
                <tr><th colSpan={4} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>بيانات الجهة المولدة للمخلفات</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600, width: '18%' }}>اسم الجهة</td>
                  <td className="value" style={{ fontWeight: 'bold' }}>{shipment.generator?.name || '-'}</td>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600, width: '18%' }}>كود العميل</td>
                  <td className="value" style={{ fontFamily: 'monospace' }}>{shipment.generator?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>السجل التجاري</td>
                  <td className="value">{shipment.generator?.commercial_register || '-'}</td>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>رقم الموافقة البيئية</td>
                  <td className="value">{shipment.generator?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>النشاط</td>
                  <td className="value">{shipment.generator?.activity_type || '-'}</td>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>المدينة</td>
                  <td className="value">{shipment.generator?.city || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>العنوان</td>
                  <td colSpan={3} className="value">{shipment.generator?.address || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>الهاتف</td>
                  <td className="value" dir="ltr">{shipment.generator?.phone || '-'}</td>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>ممثل الجهة</td>
                  <td className="value">{shipment.generator?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Transporter Table */}
            <table>
              <thead>
                <tr><th colSpan={4} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>بيانات الجهة الناقلة</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, width: '18%' }}>اسم الجهة</td>
                  <td className="value" style={{ fontWeight: 'bold' }}>{shipment.transporter?.name || '-'}</td>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, width: '18%' }}>كود العميل</td>
                  <td className="value" style={{ fontFamily: 'monospace' }}>{shipment.transporter?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>السجل التجاري</td>
                  <td className="value">{shipment.transporter?.commercial_register || '-'}</td>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>رقم الموافقة البيئية</td>
                  <td className="value">{shipment.transporter?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>النشاط</td>
                  <td className="value">{shipment.transporter?.activity_type || '-'}</td>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>المدينة</td>
                  <td className="value">{shipment.transporter?.city || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>العنوان</td>
                  <td colSpan={3} className="value">{shipment.transporter?.address || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>الهاتف</td>
                  <td className="value" dir="ltr">{shipment.transporter?.phone || '-'}</td>
                  <td className="label label-transporter" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>ممثل الجهة</td>
                  <td className="value">{shipment.transporter?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Recycler Table */}
            <table>
              <thead>
                <tr><th colSpan={4} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>بيانات الجهة المستقبلة / المدورة</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600, width: '18%' }}>اسم الجهة</td>
                  <td className="value" style={{ fontWeight: 'bold' }}>{shipment.recycler?.name || '-'}</td>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600, width: '18%' }}>كود العميل</td>
                  <td className="value" style={{ fontFamily: 'monospace' }}>{shipment.recycler?.client_code || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>السجل التجاري</td>
                  <td className="value">{shipment.recycler?.commercial_register || '-'}</td>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>رقم الموافقة البيئية</td>
                  <td className="value">{shipment.recycler?.environmental_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>النشاط</td>
                  <td className="value">{shipment.recycler?.activity_type || '-'}</td>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>المدينة</td>
                  <td className="value">{shipment.recycler?.city || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>العنوان</td>
                  <td colSpan={3} className="value">{shipment.recycler?.address || '-'}</td>
                </tr>
                <tr>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>الهاتف</td>
                  <td className="value" dir="ltr">{shipment.recycler?.phone || '-'}</td>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>ممثل الجهة</td>
                  <td className="value">{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Shipment Details Table */}
            <table>
              <thead>
                <tr><th colSpan={6} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>تفاصيل الشحنة</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>نوع المخلفات</td>
                  <td className="value highlight" style={{ fontWeight: 'bold', color: '#16a34a' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>الكمية</td>
                  <td className="value highlight" style={{ fontWeight: 'bold', color: '#16a34a' }}>{shipment.quantity} {shipment.unit}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>مستوى الخطورة</td>
                  <td className="value">{hazardLabels[shipment.hazard_level || ''] || shipment.hazard_level || '-'}</td>
                </tr>
                <tr>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>طريقة التغليف</td>
                  <td className="value">{packagingLabels[shipment.packaging_method || ''] || shipment.packaging_method || '-'}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>طريقة المعالجة</td>
                  <td className="value">{disposalLabels[shipment.disposal_method || ''] || shipment.disposal_method || '-'}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>السائق</td>
                  <td className="value">{driverName}</td>
                </tr>
                <tr>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>لوحة المركبة</td>
                  <td className="value">{vehiclePlate}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>تاريخ الاستلام</td>
                  <td className="value">{formatDate(shipment.pickup_date)}</td>
                  <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>التسليم المتوقع</td>
                  <td className="value">{formatDate(shipment.expected_delivery_date)}</td>
                </tr>
                {shipment.waste_description && (
                  <tr>
                    <td className="label" style={{ background: '#f9f9f9', fontWeight: 600 }}>وصف المخلفات</td>
                    <td colSpan={5} className="value">{shipment.waste_description}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Addresses Table */}
            <table>
              <thead>
                <tr><th colSpan={4} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>العناوين</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="label label-generator" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 600, width: '15%' }}>عنوان الاستلام</td>
                  <td className="value" style={{ width: '35%' }}>{shipment.pickup_address}</td>
                  <td className="label label-recycler" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600, width: '15%' }}>عنوان التسليم</td>
                  <td className="value" style={{ width: '35%' }}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>

            {/* Timeline Table */}
            <table>
              <thead>
                <tr><th colSpan={6} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>السجل الزمني</th></tr>
                <tr>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>الإنشاء</th>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>الاعتماد</th>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>بدء التجميع</th>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>في الطريق</th>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>التسليم</th>
                  <th className="timeline-header" style={{ background: '#f3f4f6', fontWeight: 600, fontSize: '7pt', textAlign: 'center' }}>التأكيد</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.created_at)}</td>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.approved_at)}</td>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.collection_started_at)}</td>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.in_transit_at)}</td>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.delivered_at)}</td>
                  <td className="timeline-value" style={{ fontFamily: 'monospace', fontSize: '7pt', textAlign: 'center' }}>{formatDateTime(shipment.confirmed_at)}</td>
                </tr>
              </tbody>
            </table>

            {/* Notes Table */}
            {(shipment.notes || shipment.generator_notes || shipment.recycler_notes) && (
              <table>
                <thead>
                  <tr><th colSpan={3} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>الملاحظات</th></tr>
                </thead>
                <tbody>
                  <tr>
                    {shipment.notes && (
                      <td className="value" style={{ verticalAlign: 'top' }}>
                        <strong>ملاحظات عامة:</strong><br />{shipment.notes}
                      </td>
                    )}
                    {shipment.generator_notes && (
                      <td className="value" style={{ verticalAlign: 'top' }}>
                        <strong>ملاحظات المولد:</strong><br />{shipment.generator_notes}
                      </td>
                    )}
                    {shipment.recycler_notes && (
                      <td className="value" style={{ verticalAlign: 'top' }}>
                        <strong>ملاحظات المستقبل:</strong><br />{shipment.recycler_notes}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            )}

            {/* Signatures */}
            <table style={{ marginTop: '12px' }}>
              <tbody>
                <tr className="signature-row">
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #999', paddingTop: '35px', fontSize: '8pt', color: '#666' }}>توقيع وختم الجهة المولدة</td>
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #999', paddingTop: '35px', fontSize: '8pt', color: '#666' }}>توقيع وختم الجهة الناقلة</td>
                  <td style={{ width: '33.33%', textAlign: 'center', height: '50px', border: 'none', borderTop: '1px dashed #999', paddingTop: '35px', fontSize: '8pt', color: '#666' }}>توقيع وختم الجهة المستقبلة</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="footer" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '7pt', color: '#555' }}>
              <div>تم إنشاء هذا المستند إلكترونياً بتاريخ {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })} • نظام إدارة المخلفات - آي ريسايكل</div>
              <div style={{ marginTop: '2px' }}>رقم التتبع: {shipment.shipment_number}</div>
              <div className="disclaimer" style={{ marginTop: '4px', fontSize: '6pt', color: '#888', fontStyle: 'italic' }}>
                إخلاء مسؤولية: هذا المستند تم إنشاؤه آلياً بناءً على البيانات المدخلة، والمنصة غير مسؤولة عن صحة المعلومات الواردة فيه.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
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
