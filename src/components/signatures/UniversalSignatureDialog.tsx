import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PenTool, Upload, Type, MousePointerClick, Shield, Stamp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SignatureCanvas from './SignatureCanvas';

export interface SignatureData {
  method: 'draw' | 'upload' | 'text' | 'click';
  signatureImageUrl?: string;
  signatureText?: string;
  stampApplied: boolean;
  stampImageUrl?: string;
  signerName: string;
  signerTitle?: string;
  signerNationalId?: string;
}

interface UniversalSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (data: SignatureData) => void;
  documentType: 'shipment' | 'contract' | 'invoice' | 'certificate' | 'award_letter' | 'other';
  documentId: string;
  documentTitle?: string;
  organizationId: string;
  organizationStampUrl?: string;
  signerDefaults?: {
    name?: string;
    title?: string;
    nationalId?: string;
  };
  loading?: boolean;
}

const SIGNATURE_FONTS = [
  { name: 'Amiri', family: "'Amiri', serif" },
  { name: 'Cairo', family: "'Cairo', sans-serif" },
  { name: 'Tajawal', family: "'Tajawal', sans-serif" },
  { name: 'Noto Naskh', family: "'Noto Naskh Arabic', serif" },
];

const UniversalSignatureDialog = ({
  open,
  onOpenChange,
  onSign,
  documentType,
  documentTitle,
  organizationStampUrl,
  signerDefaults,
  loading = false,
}: UniversalSignatureDialogProps) => {
  const [method, setMethod] = useState<'draw' | 'upload' | 'text' | 'click'>('draw');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState(signerDefaults?.name || '');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].family);
  const [applyStamp, setApplyStamp] = useState(!!organizationStampUrl);
  const [signerName, setSignerName] = useState(signerDefaults?.name || '');
  const [signerTitle, setSignerTitle] = useState(signerDefaults?.title || '');
  const [signerNationalId, setSignerNationalId] = useState(signerDefaults?.nationalId || '');
  const [confirmed, setConfirmed] = useState(false);

  const documentTypeLabels: Record<string, string> = {
    shipment: 'نموذج تتبع الشحنة',
    contract: 'عقد / اتفاقية',
    invoice: 'فاتورة',
    certificate: 'شهادة',
    award_letter: 'خطاب ترسية',
    other: 'مستند',
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى رفع صورة فقط');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadedSignature(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const getSignaturePreview = () => {
    switch (method) {
      case 'draw': return drawnSignature;
      case 'upload': return uploadedSignature;
      case 'text': return null;
      case 'click': return null;
    }
  };

  const isValid = () => {
    if (!signerName.trim()) return false;
    if (!confirmed) return false;
    switch (method) {
      case 'draw': return !!drawnSignature;
      case 'upload': return !!uploadedSignature;
      case 'text': return !!signatureText.trim();
      case 'click': return true;
    }
  };

  const handleSign = () => {
    if (!isValid()) return;
    
    const data: SignatureData = {
      method,
      stampApplied: applyStamp,
      stampImageUrl: applyStamp ? organizationStampUrl : undefined,
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim() || undefined,
      signerNationalId: signerNationalId.trim() || undefined,
    };

    switch (method) {
      case 'draw':
        data.signatureImageUrl = drawnSignature!;
        break;
      case 'upload':
        data.signatureImageUrl = uploadedSignature!;
        break;
      case 'text':
        data.signatureText = signatureText.trim();
        break;
      case 'click':
        data.signatureText = `تم التوقيع إلكترونياً بواسطة: ${signerName}`;
        break;
    }

    onSign(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" />
            توقيع وختم المستند
          </DialogTitle>
          {documentTitle && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{documentTypeLabels[documentType]}</Badge>
              <span className="text-sm text-muted-foreground">{documentTitle}</span>
            </div>
          )}
        </DialogHeader>

        {/* Signer Info */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">اسم الموقع *</Label>
            <Input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="الاسم الكامل" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">الصفة / المنصب</Label>
            <Input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} placeholder="المدير التنفيذي" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">الرقم القومي</Label>
            <Input value={signerNationalId} onChange={e => setSignerNationalId(e.target.value)} placeholder="00000000000000" className="mt-1" maxLength={14} />
          </div>
        </div>

        <Separator />

        {/* Signature Method Tabs */}
        <Tabs value={method} onValueChange={v => setMethod(v as typeof method)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="draw" className="gap-1 text-xs"><PenTool className="w-3.5 h-3.5" /> رسم يدوي</TabsTrigger>
            <TabsTrigger value="upload" className="gap-1 text-xs"><Upload className="w-3.5 h-3.5" /> رفع صورة</TabsTrigger>
            <TabsTrigger value="text" className="gap-1 text-xs"><Type className="w-3.5 h-3.5" /> توقيع نصي</TabsTrigger>
            <TabsTrigger value="click" className="gap-1 text-xs"><MousePointerClick className="w-3.5 h-3.5" /> بنقرة</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-3">
            <SignatureCanvas onSignatureChange={setDrawnSignature} />
          </TabsContent>

          <TabsContent value="upload" className="mt-3">
            <div className="flex flex-col items-center gap-3">
              <label className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">اضغط لرفع صورة التوقيع</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG - حد أقصى 2MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              {uploadedSignature && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <img src={uploadedSignature} alt="التوقيع" className="max-h-24 mx-auto" />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-3">
            <div className="space-y-3">
              <Input value={signatureText} onChange={e => setSignatureText(e.target.value)} placeholder="اكتب اسمك كما تريد ظهوره كتوقيع" />
              <div className="grid grid-cols-2 gap-2">
                {SIGNATURE_FONTS.map(font => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedFont(font.family)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedFont === font.family ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span style={{ fontFamily: font.family, fontSize: '18px' }}>{signatureText || 'التوقيع'}</span>
                    <p className="text-[10px] text-muted-foreground mt-1">{font.name}</p>
                  </button>
                ))}
              </div>
              {signatureText && (
                <div className="border rounded-lg p-4 text-center bg-white">
                  <span style={{ fontFamily: selectedFont, fontSize: '24px', color: '#1a365d' }}>{signatureText}</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="click" className="mt-3">
            <div className="text-center p-6 border rounded-lg bg-muted/20">
              <MousePointerClick className="w-12 h-12 mx-auto text-primary mb-3" />
              <p className="text-sm font-semibold">موافقة إلكترونية بنقرة واحدة</p>
              <p className="text-xs text-muted-foreground mt-2">
                بالضغط على "توقيع المستند"، أنت تؤكد موافقتك على محتوى هذا المستند.
                <br />
                سيتم تسجيل عنوان IP، الجهاز، والوقت كدليل قانوني.
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Shield className="w-3 h-3" />
                توقيع إلكتروني مؤمن
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Stamp Section */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">تطبيق ختم المنظمة</span>
          </div>
          <div className="flex items-center gap-3">
            {organizationStampUrl ? (
              <>
                <img src={organizationStampUrl} alt="ختم" className="h-10 w-10 object-contain border rounded" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={applyStamp} onChange={e => setApplyStamp(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all rtl:peer-checked:after:-translate-x-full" />
                </label>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">لم يتم رفع ختم للمنظمة بعد</span>
            )}
          </div>
        </div>

        {/* Legal Confirmation */}
        <div className="p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 accent-primary" />
            <div>
              <p className="text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                إقرار قانوني
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                أُقر بأنني مفوض بالتوقيع نيابة عن الجهة، وأن هذا التوقيع ملزم قانونياً وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004. 
                المنصة غير مسؤولة عن صحة البيانات الواردة.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSign} disabled={!isValid() || loading} className="gap-2">
            <PenTool className="w-4 h-4" />
            {loading ? 'جاري التوقيع...' : 'توقيع المستند'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalSignatureDialog;
