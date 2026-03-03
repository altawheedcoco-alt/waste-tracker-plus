import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, FileCheck, FileX, Loader2, Shield, Camera, Package, FileText, Receipt, Scale, Award, Building2, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQRVerification } from '@/hooks/useQRVerification';
import { DOCUMENT_TYPE_LABELS, DocumentQRType } from '@/lib/documentQR';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const docTypeIcons: Record<string, React.ReactNode> = {
  shipment: <Package className="w-4 h-4" />,
  certificate: <FileCheck className="w-4 h-4" />,
  receipt: <Receipt className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
  invoice: <FileText className="w-4 h-4" />,
  disposal: <Shield className="w-4 h-4" />,
  award_letter: <Award className="w-4 h-4" />,
  statement: <Scale className="w-4 h-4" />,
  report: <FileText className="w-4 h-4" />,
  entity_certificate: <Building2 className="w-4 h-4" />,
};

// الحقول المسموح بعرضها للتحقق الخارجي (خصوصية الجهات)
const EXTERNAL_ALLOWED_FIELDS: Record<string, string[]> = {
  shipment: ['shipment_number', 'status', 'waste_type', 'quantity', 'unit', 'created_at'],
  certificate: ['report_number', 'certificate_type', 'waste_type', 'recycling_method', 'created_at'],
  receipt: ['receipt_number', 'signed_at', 'waste_type'],
  contract: ['contract_number', 'title', 'start_date', 'end_date'],
  invoice: ['invoice_number', 'issue_date', 'due_date', 'currency'],
  disposal: ['shipment_number', 'status', 'waste_type', 'disposal_method'],
  award_letter: ['letter_number', 'title', 'start_date', 'end_date', 'issue_date'],
  lms_certificate: ['certificate_number', 'course_title', 'score', 'issued_at', 'is_valid'],
  signer: ['signer_name', 'signer_title', 'authority_level'],
  attestation: ['attestation_number', 'organization_type', 'terms_accepted', 'identity_verified', 'licenses_valid', 'kyc_complete', 'issued_at'],
};

// الحقول التي تحتوي على بيانات حساسة يجب إخفاؤها دائماً من الخارج
const SENSITIVE_FIELDS = [
  'id', 'generator_id', 'transporter_id', 'recycler_id', 'organization_id',
  'created_by', 'updated_by', 'user_id', 'profile_id',
  'total_amount', 'amount', 'price', 'cost', 'balance',
  'phone', 'email', 'address', 'city',
  'pickup_address', 'delivery_address', 'pickup_lat', 'pickup_lng',
  'delivery_lat', 'delivery_lng', 'ip_address',
  'generator_notes', 'recycler_notes', 'transporter_notes',
  'internal_notes', 'admin_notes',
];

// تصفية البيانات للعرض الخارجي مع حماية خصوصية الجهات
function sanitizeForExternalView(data: Record<string, any>, docType: string): Record<string, any> {
  const allowedFields = EXTERNAL_ALLOWED_FIELDS[docType] || [];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.includes(key)) continue;
    if (typeof value === 'object' && value !== null) continue;
    if (!value) continue;
    
    // إظهار اسم المنظمة بشكل مختصر فقط
    if (key.includes('organization_name') || key === 'partner_name') {
      sanitized[key] = maskOrganizationName(String(value));
      continue;
    }
    
    // إظهار الحقول المسموح بها أو الحقول العامة الآمنة
    if (allowedFields.includes(key) || key.includes('number') || key.includes('date') || key === 'status' || key === 'waste_type') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// إخفاء جزء من اسم المنظمة
function maskOrganizationName(name: string): string {
  if (!name || name.length <= 4) return '●●●●';
  const visibleChars = Math.min(Math.ceil(name.length * 0.4), 8);
  return name.substring(0, visibleChars) + '●●●';
}

// تسميات عربية للحقول
const FIELD_LABELS: Record<string, string> = {
  shipment_number: 'رقم الشحنة',
  status: 'الحالة',
  waste_type: 'نوع المخلف',
  quantity: 'الكمية',
  unit: 'الوحدة',
  created_at: 'تاريخ الإنشاء',
  report_number: 'رقم الشهادة',
  certificate_type: 'نوع الشهادة',
  recycling_method: 'طريقة التدوير',
  receipt_number: 'رقم الإيصال',
  signed_at: 'تاريخ التوقيع',
  contract_number: 'رقم العقد',
  title: 'العنوان',
  start_date: 'تاريخ البدء',
  end_date: 'تاريخ الانتهاء',
  invoice_number: 'رقم الفاتورة',
  issue_date: 'تاريخ الإصدار',
  due_date: 'تاريخ الاستحقاق',
  currency: 'العملة',
  letter_number: 'رقم الخطاب',
  certificate_number: 'رقم الشهادة',
  course_title: 'اسم الدورة',
  score: 'النتيجة',
  issued_at: 'تاريخ الإصدار',
  is_valid: 'صالحة',
  signer_name: 'اسم المفوض',
  signer_title: 'المسمى الوظيفي',
  authority_level: 'مستوى الصلاحية',
  attestation_number: 'رقم الإفادة',
  organization_type: 'نوع الجهة',
  organization_name: 'اسم الجهة',
  partner_name: 'اسم الشريك',
  terms_accepted: 'قبول الشروط',
  identity_verified: 'التحقق من الهوية',
  licenses_valid: 'صلاحية التراخيص',
  kyc_complete: 'اكتمال KYC',
  disposal_method: 'طريقة التخلص',
};

const DocumentVerification = () => {
  const navigate = useNavigate();
  const [documentNumber, setDocumentNumber] = useState('');
  const { loading, result, verify, reset } = useQRVerification();
  const { t, language } = useLanguage();

  const statusLabels: Record<string, string> = {
    new: t('docVerify.statusNew'), approved: t('docVerify.statusApproved'), collecting: t('docVerify.statusCollecting'),
    in_transit: t('docVerify.statusInTransit'), delivered: t('docVerify.statusDelivered'), confirmed: t('docVerify.statusConfirmed'),
    cancelled: t('docVerify.statusCancelled'), active: t('docVerify.statusActive'), expired: t('docVerify.statusExpired'), draft: t('docVerify.statusDraft'),
    paid: t('docVerify.statusPaid'), unpaid: t('docVerify.statusUnpaid'), partial: t('docVerify.statusPartial'),
    valid: 'صالحة', invalid: 'غير صالحة',
  };

  const handleVerify = async () => {
    if (!documentNumber.trim()) {
      toast.error(t('docVerify.enterNumber'));
      return;
    }
    reset();
    await verify(documentNumber.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const langKey = language === 'ar' ? 'ar' : 'en';
  const typeLabel = result?.type
    ? DOCUMENT_TYPE_LABELS[result.type as DocumentQRType]?.[langKey] || result.type
    : '';

  // تصفية البيانات للعرض الخارجي
  const sanitizedData = result?.data
    ? sanitizeForExternalView(result.data as Record<string, any>, result.type)
    : null;

  return (
    <section className="py-10 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Shield className="w-5 h-5" />
            <span className="font-medium">{t('docVerify.sectionBadge')}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">{t('docVerify.title')}</h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
            {t('docVerify.subtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto animate-fade-in">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                {t('docVerify.cardTitle')}
              </CardTitle>
              <CardDescription>
                {t('docVerify.cardDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="number" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="number" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {t('docVerify.tabNumber')}
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    {t('docVerify.tabQR')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="number" className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <Input
                      placeholder={t('docVerify.placeholder')}
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 text-base sm:text-lg h-12"
                      dir="ltr"
                    />
                    <Button onClick={handleVerify} disabled={loading} size="lg" className="h-12 px-6">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <><Search className="w-5 h-5 ml-2" />{t('docVerify.verifyBtn')}</>
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['shipment', 'certificate', 'receipt', 'contract', 'invoice', 'disposal', 'award_letter'].map(docType => (
                      <Badge key={docType} variant="outline" className="text-[10px] gap-1">
                        {docTypeIcons[docType]}
                        {DOCUMENT_TYPE_LABELS[docType as DocumentQRType]?.[langKey]}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
                    <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground mb-4">{t('docVerify.qrPrompt')}</p>
                    <Button size="lg" onClick={() => navigate('/scan')} className="gap-2">
                      <Camera className="w-5 h-5" />
                      {t('docVerify.openScanner')}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">{t('docVerify.qrSupported')}</p>
                  </div>
                </TabsContent>
              </Tabs>

              {result && (
                <div className="mt-6 animate-fade-in">
                  {result.isValid ? (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-700 dark:text-green-300">{t('docVerify.validDoc')}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                              {docTypeIcons[result.type] || <FileText className="w-3 h-3" />}
                              {typeLabel}
                            </Badge>
                            <span className="text-sm text-green-600 dark:text-green-400 font-mono">{result.reference}</span>
                          </div>
                        </div>
                      </div>
                      
                      {result.status && (
                        <div className="mb-3">
                          <span className="text-muted-foreground text-sm">الحالة: </span>
                          <Badge variant="secondary">{statusLabels[result.status] || result.status}</Badge>
                        </div>
                      )}

                      {/* بيانات مصفّاة للخصوصية - عرض خارجي */}
                      {sanitizedData && Object.keys(sanitizedData).length > 0 && (
                        <div className="grid grid-cols-2 gap-3 text-sm border-t border-green-200 dark:border-green-800 pt-3 mt-3">
                          {Object.entries(sanitizedData)
                            .slice(0, 8)
                            .map(([key, value]) => (
                              <div key={key}>
                                <span className="text-muted-foreground text-xs">
                                  {FIELD_LABELS[key] || key.replace(/_/g, ' ')}:
                                </span>
                                <p className="font-medium truncate">
                                  {typeof value === 'boolean' ? (value ? '✓ نعم' : '✗ لا') : String(value)}
                                </p>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {/* إشعار الخصوصية */}
                      <div className="flex items-center gap-2 mt-4 p-2 rounded-md bg-green-100/50 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-400">
                        <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>بعض البيانات محجوبة لحماية خصوصية الجهات المرتبطة</span>
                      </div>

                      {/* التوقيعات */}
                      {result.signatures && result.signatures.length > 0 && (
                        <div className="border-t border-green-200 dark:border-green-800 pt-3 mt-3">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">التوقيعات المعتمدة ({result.signatures.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {result.signatures.map((sig: any, i: number) => (
                              <Badge key={i} variant="outline" className="gap-1 text-green-600 text-xs">
                                <FileCheck className="w-3 h-3" />
                                {sig.signer_name} - {sig.signer_role || sig.signer_title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.verifiedAt && (
                        <p className="text-xs text-green-500 mt-3">
                          {t('docVerify.verifiedAt')}: {new Date(result.verifiedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <FileX className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-700 dark:text-red-300">{t('docVerify.invalidDoc')}</h3>
                          <p className="text-sm text-red-600 dark:text-red-400">{result.message || t('docVerify.invalidMsg')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DocumentVerification;
