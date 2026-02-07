import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Building2,
  Truck,
  Recycle,
  Calendar,
  Scale,
  MapPin,
  Package,
  Leaf,
  Shield,
  Download,
  ExternalLink,
  Clock,
} from 'lucide-react';

export interface VerificationData {
  isValid: boolean;
  type: 'shipment' | 'certificate' | 'contract' | 'receipt' | 'report' | 'unknown';
  reference: string;
  status?: string;
  data?: {
    // بيانات الشحنة
    shipment_number?: string;
    waste_type?: string;
    quantity?: number;
    unit?: string;
    pickup_address?: string;
    delivery_address?: string;
    pickup_date?: string;
    delivered_at?: string;
    created_at?: string;
    // الأطراف
    generator?: { name: string; city?: string } | null;
    transporter?: { name: string; city?: string } | null;
    recycler?: { name: string; city?: string } | null;
    // بيانات الشهادة
    report_number?: string;
    waste_category?: string;
    recycler_organization?: { name: string } | null;
    // بيانات العقد
    contract_number?: string;
    title?: string;
    partner_name?: string;
    start_date?: string;
    end_date?: string;
    // بيانات الإيصال
    receipt_number?: string;
    signed_at?: string;
  } | null;
  message?: string;
  verifiedAt?: string;
}

interface VerificationResultProps {
  result: VerificationData;
  onScanAgain: () => void;
  onViewDetails?: () => void;
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
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'معتمدة', color: 'bg-green-100 text-green-800' },
  in_transit: { label: 'في الطريق', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'تم التسليم', color: 'bg-purple-100 text-purple-800' },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-100 text-emerald-800' },
  active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
};

const typeLabels: Record<string, { label: string; icon: any }> = {
  shipment: { label: 'شحنة', icon: Package },
  certificate: { label: 'شهادة تدوير', icon: Recycle },
  contract: { label: 'عقد', icon: FileText },
  receipt: { label: 'إيصال استلام', icon: FileText },
  report: { label: 'تقرير مجمع', icon: FileText },
  unknown: { label: 'مستند', icon: FileText },
};

const VerificationResult = ({ result, onScanAgain, onViewDetails }: VerificationResultProps) => {
  const TypeIcon = typeLabels[result.type]?.icon || FileText;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* حالة التحقق */}
      <Card className={`border-2 ${result.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className={`h-8 w-8 ${result.isValid ? 'text-green-600' : 'text-red-600'}`} />
            {result.isValid ? (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
            <Shield className={`h-8 w-8 ${result.isValid ? 'text-green-600' : 'text-red-600'}`} />
          </div>

          <h2 className={`text-2xl font-bold mb-2 ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
            {result.isValid ? 'تم التحقق بنجاح ✓' : 'فشل التحقق ✗'}
          </h2>

          <p className={result.isValid ? 'text-green-600' : 'text-red-600'}>
            {result.message || (result.isValid 
              ? `${typeLabels[result.type]?.label || 'المستند'} مسجل ومعتمد في النظام`
              : 'لم يتم العثور على المستند في النظام'
            )}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 border">
            <TypeIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-500">رقم المرجع: </span>
            <span className="font-mono font-bold text-primary">{result.reference}</span>
          </div>

          {result.verifiedAt && (
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>تم التحقق: {format(new Date(result.verifiedAt), 'PPpp', { locale: ar })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل المستند */}
      {result.isValid && result.data && (
        <>
          {/* بيانات الشحنة أو الشهادة */}
          {(result.type === 'shipment' || result.type === 'certificate' || result.type === 'receipt') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end">
                  <TypeIcon className="w-5 h-5 text-primary" />
                  بيانات {typeLabels[result.type]?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {result.data.shipment_number && (
                    <div>
                      <span className="text-sm text-muted-foreground">رقم الشحنة</span>
                      <p className="font-mono font-bold">{result.data.shipment_number}</p>
                    </div>
                  )}
                  {result.data.report_number && (
                    <div>
                      <span className="text-sm text-muted-foreground">رقم الشهادة</span>
                      <p className="font-mono font-bold">{result.data.report_number}</p>
                    </div>
                  )}
                  {result.data.receipt_number && (
                    <div>
                      <span className="text-sm text-muted-foreground">رقم الإيصال</span>
                      <p className="font-mono font-bold">{result.data.receipt_number}</p>
                    </div>
                  )}
                  {result.status && (
                    <div>
                      <span className="text-sm text-muted-foreground">الحالة</span>
                      <div className="mt-1">
                        <Badge className={statusLabels[result.status]?.color || 'bg-gray-100'}>
                          {statusLabels[result.status]?.label || result.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {result.data.waste_type && (
                    <div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" /> نوع المخلفات
                      </span>
                      <p className="font-semibold">
                        {wasteTypeLabels[result.data.waste_type] || result.data.waste_type}
                      </p>
                    </div>
                  )}
                  {result.data.quantity && (
                    <div>
                      <span className="text-sm text-muted-foreground">الكمية</span>
                      <p className="font-bold text-primary">
                        {result.data.quantity} {result.data.unit || 'كجم'}
                      </p>
                    </div>
                  )}
                  {result.data.waste_category && (
                    <div>
                      <span className="text-sm text-muted-foreground">تصنيف المخلفات</span>
                      <p className="font-semibold">
                        {result.data.waste_category === 'hazardous' ? 'خطرة' : 
                         result.data.waste_category === 'medical' ? 'طبية' : 'غير خطرة'}
                      </p>
                    </div>
                  )}
                </div>

                {(result.data.delivered_at || result.data.signed_at) && (
                  <div className="pt-4 mt-4 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 
                      {result.data.delivered_at ? 'تاريخ التسليم' : 'تاريخ التوقيع'}
                    </span>
                    <p className="font-semibold">
                      {format(new Date(result.data.delivered_at || result.data.signed_at!), 'PPpp', { locale: ar })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* الأطراف */}
          {(result.data.generator || result.data.transporter || result.data.recycler) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.data.generator && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <Building2 className="h-4 w-4" />
                      <span className="font-semibold text-sm">الجهة المولدة</span>
                    </div>
                    <p className="font-bold">{result.data.generator.name}</p>
                    {result.data.generator.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {result.data.generator.city}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.data.transporter && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                      <Truck className="h-4 w-4" />
                      <span className="font-semibold text-sm">جهة النقل</span>
                    </div>
                    <p className="font-bold">{result.data.transporter.name}</p>
                    {result.data.transporter.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {result.data.transporter.city}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {(result.data.recycler || result.data.recycler_organization) && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                      <Recycle className="h-4 w-4" />
                      <span className="font-semibold text-sm">جهة التدوير</span>
                    </div>
                    <p className="font-bold">
                      {result.data.recycler?.name || result.data.recycler_organization?.name}
                    </p>
                    {result.data.recycler?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {result.data.recycler.city}
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end">
                  <FileText className="w-5 h-5 text-primary" />
                  بيانات العقد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">رقم العقد</span>
                    <p className="font-mono font-bold">{result.data.contract_number}</p>
                  </div>
                  {result.data.title && (
                    <div>
                      <span className="text-sm text-muted-foreground">عنوان العقد</span>
                      <p className="font-semibold">{result.data.title}</p>
                    </div>
                  )}
                  {result.data.partner_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">الطرف الآخر</span>
                      <p className="font-semibold">{result.data.partner_name}</p>
                    </div>
                  )}
                  {result.data.start_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">تاريخ البدء</span>
                      <p className="font-semibold">
                        {format(new Date(result.data.start_date), 'PP', { locale: ar })}
                      </p>
                    </div>
                  )}
                  {result.data.end_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">تاريخ الانتهاء</span>
                      <p className="font-semibold">
                        {format(new Date(result.data.end_date), 'PP', { locale: ar })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* أزرار الإجراءات */}
      <div className="flex gap-3 justify-center">
        <Button onClick={onScanAgain} variant="outline" className="gap-2">
          مسح رمز آخر
        </Button>
        {result.isValid && onViewDetails && (
          <Button onClick={onViewDetails} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            عرض التفاصيل الكاملة
          </Button>
        )}
      </div>

      {/* تذييل */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-green-600" />
          <span>iRecycle - نظام إدارة المخلفات وإعادة التدوير</span>
          <Leaf className="w-4 h-4 text-green-600" />
        </div>
        <p>© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
};

export default VerificationResult;
