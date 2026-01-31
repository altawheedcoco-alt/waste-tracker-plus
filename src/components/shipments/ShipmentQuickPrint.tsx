import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import { supabase } from '@/integrations/supabase/client';
import { usePDFExport } from '@/hooks/usePDFExport';

interface ShipmentQuickPrintProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
}

interface ShipmentLogEntry {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  changed_by: {
    full_name: string;
  } | null;
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
  generator: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    commercial_register?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
    environmental_license?: string | null;
    wmra_license?: string | null;
    establishment_registration?: string | null;
    registered_activity?: string | null;
  } | null;
  transporter: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    commercial_register?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
    wmra_license?: string | null;
    establishment_registration?: string | null;
    registered_activity?: string | null;
    land_transport_license?: string | null;
  } | null;
  recycler: { 
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
    client_code?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    commercial_register?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
    environmental_license?: string | null;
    wmra_license?: string | null;
    establishment_registration?: string | null;
    registered_activity?: string | null;
    ida_license?: string | null;
    industrial_registry?: string | null;
    license_number?: string | null;
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

const ShipmentQuickPrint = ({ isOpen, onClose, shipmentId }: ShipmentQuickPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [shipmentLogs, setShipmentLogs] = useState<ShipmentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  
  const { exportToPDF, isExporting } = usePDFExport({
    filename: `tracking-form-${shipmentId}`,
    orientation: 'portrait',
    format: 'a4',
    scale: 2,
  });

  useEffect(() => {
    if (isOpen && shipmentId) {
      fetchShipmentDetails();
    }
  }, [isOpen, shipmentId]);

  const fetchShipmentDetails = async () => {
    setLoading(true);
    try {
      // Fetch shipment and logs in parallel
      const [shipmentResult, logsResult] = await Promise.all([
        supabase
          .from('shipments')
          .select(`
            id,
            shipment_number,
            waste_type,
            quantity,
            unit,
            status,
            created_at,
            pickup_address,
            delivery_address,
            pickup_date,
            expected_delivery_date,
            notes,
            generator_notes,
            recycler_notes,
            waste_description,
            hazard_level,
            packaging_method,
            disposal_method,
            approved_at,
            collection_started_at,
            in_transit_at,
            delivered_at,
            confirmed_at,
            manual_driver_name,
            manual_vehicle_plate,
            generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, representative_name, client_code, stamp_url, signature_url, commercial_register, tax_card, environmental_approval_number, environmental_license, wmra_license, establishment_registration, registered_activity),
            recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, representative_name, client_code, stamp_url, signature_url, commercial_register, tax_card, environmental_approval_number, environmental_license, wmra_license, establishment_registration, registered_activity, ida_license, industrial_registry, license_number),
            transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, representative_name, client_code, stamp_url, signature_url, commercial_register, tax_card, environmental_approval_number, wmra_license, establishment_registration, registered_activity, land_transport_license),
            driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
          `)
          .eq('id', shipmentId)
          .single(),
        supabase
          .from('shipment_logs')
          .select(`
            id,
            status,
            notes,
            created_at,
            changed_by:profiles(full_name)
          `)
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true })
      ]);

      if (shipmentResult.error) throw shipmentResult.error;
      setShipment(shipmentResult.data as unknown as ShipmentData);
      
      if (!logsResult.error && logsResult.data) {
        setShipmentLogs(logsResult.data as unknown as ShipmentLogEntry[]);
      }
    } catch (error) {
      console.error('Error fetching shipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate QR and Barcode data URLs
  useEffect(() => {
    if (qrRef.current && shipment) {
      const dataUrl = qrRef.current.toDataURL('image/png');
      setQrDataUrl(dataUrl);
    }
  }, [shipment?.id, loading]);

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
  }, [shipment?.id, loading]);

  const shipmentUrl = shipment ? `${window.location.origin}/verify?type=shipment&code=${shipment.shipment_number}` : '';

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !shipment) return;
    await exportToPDF(pdfRef.current, `نموذج-تتبع-${shipment.shipment_number}`);
  };

  const handlePrint = () => {
    if (!printRef.current || !shipment) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>نموذج تتبع الشحنة - ${shipment.shipment_number}</title>
        <style>
          @page { size: A4; margin: 5mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 6pt; direction: rtl; background: white; color: #1a1a1a; line-height: 1.2; }
          .page { width: 100%; max-width: 210mm; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
          th, td { border: 1px solid #d1d5db; padding: 2px 3px; text-align: right; font-size: 6pt; }
          .section-header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; font-weight: bold; font-size: 7pt; text-align: center; padding: 2px; }
          .label-cell { background: #f9fafb; font-weight: 600; color: #4b5563; }
          .party-header-gen { background: #dbeafe; color: #1e40af; font-weight: bold; font-size: 7pt; text-align: center; }
          .party-header-trans { background: #fef3c7; color: #92400e; font-weight: bold; font-size: 7pt; text-align: center; }
          .party-header-rec { background: #dcfce7; color: #166534; font-weight: bold; font-size: 7pt; text-align: center; }
          .party-name-gen { background: #eff6ff; font-weight: bold; text-align: center; }
          .party-name-trans { background: #fefce8; font-weight: bold; text-align: center; }
          .party-name-rec { background: #f0fdf4; font-weight: bold; text-align: center; }
          .signature-cell { text-align: center; vertical-align: bottom; height: 35px; }
          .footer { text-align: center; font-size: 5pt; color: #9ca3af; margin-top: 3px; padding-top: 3px; border-top: 1px solid #e5e7eb; }
          @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ar });
  };

  if (loading || !shipment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir="rtl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="mr-3">جاري تحميل بيانات الشحنة...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        {/* Hidden QR Code and Barcode for data URL generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <QRCodeCanvas ref={qrRef} value={shipmentUrl} size={60} level="M" includeMargin={false} />
          <div ref={barcodeRef}>
            <Barcode value={shipment.shipment_number} format="CODE128" width={1.2} height={35} displayValue={false} background="#ffffff" lineColor="#000000" />
          </div>
        </div>

        {/* Print Preview */}
        <div ref={(el) => { printRef.current = el; pdfRef.current = el; }} className="bg-white p-2 rounded-lg border text-foreground" style={{ direction: 'rtl', fontSize: '6pt' }}>
          <div className="page">
            {/* Header Table */}
            <table style={{ marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '15%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '50px', height: '50px' }} />}
                    <div style={{ fontSize: '5pt', color: '#6b7280' }}>امسح للتتبع</div>
                  </td>
                  <td style={{ width: '70%', textAlign: 'center', border: 'none', padding: '2px' }}>
                    <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#16a34a' }}>نموذج تتبع نقل المخلفات</div>
                    <div style={{ fontSize: '7pt', color: '#666' }}>Waste Transport Tracking Form</div>
                    <div style={{ marginTop: '3px' }}>
                      <span style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '8pt' }}>
                        {shipment.shipment_number}
                      </span>
                      <span style={{ marginRight: '6px', padding: '1px 6px', borderRadius: '8px', fontSize: '6pt', fontWeight: '600', background: '#dcfce7', color: '#166534' }}>
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ width: '15%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                    {barcodeDataUrl && <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '25px' }} />}
                    <div style={{ fontSize: '5pt', color: '#6b7280' }}>{shipment.shipment_number}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Shipment Details Table */}
            <table>
              <tbody>
                <tr>
                  <td colSpan={8} className="section-header" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>بيانات الشحنة</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>نوع المخلفات</td>
                  <td style={{ width: '15%' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>الكمية</td>
                  <td style={{ width: '15%' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>مستوى الخطورة</td>
                  <td style={{ width: '10%' }}>{shipment.hazard_level || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>تاريخ الاستلام</td>
                  <td style={{ width: '20%' }}>{formatDate(shipment.pickup_date)}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>طريقة التعبئة</td>
                  <td>{shipment.packaging_method || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>طريقة التخلص</td>
                  <td>{shipment.disposal_method || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>وصف المخلفات</td>
                  <td colSpan={3}>{shipment.waste_description || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>موقع الاستلام</td>
                  <td colSpan={3}>{shipment.pickup_address}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>موقع التسليم</td>
                  <td colSpan={3}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>

            {/* All Three Parties in Single Compact Table */}
            <table>
              <tbody>
                {/* Generator Section */}
                <tr>
                  <td colSpan={8} className="party-header-gen" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>
                    بيانات الجهة المولدة: {shipment.generator?.name || '-'} {shipment.generator?.client_code && <span style={{ marginRight: '4px', background: '#e0f2fe', color: '#0369a1', padding: '0 4px', borderRadius: '3px', fontSize: '5pt' }}>{shipment.generator.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>السجل التجاري</td>
                  <td style={{ width: '15%' }}>{shipment.generator?.commercial_register || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>البطاقة الضريبية</td>
                  <td style={{ width: '15%' }}>{shipment.generator?.tax_card || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '15%' }}>{shipment.generator?.environmental_approval_number || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>رخصة إدارة المخلفات</td>
                  <td style={{ width: '15%' }}>{shipment.generator?.wmra_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>تسجيل المنشأة</td>
                  <td>{shipment.generator?.establishment_registration || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>النشاط المسجل</td>
                  <td>{shipment.generator?.registered_activity || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>العنوان</td>
                  <td>{shipment.generator?.address || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>ممثل الجهة</td>
                  <td>{shipment.generator?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>الهاتف</td>
                  <td>{shipment.generator?.phone || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>البريد</td>
                  <td colSpan={5}>{shipment.generator?.email || '-'}</td>
                </tr>

                {/* Transporter Section */}
                <tr>
                  <td colSpan={8} className="party-header-trans" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>
                    بيانات الجهة الناقلة: {shipment.transporter?.name || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>السجل التجاري</td>
                  <td>{shipment.transporter?.commercial_register || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>البطاقة الضريبية</td>
                  <td>{shipment.transporter?.tax_card || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رقم الموافقة البيئية</td>
                  <td>{shipment.transporter?.environmental_approval_number || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رخصة النقل البري</td>
                  <td>{shipment.transporter?.land_transport_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رخصة إدارة المخلفات</td>
                  <td>{shipment.transporter?.wmra_license || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>تسجيل المنشأة</td>
                  <td>{shipment.transporter?.establishment_registration || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>النشاط المسجل</td>
                  <td>{shipment.transporter?.registered_activity || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>ممثل الجهة</td>
                  <td>{shipment.transporter?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>العنوان</td>
                  <td>{shipment.transporter?.address || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>الهاتف</td>
                  <td>{shipment.transporter?.phone || '-'}</td>
                  <td className="label-cell" style={{ background: '#fef3c7', fontWeight: '600' }}>السائق</td>
                  <td style={{ background: '#fefce8' }}>{driverName}</td>
                  <td className="label-cell" style={{ background: '#fef3c7', fontWeight: '600' }}>لوحة المركبة</td>
                  <td style={{ background: '#fefce8' }}>{vehiclePlate}</td>
                </tr>

                {/* Recycler Section */}
                <tr>
                  <td colSpan={8} className="party-header-rec" style={{ background: '#dcfce7', color: '#166534', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>
                    بيانات جهة التدوير: {shipment.recycler?.name || '-'} {shipment.recycler?.client_code && <span style={{ marginRight: '4px', background: '#e0f2fe', color: '#0369a1', padding: '0 4px', borderRadius: '3px', fontSize: '5pt' }}>{shipment.recycler.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>السجل التجاري</td>
                  <td>{shipment.recycler?.commercial_register || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>البطاقة الضريبية</td>
                  <td>{shipment.recycler?.tax_card || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رقم الموافقة البيئية</td>
                  <td>{shipment.recycler?.environmental_approval_number || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رخصة التنمية الصناعية</td>
                  <td>{shipment.recycler?.ida_license || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>السجل الصناعي</td>
                  <td>{shipment.recycler?.industrial_registry || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رقم الترخيص</td>
                  <td>{shipment.recycler?.license_number || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>رخصة إدارة المخلفات</td>
                  <td>{shipment.recycler?.wmra_license || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>تسجيل المنشأة</td>
                  <td>{shipment.recycler?.establishment_registration || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>النشاط المسجل</td>
                  <td>{shipment.recycler?.registered_activity || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>العنوان</td>
                  <td>{shipment.recycler?.address || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>الهاتف</td>
                  <td>{shipment.recycler?.phone || '-'}</td>
                  <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600' }}>ممثل الجهة</td>
                  <td>{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>


            {/* Notes Table */}
            {(shipment.notes || shipment.generator_notes || shipment.recycler_notes) && (
              <table>
                <tbody>
                  <tr>
                    <td colSpan={6} className="section-header" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>الملاحظات</td>
                  </tr>
                  <tr>
                    {shipment.notes && (
                      <>
                        <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>ملاحظات عامة</td>
                        <td style={{ width: '23%' }}>{shipment.notes}</td>
                      </>
                    )}
                    {!shipment.notes && <><td style={{ width: '10%' }}></td><td style={{ width: '23%' }}></td></>}
                    {shipment.generator_notes && (
                      <>
                        <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>ملاحظات المولد</td>
                        <td style={{ width: '23%' }}>{shipment.generator_notes}</td>
                      </>
                    )}
                    {!shipment.generator_notes && <><td style={{ width: '10%' }}></td><td style={{ width: '23%' }}></td></>}
                    {shipment.recycler_notes && (
                      <>
                        <td className="label-cell" style={{ background: '#f9fafb', fontWeight: '600', width: '10%' }}>ملاحظات المدور</td>
                        <td style={{ width: '24%' }}>{shipment.recycler_notes}</td>
                      </>
                    )}
                    {!shipment.recycler_notes && <><td style={{ width: '10%' }}></td><td style={{ width: '24%' }}></td></>}
                  </tr>
                </tbody>
              </table>
            )}

            {/* Stamps and Signatures Table */}
            <table>
              <tbody>
                <tr>
                  <td colSpan={3} className="section-header" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px' }}>الأختام والتوقيعات</td>
                </tr>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '600', color: '#1e40af', marginBottom: '3px' }}>الجهة المولدة</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', minHeight: '35px' }}>
                      {shipment.generator?.stamp_url && <img src={shipment.generator.stamp_url} alt="ختم" style={{ maxHeight: '30px', maxWidth: '30px', objectFit: 'contain' }} />}
                      {shipment.generator?.signature_url && <img src={shipment.generator.signature_url} alt="توقيع" style={{ maxHeight: '25px', maxWidth: '50px', objectFit: 'contain' }} />}
                    </div>
                    {!shipment.generator?.stamp_url && !shipment.generator?.signature_url && (
                      <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '20px', paddingTop: '2px', fontSize: '5pt', color: '#9ca3af' }}>التوقيع والختم</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '600', color: '#92400e', marginBottom: '3px' }}>الجهة الناقلة</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', minHeight: '35px' }}>
                      {shipment.transporter?.stamp_url && <img src={shipment.transporter.stamp_url} alt="ختم" style={{ maxHeight: '30px', maxWidth: '30px', objectFit: 'contain' }} />}
                      {shipment.transporter?.signature_url && <img src={shipment.transporter.signature_url} alt="توقيع" style={{ maxHeight: '25px', maxWidth: '50px', objectFit: 'contain' }} />}
                    </div>
                    {!shipment.transporter?.stamp_url && !shipment.transporter?.signature_url && (
                      <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '20px', paddingTop: '2px', fontSize: '5pt', color: '#9ca3af' }}>التوقيع والختم</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '600', color: '#166534', marginBottom: '3px' }}>جهة التدوير</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', minHeight: '35px' }}>
                      {shipment.recycler?.stamp_url && <img src={shipment.recycler.stamp_url} alt="ختم" style={{ maxHeight: '30px', maxWidth: '30px', objectFit: 'contain' }} />}
                      {shipment.recycler?.signature_url && <img src={shipment.recycler.signature_url} alt="توقيع" style={{ maxHeight: '25px', maxWidth: '50px', objectFit: 'contain' }} />}
                    </div>
                    {!shipment.recycler?.stamp_url && !shipment.recycler?.signature_url && (
                      <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '20px', paddingTop: '2px', fontSize: '5pt', color: '#9ca3af' }}>التوقيع والختم</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="footer" style={{ marginTop: '3px', paddingTop: '3px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '5pt', color: '#9ca3af' }}>
              تم إنشاء هذا النموذج بواسطة نظام إدارة المخلفات طبقاً للبيانات المدخلة والواردة إلينا على النظام، دون أدنى مسؤولية على النظام | {format(new Date(), 'PPP', { locale: ar })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF} 
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            تحميل PDF
          </Button>
          <Button variant="eco" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentQuickPrint;
