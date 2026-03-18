import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2, XCircle, FileText, Building2, Truck, Recycle,
  Calendar, Scale, MapPin, Package, Leaf, Shield, ExternalLink,
  Clock, Receipt, FileCheck, Award, CreditCard, Fingerprint,
  Stamp, PenTool, Hash, Lock, UserCheck, GraduationCap, BadgeCheck,
} from 'lucide-react';

export type VerificationDocType = 
  | 'shipment' | 'certificate' | 'contract' | 'receipt' 
  | 'report' | 'invoice' | 'disposal' | 'statement' 
  | 'award_letter' | 'entity_certificate' | 'lms_certificate' | 'signer' | 'attestation' | 'seal' | 'unknown';

export interface SignatureInfo {
  id: string;
  signer_name: string;
  signer_role: string | null;
  signer_title: string | null;
  signature_method: string;
  signature_image_url: string | null;
  stamp_applied: boolean;
  stamp_image_url: string | null;
  platform_seal_number: string | null;
  document_hash: string | null;
  signature_hash: string | null;
  status: string;
  created_at: string;
}

export interface VerificationData {
  isValid: boolean;
  type: VerificationDocType;
  reference: string;
  status?: string;
  data?: Record<string, any> | null;
  message?: string;
  verifiedAt?: string;
  signatures?: SignatureInfo[];
}

interface VerificationResultProps {
  result: VerificationData;
  onScanAgain: () => void;
  onViewDetails?: () => void;
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', other: 'أخرى',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'معتمدة', color: 'bg-green-100 text-green-800' },
  in_transit: { label: 'في الطريق', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'تم التسليم', color: 'bg-purple-100 text-purple-800' },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-100 text-emerald-800' },
  active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-800' },
  pending: { label: 'معلقة', color: 'bg-yellow-100 text-yellow-800' },
  overdue: { label: 'متأخرة', color: 'bg-red-100 text-red-800' },
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
  valid: { label: 'صالحة', color: 'bg-green-100 text-green-800' },
};

const typeLabels: Record<string, { label: string; icon: any }> = {
  shipment: { label: 'شحنة', icon: Package },
  certificate: { label: 'شهادة تدوير', icon: Recycle },
  contract: { label: 'عقد', icon: FileText },
  receipt: { label: 'إيصال استلام', icon: Receipt },
  report: { label: 'تقرير مجمع', icon: FileText },
  invoice: { label: 'فاتورة', icon: CreditCard },
  disposal: { label: 'شهادة تخلص آمن', icon: Shield },
  statement: { label: 'كشف حساب', icon: FileCheck },
  award_letter: { label: 'خطاب ترسية', icon: Award },
  entity_certificate: { label: 'شهادة جهة', icon: Building2 },
  lms_certificate: { label: 'شهادة تدريبية', icon: GraduationCap },
  signer: { label: 'مفوض معتمد', icon: UserCheck },
  attestation: { label: 'إفادة تسجيل', icon: FileText },
  unknown: { label: 'مستند', icon: FileText },
};

const signatureMethodLabels: Record<string, string> = {
  draw: 'رسم يدوي', upload: 'توقيع مرفوع', text: 'توقيع نصي', approve: 'موافقة إلكترونية',
};

const VerificationResult = ({ result, onScanAgain, onViewDetails }: VerificationResultProps) => {
  const TypeIcon = typeLabels[result.type]?.icon || FileText;
  const signatures = result.signatures || [];
  const hasSignatures = signatures.length > 0;
  const hasStamps = signatures.some(s => s.stamp_applied);
  const documentHash = signatures[0]?.document_hash;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* حالة التحقق */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className={`border-2 overflow-hidden ${result.isValid ? 'border-green-200' : 'border-red-200'}`}>
          {/* شريط علوي ملون */}
          <div className={`h-2 ${result.isValid ? 'bg-gradient-to-l from-green-400 to-emerald-600' : 'bg-gradient-to-l from-red-400 to-red-600'}`} />
          <CardContent className={`pt-6 text-center ${result.isValid ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <Shield className={`h-7 w-7 ${result.isValid ? 'text-green-600' : 'text-red-600'}`} />
              {result.isValid ? (
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
              <Shield className={`h-7 w-7 ${result.isValid ? 'text-green-600' : 'text-red-600'}`} />
            </motion.div>

            <h2 className={`text-2xl font-bold mb-2 ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
              {result.isValid ? 'تم التحقق بنجاح ✓' : 'فشل التحقق ✗'}
            </h2>

            <p className={`text-sm ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {result.message || (result.isValid 
                ? `${typeLabels[result.type]?.label || 'المستند'} مسجل ومعتمد في النظام`
                : 'لم يتم العثور على المستند في النظام'
              )}
            </p>

            {/* شارات المعلومات الأساسية */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <div className="inline-flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border text-sm">
                <TypeIcon className="w-4 h-4 text-primary" />
                <Badge variant="outline">{typeLabels[result.type]?.label || 'مستند'}</Badge>
              </div>
              <div className="inline-flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border text-sm">
                <span className="font-mono font-bold text-primary text-xs">{result.reference}</span>
              </div>
            </div>

            {/* شارات التوقيع والختم */}
            {result.isValid && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {hasSignatures && (
                  <Badge className="bg-blue-100 text-blue-800 gap-1">
                    <PenTool className="w-3 h-3" />
                    موقّع إلكترونياً ({signatures.length})
                  </Badge>
                )}
                {hasStamps && (
                  <Badge className="bg-purple-100 text-purple-800 gap-1">
                    <Stamp className="w-3 h-3" />
                    مختوم
                  </Badge>
                )}
                {documentHash && (
                  <Badge className="bg-amber-100 text-amber-800 gap-1">
                    <Lock className="w-3 h-3" />
                    محمي بالبصمة الرقمية
                  </Badge>
                )}
              </div>
            )}

            {result.verifiedAt && (
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>تم التحقق: {format(new Date(result.verifiedAt), 'PPpp', { locale: ar })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* تفاصيل المستند */}
      <AnimatePresence>
        {result.isValid && result.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            
            {/* بيانات المفوض المعتمد */}
            {result.type === 'signer' && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    بيانات المفوض المعتمد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {result.data.signer_name && (
                      <div>
                        <span className="text-xs text-muted-foreground">الاسم</span>
                        <p className="font-bold">{result.data.signer_name}</p>
                      </div>
                    )}
                    {result.data.signer_title && (
                      <div>
                        <span className="text-xs text-muted-foreground">المسمى الوظيفي</span>
                        <p className="font-semibold">{result.data.signer_title}</p>
                      </div>
                    )}
                    {result.data.organization_name && (
                      <div>
                        <span className="text-xs text-muted-foreground">الجهة</span>
                        <p className="font-semibold">{result.data.organization_name}</p>
                      </div>
                    )}
                    {result.data.authority_level && (
                      <div>
                        <span className="text-xs text-muted-foreground">مستوى الصلاحية</span>
                        <Badge variant="outline">{result.data.authority_level}</Badge>
                      </div>
                    )}
                  </div>
                  {/* صلاحيات التوقيع */}
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground mb-2">صلاحيات التوقيع:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.data.can_sign_shipments && <Badge className="bg-green-100 text-green-800 text-xs">الشحنات</Badge>}
                    {result.data.can_sign_contracts && <Badge className="bg-green-100 text-green-800 text-xs">العقود</Badge>}
                    {result.data.can_sign_invoices && <Badge className="bg-green-100 text-green-800 text-xs">الفواتير</Badge>}
                    {result.data.can_sign_certificates && <Badge className="bg-green-100 text-green-800 text-xs">الشهادات</Badge>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* بيانات شهادة LMS */}
            {result.type === 'lms_certificate' && (
              <Card className="border-indigo-200 bg-indigo-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    شهادة الدورة التدريبية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground">اسم الدورة</span>
                      <p className="font-bold">{result.data.course_title}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">رقم الشهادة</span>
                      <p className="font-mono font-bold text-sm">{result.data.certificate_number}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">النتيجة</span>
                      <p className="font-bold text-primary">{result.data.score}%</p>
                    </div>
                    {result.data.issued_at && (
                      <div>
                        <span className="text-xs text-muted-foreground">تاريخ الإصدار</span>
                        <p className="font-semibold text-sm">{format(new Date(result.data.issued_at), 'PP', { locale: ar })}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">الحالة</span>
                      <Badge className={result.data.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {result.data.is_valid ? 'صالحة' : 'منتهية'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* بيانات الشحنة / الشهادة / الإيصال / التخلص */}
            {['shipment', 'certificate', 'receipt', 'disposal'].includes(result.type) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <TypeIcon className="w-5 h-5 text-primary" />
                    بيانات {typeLabels[result.type]?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {result.data.shipment_number && (
                      <div>
                        <span className="text-xs text-muted-foreground">رقم الشحنة</span>
                        <p className="font-mono font-bold text-sm">{result.data.shipment_number}</p>
                      </div>
                    )}
                    {result.data.report_number && (
                      <div>
                        <span className="text-xs text-muted-foreground">رقم الشهادة</span>
                        <p className="font-mono font-bold text-sm">{result.data.report_number}</p>
                      </div>
                    )}
                    {result.data.receipt_number && (
                      <div>
                        <span className="text-xs text-muted-foreground">رقم الإيصال</span>
                        <p className="font-mono font-bold text-sm">{result.data.receipt_number}</p>
                      </div>
                    )}
                    {result.status && (
                      <div>
                        <span className="text-xs text-muted-foreground">الحالة</span>
                        <div className="mt-1">
                          <Badge className={statusLabels[result.status]?.color || 'bg-gray-100'}>
                            {statusLabels[result.status]?.label || result.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {result.data.waste_type && (
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Scale className="h-3 w-3" /> نوع المخلفات
                        </span>
                        <p className="font-semibold text-sm">{wasteTypeLabels[result.data.waste_type] || result.data.waste_type}</p>
                      </div>
                    )}
                    {result.data.quantity && (
                      <div>
                        <span className="text-xs text-muted-foreground">الكمية</span>
                        <p className="font-bold text-primary">{result.data.quantity} {result.data.unit || 'كجم'}</p>
                      </div>
                    )}
                    {result.data.waste_category && (
                      <div>
                        <span className="text-xs text-muted-foreground">تصنيف المخلفات</span>
                        <p className="font-semibold text-sm">
                          {result.data.waste_category === 'hazardous' ? 'خطرة' : result.data.waste_category === 'medical' ? 'طبية' : 'غير خطرة'}
                        </p>
                      </div>
                    )}
                  </div>

                  {(result.data.delivered_at || result.data.signed_at) && (
                    <div className="pt-3 mt-3 border-t">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {result.data.delivered_at ? 'تاريخ التسليم' : 'تاريخ التوقيع'}
                      </span>
                      <p className="font-semibold text-sm">
                        {format(new Date(result.data.delivered_at || result.data.signed_at!), 'PPpp', { locale: ar })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* الأطراف */}
            {(result.data.generator || result.data.transporter || result.data.recycler) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.data.generator && (
                  <Card className="border-blue-100">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-1 text-blue-600">
                        <Building2 className="h-4 w-4" />
                        <span className="font-semibold text-xs">الجهة المولدة</span>
                      </div>
                      <p className="font-bold text-sm">{result.data.generator.name}</p>
                      {result.data.generator.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {result.data.generator.city}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {result.data.transporter && (
                  <Card className="border-orange-100">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-1 text-orange-600">
                        <Truck className="h-4 w-4" />
                        <span className="font-semibold text-xs">جهة النقل</span>
                      </div>
                      <p className="font-bold text-sm">{result.data.transporter.name}</p>
                      {result.data.transporter.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {result.data.transporter.city}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {(result.data.recycler || result.data.recycler_organization) && (
                  <Card className="border-green-200 bg-green-50/30">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-1 text-green-600">
                        <Recycle className="h-4 w-4" />
                        <span className="font-semibold text-xs">جهة التدوير</span>
                      </div>
                      <p className="font-bold text-sm">{result.data.recycler?.name || result.data.recycler_organization?.name}</p>
                      {result.data.recycler?.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {result.data.recycler.city}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* بيانات العقد */}
            {result.type === 'contract' && result.data.contract_number && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <FileText className="w-5 h-5 text-primary" /> بيانات العقد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">رقم العقد</span>
                      <p className="font-mono font-bold text-sm">{result.data.contract_number}</p>
                    </div>
                    {result.data.title && <div><span className="text-xs text-muted-foreground">العنوان</span><p className="font-semibold text-sm">{result.data.title}</p></div>}
                    {result.data.partner_name && <div><span className="text-xs text-muted-foreground">الطرف الآخر</span><p className="font-semibold text-sm">{result.data.partner_name}</p></div>}
                    {result.data.start_date && <div><span className="text-xs text-muted-foreground">تاريخ البدء</span><p className="font-semibold text-sm">{format(new Date(result.data.start_date), 'PP', { locale: ar })}</p></div>}
                    {result.data.end_date && <div><span className="text-xs text-muted-foreground">تاريخ الانتهاء</span><p className="font-semibold text-sm">{format(new Date(result.data.end_date), 'PP', { locale: ar })}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* بيانات الفاتورة */}
            {result.type === 'invoice' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <CreditCard className="w-5 h-5 text-primary" /> بيانات الفاتورة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {result.data.invoice_number && <div><span className="text-xs text-muted-foreground">رقم الفاتورة</span><p className="font-mono font-bold text-sm">{result.data.invoice_number}</p></div>}
                    {result.status && <div><span className="text-xs text-muted-foreground">الحالة</span><div className="mt-1"><Badge className={statusLabels[result.status]?.color || 'bg-gray-100'}>{statusLabels[result.status]?.label || result.status}</Badge></div></div>}
                    {result.data.total_amount && <div><span className="text-xs text-muted-foreground">المبلغ الإجمالي</span><p className="font-bold text-primary">{Number(result.data.total_amount).toLocaleString('ar-EG')} {result.data.currency || 'ج.م'}</p></div>}
                    {result.data.organization_name && <div><span className="text-xs text-muted-foreground">الجهة المصدرة</span><p className="font-semibold text-sm">{result.data.organization_name}</p></div>}
                    {result.data.partner_name && <div><span className="text-xs text-muted-foreground">العميل</span><p className="font-semibold text-sm">{result.data.partner_name}</p></div>}
                    {result.data.issue_date && <div><span className="text-xs text-muted-foreground">تاريخ الإصدار</span><p className="font-semibold text-sm">{format(new Date(result.data.issue_date), 'PP', { locale: ar })}</p></div>}
                    {result.data.due_date && <div><span className="text-xs text-muted-foreground">تاريخ الاستحقاق</span><p className="font-semibold text-sm">{format(new Date(result.data.due_date), 'PP', { locale: ar })}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* بيانات خطاب الترسية */}
            {result.type === 'award_letter' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 justify-end text-base">
                    <Award className="w-5 h-5 text-primary" /> بيانات خطاب الترسية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {result.data.letter_number && <div><span className="text-xs text-muted-foreground">رقم الخطاب</span><p className="font-mono font-bold text-sm">{result.data.letter_number}</p></div>}
                    {result.data.title && <div><span className="text-xs text-muted-foreground">العنوان</span><p className="font-semibold text-sm">{result.data.title}</p></div>}
                    {result.data.organization_name && <div><span className="text-xs text-muted-foreground">الجهة</span><p className="font-semibold text-sm">{result.data.organization_name}</p></div>}
                    {result.data.issue_date && <div><span className="text-xs text-muted-foreground">تاريخ الإصدار</span><p className="font-semibold text-sm">{format(new Date(result.data.issue_date), 'PP', { locale: ar })}</p></div>}
                    {result.data.start_date && <div><span className="text-xs text-muted-foreground">تاريخ البدء</span><p className="font-semibold text-sm">{format(new Date(result.data.start_date), 'PP', { locale: ar })}</p></div>}
                    {result.data.end_date && <div><span className="text-xs text-muted-foreground">تاريخ الانتهاء</span><p className="font-semibold text-sm">{format(new Date(result.data.end_date), 'PP', { locale: ar })}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══════ قسم التوقيعات والأختام ═══════ */}
            {hasSignatures && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 justify-end text-base">
                      <Fingerprint className="w-5 h-5 text-primary" />
                      التوقيعات والأختام الإلكترونية
                      <Badge variant="secondary" className="text-xs">{signatures.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {signatures.map((sig, idx) => (
                      <div key={sig.id} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {sig.signature_image_url && (
                              <img src={sig.signature_image_url} alt="التوقيع" className="h-10 w-auto max-w-[80px] object-contain border rounded bg-white p-1" />
                            )}
                            {sig.stamp_applied && sig.stamp_image_url && (
                              <img src={sig.stamp_image_url} alt="الختم" className="h-10 w-auto max-w-[80px] object-contain border rounded bg-white p-1" />
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{sig.signer_name}</p>
                            {sig.signer_title && <p className="text-xs text-muted-foreground">{sig.signer_title}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <PenTool className="w-2.5 h-2.5" />
                            {signatureMethodLabels[sig.signature_method] || sig.signature_method}
                          </Badge>
                          {sig.stamp_applied && (
                            <Badge variant="outline" className="gap-1 text-purple-700 border-purple-200">
                              <Stamp className="w-2.5 h-2.5" />
                              مختوم
                            </Badge>
                          )}
                          {sig.platform_seal_number && (
                            <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200">
                              <BadgeCheck className="w-2.5 h-2.5" />
                              ختم #{sig.platform_seal_number}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {format(new Date(sig.created_at), 'PP p', { locale: ar })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ═══════ البصمة الرقمية ═══════ */}
            {documentHash && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <Card className="border-amber-200/50 bg-amber-50/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-sm text-amber-800">البصمة الرقمية (SHA-256)</span>
                      <Lock className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="font-mono text-[10px] text-amber-700/80 break-all leading-relaxed bg-white/60 rounded p-2 border border-amber-100" dir="ltr">
                      {documentHash}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      هذه البصمة تضمن عدم التلاعب بمحتوى المستند بعد التوقيع
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* رسالة التحقق الرسمية للجهات الرقابية */}
      {result.isValid && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2 justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-sm text-emerald-800">رسالة التحقق الرسمية</span>
              </div>
              <p className="text-xs text-center text-emerald-700 leading-relaxed">
                نظام iRecycle: تم التحقق من صحة هذا المستند.
                الجهة المصدرة: <strong>{result.data?.generator || result.data?.organization_name || result.data?.signer_name || '—'}</strong>.
                {result.data?.license_status && <> حالة التراخيص وقت الإصدار: <strong>{result.data.license_status === 'active' ? 'سارية' : 'غير سارية'}</strong>.</>}
                {' '}المنصة تعمل كوسيط تقني لتوثيق حركة المخلفات رقمياً لضمان الشفافية.
              </p>
              <Separator className="my-2" />
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                البيانات الواردة تم إدخالها بواسطة المستخدم وتحت مسؤوليته الكاملة. لا تتحمل إدارة المنصة أي مسؤولية قانونية
                بخصوص صحة هذه البيانات أو طبيعة المواد المشحونة فعلياً.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* أزرار الإجراءات */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex gap-3 justify-center">
        <Button onClick={onScanAgain} variant="outline" className="gap-2">
          مسح رمز آخر
        </Button>
        {result.isValid && onViewDetails && (
          <Button onClick={onViewDetails} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            عرض التفاصيل الكاملة
          </Button>
        )}
      </motion.div>

      {/* تذييل */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-3 h-3 text-green-600" />
          <span>iRecycle - نظام إدارة المخلفات وإعادة التدوير</span>
          <Leaf className="w-3 h-3 text-green-600" />
        </div>
        <p>© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
};

export default VerificationResult;
