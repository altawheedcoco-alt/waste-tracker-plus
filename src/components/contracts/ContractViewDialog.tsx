import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { type Contract, getStatusBadgeConfig, getContractTypeLabel } from '@/hooks/useContracts';
import { signingMethodLabels } from '@/lib/contract-logic/contractSigningTypes';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import { Download, Printer, PenTool, Building2, UserPlus } from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';
import SignDocumentButton from '@/components/signature/SignDocumentButton';

interface ContractViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  getContractStatus: (contract: Contract) => string;
}

const ContractViewDialog = ({
  open,
  onOpenChange,
  contract,
  getContractStatus,
}: ContractViewDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, isExporting } = usePDFExport({
    filename: contract ? `عقد_${contract.contract_number}` : 'عقد',
    orientation: 'portrait',
    scale: 2,
  });

  if (!contract) return null;

  const status = getContractStatus(contract);
  const badgeConfig = getStatusBadgeConfig(status);
  const isExternal = contract.contractor_type === 'external';
  const signingMethod = (contract.signing_method || 'none') as keyof typeof signingMethodLabels;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contract.title}
            <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">رقم العقد:</span>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">نوع العقد:</span>
              <p className="font-medium">{getContractTypeLabel(contract.contract_type)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">نوع الطرف الآخر:</span>
              <p className="font-medium flex items-center gap-1">
                {isExternal ? (
                  <><UserPlus className="w-3 h-3" /> جهة خارجية</>
                ) : (
                  <><Building2 className="w-3 h-3" /> جهة داخلية</>
                )}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">طريقة التوقيع:</span>
              <p className="font-medium flex items-center gap-1">
                <PenTool className="w-3 h-3" />
                {signingMethodLabels[signingMethod]}
              </p>
            </div>
          </div>

          {/* Partner Info */}
          <Separator />
          <div className="p-3 border rounded-lg bg-muted/30">
            <h4 className="font-semibold text-sm mb-2">بيانات الطرف الآخر</h4>
            {isExternal ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {contract.external_legal_name && <div><span className="text-muted-foreground">الاسم القانوني:</span> <span className="font-medium">{contract.external_legal_name}</span></div>}
                {contract.external_tax_id && <div><span className="text-muted-foreground">البطاقة الضريبية:</span> <span className="font-medium">{contract.external_tax_id}</span></div>}
                {contract.external_commercial_register && <div><span className="text-muted-foreground">السجل التجاري:</span> <span className="font-medium">{contract.external_commercial_register}</span></div>}
                {contract.external_address && <div className="col-span-2"><span className="text-muted-foreground">العنوان:</span> <span className="font-medium">{contract.external_address}</span></div>}
                {contract.external_representative && <div><span className="text-muted-foreground">مفوض التوقيع:</span> <span className="font-medium">{contract.external_representative}</span></div>}
                {contract.external_phone && <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium">{contract.external_phone}</span></div>}
                {contract.external_email && <div className="col-span-2"><span className="text-muted-foreground">البريد:</span> <span className="font-medium">{contract.external_email}</span></div>}
              </div>
            ) : (
              <div className="text-sm">
                {contract.partner_name && <p className="font-medium">{contract.partner_name}</p>}
              </div>
            )}
          </div>

          {/* Dates & Value */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {contract.value && (
              <div>
                <span className="text-muted-foreground">القيمة:</span>
                <p className="font-medium">{contract.value.toLocaleString()} {contract.currency || 'EGP'}</p>
              </div>
            )}
            {contract.start_date && (
              <div>
                <span className="text-muted-foreground">تاريخ البداية:</span>
                <p className="font-medium">{format(new Date(contract.start_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
            {contract.end_date && (
              <div>
                <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                <p className="font-medium">{format(new Date(contract.end_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </div>

          {contract.description && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">الوصف:</span>
                <p className="mt-1">{contract.description}</p>
              </div>
            </>
          )}

          {contract.terms && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">الشروط والأحكام:</span>
                <p className="mt-1 whitespace-pre-wrap">{contract.terms}</p>
              </div>
            </>
          )}

          {contract.notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">ملاحظات:</span>
                <p className="mt-1">{contract.notes}</p>
              </div>
            </>
          )}

          {/* Signature display */}
          {signingMethod === 'digital' && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">توقيع الطرف الأول</p>
                  {contract.party_one_signature_url ? (
                    <img src={contract.party_one_signature_url} alt="توقيع" className="h-16 mx-auto" />
                  ) : (
                    <div className="h-16 border-b border-dashed flex items-end justify-center text-xs text-muted-foreground pb-1">
                      لم يتم التوقيع بعد
                    </div>
                  )}
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2">توقيع الطرف الثاني</p>
                  {contract.party_two_signature_url ? (
                    <img src={contract.party_two_signature_url} alt="توقيع" className="h-16 mx-auto" />
                  ) : (
                    <div className="h-16 border-b border-dashed flex items-end justify-center text-xs text-muted-foreground pb-1">
                      لم يتم التوقيع بعد
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {signingMethod === 'manual' && (
            <>
              <Separator />
              <div className="p-3 bg-muted/30 rounded-lg text-sm text-center">
                <Printer className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">هذا العقد مُعد للطباعة والتوقيع الحي</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-row gap-2 flex-wrap">
          {signingMethod === 'digital' && !contract.party_one_signature_url && (
            <SignDocumentButton
              documentId={contract.id}
              documentType="contract"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF(printRef.current)}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 ml-1" />
            تحميل PDF
          </Button>
          {signingMethod === 'manual' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 ml-1" />
              طباعة للتوقيع
            </Button>
          )}
          <ShareDocumentButton
            referenceId={contract.id}
            referenceType="contract"
            documentTitle={`عقد ${contract.title} - ${contract.contract_number}`}
            variant="outline"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractViewDialog;
