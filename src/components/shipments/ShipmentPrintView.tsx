import { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Printer, Download, Stamp } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrganizationData {
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
  stamp_url?: string | null;
  signature_url?: string | null;
}

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
  generator: OrganizationData | null;
  transporter: OrganizationData | null;
  recycler: OrganizationData | null;
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
  const [showStampsSignatures, setShowStampsSignatures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const shipmentUrl = shipment ? `${window.location.origin}/verify?type=shipment&code=${shipment.shipment_number}` : '';

  // Check if any stamps or signatures exist
  const hasStampsOrSignatures = shipment && (
    shipment.generator?.stamp_url || shipment.generator?.signature_url ||
    shipment.transporter?.stamp_url || shipment.transporter?.signature_url ||
    shipment.recycler?.stamp_url || shipment.recycler?.signature_url
  );

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

  const getPrintStyles = () => `
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
    .qr-box, .barcode-box { text-align: center; }
    .qr-box img { width: 55px; height: 55px; }
    .barcode-box img { max-height: 30px; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #999; padding: 4px 6px; text-align: right; font-size: 8pt; vertical-align: top; }
    .section-title { background: #f5f5f5; font-weight: bold; font-size: 9pt; text-align: center; padding: 5px; }
    .label { background: #f9f9f9; font-weight: 600; width: 18%; color: #333; }
    .value { background: white; }
    .highlight { font-weight: bold; color: #16a34a; }
    .label-generator { background: #dbeafe; color: #1e40af; }
    .label-transporter { background: #fef3c7; color: #92400e; }
    .label-recycler { background: #dcfce7; color: #166534; }
    .timeline-header { background: #f3f4f6; font-weight: 600; font-size: 7pt; text-align: center; }
    .timeline-value { font-family: monospace; font-size: 7pt; text-align: center; }
    
    /* Stamps & Signatures */
    .stamp-signature-section { margin-top: 10px; }
    .stamp-signature-table td { text-align: center; vertical-align: top; padding: 8px; border: 1px solid #ddd; }
    .stamp-signature-title { font-weight: bold; font-size: 8pt; margin-bottom: 6px; color: #333; }
    .stamp-img { max-width: 70px; max-height: 70px; object-fit: contain; margin: 4px auto; display: block; }
    .signature-img { max-width: 80px; max-height: 40px; object-fit: contain; margin: 4px auto; display: block; }
    .stamp-label { font-size: 6pt; color: #666; margin-top: 2px; }
    .empty-stamp { width: 60px; height: 60px; border: 1px dashed #ccc; border-radius: 50%; margin: 4px auto; display: flex; align-items: center; justify-content: center; font-size: 6pt; color: #999; }
    .empty-signature { width: 80px; height: 30px; border-bottom: 1px dashed #999; margin: 4px auto; }
    
    /* Footer */
    .footer { margin-top: 8px; padding-top: 6px; border-top: 1px solid #ccc; text-align: center; font-size: 7pt; color: #555; }
    .disclaimer { font-size: 6pt; color: #888; font-style: italic; margin-top: 4px; }
    
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  `;

  const getDocumentHTML = () => {
    const printContent = printRef.current;
    if (!printContent) return '';
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>نموذج تتبع الشحنة - ${shipment.shipment_number}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(getDocumentHTML());
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Open in new window for download
      const pdfWindow = window.open('', '_blank');
      if (!pdfWindow) {
        setIsExporting(false);
        return;
      }
      
      pdfWindow.document.write(getDocumentHTML());
      pdfWindow.document.close();
      
      // Add download instruction
      const downloadBtn = pdfWindow.document.createElement('div');
      downloadBtn.style.cssText = 'position:fixed;top:10px;left:10px;background:#16a34a;color:white;padding:10px 20px;border-radius:6px;cursor:pointer;font-family:Arial;font-size:14px;z-index:9999;';
      downloadBtn.innerHTML = '💾 اضغط Ctrl+P ثم اختر "حفظ كـ PDF"';
      pdfWindow.document.body.appendChild(downloadBtn);
      
      pdfWindow.focus();
    } finally {
      setIsExporting(false);
    }
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

            {/* Stamps and Signatures Section */}
            {showStampsSignatures && (
              <table className="stamp-signature-table" style={{ marginTop: '10px' }}>
                <thead>
                  <tr><th colSpan={3} className="section-title" style={{ background: '#f5f5f5', fontWeight: 'bold', fontSize: '9pt', textAlign: 'center', padding: '5px' }}>الأختام والتوقيعات</th></tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Generator Stamp & Signature */}
                    <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: '8px', border: '1px solid #ddd' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '6px', color: '#1e40af' }}>الجهة المولدة</div>
                      <div style={{ marginBottom: '8px' }}>
                        {shipment.generator?.stamp_url ? (
                          <img src={shipment.generator.stamp_url} alt="ختم" crossOrigin="anonymous" style={{ maxWidth: '70px', maxHeight: '70px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', border: '1px dashed #ccc', borderRadius: '50%', margin: '4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#999' }}>الختم</div>
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>الختم</div>
                      </div>
                      <div>
                        {shipment.generator?.signature_url ? (
                          <img src={shipment.generator.signature_url} alt="توقيع" crossOrigin="anonymous" style={{ maxWidth: '80px', maxHeight: '40px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '80px', height: '30px', borderBottom: '1px dashed #999', margin: '4px auto' }} />
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>التوقيع</div>
                      </div>
                    </td>

                    {/* Transporter Stamp & Signature */}
                    <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: '8px', border: '1px solid #ddd' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '6px', color: '#92400e' }}>الجهة الناقلة</div>
                      <div style={{ marginBottom: '8px' }}>
                        {shipment.transporter?.stamp_url ? (
                          <img src={shipment.transporter.stamp_url} alt="ختم" crossOrigin="anonymous" style={{ maxWidth: '70px', maxHeight: '70px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', border: '1px dashed #ccc', borderRadius: '50%', margin: '4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#999' }}>الختم</div>
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>الختم</div>
                      </div>
                      <div>
                        {shipment.transporter?.signature_url ? (
                          <img src={shipment.transporter.signature_url} alt="توقيع" crossOrigin="anonymous" style={{ maxWidth: '80px', maxHeight: '40px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '80px', height: '30px', borderBottom: '1px dashed #999', margin: '4px auto' }} />
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>التوقيع</div>
                      </div>
                    </td>

                    {/* Recycler Stamp & Signature */}
                    <td style={{ width: '33.33%', textAlign: 'center', verticalAlign: 'top', padding: '8px', border: '1px solid #ddd' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '6px', color: '#166534' }}>الجهة المستقبلة</div>
                      <div style={{ marginBottom: '8px' }}>
                        {shipment.recycler?.stamp_url ? (
                          <img src={shipment.recycler.stamp_url} alt="ختم" crossOrigin="anonymous" style={{ maxWidth: '70px', maxHeight: '70px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '60px', height: '60px', border: '1px dashed #ccc', borderRadius: '50%', margin: '4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6pt', color: '#999' }}>الختم</div>
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>الختم</div>
                      </div>
                      <div>
                        {shipment.recycler?.signature_url ? (
                          <img src={shipment.recycler.signature_url} alt="توقيع" crossOrigin="anonymous" style={{ maxWidth: '80px', maxHeight: '40px', objectFit: 'contain', margin: '4px auto', display: 'block' }} />
                        ) : (
                          <div style={{ width: '80px', height: '30px', borderBottom: '1px dashed #999', margin: '4px auto' }} />
                        )}
                        <div style={{ fontSize: '6pt', color: '#666', marginTop: '2px' }}>التوقيع</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

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

        <DialogFooter className="flex-col sm:flex-row gap-3">
          {/* Stamps Toggle Option */}
          <div className="flex items-center gap-2 mr-auto">
            <Switch
              id="show-stamps"
              checked={showStampsSignatures}
              onCheckedChange={setShowStampsSignatures}
            />
            <Label htmlFor="show-stamps" className="text-sm flex items-center gap-1">
              <Stamp className="w-4 h-4" />
              عرض الأختام والتوقيعات
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? 'جاري التحميل...' : 'تحميل PDF'}
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentPrintView;
