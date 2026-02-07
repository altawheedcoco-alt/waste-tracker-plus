import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useOrganizationSignatures } from '@/hooks/useOrganizationSignatures';
import { useDocumentEndorsement, EndorsementRequest, EndorsementResult } from '@/hooks/useDocumentEndorsement';
import SystemEndorsementBadge from './SystemEndorsementBadge';
import {
  PenTool,
  Stamp,
  Shield,
  Loader2,
  CheckCircle2,
  Fingerprint,
  FileText,
} from 'lucide-react';

interface EndorsementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'certificate' | 'report' | 'contract' | 'receipt' | 'aggregate';
  documentId: string;
  documentNumber: string;
  onEndorsementComplete?: (result: EndorsementResult) => void;
}

const documentTypeLabels: Record<string, string> = {
  certificate: 'شهادة إعادة التدوير',
  report: 'تقرير',
  contract: 'عقد',
  receipt: 'إيصال',
  aggregate: 'تقرير مجمع',
};

const EndorsementDialog = ({
  isOpen,
  onClose,
  documentType,
  documentId,
  documentNumber,
  onEndorsementComplete,
}: EndorsementDialogProps) => {
  const { signatures, stamps, getActiveSignatures, getActiveStamps } = useOrganizationSignatures();
  const { createEndorsement, loading } = useDocumentEndorsement();

  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');
  const [selectedStampId, setSelectedStampId] = useState<string>('');
  const [endorsementType, setEndorsementType] = useState<'signed' | 'stamped' | 'signed_and_stamped'>('signed_and_stamped');
  const [notes, setNotes] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [endorsementResult, setEndorsementResult] = useState<EndorsementResult | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'complete'>('select');

  const activeSignatures = getActiveSignatures();
  const activeStamps = getActiveStamps();

  const selectedSignature = activeSignatures.find(s => s.id === selectedSignatureId);
  const selectedStamp = activeStamps.find(s => s.id === selectedStampId);

  const handleProceed = () => {
    if (endorsementType !== 'stamped' && !selectedSignatureId) {
      toast.error('يرجى اختيار توقيع');
      return;
    }
    if (endorsementType !== 'signed' && !selectedStampId) {
      toast.error('يرجى اختيار ختم');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    const request: EndorsementRequest = {
      document_type: documentType,
      document_id: documentId,
      document_number: documentNumber,
      signature_id: endorsementType !== 'stamped' ? selectedSignatureId : undefined,
      stamp_id: endorsementType !== 'signed' ? selectedStampId : undefined,
      endorsement_type: endorsementType,
      biometric_verified: useBiometric,
      notes: notes || undefined,
    };

    const result = await createEndorsement(request);
    
    if (result) {
      setEndorsementResult(result);
      setStep('complete');
      onEndorsementComplete?.(result);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedSignatureId('');
    setSelectedStampId('');
    setNotes('');
    setUseBiometric(false);
    setEndorsementResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            اعتماد المستند إلكترونياً
          </DialogTitle>
          <DialogDescription>
            {documentTypeLabels[documentType]} رقم: {documentNumber}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4 py-4">
            {/* Endorsement Type */}
            <div className="space-y-2">
              <Label>نوع الاعتماد</Label>
              <Select value={endorsementType} onValueChange={(val: any) => setEndorsementType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signed_and_stamped">توقيع وختم</SelectItem>
                  <SelectItem value="signed">توقيع فقط</SelectItem>
                  <SelectItem value="stamped">ختم فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signature Selection */}
            {endorsementType !== 'stamped' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  اختر التوقيع
                </Label>
                {activeSignatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                    لا توجد توقيعات نشطة. يرجى إضافة توقيع من الإعدادات.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {activeSignatures.map((sig) => (
                      <div
                        key={sig.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedSignatureId === sig.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedSignatureId(sig.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-8 border rounded bg-white flex items-center justify-center overflow-hidden">
                            {sig.signature_image_url ? (
                              <img src={sig.signature_image_url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <PenTool className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sig.signer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{sig.signer_position}</p>
                          </div>
                          {sig.is_primary && (
                            <Badge variant="secondary" className="text-[10px]">أساسي</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stamp Selection */}
            {endorsementType !== 'signed' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stamp className="w-4 h-4" />
                  اختر الختم
                </Label>
                {activeStamps.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                    لا توجد أختام نشطة. يرجى إضافة ختم من الإعدادات.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {activeStamps.map((stamp) => (
                      <div
                        key={stamp.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedStampId === stamp.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedStampId(stamp.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 border rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {stamp.stamp_image_url ? (
                              <img src={stamp.stamp_image_url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Stamp className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{stamp.stamp_name}</p>
                            <p className="text-xs text-muted-foreground">{stamp.stamp_type === 'official' ? 'رسمي' : stamp.stamp_type}</p>
                          </div>
                          {stamp.is_primary && (
                            <Badge variant="secondary" className="text-[10px]">أساسي</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات على الاعتماد..."
                rows={2}
              />
            </div>

            {/* Biometric Option */}
            <div className="flex items-center space-x-2 space-x-reverse p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="biometric"
                checked={useBiometric}
                onCheckedChange={(checked) => setUseBiometric(checked as boolean)}
              />
              <Label htmlFor="biometric" className="flex items-center gap-2 cursor-pointer">
                <Fingerprint className="w-4 h-4 text-primary" />
                استخدام التحقق البيومتري (بصمة/وجه)
              </Label>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">تأكيد الاعتماد</h3>
              <p className="text-muted-foreground text-sm">
                أنت على وشك اعتماد هذا المستند رسمياً
              </p>
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">نوع المستند:</span>
                <span className="font-medium">{documentTypeLabels[documentType]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رقم المستند:</span>
                <span className="font-mono">{documentNumber}</span>
              </div>
              {selectedSignature && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الموقع:</span>
                  <span>{selectedSignature.signer_name}</span>
                </div>
              )}
              {selectedStamp && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الختم:</span>
                  <span>{selectedStamp.stamp_name}</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p>بالضغط على "اعتماد" أنت تؤكد صحة هذا المستند وتتحمل المسؤولية القانونية الكاملة.</p>
            </div>
          </div>
        )}

        {step === 'complete' && endorsementResult && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">تم الاعتماد بنجاح!</h3>
              <p className="text-muted-foreground text-sm">
                تم اعتماد المستند وتسجيله في النظام
              </p>
            </div>

            <SystemEndorsementBadge
              systemSealNumber={endorsementResult.system_seal_number}
              verificationCode={endorsementResult.verification_code}
              endorsedAt={new Date()}
              verificationUrl={endorsementResult.verification_url}
              isValid={true}
              showDisclaimer={true}
            />
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button onClick={handleProceed}>
                متابعة
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                رجوع
              </Button>
              <Button onClick={handleConfirm} disabled={loading} className="gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                اعتماد
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>
              إغلاق
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndorsementDialog;
