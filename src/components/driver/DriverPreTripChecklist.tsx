import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ClipboardCheck, ShieldCheck, AlertTriangle, CheckCircle2,
  Truck, Eye, Gauge, Wrench, FileText, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverPreTripChecklistProps {
  driverId: string;
  onComplete?: () => void;
}

const checklistCategories = [
  {
    id: 'vehicle',
    title: 'فحص المركبة',
    icon: Truck,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      { id: 'tires', label: 'حالة الإطارات وضغط الهواء', critical: true },
      { id: 'brakes', label: 'فحص الفرامل', critical: true },
      { id: 'lights', label: 'الأضواء الأمامية والخلفية', critical: true },
      { id: 'mirrors', label: 'المرايا الجانبية والخلفية', critical: false },
      { id: 'horn', label: 'البوق يعمل بشكل سليم', critical: false },
    ],
  },
  {
    id: 'safety',
    title: 'معدات السلامة',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    items: [
      { id: 'fire_ext', label: 'طفاية الحريق صالحة', critical: true },
      { id: 'first_aid', label: 'حقيبة الإسعافات الأولية', critical: true },
      { id: 'reflective', label: 'مثلث التحذير العاكس', critical: false },
      { id: 'vest', label: 'سترة السلامة العاكسة', critical: false },
    ],
  },
  {
    id: 'documents',
    title: 'المستندات',
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    items: [
      { id: 'license', label: 'رخصة القيادة سارية', critical: true },
      { id: 'registration', label: 'استمارة المركبة', critical: true },
      { id: 'insurance', label: 'تأمين المركبة ساري', critical: true },
      { id: 'permits', label: 'تصاريح النقل', critical: false },
    ],
  },
  {
    id: 'fluids',
    title: 'السوائل والمقاييس',
    icon: Gauge,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    items: [
      { id: 'fuel', label: 'مستوى الوقود كافٍ', critical: true },
      { id: 'oil', label: 'مستوى الزيت طبيعي', critical: false },
      { id: 'coolant', label: 'سائل التبريد', critical: false },
      { id: 'windshield', label: 'سائل المساحات', critical: false },
    ],
  },
];

const allItems = checklistCategories.flatMap(c => c.items);
const criticalItems = allItems.filter(i => i.critical);

const DriverPreTripChecklist = ({ driverId, onComplete }: DriverPreTripChecklistProps) => {
  const { toast } = useToast();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // Check if already completed today
    const todayKey = `pretripcheck_${driverId}_${new Date().toISOString().split('T')[0]}`;
    if (localStorage.getItem(todayKey)) {
      setCompletedToday(true);
    }
  }, [driverId]);

  const toggleItem = (itemId: string) => {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = allItems.length;
  const progress = (checkedCount / totalCount) * 100;
  const criticalChecked = criticalItems.every(i => checked[i.id]);
  const allChecked = checkedCount === totalCount;

  const handleSubmit = async () => {
    if (!criticalChecked) {
      toast({ title: 'يجب إكمال جميع البنود الحرجة ⚠️', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const todayKey = `pretripcheck_${driverId}_${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(todayKey, JSON.stringify({
        checked,
        completedAt: new Date().toISOString(),
        duration: elapsed,
      }));

      setCompletedToday(true);
      toast({ title: 'تم اعتماد الفحص بنجاح ✅', description: `${checkedCount}/${totalCount} بند - ${elapsed} ثانية` });
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedToday) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <p className="font-bold text-lg">فحص ما قبل الرحلة مكتمل ✅</p>
          <p className="text-sm text-muted-foreground mt-1">تم اعتماد الفحص اليوم - قيادة آمنة!</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs"
            onClick={() => setCompletedToday(false)}
          >
            إعادة الفحص
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            فحص ما قبل الرحلة
            <Badge variant="outline" className="text-[10px] mr-auto gap-1">
              <Timer className="w-3 h-3" />
              إلزامي
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>{checkedCount}/{totalCount} بند</span>
            <span className={criticalChecked ? 'text-emerald-500' : 'text-destructive'}>
              {criticalChecked ? 'البنود الحرجة مكتملة ✓' : `${criticalItems.filter(i => !checked[i.id]).length} بند حرج متبقي`}
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Categories */}
      {checklistCategories.map((cat, catIdx) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIdx * 0.08 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                {cat.title}
                <Badge variant="outline" className="text-[10px] mr-auto">
                  {cat.items.filter(i => checked[i.id]).length}/{cat.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-right ${
                    checked[item.id]
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : item.critical
                      ? 'bg-destructive/5 border-destructive/10 hover:border-destructive/30'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox checked={!!checked[item.id]} className="pointer-events-none" />
                  <span className={`flex-1 text-sm ${checked[item.id] ? 'line-through text-muted-foreground' : ''}`}>
                    {item.label}
                  </span>
                  {item.critical && !checked[item.id] && (
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  {checked[item.id] && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Submit */}
      <Button
        className="w-full h-12 text-base gap-2"
        disabled={!criticalChecked || isSubmitting}
        onClick={handleSubmit}
      >
        <ShieldCheck className="w-5 h-5" />
        {allChecked ? 'اعتماد الفحص الكامل ✅' : criticalChecked ? 'اعتماد الفحص (بنود اختيارية متبقية)' : 'أكمل البنود الحرجة أولاً'}
      </Button>
    </div>
  );
};

export default DriverPreTripChecklist;
