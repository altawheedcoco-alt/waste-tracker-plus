/**
 * ShipmentFullCircle — Visual cross-matching dashboard for a single shipment
 * Shows how all 4 parties contribute data and how they reconcile
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Factory, Truck, User, Recycle, ShieldCheck, Scale, Leaf,
  DollarSign, AlertTriangle, CheckCircle2, XCircle, Info,
  TrendingDown, MapPin, QrCode, FileCheck, Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useShipmentIntelligence, type ShipmentIntelligence } from '@/hooks/useShipmentIntelligence';

interface ShipmentFullCircleProps {
  shipmentId: string;
}

const gradeColors: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-100 border-emerald-300',
  'A': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'B': 'text-blue-600 bg-blue-50 border-blue-200',
  'C': 'text-amber-600 bg-amber-50 border-amber-200',
  'D': 'text-red-600 bg-red-50 border-red-200',
};

const partyIcons: Record<string, React.ElementType> = {
  generator: Factory,
  transporter: Truck,
  driver: User,
  recycler: Recycle,
};

const ShipmentFullCircle = ({ shipmentId }: ShipmentFullCircleProps) => {
  const { data: intel, isLoading, error } = useShipmentIntelligence(shipmentId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !intel) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm">تعذر تحميل بيانات التحليل</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Grade */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${gradeColors[intel.grade]}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${gradeColors[intel.grade]}`}>
                  <span className="text-2xl font-black">{intel.grade}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">تقييم الدائرة الكاملة</h3>
                  <p className="text-xs text-muted-foreground">Full Circle Assessment</p>
                </div>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black">{intel.overallHealth}%</span>
                <p className="text-[10px] text-muted-foreground">صحة البيانات</p>
              </div>
            </div>
            <Progress value={intel.overallHealth} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Party Contributions */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            مساهمة كل طرف
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {intel.parties.map((p) => {
            const Icon = partyIcons[p.party] || Info;
            return (
              <div key={p.party} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold">{p.partyAr}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{p.orgName}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${
                    p.completeness >= 75 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    p.completeness >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {p.completeness}%
                  </Badge>
                </div>
                <Progress value={p.completeness} className="h-1 mb-1.5" />
                <div className="flex flex-wrap gap-1">
                  {p.dataProvided.map((d) => (
                    <span key={d} className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {d}
                    </span>
                  ))}
                  {p.dataMissing.map((d) => (
                    <span key={d} className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      <XCircle className="w-2.5 h-2.5" /> {d}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Weight Reconciliation */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-500" />
            مطابقة الأوزان
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/30 p-2.5 border">
              <Factory className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold">{intel.weight.generatorWeight}</p>
              <p className="text-[9px] text-muted-foreground">وزن المولّد</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5 border">
              <Recycle className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold">{intel.weight.recyclerWeight || '—'}</p>
              <p className="text-[9px] text-muted-foreground">وزن المُعالِج</p>
            </div>
            <div className={`rounded-lg p-2.5 border ${
              intel.weight.status === 'match' ? 'bg-emerald-50 border-emerald-200' :
              intel.weight.status === 'minor' ? 'bg-amber-50 border-amber-200' :
              intel.weight.status === 'major' ? 'bg-red-50 border-red-200' :
              'bg-muted/30'
            }`}>
              {intel.weight.status === 'match' ? <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" /> :
               intel.weight.status === 'minor' ? <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-600" /> :
               intel.weight.status === 'major' ? <XCircle className="w-4 h-4 mx-auto mb-1 text-red-600" /> :
               <Info className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />}
              <p className="text-sm font-bold">{intel.weight.variance}%</p>
              <p className="text-[9px] text-muted-foreground">الفرق</p>
            </div>
          </div>
          {intel.weight.status === 'major' && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 text-[10px] text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              تحذير: فرق الأوزان يتجاوز الحد المسموح (10%) — يُرجى التحقيق
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            الامتثال القانوني
            <Badge variant="outline" className="mr-auto text-[10px]">
              {intel.compliance.overallScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5">
            <ComplianceItem label="رخصة المولد" ok={intel.compliance.generatorLicense} />
            <ComplianceItem label="رخصة الناقل" ok={intel.compliance.transporterLicense} />
            <ComplianceItem label="رخصة المُعالج" ok={intel.compliance.recyclerLicense} />
            <ComplianceItem label="بيانات السائق" ok={intel.compliance.driverLicense} />
            <ComplianceItem label="تصنيف النفايات" ok={intel.compliance.wasteClassified} />
            <ComplianceItem label="مسح QR" ok={intel.compliance.qrScanned} />
            <ComplianceItem label="تتبع GPS" ok={intel.compliance.gpsTracked} />
            <ComplianceItem label="وزن الميزان" ok={intel.compliance.weighbridgeVerified} />
            <ComplianceItem label="اكتمال المانيفست" ok={intel.compliance.manifestComplete} />
          </div>
        </CardContent>
      </Card>

      {/* Carbon & Financial Summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Carbon */}
        {intel.carbon && (
          <Card>
            <CardContent className="p-3 text-center">
              <Leaf className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-bold text-emerald-600">{intel.carbon.co2Saved.toFixed(2)}</p>
              <p className="text-[9px] text-muted-foreground">طن CO₂ موفّر</p>
              <Separator className="my-1.5" />
              <p className="text-xs font-medium">{intel.carbon.treesEquivalent} 🌳</p>
              <p className="text-[9px] text-muted-foreground">شجرة مكافئة</p>
            </CardContent>
          </Card>
        )}

        {/* Financial */}
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{intel.financial.totalAmount.toLocaleString('ar-EG')}</p>
            <p className="text-[9px] text-muted-foreground">ج.م (الوزن المعتمد: {intel.financial.approvedWeight})</p>
            <Separator className="my-1.5" />
            <Badge variant="outline" className={`text-[10px] ${
              intel.financial.paymentStatus === 'settled' 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-amber-50 text-amber-600'
            }`}>
              {intel.financial.paymentStatus === 'settled' ? 'مُسوّى' : 'معلق'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ComplianceItem = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className={`flex items-center gap-1 text-[9px] px-2 py-1.5 rounded border ${
    ok ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
       : 'bg-red-50/50 border-red-200 text-red-600 dark:bg-red-950/20 dark:text-red-400'
  }`}>
    {ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
    <span className="truncate">{label}</span>
  </div>
);

export default ShipmentFullCircle;
