import { useRef } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import { ContractTemplate, partnerTypeLabels, contractCategoryLabels } from '@/hooks/useContractTemplates';

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
  const { exportToPDF, printContent, isExporting } = usePDFExport({
    filename: template?.name || 'template',
    orientation: 'portrait',
    format: 'a4',
  });

  if (!template) return null;

  const handlePrint = () => {
    printContent(printRef.current, `
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
      body { padding: 30px; direction: rtl; background: white; }
      .template-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #16a34a; padding-bottom: 20px; }
      .template-title { font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 8px; }
      .template-subtitle { font-size: 14px; color: #666; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 14px; font-weight: bold; color: #16a34a; margin-bottom: 8px; padding: 6px 12px; background: #f0fdf4; border-right: 4px solid #16a34a; }
      .section-content { font-size: 12px; line-height: 1.8; padding: 10px; background: #fafafa; border-radius: 4px; white-space: pre-wrap; }
      .badges { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
      .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; background: #e5e7eb; }
      .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #666; }
      @media print { body { padding: 20px; } }
    `);
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
          <div className="p-6 space-y-4" ref={printRef}>
            {/* Print Header */}
            <div className="template-header text-center pb-4 border-b-2 border-primary/20 print:block hidden">
              <h1 className="template-title text-2xl font-bold text-primary">{template.name}</h1>
              <p className="template-subtitle text-muted-foreground">{template.description}</p>
            </div>

            {/* Settings Icons */}
            <div className="flex items-center justify-center gap-6 py-3 bg-muted/30 rounded-lg">
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

            {/* Usage Stats */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mt-6">
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
    </Dialog>
  );
};

export default TemplatePreviewDialog;
