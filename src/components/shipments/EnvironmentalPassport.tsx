import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Leaf, TreePine, Droplets, Zap, Factory, Truck, Recycle,
  ShieldCheck, Award, Download, QrCode, TrendingDown, Flame,
  ThermometerSun, Wind, Globe, FileCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateGreenPoints, getGreenLevel, DEFAULT_GREEN_FACTORS } from '@/lib/greenPointsEngine';

interface PassportProps {
  shipment: {
    id: string;
    waste_type?: string;
    quantity?: number;
    unit?: string;
    status?: string;
    disposal_method?: string;
    pickup_latitude?: number;
    pickup_longitude?: number;
    delivery_latitude?: number;
    delivery_longitude?: number;
    generator_name?: string;
    transporter_name?: string;
    recycler_name?: string;
    created_at?: string;
    delivered_at?: string;
  };
  carbonResult?: {
    transportEmissions: number;
    processingEmissions: number;
    totalEmissions: number;
    co2Saved: number;
    netImpact: number;
    distanceKm: number;
    treesEquivalent: number;
    carsEquivalent: number;
    homesEquivalent: number;
    recyclingRate: number;
  } | null;
}

const gradeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  'A+': { label: 'ممتاز+', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: Award },
  'A': { label: 'ممتاز', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: ShieldCheck },
  'B': { label: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Leaf },
  'C': { label: 'جيد', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: Leaf },
  'D': { label: 'يحتاج تحسين', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: TrendingDown },
};

const EnvironmentalPassport: React.FC<PassportProps> = ({ shipment, carbonResult }) => {
  const wasteType = shipment.waste_type || 'other';
  const quantity = Number(shipment.quantity) || 0;
  const unit = shipment.unit || 'كجم';
  const weightTons = (unit === 'كجم' || unit === 'kg' || !unit) ? quantity / 1000 : quantity;

  const greenPoints = useMemo(() => calculateGreenPoints(wasteType, weightTons), [wasteType, weightTons]);
  const greenLevel = useMemo(() => getGreenLevel(greenPoints.finalPoints), [greenPoints.finalPoints]);

  // Calculate environmental grade
  const grade = useMemo(() => {
    if (!carbonResult) return 'C';
    const ratio = carbonResult.co2Saved / Math.max(carbonResult.totalEmissions, 0.001);
    if (ratio >= 3) return 'A+';
    if (ratio >= 2) return 'A';
    if (ratio >= 1) return 'B';
    if (ratio >= 0.5) return 'C';
    return 'D';
  }, [carbonResult]);

  const gradeInfo = gradeConfig[grade] || gradeConfig['C'];
  const GradeIcon = gradeInfo.icon;

  const lifecycle = [
    { label: 'التوليد', icon: Factory, entity: shipment.generator_name || '—', done: true },
    { label: 'النقل', icon: Truck, entity: shipment.transporter_name || '—', done: ['in_transit', 'delivered', 'confirmed'].includes(shipment.status || '') },
    { label: 'المعالجة', icon: Recycle, entity: shipment.recycler_name || '—', done: ['delivered', 'confirmed'].includes(shipment.status || '') },
    { label: 'التحقق', icon: ShieldCheck, entity: 'النظام', done: shipment.status === 'confirmed' },
  ];

  const factors = DEFAULT_GREEN_FACTORS[wasteType] || DEFAULT_GREEN_FACTORS.other;

  return (
    <div className="space-y-4">
      {/* Header Card - Environmental Grade */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${gradeInfo.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${gradeInfo.bg}`}>
                  <span className={`text-2xl font-black ${gradeInfo.color}`}>{grade}</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">جواز السفر البيئي</h3>
                  <p className={`text-sm font-semibold ${gradeInfo.color}`}>
                    التقييم: {gradeInfo.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    شحنة #{shipment.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <GradeIcon className={`w-6 h-6 ${gradeInfo.color}`} />
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lifecycle Chain */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            سلسلة دورة الحياة
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {lifecycle.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    step.done 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-medium text-center">{step.label}</span>
                  <span className="text-[8px] text-muted-foreground truncate max-w-[60px] text-center">{step.entity}</span>
                </div>
                {i < lifecycle.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded ${step.done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Carbon Metrics */}
      {carbonResult && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ThermometerSun className="w-4 h-4 text-orange-500" />
              البصمة الكربونية
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricBox
                icon={<Truck className="w-3.5 h-3.5 text-blue-500" />}
                label="انبعاثات النقل"
                value={`${carbonResult.transportEmissions.toFixed(3)} طن`}
                sub={`${carbonResult.distanceKm} كم`}
              />
              <MetricBox
                icon={<Factory className="w-3.5 h-3.5 text-gray-500" />}
                label="انبعاثات المعالجة"
                value={`${carbonResult.processingEmissions.toFixed(3)} طن`}
              />
              <MetricBox
                icon={<Flame className="w-3.5 h-3.5 text-red-500" />}
                label="إجمالي الانبعاثات"
                value={`${carbonResult.totalEmissions.toFixed(3)} طن`}
                highlight="destructive"
              />
              <MetricBox
                icon={<Leaf className="w-3.5 h-3.5 text-emerald-500" />}
                label="CO₂ تم توفيره"
                value={`${carbonResult.co2Saved.toFixed(3)} طن`}
                highlight="success"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">صافي الأثر الكربوني</span>
              <span className={`font-bold ${carbonResult.netImpact <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {carbonResult.netImpact <= 0 ? '✅ سالب (إيجابي)' : '⚠️ موجب (سلبي)'}
                {' '}{Math.abs(carbonResult.netImpact).toFixed(3)} طن
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environmental Equivalents */}
      {carbonResult && carbonResult.co2Saved > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wind className="w-4 h-4 text-teal-500" />
              المكافئات البيئية
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-3">
              <EquivalentBox
                icon={<TreePine className="w-5 h-5 text-green-600" />}
                value={carbonResult.treesEquivalent}
                label="شجرة/سنة"
              />
              <EquivalentBox
                icon={<Zap className="w-5 h-5 text-yellow-500" />}
                value={greenPoints.energySavedKwh}
                label="كيلوواط ساعة"
              />
              <EquivalentBox
                icon={<Droplets className="w-5 h-5 text-blue-500" />}
                value={greenPoints.waterSavedLiters}
                label="لتر مياه"
              />
              <EquivalentBox
                icon={<Recycle className="w-5 h-5 text-emerald-500" />}
                value={greenPoints.finalPoints}
                label="نقطة خضراء"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Green Points Summary */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-sm">المستوى الأخضر</span>
            </div>
            <Badge variant="outline" className={`${greenLevel.color} border-emerald-300`}>
              {greenLevel.label}
            </Badge>
          </div>
          <Progress 
            value={(greenPoints.finalPoints / greenLevel.nextThreshold) * 100} 
            className="h-2 mb-1" 
          />
          <p className="text-[10px] text-muted-foreground text-left">
            {greenPoints.finalPoints} / {greenLevel.nextThreshold} نقطة للمستوى التالي
          </p>
        </CardContent>
      </Card>

      {/* Waste Type Impact Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">أثر تدوير {wasteType}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{factors.description_ar}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-muted/50 rounded-lg p-2">
              <span className="font-bold block">{factors.points_per_ton}</span>
              <span className="text-muted-foreground">نقطة/طن</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <span className="font-bold block">{factors.trees_per_ton}</span>
              <span className="text-muted-foreground">شجرة/طن</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <span className="font-bold block">{factors.energy_saved_kwh_per_ton}</span>
              <span className="text-muted-foreground">كوات/طن</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MetricBox = ({ icon, label, value, sub, highlight }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  highlight?: 'success' | 'destructive';
}) => (
  <div className={`rounded-lg p-2.5 border ${
    highlight === 'success' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20' :
    highlight === 'destructive' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' :
    'bg-muted/30'
  }`}>
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <span className="font-bold text-sm">{value}</span>
    {sub && <span className="text-[9px] text-muted-foreground block">{sub}</span>}
  </div>
);

const EquivalentBox = ({ icon, value, label }: {
  icon: React.ReactNode; value: number; label: string;
}) => (
  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 border">
    {icon}
    <div>
      <span className="font-bold text-sm block">{value.toLocaleString('ar-EG')}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  </div>
);

export default EnvironmentalPassport;
