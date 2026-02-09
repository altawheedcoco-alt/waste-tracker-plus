import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Edit, 
  Printer, 
  FileDown, 
  Building2, 
  Recycle, 
  Users,
  Stamp,
  FileSignature,
  Image as ImageIcon,
  FileText,
  Scale,
  Clock,
  XCircle,
  Gavel,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Leaf
} from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import { ContractTemplate, partnerTypeLabels, contractCategoryLabels } from '@/hooks/useContractTemplates';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import logoImg from '@/assets/logo.png';
import PrintThemeSelector from '@/components/print/PrintThemeSelector';
import { type PrintThemeId } from '@/lib/printThemes';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | null;
  onEdit?: (template: ContractTemplate) => void;
}

const TemplatePreviewDialog = ({ 
  open, 
  onOpenChange, 
  template,
  onEdit 
}: TemplatePreviewDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const { exportToPDF, printWithTheme, isExporting } = usePDFExport({
    filename: template?.name || 'template',
    orientation: 'portrait',
    format: 'a4',
  });

  if (!template) return null;

  // Generate verification code for the template
  const verificationCode = `EG-I-RECYCLE-TPL-${template.id.substring(0, 8).toUpperCase()}`;
  
  // Get category color based on partner type
  const getCategoryColor = () => {
    if (template.partner_type === 'generator') return { bg: 'bg-blue-50', border: 'border-blue-300', accent: 'text-blue-700' };
    if (template.partner_type === 'recycler') return { bg: 'bg-green-50', border: 'border-green-300', accent: 'text-green-700' };
    return { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'text-amber-700' };
  };
  
  const categoryColor = getCategoryColor();

  const handlePrint = () => {
    setThemeOpen(true);
  };

  const handleExportPDF = () => {
    exportToPDF(printRef.current, template.name);
  };

  const SectionBlock = ({ 
    icon: Icon, 
    title, 
    content,
    highlight = false 
  }: { 
    icon: React.ElementType; 
    title: string; 
    content: string | null;
    highlight?: boolean;
  }) => {
    if (!content) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border overflow-hidden ${highlight ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}
      >
        <div className={`flex items-center gap-2 px-4 py-3 ${highlight ? 'bg-primary/10' : 'bg-muted/50'} border-b`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{content}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{template.name}</DialogTitle>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={template.template_type === 'system' ? 'secondary' : 'default'}>
                {template.template_type === 'system' ? 'قالب نظام' : 'قالب مخصص'}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {template.partner_type === 'generator' ? (
                  <Building2 className="w-3 h-3" />
                ) : template.partner_type === 'recycler' ? (
                  <Recycle className="w-3 h-3" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                {partnerTypeLabels[template.partner_type]}
              </Badge>
              <Badge variant="outline">
                {contractCategoryLabels[template.contract_category]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className={`p-6 space-y-4 ${categoryColor.bg}`} ref={printRef}>
            {/* Enhanced Print Header with Logo, QR, Barcode */}
            <div className="print-header flex items-start justify-between pb-4 border-b-2 border-primary/30 mb-4">
              {/* QR Code Section */}
              <div className="print-qr-section text-center">
                <QRCodeSVG
                  value={`${window.location.origin}/verify?type=template&code=${verificationCode}`}
                  size={70}
                  level="M"
                  includeMargin={false}
                />
                <p className="text-[10px] mt-1 text-muted-foreground">امسح للتحقق</p>
              </div>

              {/* Title Section with Logo */}
              <div className="print-title-section text-center flex-1 px-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img src={logoImg} alt="آي ريسايكل" className="h-10 object-contain" />
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h1 className="print-title text-xl font-bold text-primary">{template.name}</h1>
                {template.description && (
                  <p className="print-subtitle text-sm text-muted-foreground">{template.description}</p>
                )}
                <div className="print-verification mt-2 inline-block bg-primary/10 border border-primary/30 rounded px-3 py-1">
                  <span className="text-xs">رقم التحقق: </span>
                  <span className="font-mono font-bold text-primary text-sm">{verificationCode}</span>
                </div>
              </div>

              {/* Barcode Section */}
              <div className="print-barcode-section text-center">
                <Barcode
                  value={verificationCode}
                  width={1}
                  height={35}
                  fontSize={8}
                  displayValue={false}
                />
                <p className="text-[9px] font-mono mt-1">{verificationCode}</p>
              </div>
            </div>

            {/* Confidential Banner */}
            <div className="confidential-banner bg-destructive text-destructive-foreground text-center py-2 px-4 rounded-md flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-semibold text-sm">هذه الوثيقة سرية ومؤمنة - يُحظر نسخها أو توزيعها دون إذن</span>
              <Shield className="w-4 h-4" />
            </div>

            {/* Settings Icons */}
            <div className={`flex items-center justify-center gap-6 py-3 rounded-lg border ${categoryColor.border}`}>
              <div className={`flex items-center gap-2 text-sm ${template.include_header_logo ? 'text-primary' : 'text-muted-foreground/50'}`}>
                <ImageIcon className="w-4 h-4" />
                <span>شعار</span>
                {template.include_header_logo && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className={`flex items-center gap-2 text-sm ${template.include_stamp ? 'text-primary' : 'text-muted-foreground/50'}`}>
                <Stamp className="w-4 h-4" />
                <span>ختم</span>
                {template.include_stamp && <CheckCircle2 className="w-3 h-3" />}
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className={`flex items-center gap-2 text-sm ${template.include_signature ? 'text-primary' : 'text-muted-foreground/50'}`}>
                <FileSignature className="w-4 h-4" />
                <span>توقيع</span>
                {template.include_signature && <CheckCircle2 className="w-3 h-3" />}
              </div>
            </div>

            {/* Contract Sections */}
            <div className="space-y-4">
              <SectionBlock 
                icon={FileText} 
                title="ترويسة العقد" 
                content={template.header_text}
                highlight
              />
              
              <SectionBlock 
                icon={FileText} 
                title="المقدمة والتمهيد" 
                content={template.introduction_text}
              />

              <SectionBlock 
                icon={Scale} 
                title="البنود والشروط العامة" 
                content={template.terms_template}
                highlight
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionBlock 
                  icon={Building2} 
                  title="التزامات الطرف الأول (الناقل)" 
                  content={template.obligations_party_one}
                />
                <SectionBlock 
                  icon={Users} 
                  title="التزامات الطرف الثاني (الشريك)" 
                  content={template.obligations_party_two}
                />
              </div>

              <SectionBlock 
                icon={CreditCard} 
                title="شروط الدفع والمقابل المادي" 
                content={template.payment_terms_template}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionBlock 
                  icon={Clock} 
                  title="مدة العقد" 
                  content={template.duration_clause}
                />
                <SectionBlock 
                  icon={XCircle} 
                  title="شروط الإنهاء" 
                  content={template.termination_clause}
                />
              </div>

              <SectionBlock 
                icon={Gavel} 
                title="حل النزاعات" 
                content={template.dispute_resolution}
              />

              <SectionBlock 
                icon={FileSignature} 
                title="الختام والتوقيعات" 
                content={template.closing_text}
                highlight
              />
            </div>

            {/* Platform Rights Section */}
            <div className="platform-rights mt-6 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary rounded-lg">
              <div className="platform-rights-title flex items-center justify-center gap-2 text-primary font-bold mb-3">
                <Shield className="w-5 h-5" />
                <span>ضمان حقوق المنصة</span>
                <Shield className="w-5 h-5" />
              </div>
              <div className="platform-rights-content text-center text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>هذا القالب مملوك لمنصة <strong className="text-primary">آي ريسايكل</strong> وهو محمي بموجب قوانين الملكية الفكرية المصرية.</p>
                <p>يُحظر نسخ أو توزيع أو تعديل هذا القالب دون الحصول على إذن كتابي مسبق من إدارة المنصة.</p>
                <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة آي ريسايكل لإدارة المخلفات وإعادة التدوير</p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mt-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                <span>عدد مرات الاستخدام: {template.usage_count}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                آخر تحديث: {new Date(template.updated_at).toLocaleDateString('ar-EG')}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              حفظ PDF
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            {template.template_type === 'custom' && onEdit && (
              <Button onClick={() => { onOpenChange(false); onEdit(template); }} className="gap-2">
                <Edit className="w-4 h-4" />
                تعديل القالب
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <PrintThemeSelector
        open={themeOpen}
        onOpenChange={setThemeOpen}
        onSelect={(themeId) => printWithTheme(printRef.current, themeId)}
      />
    </Dialog>
  );
};

export default TemplatePreviewDialog;
