import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, 
  Printer,
  Download,
  Loader2,
  Building2,
  CalendarDays,
  Stamp,
  FileSignature
} from 'lucide-react';
import { ContractTemplate, contractCategoryLabels } from '@/hooks/useContractTemplates';
import { usePDFExport } from '@/hooks/usePDFExport';
import PrintThemeSelector from '@/components/print/PrintThemeSelector';
import { type PrintThemeId } from '@/lib/printThemes';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';

interface ContractPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ContractTemplate | null;
  partner: any;
  organization: any;
  contractNumber: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  value: string;
  customTerms: string;
  onSave: () => void;
  saving: boolean;
}

const ContractPreview = ({
  open,
  onOpenChange,
  template,
  partner,
  organization,
  contractNumber,
  startDate,
  endDate,
  value,
  customTerms,
  onSave,
  saving
}: ContractPreviewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const { exportToPDF, printContent, printWithTheme, isExporting } = usePDFExport({
    filename: `عقد_${contractNumber}`,
    orientation: 'portrait',
    scale: 2
  });

  const today = format(new Date(), 'dd MMMM yyyy', { locale: ar });

  const printStyles = `
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    body { font-family: 'Cairo', 'Tajawal', sans-serif; direction: rtl; }
    .contract-content { max-width: 100%; }
    .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .party-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
  `;

  if (!template) return null;

  const replaceVariables = (text: string | null) => {
    if (!text) return '';
    return text
      .replace(/\{التاريخ\}/g, today)
      .replace(/\{اسم_الطرف_الأول\}/g, organization?.name || 'الطرف الأول')
      .replace(/\{اسم_الطرف_الثاني\}/g, partner?.name || 'الطرف الثاني')
      .replace(/\{عنوان_الطرف_الأول\}/g, organization?.address || '')
      .replace(/\{عنوان_الطرف_الثاني\}/g, partner?.address || '')
      .replace(/\{ممثل_الطرف_الأول\}/g, organization?.representative_name || '')
      .replace(/\{ممثل_الطرف_الثاني\}/g, partner?.representative_name || '')
      .replace(/\{رقم_العقد\}/g, contractNumber)
      .replace(/\{قيمة_العقد\}/g, value ? `${parseFloat(value).toLocaleString()} جنيه مصري` : '')
      .replace(/\{تاريخ_البداية\}/g, startDate ? format(startDate, 'dd/MM/yyyy') : '')
      .replace(/\{تاريخ_الانتهاء\}/g, endDate ? format(endDate, 'dd/MM/yyyy') : '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            معاينة العقد
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[65vh]">
          <div 
            ref={printRef} 
            className="bg-white p-8 text-black contract-content"
            dir="rtl"
            style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              {template.include_header_logo && organization?.logo_url && (
                <img 
                  src={organization.logo_url} 
                  alt="Logo" 
                  className="h-16 mx-auto mb-4"
                  crossOrigin="anonymous"
                />
              )}
              <h1 className="text-2xl font-bold mb-2">
                {replaceVariables(template.header_text) || template.name}
              </h1>
              <p className="text-muted-foreground">
                رقم العقد: {contractNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {contractCategoryLabels[template.contract_category]}
              </p>
            </div>

            {/* Contract Info */}
            <div className="flex items-center justify-between text-sm mb-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>التاريخ: {today}</span>
              </div>
              {startDate && endDate && (
                <div className="flex items-center gap-2">
                  <span>من {format(startDate, 'dd/MM/yyyy')} إلى {format(endDate, 'dd/MM/yyyy')}</span>
                </div>
              )}
              {value && (
                <div className="font-medium">
                  القيمة: {parseFloat(value).toLocaleString()} EGP
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  الطرف الأول
                </h3>
                <p className="font-medium">{organization?.name}</p>
                {organization?.address && <p className="text-sm text-muted-foreground">{organization.address}</p>}
                {organization?.representative_name && (
                  <p className="text-sm">الممثل القانوني: {organization.representative_name}</p>
                )}
                {organization?.commercial_register && (
                  <p className="text-sm">السجل التجاري: {organization.commercial_register}</p>
                )}
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  الطرف الثاني
                </h3>
                <p className="font-medium">{partner?.name}</p>
                {partner?.address && <p className="text-sm text-muted-foreground">{partner.address}</p>}
                {partner?.representative_name && (
                  <p className="text-sm">الممثل القانوني: {partner.representative_name}</p>
                )}
                {partner?.commercial_register && (
                  <p className="text-sm">السجل التجاري: {partner.commercial_register}</p>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Introduction */}
            {template.introduction_text && (
              <div className="mb-6">
                <p className="leading-relaxed whitespace-pre-line">
                  {replaceVariables(template.introduction_text)}
                </p>
              </div>
            )}

            {/* Terms */}
            {template.terms_template && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">الشروط والأحكام</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.terms_template)}
                </div>
              </div>
            )}

            {/* Obligations Party One */}
            {template.obligations_party_one && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">التزامات الطرف الأول</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.obligations_party_one)}
                </div>
              </div>
            )}

            {/* Obligations Party Two */}
            {template.obligations_party_two && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">التزامات الطرف الثاني</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.obligations_party_two)}
                </div>
              </div>
            )}

            {/* Payment Terms */}
            {template.payment_terms_template && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">شروط الدفع</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.payment_terms_template)}
                </div>
              </div>
            )}

            {/* Duration */}
            {template.duration_clause && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">مدة العقد</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.duration_clause)}
                </div>
              </div>
            )}

            {/* Termination */}
            {template.termination_clause && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">إنهاء العقد</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.termination_clause)}
                </div>
              </div>
            )}

            {/* Dispute Resolution */}
            {template.dispute_resolution && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">فض النزاعات</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {replaceVariables(template.dispute_resolution)}
                </div>
              </div>
            )}

            {/* Custom Terms */}
            {customTerms && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">شروط إضافية</h3>
                <div className="whitespace-pre-line leading-relaxed">
                  {customTerms}
                </div>
              </div>
            )}

            {/* Closing */}
            {template.closing_text && (
              <div className="mb-8">
                <p className="leading-relaxed whitespace-pre-line">
                  {replaceVariables(template.closing_text)}
                </p>
              </div>
            )}

            <Separator className="my-8" />

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div className="text-center">
                <p className="font-bold mb-4">الطرف الأول</p>
                <p className="mb-2">{organization?.name}</p>
                {template.include_signature && (
                  <div className="h-20 border-b border-dashed border-muted-foreground/40 mb-2 flex items-end justify-center">
                    {organization?.signature_url && (
                      <img 
                        src={organization.signature_url} 
                        alt="Signature" 
                        className="h-16 object-contain"
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                )}
                {template.include_stamp && organization?.stamp_url && (
                  <div className="flex justify-center mt-2">
                    <img 
                      src={organization.stamp_url} 
                      alt="Stamp" 
                      className="h-20 object-contain opacity-80"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">التوقيع والختم</p>
              </div>
              <div className="text-center">
                <p className="font-bold mb-4">الطرف الثاني</p>
                <p className="mb-2">{partner?.name}</p>
                <div className="h-20 border-b border-dashed border-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mt-2">التوقيع والختم</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setThemeOpen(true)}
            disabled={isExporting}
          >
            <Printer className="w-4 h-4 ml-1" />
            طباعة
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportToPDF(printRef.current)}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Download className="w-4 h-4 ml-1" />}
            تحميل PDF
          </Button>
          <ShareDocumentButton
            referenceId={contractNumber}
            referenceType="contract"
            documentTitle={`عقد ${(template as any)?.name || ''} - ${contractNumber}`}
            variant="outline"
          />
          <div className="flex-1" />
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <FileText className="w-4 h-4 ml-1" />}
            حفظ العقد
          </Button>
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

export default ContractPreview;
