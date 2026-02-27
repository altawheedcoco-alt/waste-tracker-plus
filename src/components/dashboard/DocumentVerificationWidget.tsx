import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FileCheck, FileX, Loader2, Shield, QrCode, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQRVerification } from '@/hooks/useQRVerification';

interface DocumentVerificationWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const typeLabels: Record<string, string> = {
  shipment: 'شحنة',
  certificate: 'شهادة',
  receipt: 'إيصال',
  contract: 'عقد',
  invoice: 'فاتورة',
  disposal: 'شهادة تخلص',
  award_letter: 'خطاب ترسية',
  lms_certificate: 'شهادة تدريبية',
  signer: 'موقّع معتمد',
  attestation: 'إفادة تسجيل',
  statement: 'كشف حساب',
  report: 'تقرير',
  entity_certificate: 'شهادة جهة',
};

const DocumentVerificationWidget = ({ open, onOpenChange }: DocumentVerificationWidgetProps) => {
  const navigate = useNavigate();
  const [documentNumber, setDocumentNumber] = useState('');
  const { verify, loading, result } = useQRVerification();

  const handleVerify = async () => {
    if (!documentNumber.trim()) return;
    await verify(documentNumber.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const handleClear = () => {
    setDocumentNumber('');
  };

  const handleClose = () => {
    handleClear();
    onOpenChange?.(false);
  };

  const verificationContent = (
    <div className="space-y-4">
      <Tabs defaultValue="number" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="number" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            رقم الوثيقة
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            مسح QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="number" className="space-y-4 mt-4">
          <div className="flex gap-2 items-center">
            <Button onClick={handleVerify} disabled={loading} className="shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 ml-2" />
                  تحقق
                </>
              )}
            </Button>
            <Input
              placeholder="أدخل رقم أي وثيقة أو كود التحقق (مثال: SHP-... أو ATT-... أو 88C9-BEAB-...)"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            يدعم: الشحنات، الشهادات، الإيصالات، العقود، الفواتير، الإفادات، خطابات الترسية، وجميع وثائق المنصة
          </p>
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/50">
            <QrCode className="w-12 h-12 mx-auto text-primary mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              امسح رمز QR للتحقق من أي مستند
            </p>
            <Button 
              onClick={() => {
                onOpenChange?.(false);
                navigate('/scan');
              }}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              فتح الماسح الضوئي
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {result.isValid ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-700 dark:text-green-300">
                  {typeLabels[result.type] || 'وثيقة'} صحيحة ✓
                </span>
                <span className="text-sm text-green-600 dark:text-green-400 mr-auto" dir="ltr">
                  {result.reference}
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">{result.message}</p>
              
              {result.data && (
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  {Object.entries(result.data).slice(0, 6).map(([key, value]) => (
                    value && (
                      <div key={key} className="text-right">
                        <span className="text-muted-foreground text-xs">{key}:</span>
                        <p className="font-medium text-xs">{String(value)}</p>
                      </div>
                    )
                  ))}
                </div>
              )}
              
              <Button variant="ghost" size="sm" onClick={handleClear} className="mt-3 w-full">
                بحث جديد
              </Button>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileX className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-bold text-red-700 dark:text-red-300">
                  وثيقة غير موجودة ✗
                </span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{result.message}</p>
              <Button variant="ghost" size="sm" onClick={handleClear} className="mt-3 w-full">
                حاول مرة أخرى
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  if (open !== undefined && onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              التحقق من صحة الوثائق
            </DialogTitle>
          </DialogHeader>
          {verificationContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-right">
          <Shield className="w-5 h-5 text-primary" />
          التحقق من صحة الوثائق
        </CardTitle>
        <CardDescription className="text-right">
          تحقق من صحة أي وثيقة عبر إدخال رقمها أو كود التحقق
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationContent}
      </CardContent>
    </Card>
  );
};

export default DocumentVerificationWidget;
