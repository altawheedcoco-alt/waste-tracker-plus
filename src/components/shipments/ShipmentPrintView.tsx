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
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مكتمل',
};

const ShipmentPrintView = ({ isOpen, onClose, shipment }: ShipmentPrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [themeId, setThemeId] = useState('eco-green');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [signingLoading, setSigningLoading] = useState(false);
  const theme = getThemeById(themeId);
  
  const { exportToPDF, printContent: printContentFn, printWithTheme, isExporting } = usePDFExport({
    filename: `tracking-form-${shipment?.shipment_number || 'document'}`,
    orientation: 'portrait',
    format: 'a4',
    scale: 2,
    fitSinglePage: true,
  });

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

  const handleExportPDF = async () => {
    await exportToPDF(printRef.current, `نموذج-تتبع-${shipment.shipment_number}`);
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
          <QRCodeCanvas ref={qrRef} value={shipmentUrl} size={60} level="M" includeMargin={false} />
          <div ref={barcodeRef}>
            <Barcode value={shipment.shipment_number} format="CODE128" width={1.2} height={35} displayValue={false} background="#ffffff" lineColor="#000000" />
          </div>
        </div>

        {/* Print Preview */}
        <div ref={printRef} className="bg-white p-3 rounded-lg border" style={{ direction: 'rtl', fontSize: '7pt', color: '#000000' }}>
          <div className="page">
            {/* Header Table - Barcode left, QR right */}
            <table style={{ marginBottom: '4px', border: 'none' }}>
              <tbody>
                <tr>
                  <td style={{ width: '20%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '4px' }}>
                    {barcodeDataUrl && <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '35px', width: '100%' }} />}
                    <div style={{ fontSize: '6pt', color: '#000000', fontFamily: 'monospace' }}>{shipment.shipment_number}</div>
                  </td>
                  <td style={{ width: '60%', textAlign: 'center', border: 'none', padding: '4px' }}>
                    <div style={{ fontSize: '14pt', fontWeight: 'bold', color: theme.colors.primary, marginBottom: '2px' }}>نموذج تتبع نقل المخلفات</div>
                    <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>Waste Transport Tracking Form</div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ background: theme.colors.statusBg, color: theme.colors.statusText, padding: '3px 12px', borderRadius: theme.borderRadius, fontSize: '8pt', fontWeight: '600', border: `1px solid ${theme.colors.statusBorder}` }}>
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                      <span style={{ background: '#f3f4f6', color: '#000000', padding: '3px 12px', borderRadius: theme.borderRadius, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '9pt', border: '1px solid #d1d5db' }}>
                        {shipment.shipment_number}
                      </span>
                    </div>
                    <div style={{ fontSize: '7pt', color: '#6b7280' }}>
                      الرقم التسلسلي: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#000000' }}>{`DOC-${shipment.shipment_number.replace('SHP-', '')}`}</span>
                    </div>
                  </td>
                  <td style={{ width: '20%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '4px' }}>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '70px', height: '70px' }} />}
                    <div style={{ fontSize: '6pt', color: '#6b7280' }}>امسح للتتبع</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Organization Logos & Security Bar */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.generatorLight || '#f0f9ff' }}>
                    {shipment.generator?.stamp_url ? (
                      <img src={shipment.generator.stamp_url} alt="لوجو المولد" style={{ maxHeight: '25px', maxWidth: '70px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '7pt', color: theme.colors.generatorBg, fontWeight: '600' }}>🏢 {shipment.generator?.name || 'الجهة المولدة'}</div>
                    )}
                    {shipment.generator?.client_code && (
                      <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#6b7280', marginTop: '1px' }}>{shipment.generator.client_code}</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.transporterLight || '#fffbeb' }}>
                    {shipment.transporter?.stamp_url ? (
                      <img src={shipment.transporter.stamp_url} alt="لوجو الناقل" style={{ maxHeight: '25px', maxWidth: '70px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '7pt', color: theme.colors.transporterBg, fontWeight: '600' }}>🚛 {shipment.transporter?.name || 'الجهة الناقلة'}</div>
                    )}
                    {shipment.transporter?.client_code && (
                      <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#6b7280', marginTop: '1px' }}>{shipment.transporter.client_code}</div>
                    )}
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.recyclerLight || '#f0fdf4' }}>
                    {shipment.recycler?.stamp_url ? (
                      <img src={shipment.recycler.stamp_url} alt="لوجو المدور" style={{ maxHeight: '25px', maxWidth: '70px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ fontSize: '7pt', color: theme.colors.recyclerBg, fontWeight: '600' }}>♻️ {shipment.recycler?.name || 'جهة التدوير'}</div>
                    )}
                    {shipment.recycler?.client_code && (
                      <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#6b7280', marginTop: '1px' }}>{shipment.recycler.client_code}</div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Shipment Details Table - Olive/Yellow Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '2px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.shipmentBg, color: theme.colors.shipmentText, fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>بيانات الشحنة</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '10%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>نوع المخلفات</td>
                  <td style={{ width: '15%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '8%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>الكمية</td>
                  <td style={{ width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>مستوى الخطورة</td>
                  <td style={{ width: '8%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.hazard_level || 'low'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>تاريخ الاستلام</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{formatDate(shipment.pickup_date)}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>طريقة التعبئة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.packaging_method || '-'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>طريقة التخلص</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.disposal_method || '-'}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>وصف المخلفات</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.waste_description || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>موقع الاستلام</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.pickup_address}</td>
                  <td style={{ background: theme.colors.labelBg, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>موقع التسليم</td>
                  <td colSpan={3} style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.delivery_address}</td>
                </tr>
              </tbody>
            </table>

            {/* Generator Section - Blue Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '2px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.generatorBg, color: theme.colors.generatorText, fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات الجهة المولدة: {shipment.generator?.name || '-'}
                    {shipment.generator?.client_code && <span style={{ marginRight: '8px', background: theme.colors.generatorLight, color: theme.colors.generatorBg, padding: '1px 6px', borderRadius: '3px', fontSize: '7pt' }}>{shipment.generator.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.wmra_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>تسجيل المنشأة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.establishment_registration || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>النشاط المسجل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.registered_activity || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.address || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.phone || '-'}</td>
                  <td style={{ background: theme.colors.generatorLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البريد</td>
                  <td colSpan={5} style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.email || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Transporter Section - Yellow/Orange Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '2px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.transporterBg, color: theme.colors.transporterText, fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات الجهة الناقلة: {shipment.transporter?.name || '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رخصة النقل البري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.land_transport_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.wmra_license || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.address || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.phone || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.representative_name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البريد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.email || '-'}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>السائق</td>
                  <td style={{ background: theme.colors.transporterLight, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{driverName}</td>
                  <td style={{ background: theme.colors.transporterLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>لوحة المركبة</td>
                  <td style={{ background: theme.colors.transporterLight, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{vehiclePlate}</td>
                  <td colSpan={2} style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}></td>
                </tr>
              </tbody>
            </table>

            {/* Recycler Section - Green Header */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '2px' }}>
              <tbody>
                <tr>
                  <td colSpan={8} style={{ background: theme.colors.recyclerBg, color: theme.colors.recyclerText, fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>
                    بيانات جهة التدوير: {shipment.recycler?.name || '-'}
                    {shipment.recycler?.client_code && <span style={{ marginRight: '8px', background: theme.colors.recyclerLight, color: theme.colors.recyclerBg, padding: '1px 6px', borderRadius: '3px', fontSize: '7pt' }}>{shipment.recycler.client_code}</span>}
                  </td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.commercial_register || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البطاقة الضريبية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.tax_card || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.environmental_approval_number || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, width: '12%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رخصة التنمية الصناعية</td>
                  <td style={{ width: '13%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.ida_license || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>السجل الصناعي</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.industrial_registry || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رقم الترخيص</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.license_number || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>رخصة إدارة المخلفات</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.wmra_license || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.address || '-'}</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>النشاط المسجل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.activity_type || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.phone || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>البريد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.email || '-'}</td>
                  <td style={{ background: theme.colors.recyclerLight, fontWeight: '600', color: theme.colors.labelText, border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.representative_name || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Legal Declarations Section */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '2px' }}>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ background: '#e2e8f0', color: '#000000', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>الإقرارات القانونية والبيئية</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.generatorLight || '#eff6ff', fontWeight: '600', width: '15%', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt', verticalAlign: 'top', color: '#000' }}>إقرار المولّد</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '6.5pt', lineHeight: '1.5', color: '#000' }}>يُقر المولّد بأن المخلفات المذكورة ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات، وأنه ملتزم بيئياً وفقاً للقانون رقم 202 لسنة 2020 والقانون رقم 4 لسنة 1994 ولوائحهما التنفيذية.</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.transporterLight || '#fffbeb', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt', verticalAlign: 'top', color: '#000' }}>إقرار الناقل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '6.5pt', lineHeight: '1.5', color: '#000' }}>يُقر الناقل بتطبيق جميع المعايير القانونية والبيئية والتزامه بكافة اشتراطات وزارة البيئة وجهاز تنظيم إدارة المخلفات (WMRA)، ويتحمل كامل المسؤولية عن سلامة المخلفات خلال النقل.</td>
                </tr>
                <tr>
                  <td style={{ background: theme.colors.recyclerLight || '#f0fdf4', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt', verticalAlign: 'top', color: '#000' }}>إقرار المستقبل</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '6.5pt', lineHeight: '1.5', color: '#000' }}>يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية في عمليات إعادة التدوير وفقاً لترخيصه ومعايير WMRA.</td>
                </tr>
                <tr>
                  <td style={{ background: '#fef2f2', fontWeight: '600', border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '7pt', verticalAlign: 'top', color: '#991b1b' }}>إخلاء مسؤولية</td>
                  <td style={{ border: `1px solid ${theme.colors.border}`, padding: '3px 5px', fontSize: '6.5pt', lineHeight: '1.5', color: '#000' }}>منصة iRecycle أداة رقمية للتوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات أو العمليات. المسؤولية الكاملة على الأطراف الموقّعة.</td>
                </tr>
              </tbody>
            </table>

            {/* Stamps and Signatures Table */}
            <table style={{ borderCollapse: 'collapse', marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td colSpan={3} style={{ background: theme.colors.stampBg, color: theme.colors.stampText, fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: `1px solid ${theme.colors.border}` }}>التوقيعات والأختام</td>
                </tr>
                <tr>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.border}`, background: theme.colors.generatorLight || '#eff6ff' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#000', marginBottom: '2px' }}>المولّد</div>
                    <div style={{ fontSize: '6pt', color: '#000' }}>{shipment.generator?.representative_name || shipment.generator?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.border}`, background: theme.colors.transporterLight || '#fffbeb' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: '#000', marginBottom: '2px' }}>الناقل</div>
                    <div style={{ fontSize: '6pt', color: '#000' }}>{shipment.transporter?.representative_name || shipment.transporter?.name || '-'}</div>
                  </td>
                  <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: `1px solid ${theme.colors.border}`, background: theme.colors.recyclerLight || '#f0fdf4' }}>
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
                    <td key={idx} style={{ width: '33.33%', textAlign: 'center', padding: '8px', verticalAlign: 'top', border: `1px solid ${theme.colors.border}`, minHeight: '80px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'flex-end', minHeight: '45px' }}>
                        {item.org?.stamp_url && <img src={item.org.stamp_url} alt="ختم" style={{ maxHeight: '40px', maxWidth: '40px', objectFit: 'contain' }} />}
                        {item.org?.signature_url && <img src={item.org.signature_url} alt="توقيع" style={{ maxHeight: '35px', maxWidth: '60px', objectFit: 'contain' }} />}
                      </div>
                      <div style={{ borderTop: `1px dashed ${theme.colors.accent}`, marginTop: '6px', paddingTop: '3px', fontSize: '6pt', color: '#000' }}>الاسم / التوقيع / الختم</div>
                      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        <QRCodeSVG 
                          value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(item.org?.commercial_register || item.org?.name || '')}&doc=${encodeURIComponent(shipment.shipment_number)}`} 
                          size={28} 
                          level="L" 
                        />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#000' }}>{item.org?.commercial_register || '-'}</div>
                          <div style={{ fontSize: '5pt', color: '#666' }}>QR الموقع</div>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* Role-based tagline */}
            <ShipmentTaglineFooter shipmentNumber={shipment.shipment_number} disposalMethod={shipment.disposal_method} />

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '6pt', color: '#000', paddingTop: '4px', borderTop: `1px solid ${theme.colors.borderLight}` }}>
              <div>تم إنشاء هذا المستند إلكترونياً بتاريخ {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })} • نظام إدارة المخلفات - آي ريسايكل</div>
              <div style={{ marginTop: '2px' }}>
                رقم التتبع: {shipment.shipment_number} | الرقم التسلسلي: {`DOC-${shipment.shipment_number.replace('SHP-', '')}`}
              </div>
              <div style={{ marginTop: '3px', fontSize: '6pt' }}>
                📅 تاريخ وصول الشحنة: {shipment.confirmed_at ? format(new Date(shipment.confirmed_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.delivered_at ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.created_at ? format(new Date(shipment.created_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : '-'}
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
            تصدير PDF
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
