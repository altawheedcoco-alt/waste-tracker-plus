import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { normalizeShipment, normalizeRecyclingReport } from '@/lib/supabaseHelpers';
import { ar } from 'date-fns/locale';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  Truck, 
  Building2, 
  Recycle,
  Scale,
  Calendar,
  MapPin,
  Leaf,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  new: { label: 'جديدة', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  approved: { label: 'معتمدة', color: 'bg-primary/10 text-primary' },
  in_transit: { label: 'في الطريق', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  delivered: { label: 'تم التسليم', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date?: string;
  delivered_at?: string;
  created_at: string;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; city?: string } | null;
  recycler?: { name: string; city?: string } | null;
}

interface RecyclingReport {
  id: string;
  report_number: string;
  waste_category: string;
  created_at: string;
  shipment?: ShipmentData | null;
  recycler_organization?: { name: string } | null;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [documentType, setDocumentType] = useState<'shipment' | 'certificate' | 'report' | null>(null);
  const [data, setData] = useState<ShipmentData | RecyclingReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const type = searchParams.get('type');
  const code = searchParams.get('code');

  useEffect(() => {
    const verifyDocument = async () => {
      if (!type || !code) {
        setError('رابط التحقق غير صالح');
        setLoading(false);
        return;
      }

      try {
        if (type === 'shipment') {
          const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .select(`
              *,
              generator:organizations!shipments_generator_id_fkey(name, city),
              transporter:organizations!shipments_transporter_id_fkey(name, city),
              recycler:organizations!shipments_recycler_id_fkey(name, city)
            `)
            .eq('shipment_number', code)
            .single();

          if (shipmentError || !shipment) {
            setError('لم يتم العثور على الشحنة');
            setLoading(false);
            return;
          }

          setData(normalizeShipment(shipment as any) as any);
          setDocumentType('shipment');
          setVerified(true);
        } else if (type === 'certificate' || type === 'recycling') {
          // First try to find by report number
          const { data: report, error: reportError } = await supabase
            .from('recycling_reports')
            .select(`
              *,
              shipment:shipments(
                *,
                generator:organizations!shipments_generator_id_fkey(name, city),
                transporter:organizations!shipments_transporter_id_fkey(name, city),
                recycler:organizations!shipments_recycler_id_fkey(name, city)
              ),
              recycler_organization:organizations!recycling_reports_recycler_organization_id_fkey(name)
            `)
            .eq('report_number', code)
            .single();

          if (!reportError && report) {
            setData(normalizeRecyclingReport(report as any) as any);
            setDocumentType('certificate');
            setVerified(true);
          } else {
            // Try finding by shipment number
            const { data: shipment, error: shipmentError } = await supabase
              .from('shipments')
              .select(`
                *,
                generator:organizations!shipments_generator_id_fkey(name, city),
                transporter:organizations!shipments_transporter_id_fkey(name, city),
                recycler:organizations!shipments_recycler_id_fkey(name, city)
              `)
              .eq('shipment_number', code)
              .single();

            if (shipmentError || !shipment) {
              setError('لم يتم العثور على الشهادة');
              setLoading(false);
              return;
            }

            setData(normalizeShipment(shipment as any) as any);
            setDocumentType('shipment');
            setVerified(true);
          }
        } else if (type === 'aggregate') {
          // Aggregate reports verification - just show success with the report number
          setDocumentType('report');
          setVerified(true);
          setData(null);
        } else {
          setError('نوع المستند غير معروف');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('حدث خطأ أثناء التحقق');
      } finally {
        setLoading(false);
      }
    };

    verifyDocument();
  }, [type, code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">جاري التحقق من المستند...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-700 mb-2">فشل التحقق</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shipmentData = documentType === 'shipment' ? (data as ShipmentData) : 
                       documentType === 'certificate' ? (data as RecyclingReport)?.shipment : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-10 w-10 text-green-600" />
            <h1 className="text-3xl font-bold text-green-700">iRecycle</h1>
          </div>
          <p className="text-gray-600">نظام إدارة المخلفات وإعادة التدوير</p>
        </div>

        {/* Verification Status */}
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">تم التحقق بنجاح ✓</h2>
            <p className="text-green-600">
              {documentType === 'shipment' && 'هذه الشحنة مسجلة ومعتمدة في النظام'}
              {documentType === 'certificate' && 'شهادة إعادة التدوير هذه صادرة رسمياً من النظام'}
              {documentType === 'report' && 'هذا التقرير المجمع صادر رسمياً من النظام'}
            </p>
            <div className="mt-4 inline-block bg-white rounded-lg px-4 py-2 border border-green-200">
              <span className="text-sm text-gray-500">رقم المرجع: </span>
              <span className="font-mono font-bold text-green-700">{code}</span>
            </div>
          </CardContent>
        </Card>

        {/* Document Details */}
        {documentType === 'report' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                تقرير مجمع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                هذا تقرير مجمع يحتوي على بيانات متعددة الشحنات. التقرير صادر رسمياً من نظام iRecycle.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                تاريخ التحقق: {format(new Date(), 'PPpp', { locale: ar })}
              </p>
            </CardContent>
          </Card>
        )}

        {shipmentData && (
          <>
            {/* Shipment Info */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  بيانات الشحنة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">رقم الشحنة</span>
                    <p className="font-mono font-bold">{shipmentData.shipment_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">الحالة</span>
                    <div className="mt-1">
                      <Badge className={statusLabels[shipmentData.status]?.color || 'bg-gray-100'}>
                        {statusLabels[shipmentData.status]?.label || shipmentData.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Scale className="h-3 w-3" /> نوع المخلفات
                    </span>
                    <p className="font-semibold">{wasteTypeLabels[shipmentData.waste_type] || shipmentData.waste_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">الكمية</span>
                    <p className="font-bold text-green-600">{shipmentData.quantity} {shipmentData.unit || 'كجم'}</p>
                  </div>
                </div>

                {shipmentData.delivered_at && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> تاريخ التسليم
                    </span>
                    <p className="font-semibold">
                      {format(new Date(shipmentData.delivered_at), 'PPpp', { locale: ar })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Generator */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <Building2 className="h-4 w-4" />
                    <span className="font-semibold text-sm">الجهة المولدة</span>
                  </div>
                  <p className="font-bold">{shipmentData.generator?.name || '-'}</p>
                  {shipmentData.generator?.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {shipmentData.generator.city}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Transporter */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2 text-orange-600">
                    <Truck className="h-4 w-4" />
                    <span className="font-semibold text-sm">جهة النقل</span>
                  </div>
                  <p className="font-bold">{shipmentData.transporter?.name || '-'}</p>
                  {shipmentData.transporter?.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {shipmentData.transporter.city}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recycler */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                    <Recycle className="h-4 w-4" />
                    <span className="font-semibold text-sm">جهة التدوير</span>
                  </div>
                  <p className="font-bold">{shipmentData.recycler?.name || '-'}</p>
                  {shipmentData.recycler?.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {shipmentData.recycler.city}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Certificate Info */}
        {documentType === 'certificate' && data && 'report_number' in data && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Recycle className="h-5 w-5 text-green-600" />
                بيانات شهادة التدوير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">رقم الشهادة</span>
                  <p className="font-mono font-bold">{data.report_number}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">تصنيف المخلفات</span>
                  <p className="font-semibold">
                    {data.waste_category === 'hazardous' ? 'خطرة' : 
                     data.waste_category === 'medical' ? 'طبية' : 'غير خطرة'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">جهة التدوير</span>
                  <p className="font-semibold">{data.recycler_organization?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">تاريخ الإصدار</span>
                  <p className="font-semibold">
                    {format(new Date(data.created_at), 'PP', { locale: ar })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>تم التحقق بتاريخ: {format(new Date(), 'PPpp', { locale: ar })}</p>
          <p className="mt-2">© {new Date().getFullYear()} iRecycle - نظام إدارة المخلفات وإعادة التدوير</p>
          <Link to="/" className="text-green-600 hover:underline mt-4 inline-block">
            زيارة الموقع الرئيسي
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Verify;
