/**
 * نسب الامتثال لكل جهة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const complianceRates = [
  { type: 'الجهات الناقلة', rate: 87, change: +3, total: 186, compliant: 162 },
  { type: 'مصانع التدوير', rate: 79, change: -2, total: 94, compliant: 74 },
  { type: 'الجهات المولّدة', rate: 92, change: +1, total: 2847, compliant: 2619 },
  { type: 'مواقع التخلص', rate: 95, change: +2, total: 42, compliant: 40 },
  { type: 'المكاتب الاستشارية', rate: 88, change: 0, total: 67, compliant: 59 },
];

const RegulatorComplianceRates = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        نسب الامتثال حسب القطاع
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {complianceRates.map((c, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">{c.type}</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold ${c.rate >= 85 ? 'text-green-600' : c.rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {c.rate}%
              </span>
              {c.change !== 0 && (
                <span className={`text-[9px] flex items-center ${c.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {c.change > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(c.change)}%
                </span>
              )}
            </div>
          </div>
          <Progress value={c.rate} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground">{c.compliant} من {c.total} ممتثل</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorComplianceRates;
