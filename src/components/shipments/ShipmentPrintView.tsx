import { useRef, useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, PenTool } from 'lucide-react';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import SignatureBadges from '@/components/signatures/SignatureBadges';
import { saveDocumentSignature, getDocumentSignatures } from '@/components/signatures/signatureService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

import Barcode from 'react-barcode';
import { usePDFExport } from '@/hooks/usePDFExport';
import PrintThemeSelector from './PrintThemeSelector';
import { getThemeById } from './printThemes';
import { generateRoleTagline } from '@/lib/roleTaglineEngine';
import ShipmentTaglineFooter from './ShipmentTaglineFooter';
import { generateShipmentQRData } from '@/lib/shipmentQRData';
import { resolveShipmentOrgUrls } from '@/utils/resolveOrgStorageUrls';

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
    stamp_url?: string | null;
    signature_url?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
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
    commercial_register?: string | null;
    environmental_license?: string | null;
    activity_type?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
    wmra_license?: string | null;
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
    commercial_register?: string | null;
    environmental_license?: string | null;
    activity_type?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    tax_card?: string | null;
    environmental_approval_number?: string | null;
    wmra_license?: string | null;
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
  delivered: 'تم التسليم',
  confirmed: 'مكتمل',
};

const ShipmentPrintView = ({ isOpen, onClose, shipment: rawShipment }: ShipmentPrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [themeId, setThemeId] = useState('eco-green');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [signingLoading, setSigningLoading] = useState(false);
  const [shipment, setShipment] = useState(rawShipment);
  const theme = getThemeById(themeId);

  // Resolve private storage URLs for stamps and signatures
  useEffect(() => {
    if (!rawShipment) { setShipment(null); return; }
    let cancelled = false;
    resolveShipmentOrgUrls(rawShipment).then(resolved => {
      if (!cancelled) setShipment(resolved);
    });
    return () => { cancelled = true; };
  }, [rawShipment]);
  
  const { printContent: printContentFn, printWithTheme, exportToPDF, isExporting } = usePDFExport({
    filename: `tracking-form-${shipment?.shipment_number || 'document'}`,
    orientation: 'portrait',
    format: 'a4',
    fitSinglePage: true,
  });

  const qrData = useMemo(() => shipment ? generateShipmentQRData(shipment) : null, [shipment]);
  const shipmentUrl = qrData?.url || '';

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

  // Load movement supervisors
  const [movementSupervisors, setMovementSupervisors] = useState<any[]>([]);
  useEffect(() => {
    if (shipment?.id && isOpen) {
      supabase
        .from('shipment_movement_supervisors')
        .select('*')
        .eq('shipment_id', shipment.id)
        .then(({ data }) => setMovementSupervisors(data || []));
    }
  }, [shipment?.id, isOpen]);

  // Load existing signatures
  useEffect(() => {
    if (shipment?.id && isOpen) {
      getDocumentSignatures('shipment', shipment.id).then(setSignatures);
    }
  }, [shipment?.id, isOpen]);

  const handleSignDocument = async (signatureData: any) => {
    if (!shipment) return;
    setSigningLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) return;

      const result = await saveDocumentSignature({
        signatureData,
        documentType: 'shipment',
        documentId: shipment.id,
        organizationId: profile.organization_id,
        userId: user.id,
      });

      if (result.success) {
        setSignDialogOpen(false);
        getDocumentSignatures('shipment', shipment.id).then(setSignatures);
      }
    } finally {
      setSigningLoading(false);
    }
  };

  if (!shipment) return null;

  const handlePrint = () => {
    if (printRef.current) {
      printWithTheme(printRef.current, themeId as any);
    }
  };

  const pdfFileName = [
    shipment.transporter?.name || 'الناقل',
    `شحنة-${shipment.shipment_number}`,
    shipment.generator?.name || 'المولد',
    wasteTypeLabels[shipment.waste_type] || shipment.waste_type,
  ].join('-');

  const handleExportPDF = () => {
    if (printRef.current) {
      exportToPDF(printRef.current, pdfFileName);
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
          <QRCodeCanvas ref={qrRef} value={qrData?.fullPayload || shipmentUrl} size={80} level="H" includeMargin={false} />
          <div ref={barcodeRef}>
            <Barcode value={qrData?.barcodeValue || shipment.shipment_number} format="CODE128" width={1.2} height={35} displayValue={false} background="#ffffff" lineColor="#000000" />
          </div>
        </div>

        {/* Print Preview */}
        <div ref={printRef} className="print-transparent-tables bg-white p-2 rounded-lg border" style={{ direction: 'rtl', fontSize: '5pt', color: '#000000', fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif", lineHeight: '1.15' }}>
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
          <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '279mm', boxSizing: 'border-box', paddingBottom: '2px' }}>
            {/* Header Table - Barcode left, QR right */}
            <table style={{ marginBottom: '0px', border: 'none' }}>
              <tbody>
                <tr>
                  <td style={{ width: '18%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                    {barcodeDataUrl && <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '28px', width: '100%' }} />}
                    <div style={{ fontSize: '5.5pt', color: '#000000', fontFamily: 'monospace' }}>{shipment.shipment_number}</div>
                    {qrData?.docHash && <div style={{ fontSize: '4pt', color: '#6b7280', fontFamily: 'monospace' }}>H:{qrData.docHash}</div>}
                  </td>
                  <td style={{ width: '64%', textAlign: 'center', border: 'none', padding: '2px' }}>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', color: theme.colors.primary, marginBottom: '0px' }}>نموذج تتبع نقل المخلفات</div>
                    <div style={{ fontSize: '6pt', color: '#6b7280', marginBottom: '1px' }}>Waste Transport Tracking Form</div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                      <span style={{ background: theme.colors.statusBg, color: theme.colors.statusText, padding: '1px 6px', borderRadius: theme.borderRadius, fontSize: '5.5pt', fontWeight: '600', border: `1px solid ${theme.colors.statusBorder}` }}>
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                      <span style={{ background: '#f3f4f6', color: '#000000', padding: '1px 6px', borderRadius: theme.borderRadius, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '6pt', border: '1px solid #d1d5db' }}>
                        {shipment.shipment_number}
                      </span>
                    </div>
                    <div style={{ fontSize: '5pt', color: '#6b7280' }}>
                      الرقم التسلسلي: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#000000' }}>{`DOC-${shipment.shipment_number.replace('SHP-', '')}`}</span>
                      {qrData?.docHash && <> | بصمة الوثيقة: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309' }}>{qrData.docHash}</span></>}
                    </div>
                  </td>
                  <td style={{ width: '13%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '50px', height: '50px' }} />}
                    <div style={{ fontSize: '4pt', color: '#6b7280' }}>امسح للتحقق والتتبع</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Organization Logos & Security Bar */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.generatorLight || '#f0f9ff' }}>
                    {shipment.generator?.stamp_url ? (
                      <img src={shipment.generator.stamp_url} alt="لوجو المولد" style={{ maxHeight: '20px', maxWidth: '60px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '6pt', color: theme.colors.generatorBg, fontWeight: '600' }}>🏢 {shipment.generator?.name || 'الجهة المولدة'}</div>
                    )}
                    {shipment.generator?.client_code && (
                      <div style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#6b7280' }}>{shipment.generator.client_code}</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.transporterLight || '#fffbeb' }}>
                    {shipment.transporter?.stamp_url ? (
                      <img src={shipment.transporter.stamp_url} alt="لوجو الناقل" style={{ maxHeight: '20px', maxWidth: '60px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '6pt', color: theme.colors.transporterBg, fontWeight: '600' }}>🚛 {shipment.transporter?.name || 'الجهة الناقلة'}</div>
                    )}
                    {shipment.transporter?.client_code && (
                      <div style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#6b7280' }}>{shipment.transporter.client_code}</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.recyclerLight || '#f0fdf4' }}>
                    {shipment.recycler?.stamp_url ? (
                      <img src={shipment.recycler.stamp_url} alt="لوجو المدور" style={{ maxHeight: '20px', maxWidth: '60px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '6pt', color: theme.colors.recyclerBg, fontWeight: '600' }}>♻️ {shipment.recycler?.name || 'جهة التدوير'}</div>
                    )}
                    {shipment.recycler?.client_code && (
                      <div style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#6b7280' }}>{shipment.recycler.client_code}</div>
                    )}
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
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '10%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>نوع المخلفات</td>
                  <td style={{ width: '15%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '8%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>الكمية</td>
                  <td style={{ width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>مستوى الخطورة</td>
                  <td style={{ width: '8%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.hazard_level || 'low'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>تاريخ الاستلام</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{formatDate(shipment.pickup_date)}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>طريقة التعبئة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.packaging_method || '-'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>طريقة التخلص</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.disposal_method || '-'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>وصف المخلفات</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.waste_description || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>موقع الاستلام</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.pickup_address}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>موقع التسليم</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>

            {/* Generator Section - Blue Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.generatorBg, color: theme.colors.generatorText, fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات الجهة المولدة: {shipment.generator?.name || '-'}
                    {shipment.generator?.client_code && <span style={{ marginRight: '8px', background: theme.colors.generatorLight, color: theme.colors.generatorBg, padding: '1px 6px', borderRadius: '3px', fontSize: '7pt' }}>{shipment.generator.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.wmra_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>تسجيل المنشأة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.establishment_registration || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>النشاط المسجل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.registered_activity || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.address || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.phone || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td colSpan={5} style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.generator?.email || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Transporter Section - Yellow/Orange Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.transporterBg, color: theme.colors.transporterText, fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات الجهة الناقلة: {shipment.transporter?.name || '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رخصة النقل البري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.land_transport_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.wmra_license || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.address || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.phone || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.transporter?.email || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>السائق</td>
                  <td style={{ background: theme.colors.transporterLight, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{driverName}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>لوحة المركبة</td>
                  <td style={{ background: theme.colors.transporterLight, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{vehiclePlate}</td>
                  <td colSpan={2} style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}></td>
                </tr>
              </tbody>
            </table>

            {/* Recycler Section - Green Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.recyclerBg, color: theme.colors.recyclerText, fontWeight: 'bold', textAlign: 'center', fontSize: '6.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات جهة التدوير: {shipment.recycler?.name || '-'}
                    {shipment.recycler?.client_code && <span style={{ marginRight: '8px', background: theme.colors.recyclerLight, color: theme.colors.recyclerBg, padding: '1px 4px', borderRadius: '3px', fontSize: '5.5pt' }}>{shipment.recycler.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رخصة التنمية الصناعية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.ida_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>السجل الصناعي</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.industrial_registry || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رقم الترخيص</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.license_number || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.wmra_license || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.address || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>النشاط المسجل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.activity_type || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.phone || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>البريد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.email || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6pt' }}>{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Legal Declarations Section */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ background: '#e2e8f0', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '5.5pt', padding: '1px', border: `1px solid ${theme.colors.border}` }}>الإقرارات القانونية والبيئية</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight || '#eff6ff', fontWeight: '600', width: '12%', border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', verticalAlign: 'top', color: '#000' }}>إقرار المولّد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', lineHeight: '1.25', color: '#000' }}>يُقر المولّد بأن المخلفات ناتجة عن نشاطه وملتزم بيئياً وفقاً للقانون 202/2020 والقانون 4/1994 ولوائحهما.</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight || '#fffbeb', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', verticalAlign: 'top', color: '#000' }}>إقرار الناقل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', lineHeight: '1.25', color: '#000' }}>يُقر الناقل بتطبيق المعايير البيئية واشتراطات WMRA ويتحمل المسؤولية عن سلامة المخلفات خلال النقل.</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight || '#f0fdf4', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', verticalAlign: 'top', color: '#000' }}>إقرار المستقبل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', lineHeight: '1.25', color: '#000' }}>يُقر المستقبل باستلام المخلفات وتطبيق المعايير البيئية وفقاً لترخيصه ومعايير WMRA.</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef2f2', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', verticalAlign: 'top', color: '#991b1b' }}>إخلاء مسؤولية</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '1px 3px', fontSize: '5pt', lineHeight: '1.25', color: '#000' }}>منصة iRecycle أداة رقمية للتوثيق فقط ولا تتحمل مسؤولية قانونية. المسؤولية على الأطراف الموقّعة.</td>
                </tr>
              </tbody>
            </table>

            {/* Movement Supervisors Section - always shown */}
            {movementSupervisors.length > 0 && (
              <table style={{ borderCollapse: 'collapse', marginBottom: '0px' }}>
                <tbody>
                  <tr>
                    <td colSpan={5} style={{ background: '#e0e7ff', color: '#312e81', fontWeight: 'bold', textAlign: 'center', fontSize: '6pt', padding: '1.5px', border: `1px solid ${theme.colors.border}` }}>
                      👁️ مسئولو الحركة والمتابعة
                    </td>
                  </tr>
                  <tr>
                    <td style={{ background: '#eef2ff', fontWeight: '600', fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, width: '12%', color: '#000' }}>الجهة</td>
                    <td style={{ background: '#eef2ff', fontWeight: '600', fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, width: '20%', color: '#000' }}>المسئول</td>
                    <td style={{ background: '#eef2ff', fontWeight: '600', fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, width: '13%', color: '#000' }}>الهاتف</td>
                    <td style={{ background: '#eef2ff', fontWeight: '600', fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, width: '15%', color: '#000' }}>وضع التوقيع</td>
                    <td style={{ background: '#eef2ff', fontWeight: '600', fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, width: '40%', color: '#000' }}>QR التحقق / البصمة</td>
                  </tr>
                  {movementSupervisors.map((sup, idx) => {
                    const roleLabels: Record<string, string> = { generator: 'المولد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص' };
                    const methodLabels: Record<string, string> = { manual: 'يدوي', otp: 'OTP', national_id: 'رقم قومي', digital_stamp: 'ختم رقمي', full_auto: 'تلقائي كامل' };
                    const supervisorQRValue = JSON.stringify({
                      v: 1, t: 'SUP',
                      doc: shipment.shipment_number,
                      role: sup.party_role,
                      name: sup.supervisor_name?.slice(0, 30),
                      type: sup.supervisor_type,
                      auto: sup.auto_sign_enabled ? 1 : 0,
                      method: sup.auto_sign_method || 'manual',
                      hash: qrData?.docHash || '',
                    });
                    return (
                      <tr key={idx}>
                        <td style={{ fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>
                          {roleLabels[sup.party_role] || sup.party_role}
                        </td>
                        <td style={{ fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>
                          {sup.supervisor_type === 'ai' ? '🤖 ' : '👤 '}{sup.supervisor_name || '-'}
                          {sup.auto_sign_enabled && <span style={{ color: '#2563eb', marginRight: '2px', fontSize: '4pt' }}> ⚡تلقائي</span>}
                        </td>
                        <td style={{ fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>
                          {sup.supervisor_phone || '-'}
                        </td>
                        <td style={{ fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, color: '#000', textAlign: 'center' }}>
                          {sup.auto_sign_enabled 
                            ? <span style={{ color: '#2563eb', fontWeight: '600' }}>⚡ {methodLabels[sup.auto_sign_method] || 'تلقائي'}</span>
                            : <span style={{ color: '#6b7280' }}>✍️ يدوي</span>
                          }
                        </td>
                        <td style={{ fontSize: '5pt', padding: '1px 3px', border: `1px solid ${theme.colors.border}`, color: '#000', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            <QRCodeSVG value={supervisorQRValue} size={24} level="H" />
                            {sup.signed_at ? (
                              <span style={{ color: '#059669', fontSize: '4.5pt' }}>✅ {new Date(sup.signed_at).toLocaleDateString('ar-EG')}</span>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '4.5pt' }}>⏳ في انتظار البصمة</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Stamps and Signatures Table - flex-grow to fill remaining space */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '0', flexGrow: 1 }}>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ background: theme.colors.stampBg, color: theme.colors.stampText, fontWeight: 'bold', textAlign: 'center', fontSize: '6pt', padding: '1px', border: `1px solid ${theme.colors.border}` }}>التوقيعات والأختام</td>
                </tr>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.border}`, background: theme.colors.generatorLight || '#eff6ff' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '700', color: '#000' }}>المولّد</div>
                    <div style={{ fontSize: '5pt', color: '#000' }}>{shipment.generator?.representative_name || shipment.generator?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.border}`, background: theme.colors.transporterLight || '#fffbeb' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '700', color: '#000' }}>الناقل</div>
                    <div style={{ fontSize: '5pt', color: '#000' }}>{shipment.transporter?.representative_name || shipment.transporter?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.border}`, background: theme.colors.recyclerLight || '#f0fdf4' }}>
                    <div style={{ fontSize: '6pt', fontWeight: '700', color: '#000' }}>المستقبل</div>
                    <div style={{ fontSize: '5pt', color: '#000' }}>{shipment.recycler?.representative_name || shipment.recycler?.name || '-'}</div>
                  </td>
                </tr>
                <tr>
                  {[
                    { org: shipment.generator, label: 'المولدة', role: 'generator' },
                    { org: shipment.transporter, label: 'الناقلة', role: 'transporter' },
                    { org: shipment.recycler, label: 'المدورة', role: 'recycler' },
                  ].map((item, idx) => (
                    <td key={idx} style={{ width: '33.33%', textAlign: 'center', padding: '3px', verticalAlign: 'top', border: `1px solid ${theme.colors.border}`, minHeight: '45px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', minHeight: '22px' }}>
                        {item.org?.stamp_url && <img src={item.org.stamp_url} alt="ختم" style={{ maxHeight: '22px', maxWidth: '22px', objectFit: 'contain' }} />}
                        {item.org?.signature_url && <img src={item.org.signature_url} alt="توقيع" style={{ maxHeight: '20px', maxWidth: '40px', objectFit: 'contain' }} />}
                      </div>
                      <div style={{ borderTop: `1px dashed ${theme.colors.accent}`, marginTop: '2px', paddingTop: '1px', fontSize: '4.5pt', color: '#000' }}>الاسم / التوقيع / الختم</div>
                      <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                        <QRCodeSVG 
                          value={qrData?.signerPayload({ name: item.org?.name || '', commercialRegister: item.org?.commercial_register, role: item.role }) || `${window.location.origin}/qr-verify?type=signer&doc=${shipment.shipment_number}`} 
                          size={28} 
                          level="H" 
                        />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '4pt', fontFamily: 'monospace', color: '#000' }}>{item.org?.commercial_register || '-'}</div>
                          <div style={{ fontSize: '3.5pt', color: '#b45309', fontFamily: 'monospace' }}>H:{qrData?.docHash || ''}</div>
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
            <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '5pt', color: '#000', paddingTop: '2px', paddingBottom: '1px', borderTop: `1px solid ${theme.colors.borderLight}`, background: 'rgba(241,245,249,0.5)', borderRadius: '0 0 3px 3px' }}>
              <div style={{ fontWeight: '600' }}>تم إنشاء هذا النموذج بواسطة نظام إدارة المخلفات الذكي طبقاً للبيانات المدخلة والواردة إلينا على النظام، دون أدنى مسؤولية على النظام</div>
              <div style={{ fontFamily: 'monospace', fontSize: '4.5pt' }}>
                رقم التتبع: {shipment.shipment_number} | الرقم التسلسلي: {`DOC-${shipment.shipment_number.replace('SHP-', '')}`} | {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
              </div>
            </div>
          </div>
          
        </div>

        {/* Signatures display */}
        {signatures.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-1">
            <span className="text-xs text-muted-foreground">التوقيعات:</span>
            <SignatureBadges signatures={signatures} />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button variant="outline" onClick={() => setSignDialogOpen(true)} className="gap-2">
            <PenTool className="w-4 h-4" />
            توقيع وختم
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            تنزيل PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </DialogFooter>

        {/* Signature Dialog */}
        <UniversalSignatureDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          onSign={handleSignDocument}
          documentType="shipment"
          documentId={shipment.id}
          documentTitle={`نموذج تتبع - ${shipment.shipment_number}`}
          organizationId=""
          organizationStampUrl={shipment.generator?.stamp_url || shipment.transporter?.stamp_url || shipment.recycler?.stamp_url}
          loading={signingLoading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentPrintView;
