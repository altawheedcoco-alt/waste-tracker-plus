import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, Phone, MapPin, Clock, Users, ShieldAlert,
  Flame, Droplets, Wind, FileText, CheckCircle2, Radio
} from 'lucide-react';

interface EmergencyPlan {
  id: string;
  type: 'chemical_spill' | 'fire' | 'environmental' | 'injury' | 'equipment_failure';
  title: string;
  severity: 'critical' | 'high' | 'medium';
  steps: string[];
  contacts: { role: string; name: string; phone: string }[];
  equipment_needed: string[];
  last_drill?: string;
}

const EMERGENCY_TYPES = {
  chemical_spill: { label: 'تسرب كيماوي', icon: Droplets, color: 'text-purple-600' },
  fire: { label: 'حريق', icon: Flame, color: 'text-red-600' },
  environmental: { label: 'تلوث بيئي', icon: Wind, color: 'text-amber-600' },
  injury: { label: 'إصابة عمل', icon: Users, color: 'text-blue-600' },
  equipment_failure: { label: 'عطل معدات', icon: ShieldAlert, color: 'text-orange-600' },
};

const DEMO_PLANS: EmergencyPlan[] = [
  {
    id: '1', type: 'chemical_spill', title: 'خطة استجابة التسرب الكيماوي',
    severity: 'critical',
    steps: ['إخلاء المنطقة فوراً (نطاق 50م)', 'إخطار مسؤول السلامة', 'ارتداء معدات الحماية الكاملة', 'احتواء التسرب بالحواجز', 'إبلاغ الجهات الرقابية خلال 1 ساعة', 'توثيق الحادث بالصور والتقارير'],
    contacts: [{ role: 'مسؤول السلامة', name: 'م. خالد', phone: '01001234567' }, { role: 'الدفاع المدني', name: '', phone: '180' }],
    equipment_needed: ['بدلة حماية كيماوية', 'حواجز امتصاص', 'أقنعة تنفس', 'مواد معادلة'],
    last_drill: '2026-03-15',
  },
  {
    id: '2', type: 'fire', title: 'خطة مكافحة الحرائق',
    severity: 'critical',
    steps: ['تشغيل إنذار الحريق', 'إخلاء المبنى عبر مخارج الطوارئ', 'الاتصال بالإطفاء', 'استخدام طفايات الحريق إن أمكن', 'التجمع في نقطة التجمع المحددة', 'إجراء عد الأفراد'],
    contacts: [{ role: 'الإطفاء', name: '', phone: '180' }, { role: 'الإسعاف', name: '', phone: '123' }],
    equipment_needed: ['طفايات حريق', 'خراطيم مياه', 'بطانيات إطفاء', 'إسعافات أولية'],
    last_drill: '2026-02-28',
  },
  {
    id: '3', type: 'environmental', title: 'خطة الاستجابة للتلوث البيئي',
    severity: 'high',
    steps: ['تحديد مصدر التلوث', 'وقف مصدر التلوث', 'إبلاغ وزارة البيئة', 'أخذ عينات من الهواء/التربة/المياه', 'تنفيذ إجراءات المعالجة', 'تقديم تقرير بيئي خلال 48 ساعة'],
    contacts: [{ role: 'وزارة البيئة', name: '', phone: '19808' }],
    equipment_needed: ['أدوات أخذ عينات', 'حواجز احتواء', 'مواد امتصاص'],
    last_drill: '2026-01-20',
  },
];

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const EmergencyResponseDashboard = () => {
  const daysSinceLastDrill = Math.min(...DEMO_PLANS.map(p => {
    if (!p.last_drill) return 999;
    return Math.floor((Date.now() - new Date(p.last_drill).getTime()) / (1000 * 60 * 60 * 24));
  }));

  return (
    <div className="space-y-4" dir="rtl">
      {/* Quick Actions */}
      <Card className="border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-sm font-bold text-red-700 dark:text-red-400">زر الطوارئ</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" size="sm" className="h-9 text-xs">
              <Flame className="h-4 w-4 ml-1" />
              إنذار حريق
            </Button>
            <Button variant="destructive" size="sm" className="h-9 text-xs">
              <Droplets className="h-4 w-4 ml-1" />
              تسرب كيماوي
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs border-red-300 text-red-700">
              <Users className="h-4 w-4 ml-1" />
              إصابة عمل
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs border-red-300 text-red-700">
              <Phone className="h-4 w-4 ml-1" />
              اتصال طوارئ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <FileText className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_PLANS.length}</div>
            <p className="text-[10px] text-muted-foreground">خطة طوارئ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <div className="text-lg font-bold">{daysSinceLastDrill}</div>
            <p className="text-[10px] text-muted-foreground">يوم منذ آخر تدريب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-lg font-bold">100%</div>
            <p className="text-[10px] text-muted-foreground">تغطية الخطط</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <div className="space-y-3">
        {DEMO_PLANS.map(plan => {
          const typeConfig = EMERGENCY_TYPES[plan.type];
          const TypeIcon = typeConfig.icon;
          return (
            <Card key={plan.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                    <div>
                      <h3 className="text-sm font-semibold">{plan.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{typeConfig.label}</p>
                    </div>
                  </div>
                  <Badge className={SEVERITY_COLORS[plan.severity] + ' text-[9px] h-5'}>
                    {plan.severity === 'critical' ? 'حرج' : plan.severity === 'high' ? 'عالي' : 'متوسط'}
                  </Badge>
                </div>

                {/* Steps */}
                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-semibold mb-1.5">خطوات الاستجابة:</p>
                  <ol className="space-y-1">
                    {plan.steps.map((step, i) => (
                      <li key={i} className="text-[10px] flex gap-1.5">
                        <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Contacts */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {plan.contacts.map((c, i) => (
                    <Button key={i} variant="outline" size="sm" className="h-7 text-[10px]">
                      <Phone className="h-3 w-3 ml-1" />
                      {c.role}: {c.phone}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>آخر تدريب: {plan.last_drill ? new Date(plan.last_drill).toLocaleDateString('ar-EG') : 'لم يتم'}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]">تنفيذ تدريب</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EmergencyResponseDashboard;
