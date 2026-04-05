/**
 * تنبيهات موسمية - تنبيهات ذكية بالزيادة المتوقعة في النفايات حسب الموسم
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertTriangle, TrendingUp, Sun, Moon } from 'lucide-react';
import { useMemo } from 'react';

interface SeasonalAlert {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  icon: typeof Sun;
  wasteTypes: string[];
  expectedIncrease: string;
}

const SeasonalWasteAlerts = () => {
  const alerts = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();
    const result: SeasonalAlert[] = [];

    // Ramadan check (approximate - varies by year)
    if (month === 2 || month === 3) {
      result.push({
        title: '🌙 موسم رمضان',
        description: 'زيادة متوقعة في المخلفات الغذائية والتغليف خلال شهر رمضان',
        severity: 'warning',
        icon: Moon,
        wasteTypes: ['مخلفات غذائية', 'بلاستيك تغليف', 'كرتون'],
        expectedIncrease: '+40-60%',
      });
    }

    // Summer
    if (month >= 5 && month <= 8) {
      result.push({
        title: '☀️ موسم الصيف',
        description: 'زيادة في عبوات المياه والمشروبات - فرصة لزيادة التدوير',
        severity: 'info',
        icon: Sun,
        wasteTypes: ['بلاستيك PET', 'علب ألومنيوم', 'زجاج'],
        expectedIncrease: '+25-35%',
      });
    }

    // Eid Al-Adha (approximate)
    if (month === 5 || month === 6) {
      result.push({
        title: '🐑 عيد الأضحى',
        description: 'زيادة حادة في النفايات العضوية والطبية - تحتاج معالجة خاصة',
        severity: 'critical',
        icon: AlertTriangle,
        wasteTypes: ['مخلفات عضوية', 'مخلفات طبية', 'جلود'],
        expectedIncrease: '+80-120%',
      });
    }

    // School season
    if (month === 8 || month === 9) {
      result.push({
        title: '🏫 بداية العام الدراسي',
        description: 'زيادة في مخلفات الورق والكرتون والمستلزمات',
        severity: 'info',
        icon: CalendarDays,
        wasteTypes: ['ورق', 'كرتون', 'بلاستيك'],
        expectedIncrease: '+15-25%',
      });
    }

    // Winter/end of year
    if (month === 11 || month === 0) {
      result.push({
        title: '🎄 نهاية العام',
        description: 'زيادة في مخلفات التغليف والهدايا وتصفية المخزون',
        severity: 'info',
        icon: CalendarDays,
        wasteTypes: ['كرتون', 'بلاستيك تغليف', 'ستايروفوم'],
        expectedIncrease: '+20-30%',
      });
    }

    // Always show general tip
    if (result.length === 0) {
      result.push({
        title: '📊 موسم عادي',
        description: 'لا توجد أحداث موسمية قريبة - وقت مثالي لتحسين عمليات الفرز',
        severity: 'info',
        icon: CalendarDays,
        wasteTypes: [],
        expectedIncrease: 'مستقر',
      });
    }

    return result;
  }, []);

  const severityColors = {
    info: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
    warning: 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20',
    critical: 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <CalendarDays className="h-4 w-4 text-primary" />
          تنبيهات موسمية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        {alerts.map((alert, i) => (
          <div key={i} className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}>
            <div className="flex items-center justify-between mb-1">
              <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'default' : 'secondary'} className="text-xs">
                <TrendingUp className="h-3 w-3 ml-1" />
                {alert.expectedIncrease}
              </Badge>
              <span className="text-sm font-medium">{alert.title}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
            {alert.wasteTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {alert.wasteTypes.map(w => (
                  <Badge key={w} variant="outline" className="text-[10px]">{w}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SeasonalWasteAlerts;
