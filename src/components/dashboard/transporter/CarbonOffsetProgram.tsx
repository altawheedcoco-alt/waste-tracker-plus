import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, TreePine, Droplets, Zap, ArrowRight } from 'lucide-react';

interface CarbonOffset {
  category: string;
  emitted: number; // tonnes CO2
  offset: number;
  method: string;
  cost: number;
  status: 'active' | 'planned' | 'completed';
}

const MOCK_OFFSETS: CarbonOffset[] = [
  { category: 'وقود الأسطول', emitted: 245, offset: 120, method: 'شراء شهادات كربون (VCS)', cost: 18000, status: 'active' },
  { category: 'كهرباء المنشآت', emitted: 85, offset: 85, method: 'ألواح شمسية على المستودع', cost: 45000, status: 'completed' },
  { category: 'عمليات لوجستية', emitted: 65, offset: 30, method: 'تحسين المسارات + مركبات كهربائية', cost: 120000, status: 'planned' },
];

export default function CarbonOffsetProgram() {
  const totalEmitted = MOCK_OFFSETS.reduce((s, o) => s + o.emitted, 0);
  const totalOffset = MOCK_OFFSETS.reduce((s, o) => s + o.offset, 0);
  const netEmissions = totalEmitted - totalOffset;
  const offsetRate = (totalOffset / totalEmitted * 100).toFixed(1);

  // Equivalent trees needed to offset remaining
  const treesNeeded = Math.ceil(netEmissions * 45); // ~45 trees per tonne CO2/year

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-500" />
          برنامج تحييد الكربون
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-lg font-bold text-red-600">{totalEmitted}</p>
            <p className="text-muted-foreground">طن CO₂ منبعث</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-lg font-bold text-green-600">{totalOffset}</p>
            <p className="text-muted-foreground">طن CO₂ مُعوّض</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{offsetRate}%</p>
            <p className="text-muted-foreground">نسبة التحييد</p>
          </div>
        </div>

        {/* Net emissions gauge */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-green-600">الهدف: صفر انبعاثات</span>
            <span className="text-muted-foreground">صافي الانبعاثات: {netEmissions} طن</span>
          </div>
          <Progress value={parseFloat(offsetRate)} className="h-2" />
        </div>

        {/* Offset methods */}
        <div className="space-y-2">
          {MOCK_OFFSETS.map((offset, idx) => (
            <div key={idx} className="p-3 border rounded-lg space-y-1 hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <Badge variant={offset.status === 'completed' ? 'default' : offset.status === 'active' ? 'secondary' : 'outline'} className="text-[10px]">
                  {offset.status === 'completed' ? 'مكتمل' : offset.status === 'active' ? 'نشط' : 'مخطط'}
                </Badge>
                <p className="text-sm font-medium">{offset.category}</p>
              </div>
              <p className="text-xs text-muted-foreground text-right">{offset.method}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{offset.cost.toLocaleString()} ج.م تكلفة</span>
                <span>
                  <span className="text-red-500">{offset.emitted}t</span>
                  <ArrowRight className="w-3 h-3 inline mx-1" />
                  <span className="text-green-500">{offset.offset}t مُعوّض</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trees equivalent */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-right flex-1">
            <p className="text-xs font-medium">لتحييد الانبعاثات المتبقية:</p>
            <p className="text-xs text-muted-foreground">تحتاج زراعة {treesNeeded.toLocaleString()} شجرة سنوياً</p>
          </div>
          <TreePine className="w-8 h-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );
}
