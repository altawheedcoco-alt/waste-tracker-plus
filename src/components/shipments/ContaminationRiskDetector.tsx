/**
 * AI Contamination Risk Detector
 * Assesses contamination risk for waste shipments based on type, method, and historical data
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Info,
  Skull, Droplets, Flame, Biohazard, CircleAlert
} from 'lucide-react';

interface ContaminationProps {
  wasteType: string;
  quantity: number;
  unit?: string;
  disposalMethod?: string;
  mixedMaterials?: boolean;
  hasLabReport?: boolean;
  containerCondition?: 'good' | 'fair' | 'poor';
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
  regulatoryFlags: string[];
}

interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  icon: React.ElementType;
}

// Risk profiles per waste type
const RISK_PROFILES: Record<string, {
  baseRisk: number;
  hazards: string[];
  regulations: string[];
}> = {
  chemical: { baseRisk: 80, hazards: ['سمية', 'تفاعل كيميائي', 'تآكل'], regulations: ['بازل', 'قانون 4/1994'] },
  medical: { baseRisk: 85, hazards: ['عدوى بيولوجية', 'أدوات حادة', 'نفايات مشعة'], regulations: ['قانون 202/2020', 'WHO Guidelines'] },
  electronic: { baseRisk: 60, hazards: ['معادن ثقيلة', 'بطاريات ليثيوم', 'غازات سامة'], regulations: ['توجيه WEEE', 'بازل'] },
  plastic: { baseRisk: 25, hazards: ['ملوثات كيميائية', 'مواد غير متوافقة'], regulations: ['قانون 202/2020'] },
  paper: { baseRisk: 15, hazards: ['رطوبة', 'تلوث حبري'], regulations: [] },
  metal: { baseRisk: 35, hazards: ['حواف حادة', 'تلوث زيتي', 'صدأ'], regulations: [] },
  glass: { baseRisk: 30, hazards: ['كسر', 'تلوث كيميائي'], regulations: [] },
  organic: { baseRisk: 40, hazards: ['تعفن', 'غازات سامة', 'حشرات'], regulations: ['صحة عامة'] },
  construction: { baseRisk: 35, hazards: ['غبار', 'أسبستوس', 'معادن ثقيلة'], regulations: ['بيئة / بناء'] },
  other: { baseRisk: 50, hazards: ['غير محدد'], regulations: ['تصنيف مطلوب'] },
};

const assessContaminationRisk = (props: ContaminationProps): RiskAssessment => {
  const profile = RISK_PROFILES[props.wasteType] || RISK_PROFILES.other;
  let riskScore = profile.baseRisk;
  const factors: RiskFactor[] = [];
  const recommendations: string[] = [];

  // Factor: Mixed materials
  if (props.mixedMaterials) {
    riskScore += 15;
    factors.push({
      name: 'مواد مختلطة',
      level: 'high',
      description: 'خلط أنواع مختلفة يزيد احتمال التلوث المتبادل',
      icon: Droplets,
    });
    recommendations.push('فصل المواد قبل النقل لتقليل مخاطر التلوث المتبادل');
  }

  // Factor: No lab report for hazardous waste
  if (['chemical', 'medical', 'electronic'].includes(props.wasteType) && !props.hasLabReport) {
    riskScore += 10;
    factors.push({
      name: 'تقرير مختبري مفقود',
      level: 'high',
      description: 'المخلفات الخطرة تتطلب تحليل مختبري للتأكد من التركيب',
      icon: CircleAlert,
    });
    recommendations.push('إرفاق تقرير تحليل مختبري معتمد قبل النقل');
  }

  // Factor: Container condition
  if (props.containerCondition === 'poor') {
    riskScore += 12;
    factors.push({
      name: 'حالة الحاوية سيئة',
      level: 'high',
      description: 'حاوية تالفة قد تسبب تسرب أو انسكاب',
      icon: AlertTriangle,
    });
    recommendations.push('استبدال الحاوية بأخرى سليمة قبل النقل');
  } else if (props.containerCondition === 'fair') {
    riskScore += 5;
    factors.push({
      name: 'حالة الحاوية متوسطة',
      level: 'medium',
      description: 'يُنصح بفحص الحاوية قبل النقل',
      icon: Info,
    });
  }

  // Factor: Large quantity
  const tons = (props.unit === 'كجم' || props.unit === 'kg') ? props.quantity / 1000 : props.quantity;
  if (tons > 10) {
    riskScore += 8;
    factors.push({
      name: 'كمية كبيرة',
      level: 'medium',
      description: `${tons} طن — كميات كبيرة تتطلب احتياطات إضافية`,
      icon: Flame,
    });
    recommendations.push('تقسيم الحمولة على دفعات أو استخدام مركبات مخصصة');
  }

  // Factor: Disposal method
  if (!props.disposalMethod || props.disposalMethod === 'landfill') {
    riskScore += 5;
    recommendations.push('النظر في خيارات التدوير بدلاً من الدفن لتقليل الأثر البيئي');
  }

  // Always add base hazard factor
  if (profile.hazards.length > 0) {
    factors.push({
      name: `مخاطر ${props.wasteType}`,
      level: profile.baseRisk >= 60 ? 'high' : profile.baseRisk >= 30 ? 'medium' : 'low',
      description: profile.hazards.join('، '),
      icon: profile.baseRisk >= 60 ? Biohazard : ShieldAlert,
    });
  }

  riskScore = Math.min(100, riskScore);

  const overallRisk: RiskAssessment['overallRisk'] = 
    riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

  if (recommendations.length === 0) {
    recommendations.push('لا توجد مخاطر عالية — استمر بالإجراءات المعتادة');
  }

  return {
    overallRisk,
    riskScore,
    factors,
    recommendations,
    regulatoryFlags: profile.regulations,
  };
};

const riskConfig = {
  low: { label: 'منخفض', color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-300', barColor: 'bg-emerald-500' },
  medium: { label: 'متوسط', color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-300', barColor: 'bg-yellow-500' },
  high: { label: 'مرتفع', color: 'text-orange-600', bg: 'bg-orange-100 border-orange-300', barColor: 'bg-orange-500' },
  critical: { label: 'حرج', color: 'text-red-600', bg: 'bg-red-100 border-red-300', barColor: 'bg-red-500' },
};

const ContaminationRiskDetector: React.FC<ContaminationProps> = (props) => {
  const assessment = useMemo(() => assessContaminationRisk(props), [props]);
  const config = riskConfig[assessment.overallRisk];

  return (
    <div className="space-y-3">
      {/* Risk Score */}
      <Card className={`border ${config.bg}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${config.color}`} />
              <span className="font-bold text-sm">تقييم مخاطر التلوث</span>
            </div>
            <Badge className={`${config.bg} ${config.color} text-[10px] font-bold`}>
              {config.label} — {assessment.riskScore}%
            </Badge>
          </div>
          <Progress value={assessment.riskScore} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {assessment.factors.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <CardTitle className="text-sm">عوامل الخطر</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {assessment.factors.map((f, i) => {
              const fConfig = riskConfig[f.level];
              return (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/30 border">
                  <f.icon className={`w-4 h-4 mt-0.5 shrink-0 ${fConfig.color}`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{f.name}</span>
                      <Badge variant="outline" className={`text-[8px] h-3.5 px-1 ${fConfig.color}`}>
                        {fConfig.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            التوصيات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ul className="space-y-1.5">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="text-[10px] flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Regulatory Flags */}
      {assessment.regulatoryFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assessment.regulatoryFlags.map((flag, i) => (
            <Badge key={i} variant="outline" className="text-[9px]">
              📋 {flag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export { assessContaminationRisk };
export default ContaminationRiskDetector;
