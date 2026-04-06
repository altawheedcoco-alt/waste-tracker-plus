import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Recycle, Truck, Factory, Trash2 } from 'lucide-react';

const stats = [
  { label: 'إجمالي المخلفات المسجلة', value: '45,200 طن', icon: Recycle, change: '+12%' },
  { label: 'جهات ناقلة مسجلة', value: '128', icon: Truck, change: '+8' },
  { label: 'مصانع تدوير نشطة', value: '34', icon: Factory, change: '+3' },
  { label: 'مواقع تخلص نهائي', value: '12', icon: Trash2, change: '0' },
  { label: 'نسبة التدوير الوطنية', value: '23.5%', icon: Recycle, change: '+2.1%' },
  { label: 'مخالفات مفتوحة', value: '47', icon: BarChart3, change: '-15' },
];

const RegulatorNationalStats = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <BarChart3 className="h-5 w-5 text-primary" />
        إحصائيات وطنية
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="p-3 rounded-lg border bg-card/50 text-center">
              <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <span className={`text-xs ${s.change.startsWith('+') ? 'text-green-600' : s.change.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}`}>
                {s.change}
              </span>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

export default RegulatorNationalStats;
