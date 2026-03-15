import { useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Printer, 
  Download, 
  Package, 
  Truck, 
  Factory, 
  Recycle, 
  MapPin, 
  Calendar, 
  User,
  Phone,
  Mail,
  FileText,
  Eye,
  QrCode,
  Settings2,
  ChevronDown,
  Loader2,
  FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StampSignatureSettings, { StampSignatureConfig, defaultConfig } from './StampSignatureSettings';
import { usePDFExport } from '@/hooks/usePDFExport';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import SendForSigningButton from '@/components/documents/SendForSigningButton';
import SignDocumentButton from '@/components/signature/SignDocumentButton';
import AddNoteButton from '@/components/notes/AddNoteButton';
import { generateRoleTagline } from '@/lib/roleTaglineEngine';

interface OrganizationData {
  name: string;
  name_en?: string | null;
  email: string;
  phone: string;
  secondary_phone?: string | null;
  address: string;
  city: string;
  region?: string | null;
  commercial_register?: string | null;
  environmental_license?: string | null;
  activity_type?: string | null;
  production_capacity?: string | null;
  representative_name?: string | null;
  representative_phone?: string | null;
  representative_email?: string | null;
  representative_national_id?: string | null;
  representative_position?: string | null;
  delegate_name?: string | null;
  delegate_phone?: string | null;
  delegate_email?: string | null;
  delegate_national_id?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_email?: string | null;
  agent_national_id?: string | null;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  client_code?: string | null;
  organization_type?: string | null;
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

interface EnhancedShipmentPrintViewProps {
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

const disposalLabels: Record<string, string> = {
  recycling: 'إعادة تدوير',
  remanufacturing: 'إعادة تصنيع',
  recycling_remanufacturing: 'إعادة تدوير / إعادة تصنيع',
  landfill: 'دفن صحي',
  incineration: 'حرق',
  treatment: 'معالجة',
  reuse: 'إعادة استخدام',
};

const packagingLabels: Record<string, string> = {
  packaged: 'معبأ',
  unpackaged: 'غير معبأ',
};

const EnhancedShipmentPrintView = ({ isOpen, onClose, shipment }: EnhancedShipmentPrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [stampConfig, setStampConfig] = useState<StampSignatureConfig>(defaultConfig);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { exportToPDF, printContent: printContentFn, isExporting: isPDFExporting } = usePDFExport({
    filename: `شحنة-${shipment?.shipment_number || 'document'}`,
    orientation: 'portrait',
  });

  // Fetch delivery declaration for this shipment
  const { data: declarationData } = useQuery({
    queryKey: ['delivery-declaration-print', shipment?.id],
    queryFn: async () => {
      if (!shipment?.id) return null;
      const { data, error } = await supabase
        .from('delivery_declarations')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!shipment?.id && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  if (!shipment) return null;

  // Generate document serial number based on shipment
  const documentSerial = `DOC-${shipment.shipment_number.replace('SHP-', '')}`;
  
  // Generate security hash for anti-forgery
  const generateSecurityHash = () => {
    const data = `${shipment.id}-${shipment.shipment_number}-${shipment.created_at}-${shipment.generator?.name || ''}-${shipment.quantity}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };
  
  const securityHash = generateSecurityHash();
  const verificationCode = `SEC-${securityHash.slice(0, 4)}-${securityHash.slice(4, 8)}`;
  
  // QR Code data with verification URL
  const qrData = `${window.location.origin}/qr-verify?type=shipment&code=${encodeURIComponent(shipment.shipment_number)}`;

  // AI Optimization function
  const handleOptimizeWithAI = async () => {
    setIsOptimizing(true);
    try {
      const hasStamps = !!(shipment.generator?.stamp_url || shipment.transporter?.stamp_url || shipment.recycler?.stamp_url);
      const hasSignatures = !!(shipment.generator?.signature_url || shipment.transporter?.signature_url || shipment.recycler?.signature_url);
      
      const response = await supabase.functions.invoke('ai-optimize-print', {
        body: {
          hasStamps,
          hasSignatures,
          documentType: 'shipment',
          pageSize: 'A4',
        },
      });

      if (response.error) {
        // If AI function doesn't exist or fails, use smart defaults
        const optimizedConfig: StampSignatureConfig = {
          stampSize: hasStamps ? 80 : 64,
          signatureSize: hasSignatures ? 40 : 32,
          layout: 'horizontal',
          showLabels: true,
          borderStyle: hasStamps ? 'solid' : 'dashed',
        };
        setStampConfig(optimizedConfig);
        toast.success('تم تحسين الإعدادات تلقائياً');
      } else if (response.data?.config) {
        setStampConfig(response.data.config);
        toast.success('تم التحسين بواسطة الذكاء الاصطناعي');
      }
    } catch (error) {
      // Fallback to smart defaults
      const optimizedConfig: StampSignatureConfig = {
        stampSize: 80,
        signatureSize: 40,
        layout: 'horizontal',
        showLabels: true,
        borderStyle: 'solid',
      };
      setStampConfig(optimizedConfig);
      toast.success('تم تحسين الإعدادات تلقائياً');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Get dynamic styles based on config
  const getStampStyle = () => ({
    width: `${stampConfig.stampSize}px`,
    height: `${stampConfig.stampSize}px`,
  });

  const getSignatureStyle = () => ({
    height: `${stampConfig.signatureSize}px`,
  });

  const getBorderClass = () => {
    switch (stampConfig.borderStyle) {
      case 'dashed': return 'border-2 border-dashed';
      case 'solid': return 'border-2';
      case 'none': return '';
      default: return 'border-2 border-dashed';
    }
  };

  const getLayoutClass = () => {
    switch (stampConfig.layout) {
      case 'horizontal': return 'grid grid-cols-3 gap-6';
      case 'vertical': return 'flex flex-col gap-4';
      case 'compact': return 'grid grid-cols-3 gap-2';
      default: return 'grid grid-cols-3 gap-6';
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      printContentFn(printRef.current);
    }
  };

  const handleDownloadPDF = async () => {
    await exportToPDF(printRef.current, `شحنة-${shipment?.shipment_number || 'document'}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-between">
            <Badge variant="secondary" className="font-mono">{documentSerial}</Badge>
            <div className="flex items-center gap-2">
              <span>وثيقة الشحنة</span>
              <FileText className="w-5 h-5" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              معاينة
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              التفاصيل الكاملة
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
            {/* Settings Panel */}
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="mb-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    إعدادات الختم والتوقيع
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <StampSignatureSettings
                  config={stampConfig}
                  onChange={setStampConfig}
                  onOptimize={handleOptimizeWithAI}
                  isOptimizing={isOptimizing}
                />
              </CollapsibleContent>
            </Collapsible>

            <TabsContent value="preview" className="mt-0">
              {/* Print Preview - Unified Format */}
              <div 
                ref={printRef}
                className="bg-white p-3 rounded-lg border text-foreground"
                style={{ direction: 'rtl', fontSize: '7pt' }}
              >
                <div className="page">
                  {/* Header Table - Barcode left, QR right */}
                  <table style={{ marginBottom: '4px', border: 'none', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '4px' }}>
                          <div className="barcode-container bg-white p-1 border rounded overflow-hidden">
                            <Barcode value={shipment.shipment_number.replace('SHP-', '')} width={1} height={35} fontSize={8} margin={2} displayValue={false} />
                          </div>
                          <div style={{ fontSize: '6pt', color: '#374151', fontFamily: 'monospace' }}>{shipment.shipment_number}</div>
                        </td>
                        <td style={{ width: '60%', textAlign: 'center', border: 'none', padding: '4px' }}>
                          <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#16a34a', marginBottom: '2px' }}>نموذج تتبع نقل المخلفات</div>
                          <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '4px' }}>Waste Transport Tracking Form</div>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 12px', borderRadius: '4px', fontSize: '8pt', fontWeight: '600', border: '1px solid #86efac' }}>
                              {statusLabels[shipment.status] || shipment.status}
                            </span>
                            <span style={{ background: '#16a34a', color: 'white', padding: '3px 12px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '9pt' }}>
                              {shipment.shipment_number}
                            </span>
                          </div>
                          <div style={{ fontSize: '7pt', color: '#6b7280' }}>
                            الرقم التسلسلي: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#16a34a' }}>{documentSerial}</span>
                            {' | '}
                            كود التحقق: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#dc2626' }}>{verificationCode}</span>
                          </div>
                        </td>
                        <td style={{ width: '20%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '4px' }}>
                          <div className="qr-container bg-white p-2 border rounded-lg inline-block">
                            <QRCodeSVG value={qrData} size={60} level="M" />
                          </div>
                          <div style={{ fontSize: '6pt', color: '#6b7280' }}>امسح للتتبع</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Organization Logos & Security Bar */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #e5e7eb', background: '#f0f9ff' }}>
                          {shipment.generator?.logo_url ? (
                            <img src={shipment.generator.logo_url} alt="لوجو المولد" style={{ maxHeight: '30px', maxWidth: '80px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                          ) : (
                            <div style={{ fontSize: '7pt', color: '#3b82f6', fontWeight: '600' }}>🏢 {shipment.generator?.name || 'الجهة المولدة'}</div>
                          )}
                          {shipment.generator?.client_code && (
                            <div style={{ fontSize: '5pt', color: '#6b7280', fontFamily: 'monospace', marginTop: '2px' }}>
                              <Barcode value={shipment.generator.client_code} width={0.8} height={15} fontSize={0} margin={0} displayValue={false} />
                              <div>{shipment.generator.client_code}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #e5e7eb', background: '#fffbeb' }}>
                          {shipment.transporter?.logo_url ? (
                            <img src={shipment.transporter.logo_url} alt="لوجو الناقل" style={{ maxHeight: '30px', maxWidth: '80px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                          ) : (
                            <div style={{ fontSize: '7pt', color: '#eab308', fontWeight: '600' }}>🚛 {shipment.transporter?.name || 'الجهة الناقلة'}</div>
                          )}
                          {shipment.transporter?.client_code && (
                            <div style={{ fontSize: '5pt', color: '#6b7280', fontFamily: 'monospace', marginTop: '2px' }}>
                              <Barcode value={shipment.transporter.client_code} width={0.8} height={15} fontSize={0} margin={0} displayValue={false} />
                              <div>{shipment.transporter.client_code}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '4px', border: '1px solid #e5e7eb', background: '#f0fdf4' }}>
                          {shipment.recycler?.logo_url ? (
                            <img src={shipment.recycler.logo_url} alt="لوجو المدور" style={{ maxHeight: '30px', maxWidth: '80px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                          ) : (
                            <div style={{ fontSize: '7pt', color: '#22c55e', fontWeight: '600' }}>♻️ {shipment.recycler?.name || 'جهة التدوير'}</div>
                          )}
                          {shipment.recycler?.client_code && (
                            <div style={{ fontSize: '5pt', color: '#6b7280', fontFamily: 'monospace', marginTop: '2px' }}>
                              <Barcode value={shipment.recycler.client_code} width={0.8} height={15} fontSize={0} margin={0} displayValue={false} />
                              <div>{shipment.recycler.client_code}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Shipment Details Table - Olive/Yellow Header */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '2px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td colSpan={8} style={{ background: '#a3a23a', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #8b8a32' }}>بيانات الشحنة</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '10%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>نوع المخلفات</td>
                        <td style={{ width: '15%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '8%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>الكمية</td>
                        <td style={{ width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>مستوى الخطورة</td>
                        <td style={{ width: '8%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{hazardLabels[shipment.hazard_level || ''] || shipment.hazard_level || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>تاريخ الاستلام</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.pickup_date ? format(new Date(shipment.pickup_date), 'dd/MM/yyyy', { locale: ar }) : '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>طريقة التعبئة</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{packagingLabels[shipment.packaging_method || ''] || shipment.packaging_method || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>طريقة التخلص</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{disposalLabels[shipment.disposal_method || ''] || shipment.disposal_method || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>وصف المخلفات</td>
                        <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.waste_description || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>موقع الاستلام</td>
                        <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.pickup_address}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>موقع التسليم</td>
                        <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.delivery_address}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Generator Section - Blue Header */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '2px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td colSpan={8} style={{ background: '#3b82f6', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #2563eb' }}>
                          بيانات الجهة المولدة: {shipment.generator?.name || '-'}
                          {shipment.generator?.client_code && <span style={{ marginRight: '8px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '3px', fontSize: '7pt' }}>{shipment.generator.client_code}</span>}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.commercial_register || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.environmental_license || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>النشاط</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.activity_type || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.representative_name || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                        <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.address || '-'} {shipment.generator?.city && `- ${shipment.generator.city}`}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.phone || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>البريد</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.generator?.email || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Transporter Section - Yellow/Orange Header */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '2px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td colSpan={8} style={{ background: '#eab308', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #ca8a04' }}>
                          بيانات الجهة الناقلة: {shipment.transporter?.name || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.commercial_register || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.environmental_license || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>النشاط</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.activity_type || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.representative_name || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.address || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.transporter?.phone || '-'}</td>
                        <td style={{ background: '#fef3c7', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>السائق</td>
                        <td style={{ background: '#fefce8', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.driver?.profile?.full_name || shipment.manual_driver_name || '-'}</td>
                        <td style={{ background: '#fef3c7', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>لوحة المركبة</td>
                        <td style={{ background: '#fefce8', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Recycler Section - Green Header */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '2px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td colSpan={8} style={{ background: '#22c55e', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #16a34a' }}>
                          بيانات جهة التدوير: {shipment.recycler?.name || '-'}
                          {shipment.recycler?.client_code && <span style={{ marginRight: '8px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '3px', fontSize: '7pt' }}>{shipment.recycler.client_code}</span>}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>السجل التجاري</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.commercial_register || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>رقم الموافقة البيئية</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.environmental_license || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>النشاط</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.activity_type || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', width: '12%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>ممثل الجهة</td>
                        <td style={{ width: '13%', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.representative_name || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>العنوان</td>
                        <td colSpan={3} style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.address || '-'} {shipment.recycler?.city && `- ${shipment.recycler.city}`}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>الهاتف</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.phone || '-'}</td>
                        <td style={{ background: '#f9fafb', fontWeight: '600', border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>البريد</td>
                        <td style={{ border: '1px solid #d1d5db', padding: '3px 5px', fontSize: '7pt' }}>{shipment.recycler?.email || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Stamps and Signatures Table with QR Codes - Dark Green Header */}
                  <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
                    <tbody>
                      <tr>
                        <td colSpan={3} style={{ background: '#166534', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #14532d' }}>الأختام والتوقيعات المعتمدة</td>
                      </tr>
                      <tr>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', background: '#f9fafb' }}>
                          <div style={{ fontSize: '7pt', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>الجهة المولدة</div>
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', background: '#f9fafb' }}>
                          <div style={{ fontSize: '7pt', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>الجهة الناقلة</div>
                        </td>
                        <td style={{ width: '33.33%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', background: '#f9fafb' }}>
                          <div style={{ fontSize: '7pt', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>جهة التدوير</div>
                        </td>
                      </tr>
                      <tr>
                        {[
                          { org: shipment.generator, label: 'المولدة' },
                          { org: shipment.transporter, label: 'الناقلة' },
                          { org: shipment.recycler, label: 'المدورة' },
                        ].map((item, idx) => (
                          <td key={idx} style={{ width: '33.33%', textAlign: 'center', padding: '8px', verticalAlign: 'top', border: '1px solid #d1d5db', minHeight: '80px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'flex-end', minHeight: '45px' }}>
                              {item.org?.stamp_url && <img src={item.org.stamp_url} alt="ختم" style={{ maxHeight: '40px', maxWidth: '40px', objectFit: 'contain' }} />}
                              {item.org?.signature_url && <img src={item.org.signature_url} alt="توقيع" style={{ maxHeight: '35px', maxWidth: '60px', objectFit: 'contain' }} />}
                            </div>
                            <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '6px', paddingTop: '3px', fontSize: '6pt', color: '#6b7280' }}>التوقيع والختم</div>
                            {/* Signer QR Code */}
                            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                              <QRCodeSVG 
                                value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(item.org?.commercial_register || item.org?.name || '')}&doc=${encodeURIComponent(shipment.shipment_number)}`} 
                                size={28} 
                                level="L" 
                              />
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#6b7280' }}>{item.org?.commercial_register || '-'}</div>
                                <div style={{ fontSize: '5pt', color: '#9ca3af' }}>QR الموقع</div>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>

                  {/* Declaration Section with QR */}
                  {declarationData && (
                    <table style={{ borderCollapse: 'collapse', marginBottom: '4px', width: '100%' }}>
                      <tbody>
                        <tr>
                          <td colSpan={3} style={{ background: '#7c3aed', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: '8pt', padding: '4px', border: '1px solid #6d28d9' }}>
                            📋 إقرار تسليم الشحنة - Declaration
                          </td>
                        </tr>
                        <tr>
                          <td style={{ width: '70%', padding: '6px', border: '1px solid #d1d5db', fontSize: '7pt', verticalAlign: 'top' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ color: '#6b7280' }}>المُقِر: </span>
                              <strong>{(declarationData as any).driver_name || 'غير محدد'}</strong>
                              <span style={{ marginRight: '10px', color: '#6b7280' }}>رقم الهوية: </span>
                              <strong>{(declarationData as any).driver_national_id || 'غير محدد'}</strong>
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ color: '#6b7280' }}>تاريخ الإقرار: </span>
                              <strong>{(declarationData as any).declared_at ? format(new Date((declarationData as any).declared_at), 'dd/MM/yyyy hh:mm a', { locale: ar }) : '-'}</strong>
                              <span style={{ marginRight: '10px', color: '#6b7280' }}>رقم الوثيقة: </span>
                              <strong style={{ fontFamily: 'monospace', color: '#7c3aed' }}>DEC-{(declarationData as any).id?.slice(0, 8).toUpperCase()}</strong>
                            </div>
                            <div style={{ fontSize: '6pt', color: '#374151', borderTop: '1px dashed #e5e7eb', paddingTop: '3px', marginTop: '3px', maxHeight: '30px', overflow: 'hidden' }}>
                              {(declarationData as any).declaration_text?.slice(0, 200)}...
                            </div>
                            <div style={{ marginTop: '3px', fontSize: '6pt', color: '#16a34a', fontWeight: '600' }}>
                              ✅ تم التوقيع إلكترونياً - وثيقة مسجلة ومحمية رقمياً
                            </div>
                          </td>
                          <td style={{ width: '30%', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', verticalAlign: 'middle' }}>
                            <QRCodeSVG 
                              value={`${window.location.origin}/qr-verify?type=declaration&code=DEC-${(declarationData as any).id?.slice(0, 8).toUpperCase()}`} 
                              size={50} 
                              level="M" 
                            />
                            <div style={{ fontSize: '5pt', color: '#6b7280', marginTop: '2px' }}>QR الإقرار</div>
                            <div style={{ marginTop: '3px' }}>
                              <Barcode value={`DEC-${(declarationData as any).id?.slice(0, 8).toUpperCase()}`} width={0.8} height={18} fontSize={0} margin={0} displayValue={false} />
                            </div>
                            <div style={{ fontSize: '5pt', fontFamily: 'monospace', color: '#6b7280' }}>DEC-{(declarationData as any).id?.slice(0, 8).toUpperCase()}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Role-based tagline */}
                  <ShipmentTaglineFooter shipmentNumber={shipment.shipment_number} disposalMethod={shipment.disposal_method} />

                  {/* Footer */}
                  <div style={{ textAlign: 'center', fontSize: '6pt', color: '#9ca3af', paddingTop: '4px', borderTop: '1px solid #e5e7eb' }}>
                    <div>تم إنشاء هذا المستند إلكترونياً بتاريخ {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })} • نظام إدارة المخلفات - آي ريسايكل</div>
                    <div style={{ marginTop: '2px' }}>
                      رقم التتبع: {shipment.shipment_number} | رقم الوثيقة: {documentSerial} | كود التحقق: {verificationCode}
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '6pt', color: '#6b7280' }}>
                      📅 تاريخ وصول الشحنة (أول تسجيل على المنظومة): {shipment.confirmed_at ? format(new Date(shipment.confirmed_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.delivered_at ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : shipment.created_at ? format(new Date(shipment.created_at), 'dd/MM/yyyy - hh:mm a', { locale: ar }) : '-'}
                    </div>
                    <div style={{ marginTop: '3px', fontSize: '5pt', fontStyle: 'italic', color: '#a1a1aa' }}>
                      إخلاء مسؤولية: هذا المستند تم إنشاؤه آلياً بناءً على البيانات المدخلة، والمنصة غير مسؤولة عن صحة المعلومات الواردة فيه.
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0">
              {/* Full Details View */}
              <div className="bg-white p-6 rounded-lg border space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{statusLabels[shipment.status]}</Badge>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">{shipment.shipment_number}</h2>
                    <p className="text-sm text-muted-foreground">رقم الوثيقة: {documentSerial}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="font-bold text-right">سجل الحالات</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span>{format(new Date(shipment.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                      <span>تم الإنشاء</span>
                    </div>
                    {shipment.approved_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.approved_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>تمت الموافقة</span>
                      </div>
                    )}
                    {shipment.collection_started_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.collection_started_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>بدء التجميع</span>
                      </div>
                    )}
                    {shipment.in_transit_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.in_transit_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>في الطريق</span>
                      </div>
                    )}
                    {shipment.delivered_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.delivered_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>تم التسليم</span>
                      </div>
                    )}
                    {shipment.confirmed_at && (
                      <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                        <span>{format(new Date(shipment.confirmed_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</span>
                        <span>تم التأكيد</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(shipment.notes || shipment.generator_notes || shipment.recycler_notes || shipment.waste_description) && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-right">الملاحظات</h3>
                    <div className="space-y-2 text-sm">
                      {shipment.waste_description && (
                        <div className="p-3 bg-muted/50 rounded text-right">
                          <span className="font-medium">وصف النفايات: </span>
                          {shipment.waste_description}
                        </div>
                      )}
                      {shipment.notes && (
                        <div className="p-3 bg-muted/50 rounded text-right">
                          <span className="font-medium">ملاحظات عامة: </span>
                          {shipment.notes}
                        </div>
                      )}
                      {shipment.generator_notes && (
                        <div className="p-3 bg-blue-50 rounded text-right">
                          <span className="font-medium">ملاحظات المولد: </span>
                          {shipment.generator_notes}
                        </div>
                      )}
                      {shipment.recycler_notes && (
                        <div className="p-3 bg-green-50 rounded text-right">
                          <span className="font-medium">ملاحظات المدور: </span>
                          {shipment.recycler_notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Declaration Section */}
                {declarationData && (
                  <div className="space-y-3 border-t-2 border-primary/30 pt-4 mt-4">
                    <h3 className="font-bold text-right flex items-center gap-2 justify-end text-primary">
                      <FileCheck className="w-5 h-5" />
                      إقرار تسليم الشحنة
                    </h3>
                    <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3 text-sm text-right">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">المُقِر: </span><strong>{(declarationData as any).driver_name || 'غير محدد'}</strong></div>
                        <div><span className="text-muted-foreground">رقم الهوية: </span><strong>{(declarationData as any).driver_national_id || 'غير محدد'}</strong></div>
                        <div><span className="text-muted-foreground">تاريخ الإقرار: </span><strong>{(declarationData as any).declared_at ? format(new Date((declarationData as any).declared_at), 'dd/MM/yyyy hh:mm a', { locale: ar }) : '-'}</strong></div>
                        <div><span className="text-muted-foreground">رقم الوثيقة: </span><strong>DEC-{(declarationData as any).id?.slice(0, 8).toUpperCase()}</strong></div>
                      </div>
                      <div className="text-xs whitespace-pre-wrap leading-relaxed border-t pt-2 mt-2 max-h-32 overflow-hidden">
                        {(declarationData as any).declaration_text}
                      </div>
                      <div className="text-center text-xs text-muted-foreground border-t pt-2">
                        ✅ تم التوقيع إلكترونياً - وثيقة مسجلة ومحمية رقمياً
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <div className="flex items-center gap-2">
            <AddNoteButton resourceType="shipment" resourceId={shipment.id} />
            <SignDocumentButton
              documentType="shipment"
              documentId={shipment.id}
              documentTitle={`وثيقة شحنة ${shipment.shipment_number}`}
              variant="outline"
            />
            <ShareDocumentButton
              referenceId={shipment.shipment_number}
              referenceType="shipment"
              documentTitle={`وثيقة شحنة ${shipment.shipment_number}`}
              variant="outline"
            />
            <SendForSigningButton
              documentTitle={`وثيقة شحنة ${shipment.shipment_number}`}
              documentType="shipment"
              documentId={shipment.id}
              relatedShipmentId={shipment.id}
              variant="outline"
            />
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isPDFExporting} className="gap-2">
              {isPDFExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              تحميل PDF
            </Button>
            <Button variant="eco" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedShipmentPrintView;
