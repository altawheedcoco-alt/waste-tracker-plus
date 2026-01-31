import { useRef, useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StampSignatureSettings, { StampSignatureConfig, defaultConfig } from './StampSignatureSettings';
import { usePDFExport } from '@/hooks/usePDFExport';

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
  
  const { exportToPDF, isExporting: isPDFExporting } = usePDFExport({
    filename: `شحنة-${shipment?.shipment_number || 'document'}`,
    orientation: 'portrait',
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
  const qrData = `${window.location.origin}/verify?type=shipment&code=${shipment.shipment_number}`;

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
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>وثيقة الشحنة - ${documentSerial}</title>
        <style>
          @page {
            size: A4;
            margin: 5mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 5px;
            direction: rtl;
            background: white;
            color: #1a1a1a;
            font-size: 9px;
            line-height: 1.2;
          }
          /* Security Features */
          .document-wrapper {
            position: relative;
            background: white;
            border: 2px solid #16a34a;
            border-radius: 4px;
            padding: 8px;
            overflow: hidden;
            min-height: calc(100vh - 10mm);
          }
          .security-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 0;
            opacity: 0.03;
            background-image: 
              repeating-linear-gradient(45deg, #16a34a 0px, #16a34a 1px, transparent 1px, transparent 8px),
              repeating-linear-gradient(-45deg, #16a34a 0px, #16a34a 1px, transparent 1px, transparent 8px);
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 50px;
            font-weight: bold;
            color: rgba(22, 163, 74, 0.04);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            user-select: none;
          }
          .security-border {
            position: absolute;
            top: 3px;
            left: 3px;
            right: 3px;
            bottom: 3px;
            border: 1px dashed rgba(22, 163, 74, 0.3);
            border-radius: 3px;
            pointer-events: none;
            z-index: 0;
          }
          .security-corner {
            position: absolute;
            width: 15px;
            height: 15px;
            border: 2px solid #16a34a;
            z-index: 1;
          }
          .security-corner.top-right { top: 5px; right: 5px; border-left: none; border-bottom: none; }
          .security-corner.top-left { top: 5px; left: 5px; border-right: none; border-bottom: none; }
          .security-corner.bottom-right { bottom: 5px; right: 5px; border-left: none; border-top: none; }
          .security-corner.bottom-left { bottom: 5px; left: 5px; border-right: none; border-top: none; }
          .security-strip {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            background: repeating-linear-gradient(0deg, #16a34a 0px, #16a34a 3px, #dcfce7 3px, #dcfce7 6px);
            z-index: 1;
          }
          .verification-badge {
            position: absolute;
            bottom: 8px;
            left: 8px;
            background: linear-gradient(135deg, #16a34a, #22c55e);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
            z-index: 2;
          }
          .document-content {
            position: relative;
            z-index: 1;
          }
          .document-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #16a34a;
          }
          .header-right, .header-left {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 8px;
          }
          .header-center h1 {
            font-size: 14px;
            color: #16a34a;
            margin-bottom: 3px;
          }
          .org-logo, .logo-placeholder {
            width: 45px;
            height: 45px;
            object-fit: contain;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
            background: white;
          }
          .doc-serial {
            font-size: 7px;
            color: #666;
            margin-bottom: 2px;
          }
          .shipment-number {
            font-size: 10px;
            font-family: monospace;
            background: #f0fdf4;
            padding: 2px 6px;
            border-radius: 3px;
            display: inline-block;
          }
          .qr-container {
            background: white;
            padding: 3px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          .qr-container svg, .qr-container canvas {
            width: 50px !important;
            height: 50px !important;
          }
          .barcode-container svg {
            height: 30px !important;
          }
          .section {
            margin-bottom: 6px;
          }
          .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 4px;
            padding-bottom: 2px;
            border-bottom: 1px solid #e5e7eb;
          }
          .grid { display: grid; gap: 4px; }
          .grid-2 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(3, 1fr); }
          .grid-4 { grid-template-columns: repeat(4, 1fr); }
          .info-box {
            background: #f9fafb;
            padding: 4px;
            border-radius: 3px;
            border: 1px solid #e5e7eb;
          }
          .info-label {
            font-size: 7px;
            color: #6b7280;
            margin-bottom: 1px;
          }
          .info-value {
            font-size: 8px;
            font-weight: 500;
          }
          .company-card {
            background: #f9fafb;
            padding: 6px;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
          }
          .company-title {
            font-weight: bold;
            margin-bottom: 3px;
            color: #374151;
            font-size: 9px;
          }
          .company-info {
            font-size: 8px;
            color: #6b7280;
            line-height: 1.3;
          }
          .signature-area {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dashed #e5e7eb;
          }
          .signature-box {
            text-align: center;
            padding: 4px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 8px;
          }
          .signature-line {
            border-top: 1px solid #374151;
            margin-top: 20px;
            padding-top: 2px;
            font-size: 7px;
            color: #6b7280;
          }
          .stamp-area {
            width: 40px;
            height: 40px;
            border: 1px dashed #d1d5db;
            border-radius: 50%;
            margin: 4px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #9ca3af;
          }
          .stamp-area img {
            max-width: 100%;
            max-height: 100%;
          }
          .footer {
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 7px;
          }
          .status-badge {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 999px;
            font-size: 8px;
            font-weight: 500;
            background: #dcfce7;
            color: #166534;
          }
          /* Compact grids for organization data */
          .org-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3px;
            font-size: 7px;
          }
          .org-grid .org-name {
            grid-column: span 3;
            font-size: 9px;
            font-weight: bold;
          }
          .org-grid .org-field {
            display: flex;
            flex-direction: column;
          }
          .org-grid .org-field .label {
            color: #6b7280;
            font-size: 6px;
          }
          .org-grid .org-field .value {
            font-weight: 500;
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
            }
            body { 
              padding: 0; 
              margin: 0;
            }
            .no-print { display: none; }
            .document-wrapper { 
              border: 2px solid #16a34a !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .security-pattern, .watermark, .security-border, .security-corner, .security-strip, .verification-badge { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        <div class="document-wrapper">
          <div class="security-pattern"></div>
          <div class="watermark">وثيقة رسمية - ${documentSerial}</div>
          <div class="security-border"></div>
          <div class="security-corner top-right"></div>
          <div class="security-corner top-left"></div>
          <div class="security-corner bottom-right"></div>
          <div class="security-corner bottom-left"></div>
          <div class="security-strip"></div>
          <div class="verification-badge">✓ كود التحقق: ${verificationCode}</div>
          <div class="document-content">
            ${printContent.innerHTML}
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
              {/* Print Preview with Security Features */}
              <div 
                ref={printRef}
                className="document-wrapper relative bg-white p-6 rounded-lg border-[3px] border-primary text-foreground print-content overflow-hidden"
                style={{ direction: 'rtl' }}
              >
                {/* Security Pattern Background */}
                <div 
                  className="security-pattern absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(45deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 1px, transparent 1px, transparent 10px),
                      repeating-linear-gradient(-45deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 1px, transparent 1px, transparent 10px)
                    `
                  }}
                />
                
                {/* Watermark */}
                <div className="watermark absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[60px] font-bold text-primary/[0.04] whitespace-nowrap pointer-events-none z-0 select-none">
                  وثيقة رسمية - {documentSerial}
                </div>
                
                {/* Security Border */}
                <div className="security-border absolute inset-[5px] border border-dashed border-primary/30 rounded-md pointer-events-none z-0" />
                
                {/* Security Corners */}
                <div className="security-corner absolute top-[10px] right-[10px] w-[30px] h-[30px] border-2 border-primary border-l-0 border-b-0 z-10" />
                <div className="security-corner absolute top-[10px] left-[10px] w-[30px] h-[30px] border-2 border-primary border-r-0 border-b-0 z-10" />
                <div className="security-corner absolute bottom-[10px] right-[10px] w-[30px] h-[30px] border-2 border-primary border-l-0 border-t-0 z-10" />
                <div className="security-corner absolute bottom-[10px] left-[10px] w-[30px] h-[30px] border-2 border-primary border-r-0 border-t-0 z-10" />
                
                {/* Security Strip */}
                <div 
                  className="security-strip absolute right-0 top-0 bottom-0 w-2 z-10"
                  style={{
                    background: 'repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 5px, hsl(var(--primary) / 0.2) 5px, hsl(var(--primary) / 0.2) 10px)'
                  }}
                />
                
                {/* Verification Badge */}
                <div className="verification-badge absolute bottom-[15px] left-[15px] bg-gradient-to-br from-primary to-green-500 text-white px-3 py-1.5 rounded text-[9px] font-bold z-20 shadow-md">
                  ✓ كود التحقق: {verificationCode}
                </div>
                
                {/* Document Content */}
                <div className="document-content relative z-[1]">
                  {/* Document Header with QR and Logo */}
                  <div className="document-header flex justify-between items-start mb-6 pb-4 border-b-2 border-primary">
                  {/* Left side - QR Code and Barcode */}
                  <div className="header-left flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      {/* QR Code */}
                      <div className="qr-container bg-white p-2 border rounded-lg">
                        <QRCodeSVG value={qrData} size={70} level="M" />
                      </div>
                      {/* Linear Barcode */}
                      <div className="barcode-container bg-white p-1 border rounded-lg overflow-hidden">
                        <Barcode 
                          value={shipment.shipment_number.replace('SHP-', '')} 
                          width={1}
                          height={50}
                          fontSize={8}
                          margin={2}
                          displayValue={false}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{documentSerial}</span>
                  </div>
                  
                  {/* Center - Document Title and Info */}
                  <div className="header-center text-center flex-1 px-4">
                    <p className="doc-serial text-xs text-muted-foreground mb-1">رقم الوثيقة: {documentSerial}</p>
                    <h1 className="text-xl font-bold text-primary mb-2">بيان نقل نفايات</h1>
                    <div className="shipment-number inline-block bg-primary/10 px-3 py-1 rounded-lg font-mono text-base">
                      {shipment.shipment_number}
                    </div>
                    <div className="mt-2">
                      <span className="status-badge inline-block px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right side - Organization Logo */}
                  <div className="header-right flex flex-col items-center gap-2">
                    {shipment.generator?.logo_url ? (
                      <img 
                        src={shipment.generator.logo_url} 
                        alt={shipment.generator.name}
                        className="w-20 h-20 object-contain rounded-lg border bg-white p-1"
                      />
                    ) : shipment.transporter?.logo_url ? (
                      <img 
                        src={shipment.transporter.logo_url} 
                        alt={shipment.transporter.name}
                        className="w-20 h-20 object-contain rounded-lg border bg-white p-1"
                      />
                    ) : shipment.recycler?.logo_url ? (
                      <img 
                        src={shipment.recycler.logo_url} 
                        alt={shipment.recycler.name}
                        className="w-20 h-20 object-contain rounded-lg border bg-white p-1"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                        <Factory className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground text-center max-w-20 truncate">
                      {shipment.generator?.name || 'الشعار'}
                    </span>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="section mb-5">
                  <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                    معلومات الشحنة الأساسية
                    <Package className="w-4 h-4" />
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="info-box bg-muted/50 p-3 rounded-lg border">
                      <div className="info-label text-xs text-muted-foreground mb-1">نوع النفايات</div>
                      <div className="info-value font-medium text-sm">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</div>
                    </div>
                    <div className="info-box bg-muted/50 p-3 rounded-lg border">
                      <div className="info-label text-xs text-muted-foreground mb-1">الكمية</div>
                      <div className="info-value font-medium text-sm">{shipment.quantity} {shipment.unit}</div>
                    </div>
                    <div className="info-box bg-muted/50 p-3 rounded-lg border">
                      <div className="info-label text-xs text-muted-foreground mb-1">مستوى الخطورة</div>
                      <div className="info-value font-medium text-sm">{shipment.hazard_level ? hazardLabels[shipment.hazard_level] || shipment.hazard_level : '-'}</div>
                    </div>
                    <div className="info-box bg-muted/50 p-3 rounded-lg border">
                      <div className="info-label text-xs text-muted-foreground mb-1">تاريخ الإنشاء</div>
                      <div className="info-value font-medium text-sm">{format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}</div>
                    </div>
                  </div>
                  
                  {(shipment.packaging_method || shipment.disposal_method) && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {shipment.packaging_method && (
                        <div className="info-box bg-muted/50 p-3 rounded-lg border">
                          <div className="info-label text-xs text-muted-foreground mb-1">طريقة التغليف</div>
                          <div className="info-value font-medium text-sm">{packagingLabels[shipment.packaging_method] || shipment.packaging_method}</div>
                        </div>
                      )}
                      {shipment.disposal_method && (
                        <div className="info-box bg-muted/50 p-3 rounded-lg border">
                          <div className="info-label text-xs text-muted-foreground mb-1">طريقة التخلص</div>
                          <div className="info-value font-medium text-sm">{disposalLabels[shipment.disposal_method] || shipment.disposal_method}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Addresses */}
                <div className="section mb-5">
                  <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                    عناوين الشحنة
                    <MapPin className="w-4 h-4" />
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="info-box bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200">
                      <div className="info-label text-xs text-blue-600 mb-1 flex items-center gap-1 justify-end">
                        عنوان الاستلام
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div className="info-value font-medium text-sm">{shipment.pickup_address}</div>
                      {shipment.pickup_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          التاريخ: {format(new Date(shipment.pickup_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                      )}
                    </div>
                    <div className="info-box bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200">
                      <div className="info-label text-xs text-green-600 mb-1 flex items-center gap-1 justify-end">
                        عنوان التسليم
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div className="info-value font-medium text-sm">{shipment.delivery_address}</div>
                      {shipment.expected_delivery_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          المتوقع: {format(new Date(shipment.expected_delivery_date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generator Organization */}
                <div className="section mb-5">
                  <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                    بيانات الجهة المولدة للمخلفات
                    <Factory className="w-4 h-4" />
                  </h3>
                  {shipment.generator ? (
                    <div className="company-card bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">اسم الجهة</div>
                          <div className="info-value font-bold text-base flex items-center gap-2 flex-wrap">
                            {shipment.generator.name}
                            {shipment.generator.client_code && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">
                                🆔 {shipment.generator.client_code}
                              </span>
                            )}
                          </div>
                          {shipment.generator.name_en && (
                            <div className="text-muted-foreground text-xs" dir="ltr">{shipment.generator.name_en}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">السجل التجاري</div>
                          <div className="info-value font-medium">س.ت: {shipment.generator.commercial_register || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">رقم الموافقة البيئية</div>
                          <div className="info-value font-medium">م.ب: {shipment.generator.environmental_license || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">النشاط المسجل</div>
                          <div className="info-value font-medium">{shipment.generator.activity_type || 'غير متوفر'}</div>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">العنوان</div>
                          <div className="info-value font-medium">
                            {shipment.generator.address}
                            {shipment.generator.city && ` - ${shipment.generator.city}`}
                            {shipment.generator.region && ` - ${shipment.generator.region}`}
                          </div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">الهاتف</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.generator.phone}</div>
                          {shipment.generator.secondary_phone && (
                            <div className="text-muted-foreground" dir="ltr">{shipment.generator.secondary_phone}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">البريد الإلكتروني</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.generator.email || 'غير متوفر'}</div>
                        </div>
                        {shipment.generator.representative_name && (
                          <div>
                            <div className="info-label text-muted-foreground mb-1">الممثل القانوني</div>
                            <div className="info-value font-medium">{shipment.generator.representative_name}</div>
                            {shipment.generator.representative_position && (
                              <div className="text-muted-foreground">{shipment.generator.representative_position}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">غير محدد</p>
                  )}
                </div>

                {/* Transporter Organization */}
                <div className="section mb-5">
                  <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                    بيانات الجهة الناقلة
                    <Truck className="w-4 h-4" />
                  </h3>
                  {shipment.transporter ? (
                    <div className="company-card bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">اسم الناقل</div>
                          <div className="info-value font-bold text-base flex items-center gap-2 flex-wrap">
                            {shipment.transporter.name}
                            {shipment.transporter.client_code && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-mono rounded">
                                🆔 {shipment.transporter.client_code}
                              </span>
                            )}
                          </div>
                          {shipment.transporter.name_en && (
                            <div className="text-muted-foreground text-xs" dir="ltr">{shipment.transporter.name_en}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">السجل التجاري</div>
                          <div className="info-value font-medium">س.ت: {shipment.transporter.commercial_register || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">رقم الموافقة البيئية</div>
                          <div className="info-value font-medium">م.ب: {shipment.transporter.environmental_license || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">النشاط المسجل</div>
                          <div className="info-value font-medium">{shipment.transporter.activity_type || 'غير متوفر'}</div>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">العنوان</div>
                          <div className="info-value font-medium">
                            {shipment.transporter.address}
                            {shipment.transporter.city && ` - ${shipment.transporter.city}`}
                            {shipment.transporter.region && ` - ${shipment.transporter.region}`}
                          </div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">الهاتف</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.transporter.phone}</div>
                          {shipment.transporter.secondary_phone && (
                            <div className="text-muted-foreground" dir="ltr">{shipment.transporter.secondary_phone}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">البريد الإلكتروني</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.transporter.email || 'غير متوفر'}</div>
                        </div>
                        {shipment.transporter.representative_name && (
                          <div>
                            <div className="info-label text-muted-foreground mb-1">الممثل القانوني</div>
                            <div className="info-value font-medium">{shipment.transporter.representative_name}</div>
                            {shipment.transporter.representative_position && (
                              <div className="text-muted-foreground">{shipment.transporter.representative_position}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">غير محدد</p>
                  )}
                </div>

                {/* Recycler Organization */}
                <div className="section mb-5">
                  <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                    بيانات جهة التدوير
                    <Recycle className="w-4 h-4" />
                  </h3>
                  {shipment.recycler ? (
                    <div className="company-card bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">اسم الجهة</div>
                          <div className="info-value font-bold text-base flex items-center gap-2 flex-wrap">
                            {shipment.recycler.name}
                            {shipment.recycler.client_code && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-mono rounded">
                                🆔 {shipment.recycler.client_code}
                              </span>
                            )}
                          </div>
                          {shipment.recycler.name_en && (
                            <div className="text-muted-foreground text-xs" dir="ltr">{shipment.recycler.name_en}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">السجل التجاري</div>
                          <div className="info-value font-medium">س.ت: {shipment.recycler.commercial_register || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">رقم الموافقة البيئية</div>
                          <div className="info-value font-medium">م.ب: {shipment.recycler.environmental_license || 'غير متوفر'}</div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">النشاط المسجل</div>
                          <div className="info-value font-medium">{shipment.recycler.activity_type || 'غير متوفر'}</div>
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <div className="info-label text-muted-foreground mb-1">العنوان</div>
                          <div className="info-value font-medium">
                            {shipment.recycler.address}
                            {shipment.recycler.city && ` - ${shipment.recycler.city}`}
                            {shipment.recycler.region && ` - ${shipment.recycler.region}`}
                          </div>
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">الهاتف</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.recycler.phone}</div>
                          {shipment.recycler.secondary_phone && (
                            <div className="text-muted-foreground" dir="ltr">{shipment.recycler.secondary_phone}</div>
                          )}
                        </div>
                        <div>
                          <div className="info-label text-muted-foreground mb-1">البريد الإلكتروني</div>
                          <div className="info-value font-medium" dir="ltr">{shipment.recycler.email || 'غير متوفر'}</div>
                        </div>
                        {shipment.recycler.representative_name && (
                          <div>
                            <div className="info-label text-muted-foreground mb-1">الممثل القانوني</div>
                            <div className="info-value font-medium">{shipment.recycler.representative_name}</div>
                            {shipment.recycler.representative_position && (
                              <div className="text-muted-foreground">{shipment.recycler.representative_position}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">غير محدد</p>
                  )}
                </div>

                {/* Driver Info */}
                {(shipment.driver || shipment.manual_driver_name) && (
                  <div className="section mb-5">
                    <h3 className="section-title text-primary font-bold mb-3 pb-2 border-b text-sm flex items-center gap-2 justify-end">
                      معلومات السائق
                      <User className="w-4 h-4" />
                    </h3>
                    <div className="info-box bg-muted/30 p-3 rounded-lg border max-w-md mr-auto">
                      {shipment.driver ? (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{shipment.driver.profile?.full_name}</p>
                          {shipment.driver.profile?.phone && (
                            <p className="text-muted-foreground" dir="ltr">{shipment.driver.profile.phone}</p>
                          )}
                          <p className="text-muted-foreground">رقم الرخصة: {shipment.driver.license_number}</p>
                          {shipment.driver.vehicle_plate && (
                            <p className="text-muted-foreground">لوحة المركبة: {shipment.driver.vehicle_plate}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">{shipment.manual_driver_name}</p>
                          {shipment.manual_vehicle_plate && (
                            <p className="text-muted-foreground">لوحة المركبة: {shipment.manual_vehicle_plate}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Signature Area */}
                <div className={`signature-area ${getLayoutClass()} mt-10 pt-6 border-t border-dashed`}>
                  <div className={`signature-box text-center ${stampConfig.layout === 'compact' ? 'p-2' : 'p-4'} border rounded-lg`}>
                    {stampConfig.showLabels && (
                      <div className="signature-title font-bold text-xs mb-1">الشركة المولدة</div>
                    )}
                    <div 
                      className={`stamp-area ${getBorderClass()} rounded-full mx-auto my-2 flex items-center justify-center text-xs text-muted-foreground overflow-hidden p-1`}
                      style={getStampStyle()}
                    >
                      {shipment.generator?.stamp_url ? (
                        <img 
                          src={shipment.generator.stamp_url} 
                          alt="ختم المولد" 
                          className="w-full h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                      ) : (
                        'الختم'
                      )}
                    </div>
                    <div 
                      className="signature-line border-t mt-4 pt-2 flex items-center justify-center"
                      style={{ height: `${stampConfig.signatureSize + 16}px` }}
                    >
                      {shipment.generator?.signature_url ? (
                        <img 
                          src={shipment.generator.signature_url} 
                          alt="توقيع المولد" 
                          className="max-w-full object-contain"
                          style={{ maxHeight: `${stampConfig.signatureSize}px`, width: 'auto' }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">التوقيع والتاريخ</span>
                      )}
                    </div>
                  </div>
                  <div className={`signature-box text-center ${stampConfig.layout === 'compact' ? 'p-2' : 'p-4'} border rounded-lg`}>
                    {stampConfig.showLabels && (
                      <div className="signature-title font-bold text-xs mb-1">شركة النقل</div>
                    )}
                    <div 
                      className={`stamp-area ${getBorderClass()} rounded-full mx-auto my-2 flex items-center justify-center text-xs text-muted-foreground overflow-hidden p-1`}
                      style={getStampStyle()}
                    >
                      {shipment.transporter?.stamp_url ? (
                        <img 
                          src={shipment.transporter.stamp_url} 
                          alt="ختم الناقل" 
                          className="w-full h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                      ) : (
                        'الختم'
                      )}
                    </div>
                    <div 
                      className="signature-line border-t mt-4 pt-2 flex items-center justify-center"
                      style={{ height: `${stampConfig.signatureSize + 16}px` }}
                    >
                      {shipment.transporter?.signature_url ? (
                        <img 
                          src={shipment.transporter.signature_url} 
                          alt="توقيع الناقل" 
                          className="max-w-full object-contain"
                          style={{ maxHeight: `${stampConfig.signatureSize}px`, width: 'auto' }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">التوقيع والتاريخ</span>
                      )}
                    </div>
                  </div>
                  <div className={`signature-box text-center ${stampConfig.layout === 'compact' ? 'p-2' : 'p-4'} border rounded-lg`}>
                    {stampConfig.showLabels && (
                      <div className="signature-title font-bold text-xs mb-1">جهة إعادة التدوير</div>
                    )}
                    <div 
                      className={`stamp-area ${getBorderClass()} rounded-full mx-auto my-2 flex items-center justify-center text-xs text-muted-foreground overflow-hidden p-1`}
                      style={getStampStyle()}
                    >
                      {shipment.recycler?.stamp_url ? (
                        <img 
                          src={shipment.recycler.stamp_url} 
                          alt="ختم المدور" 
                          className="w-full h-full object-contain"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                      ) : (
                        'الختم'
                      )}
                    </div>
                    <div 
                      className="signature-line border-t mt-4 pt-2 flex items-center justify-center"
                      style={{ height: `${stampConfig.signatureSize + 16}px` }}
                    >
                      {shipment.recycler?.signature_url ? (
                        <img 
                          src={shipment.recycler.signature_url} 
                          alt="توقيع المدور" 
                          className="max-w-full object-contain"
                          style={{ maxHeight: `${stampConfig.signatureSize}px`, width: 'auto' }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">التوقيع والتاريخ</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                  <p>تم إنشاء هذه الوثيقة إلكترونياً - {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                  <p className="mt-1">رقم الوثيقة: {documentSerial} | رقم الشحنة: {shipment.shipment_number}</p>
                  <p className="mt-1 font-mono text-[10px] text-primary/70">كود التحقق: {verificationCode}</p>
                </div>
                </div>{/* End document-content */}
              </div>{/* End document-wrapper */}
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
                      <span>{format(new Date(shipment.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                      <span>تم الإنشاء</span>
                    </div>
                    {shipment.approved_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.approved_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        <span>تمت الموافقة</span>
                      </div>
                    )}
                    {shipment.collection_started_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.collection_started_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        <span>بدء التجميع</span>
                      </div>
                    )}
                    {shipment.in_transit_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.in_transit_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        <span>في الطريق</span>
                      </div>
                    )}
                    {shipment.delivered_at && (
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{format(new Date(shipment.delivered_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
                        <span>تم التسليم</span>
                      </div>
                    )}
                    {shipment.confirmed_at && (
                      <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                        <span>{format(new Date(shipment.confirmed_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</span>
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
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          <div className="flex items-center gap-2">
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
