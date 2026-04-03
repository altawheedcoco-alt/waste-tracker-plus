import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3,
  ArrowDownToLine, ArrowUpFromLine, RotateCcw, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_qty: number;
  unit: string;
  min_qty: number;
  max_qty: number;
  reorder_point: number;
  avg_daily_usage: number;
  days_until_empty: number;
  value_per_unit: number;
  location: string;
  method: 'FIFO' | 'LIFO';
}

const DEMO_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'أكياس بلاستيك صناعية', category: 'مستلزمات تعبئة', current_qty: 450, unit: 'كيس', min_qty: 100, max_qty: 2000, reorder_point: 200, avg_daily_usage: 25, days_until_empty: 18, value_per_unit: 5, location: 'مخزن A', method: 'FIFO' },
  { id: '2', name: 'حبيبات HDPE معاد تدويرها', category: 'منتج نهائي', current_qty: 3200, unit: 'كجم', min_qty: 500, max_qty: 10000, reorder_point: 1000, avg_daily_usage: 150, days_until_empty: 21, value_per_unit: 28, location: 'مخزن B', method: 'FIFO' },
  { id: '3', name: 'زيت هيدروليك', category: 'صيانة', current_qty: 45, unit: 'لتر', min_qty: 20, max_qty: 200, reorder_point: 40, avg_daily_usage: 3, days_until_empty: 15, value_per_unit: 85, location: 'مخزن صيانة', method: 'FIFO' },
  { id: '4', name: 'شفرات كسارة', category: 'قطع غيار', current_qty: 8, unit: 'قطعة', min_qty: 4, max_qty: 30, reorder_point: 6, avg_daily_usage: 0.5, days_until_empty: 16, value_per_unit: 1200, location: 'مخزن قطع', method: 'LIFO' },
  { id: '5', name: 'كرتون تغليف', category: 'مستلزمات تعبئة', current_qty: 12, unit: 'ربطة', min_qty: 20, max_qty: 100, reorder_point: 25, avg_daily_usage: 3, days_until_empty: 4, value_per_unit: 45, location: 'مخزن A', method: 'FIFO' },
];

const SmartInventoryDashboard = () => {
  const [search, setSearch] = useState('');
  const filtered = DEMO_INVENTORY.filter(i => i.name.includes(search) || i.category.includes(search));

  const lowStock = DEMO_INVENTORY.filter(i => i.current_qty <= i.reorder_point);
  const totalValue = DEMO_INVENTORY.reduce((s, i) => s + i.current_qty * i.value_per_unit, 0);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{DEMO_INVENTORY.length}</div>
            <p className="text-[10px] text-muted-foreground">صنف</p>
          </CardContent>
        </Card>
        <Card className={lowStock.length > 0 ? 'border-red-200 dark:border-red-800' : ''}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <div className="text-lg font-bold">{lowStock.length}</div>
            <p className="text-[10px] text-muted-foreground">تحت الحد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{(totalValue / 1000).toFixed(0)}K</div>
            <p className="text-[10px] text-muted-foreground">قيمة (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <RotateCcw className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">FIFO</div>
            <p className="text-[10px] text-muted-foreground">نظام الصرف</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold">تنبيه إعادة طلب</span>
            </div>
            {lowStock.map(i => (
              <p key={i.id} className="text-[10px] text-amber-700 dark:text-amber-400">
                • <strong>{i.name}</strong>: متبقي {i.current_qty} {i.unit} (ينفد خلال {i.days_until_empty} يوم)
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث بالاسم أو الفئة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map(item => {
          const fillPercent = (item.current_qty / item.max_qty) * 100;
          const isLow = item.current_qty <= item.reorder_point;
          return (
            <Card key={item.id} className={isLow ? 'border-red-200 dark:border-red-800' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{item.category} • {item.location}</p>
                  </div>
                  <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-[9px] h-5">
                    {item.method}
                  </Badge>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>المخزون: <strong>{item.current_qty}</strong> {item.unit}</span>
                    <span className="text-muted-foreground">الحد الأقصى: {item.max_qty}</span>
                  </div>
                  <Progress value={fillPercent} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-muted/50 rounded p-1.5">
                    <TrendingDown className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                    <div className="font-bold">{item.avg_daily_usage}</div>
                    <span className="text-muted-foreground">استهلاك/يوم</span>
                  </div>
                  <div className={`rounded p-1.5 ${item.days_until_empty <= 7 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted/50'}`}>
                    <AlertTriangle className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                    <div className="font-bold">{item.days_until_empty}</div>
                    <span className="text-muted-foreground">يوم للنفاد</span>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5">
                    <BarChart3 className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                    <div className="font-bold">{(item.current_qty * item.value_per_unit / 1000).toFixed(1)}K</div>
                    <span className="text-muted-foreground">القيمة</span>
                  </div>
                </div>

                {isLow && (
                  <Button size="sm" variant="destructive" className="w-full mt-3 h-7 text-xs">
                    <ArrowDownToLine className="h-3 w-3 ml-1" />
                    طلب إعادة تموين
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SmartInventoryDashboard;
