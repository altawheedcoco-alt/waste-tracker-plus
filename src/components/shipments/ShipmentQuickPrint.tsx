import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, Loader2, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

import Barcode from 'react-barcode';
import { supabase } from '@/integrations/supabase/client';
import { usePDFExport } from '@/hooks/usePDFExport';
import PrintThemeSelector from './PrintThemeSelector';
import { getThemeById } from './printThemes';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
import { generateRoleTagline } from '@/lib/roleTaglineEngine';
import ShipmentTaglineFooter from './ShipmentTaglineFooter';

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

// wasteTypeLabels imported from '@/lib/shipmentStatusConfig'

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'جاري التجميع',
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
  const [themeId, setThemeId] = useState('eco-green');
  const theme = getThemeById(themeId);
  const { printContent: printContentFn, printWithTheme, exportToPDF, isExporting } = usePDFExport({
    filename: `tracking-form-${shipmentId}`,
    orientation: 'portrait',
    format: 'a4',
    fitSinglePage: true,
  });

  useEffect(() => {
    if (isOpen && shipmentId) {
      fetchShipmentDetails();
    }
  }, [isOpen, shipmentId]);

  const fetchShipmentDetails = async () => {
    setLoading(true);
    try {
      // Determine if shipmentId is UUID or shipment_number
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shipmentId);
      const filterColumn = isUUID ? 'id' : 'shipment_number';
      
      // First fetch shipment to get UUID for logs query
      const shipmentResult = await supabase
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
        .eq(filterColumn, shipmentId)
        .maybeSingle();

      if (shipmentResult.error) throw shipmentResult.error;
      if (!shipmentResult.data) {
        console.error('Shipment not found');
        setShipment(null);
        setLoading(false);
        return;
      }

      // Fetch logs using the actual UUID
      const logsResult = await supabase
        .from('shipment_logs')
        .select(`
          id,
          status,
          notes,
          created_at,
          changed_by:profiles(full_name)
        `)
        .eq('shipment_id', shipmentResult.data.id)
        .order('created_at', { ascending: true });

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

  const pdfFileName = shipment ? [
    shipment.transporter?.name || 'الناقل',
    `شحنة-${shipment.shipment_number}`,
    shipment.generator?.name || 'المولد',
    wasteTypeLabels[shipment.waste_type] || shipment.waste_type,
  ].join('-') : 'tracking-form';

  const handleDownloadPDF = () => {
    if (printRef.current) {
      exportToPDF(printRef.current, pdfFileName);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      printWithTheme(printRef.current, themeId as any);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ar });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy hh:mm a', { locale: ar });
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
          <DialogTitle className="flex items-center gap-2 justify-between">
            <PrintThemeSelector selectedThemeId={themeId} onSelect={setThemeId} />
            <div className="flex items-center gap-2">
              <span>طباعة نموذج تتبع الشحنة</span>
              <Printer className="w-5 h-5" />
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Hidden QR Code and Barcode for data URL generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <QRCodeCanvas ref={qrRef} value={shipmentUrl} size={100} level="H" includeMargin={true} />
          <div ref={barcodeRef}>
            <Barcode value={shipment.shipment_number} format="CODE128" width={1.8} height={45} displayValue={false} background="#ffffff" lineColor="#000000" />
          </div>
        </div>

        {/* Print Preview */}
        <div ref={(el) => { printRef.current = el; pdfRef.current = el; }} className="print-transparent-tables bg-white p-3 rounded-lg border" style={{ direction: 'rtl', fontSize: '5.5pt', color: '#000000', fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif", lineHeight: '1.2' }}>
          <style>{`
            .print-transparent-tables table,
            .print-transparent-tables tr,
            .print-transparent-tables th,
            .print-transparent-tables td,
            .print-transparent-tables thead,
            .print-transparent-tables tbody {
              background-color: transparent !important;
              background: transparent !important;
            }
            .print-transparent-tables table {
              margin-bottom: 0 !important;
            }
          `}</style>
          <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '287mm', boxSizing: 'border-box', paddingBottom: '4px' }}>
            {/* Header Table - Barcode left, QR right */}
            <table style={{ marginBottom: '0px', border: 'none' }}>
              <tbody>
                <tr>
                  <td style={{ width: '20%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '4px' }}>
                    {barcodeDataUrl && <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '45px', width: '100%' }} />}
                    <div style={{ fontSize: '7pt', color: '#000000', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '2px' }}>{shipment.shipment_number}</div>
                  </td>
                  <td style={{ width: '60%', textAlign: 'center', border: 'none', padding: '4px' }}>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: theme.colors.primary, marginBottom: '1px' }}>نموذج تتبع نقل المخلفات</div>
                    <div style={{ fontSize: '7.5pt', color: '#6b7280', marginBottom: '2px' }}>Waste Transport Tracking Form</div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: theme.colors.statusBg, color: theme.colors.statusText, padding: '2px 8px', borderRadius: theme.borderRadius, fontSize: '6.5pt', fontWeight: '600', border: `1px solid ${theme.colors.statusBorder}` }}>
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                      <span style={{ background: '#f3f4f6', color: '#000000', padding: '2px 8px', borderRadius: theme.borderRadius, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '7.5pt', border: '1px solid #d1d5db' }}>
                        {shipment.shipment_number}
                      </span>
                    </div>
                  </td>
                  <td style={{ width: '15%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '55px', height: '55px' }} />}
                    <div style={{ fontSize: '5pt', color: '#374151', fontWeight: '600', marginTop: '1px' }}>امسح للتتبع</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Shipment Details Table - Olive/Yellow Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.shipmentBg, color: theme.colors.shipmentText, fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>بيانات الشحنة</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '10%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>نوع المخلفات</td>
                  <td style={{ width: '15%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '8%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>الكمية</td>
                  <td style={{ width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>مستوى الخطورة</td>
                  <td style={{ width: '8%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.hazard_level || 'low'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>تاريخ الاستلام</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{formatDate(shipment.pickup_date)}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>طريقة التعبئة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.packaging_method || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>طريقة التخلص</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.disposal_method || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>وصف المخلفات</td>
                  <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.waste_description || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>موقع الاستلام</td>
                  <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.pickup_address}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>موقع التسليم</td>
                  <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>

            {/* Generator Section - Blue Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: '#dbeafe', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: '1px solid #93c5fd' }}>
                    بيانات الجهة المولدة: {shipment.generator?.name || '-'}
                    {shipment.generator?.client_code && <span style={{ marginRight: '8px', background: '#bfdbfe', color: '#000000', padding: '1px 4px', borderRadius: '3px', fontSize: '5.5pt' }}>{shipment.generator.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.commercial_register || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.tax_card || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.environmental_approval_number || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.wmra_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>تسجيل المنشأة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.establishment_registration || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>النشاط المسجل</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.registered_activity || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.address || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.phone || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td colSpan={5} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.email || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Transporter Section - Yellow/Orange Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: '#fef3c7', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: '1px solid #fde68a' }}>
                    بيانات الجهة الناقلة: {shipment.transporter?.name || '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.commercial_register || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.tax_card || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.environmental_approval_number || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رخصة النقل البري</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.land_transport_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.wmra_license || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>تسجيل المنشأة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.establishment_registration || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>النشاط المسجل</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.registered_activity || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.address || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.phone || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.email || '-'}</td>
                  <td colSpan={2} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}></td>
                </tr>
                <tr>
                  <td style={{ background: '#fef3c7', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>السائق</td>
                  <td style={{ background: '#fefce8', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{driverName}</td>
                  <td style={{ background: '#fef3c7', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>لوحة المركبة</td>
                  <td style={{ background: '#fefce8', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{vehiclePlate}</td>
                  <td colSpan={4} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}></td>
                </tr>
              </tbody>
            </table>

            {/* Recycler Section - Green Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: '#dcfce7', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: '1px solid #86efac' }}>
                    بيانات جهة التدوير: {shipment.recycler?.name || '-'}
                    {shipment.recycler?.client_code && <span style={{ marginRight: '8px', background: '#bbf7d0', color: '#000000', padding: '1px 4px', borderRadius: '3px', fontSize: '5.5pt' }}>{shipment.recycler.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.commercial_register || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.tax_card || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.environmental_approval_number || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رخصة التنمية الصناعية</td>
                  <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.ida_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>السجل الصناعي</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.industrial_registry || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رقم الترخيص</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.license_number || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.wmra_license || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>تسجيل المنشأة</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.establishment_registration || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>النشاط المسجل</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.registered_activity || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.address || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.phone || '-'}</td>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.email || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td colSpan={7} style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Legal Declarations Section */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ background: '#e2e8f0', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: '1px solid #cbd5e1' }}>الإقرارات القانونية والبيئية</td>
                </tr>
                <tr>
                  <td style={{ background: '#eff6ff', fontWeight: '600', width: '15%', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt', verticalAlign: 'top', color: '#000' }}>إقرار المولّد</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '5.5pt', lineHeight: '1.4', color: '#000' }}>يُقر المولّد بأن المخلفات المذكورة ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات، وأنه ملتزم بيئياً وفقاً للقانون رقم 202 لسنة 2020 والقانون رقم 4 لسنة 1994 ولوائحهما التنفيذية.</td>
                </tr>
                <tr>
                  <td style={{ background: '#fffbeb', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt', verticalAlign: 'top', color: '#000' }}>إقرار الناقل</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '5.5pt', lineHeight: '1.4', color: '#000' }}>يُقر الناقل بتطبيق جميع المعايير القانونية والبيئية والتزامه بكافة اشتراطات وزارة البيئة وجهاز تنظيم إدارة المخلفات (WMRA)، ويتحمل كامل المسؤولية عن سلامة المخلفات خلال النقل.</td>
                </tr>
                <tr>
                  <td style={{ background: '#f0fdf4', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt', verticalAlign: 'top', color: '#000' }}>إقرار المستقبل</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '5.5pt', lineHeight: '1.4', color: '#000' }}>يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية في عمليات إعادة التدوير وفقاً لترخيصه ومعايير WMRA.</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef2f2', fontWeight: '600', border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '6pt', verticalAlign: 'top', color: '#991b1b' }}>إخلاء مسؤولية</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '2px 4px', fontSize: '5.5pt', lineHeight: '1.4', color: '#000' }}>منصة iRecycle أداة رقمية للتوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات أو العمليات. المسؤولية الكاملة على الأطراف الموقّعة.</td>
                </tr>
              </tbody>
            </table>

            {/* Stamps and Signatures Table - flex-grow to fill remaining space */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0', flexGrow: 1 }}>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ background: '#e2e8f0', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: '1px solid #cbd5e1' }}>التوقيعات والأختام</td>
                </tr>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #d1d5db', background: '#eff6ff' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#000', marginBottom: '2px' }}>المولّد</div>
                    <div style={{ fontSize: '6pt', color: '#000' }}>{shipment.generator?.representative_name || shipment.generator?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #d1d5db', background: '#fffbeb' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#000', marginBottom: '2px' }}>الناقل</div>
                    <div style={{ fontSize: '6pt', color: '#000' }}>{shipment.transporter?.representative_name || shipment.transporter?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #d1d5db', background: '#f0fdf4' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#000', marginBottom: '2px' }}>المستقبل</div>
                    <div style={{ fontSize: '6pt', color: '#000' }}>{shipment.recycler?.representative_name || shipment.recycler?.name || '-'}</div>
                  </td>
                </tr>
                <tr>
                  {[
                    { org: shipment.generator, label: 'المولدة' },
                    { org: shipment.transporter, label: 'الناقلة' },
                    { org: shipment.recycler, label: 'المدورة' },
                  ].map((item, idx) => (
                    <td key={idx} style={{ width: '33.33%', textAlign: 'center', padding: '6px', verticalAlign: 'top', border: '1px solid #d1d5db', minHeight: '70px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'flex-end', minHeight: '35px' }}>
                        {item.org?.stamp_url && <img src={item.org.stamp_url} alt="ختم" style={{ maxHeight: '35px', maxWidth: '35px', objectFit: 'contain' }} />}
                        {item.org?.signature_url && <img src={item.org.signature_url} alt="توقيع" style={{ maxHeight: '30px', maxWidth: '55px', objectFit: 'contain' }} />}
                      </div>
                      <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '4px', paddingTop: '2px', fontSize: '5pt', color: '#000' }}>الاسم / التوقيع / الختم</div>
                      <div style={{ marginTop: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px' }}>
                        <QRCodeSVG 
                          value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(item.org?.commercial_register || item.org?.name || '')}&doc=${encodeURIComponent(shipment.shipment_number)}`} 
                          size={38} 
                          level="M" 
                        />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#000' }}>{item.org?.commercial_register || '-'}</div>
                          <div style={{ fontSize: '4.5pt', color: '#666' }}>QR الموقع</div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Role-based tagline */}
            <ShipmentTaglineFooter shipmentNumber={shipment.shipment_number} disposalMethod={shipment.disposal_method} />

            {/* Footer - always at the very bottom */}
            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '5.5pt', color: '#000', paddingTop: '3px', paddingBottom: '2px', borderTop: '1px solid #e5e7eb', background: 'rgba(241,245,249,0.5)', borderRadius: '0 0 3px 3px' }}>
              <div style={{ fontWeight: '600' }}>تم إنشاء هذا النموذج بواسطة نظام إدارة المخلفات الذكي طبقاً للبيانات المدخلة والواردة إلينا على النظام، دون أدنى مسؤولية على النظام</div>
              <div style={{ marginTop: '1px', fontFamily: 'monospace', fontSize: '5pt' }}>
                رقم التتبع: {shipment.shipment_number} | الرقم التسلسلي: {`DOC-${shipment.shipment_number.replace('SHP-', '')}`} | {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
              </div>
            </div>
          </div>
          
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            تنزيل PDF
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
