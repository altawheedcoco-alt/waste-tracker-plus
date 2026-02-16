import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Factory, Package, TrendingUp, Trash2, Gauge, Plus,
  BarChart3, ArrowDown, ArrowUp, Zap
} from 'lucide-react';

interface ProductionLine {
  id: string;
  name: string;
  material: string;
  inputTons: number;
  outputTons: number;
  wasteTons: number;
  status: 'running' | 'idle' | 'maintenance';
  efficiency: number;
}

const ProductionDashboardPanel = () => {
  const [lines, setLines] = useState<ProductionLine[]>([
    { id: '1', name: 'خط البلاستيك', material: 'PET', inputTons: 50, outputTons: 38, wasteTons: 12, status: 'running', efficiency: 76 },
    { id: '2', name: 'خط الورق والكرتون', material: 'ورق مختلط', inputTons: 30, outputTons: 25, wasteTons: 5, status: 'running', efficiency: 83 },
    { id: '3', name: 'خط المعادن', material: 'حديد/ألمنيوم', inputTons: 20, outputTons: 18, wasteTons: 2, status: 'idle', efficiency: 90 },
  ]);

  const [showAddLine, setShowAddLine] = useState(false);
  const [newLineName, setNewLineName] = useState('');
  const [newLineMaterial, setNewLineMaterial] = useState('');

  const totalInput = lines.reduce((s, l) => s + l.inputTons, 0);
  const totalOutput = lines.reduce((s, l) => s + l.outputTons, 0);
  const totalWaste = lines.reduce((s, l) => s + l.wasteTons, 0);
  const avgEfficiency = lines.length > 0 ? Math.round(lines.reduce((s, l) => s + l.efficiency, 0) / lines.length) : 0;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    running: { label: 'يعمل', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    idle: { label: 'متوقف', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    maintenance: { label: 'صيانة', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  };

  const addLine = () => {
    if (!newLineName.trim()) return;
    setLines(prev => [...prev, {
      id: Date.now().toString(),
      name: newLineName,
      material: newLineMaterial || 'مختلط',
      inputTons: 0, outputTons: 0, wasteTons: 0,
      status: 'idle', efficiency: 0,
    }]);
    setNewLineName('');
    setNewLineMaterial('');
    setShowAddLine(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ArrowDown className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{totalInput}</p>
            <p className="text-[10px] text-muted-foreground">طن وارد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ArrowUp className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-bold">{totalOutput}</p>
            <p className="text-[10px] text-muted-foreground">طن منتج</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Trash2 className="w-5 h-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{totalWaste}</p>
            <p className="text-[10px] text-muted-foreground">طن فاقد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Gauge className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{avgEfficiency}%</p>
            <p className="text-[10px] text-muted-foreground">كفاءة إجمالية</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowAddLine(!showAddLine)}>
              <Plus className="w-4 h-4 ml-1" />
              خط جديد
            </Button>
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="w-5 h-5 text-emerald-500" />
              خطوط الإنتاج
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddLine && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-2">
              <Input placeholder="اسم الخط" value={newLineName} onChange={(e) => setNewLineName(e.target.value)} className="text-right" />
              <Input placeholder="نوع المادة" value={newLineMaterial} onChange={(e) => setNewLineMaterial(e.target.value)} className="text-right" />
              <Button size="sm" onClick={addLine} className="w-full">إضافة</Button>
            </div>
          )}

          {lines.map((line) => {
            const st = statusConfig[line.status];
            const yieldPct = line.inputTons > 0 ? Math.round((line.outputTons / line.inputTons) * 100) : 0;
            return (
              <div key={line.id} className="p-3 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${st.color} ${st.bg} text-[10px]`}>{st.label}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-bold">{line.name}</p>
                    <p className="text-[10px] text-muted-foreground">{line.material}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                  <div>
                    <p className="font-bold text-blue-500">{line.inputTons} طن</p>
                    <p className="text-[10px] text-muted-foreground">وارد</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-500">{line.outputTons} طن</p>
                    <p className="text-[10px] text-muted-foreground">منتج</p>
                  </div>
                  <div>
                    <p className="font-bold text-destructive">{line.wasteTons} طن</p>
                    <p className="text-[10px] text-muted-foreground">فاقد</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">كفاءة</span>
                  <Progress value={yieldPct} className="flex-1 h-2" />
                  <span className="text-xs font-bold">{yieldPct}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Input/Output Ratio Visual */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2 justify-end">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            نسبة التحويل الإجمالية
          </p>
          <div className="relative h-8 rounded-full overflow-hidden bg-muted">
            <div
              className="absolute inset-y-0 right-0 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
              style={{ width: `${totalInput > 0 ? (totalOutput / totalInput) * 100 : 0}%` }}
            >
              {totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0}% منتج
            </div>
            <div
              className="absolute inset-y-0 left-0 bg-destructive/60 rounded-l-full flex items-center justify-center text-[10px] text-white font-bold"
              style={{ width: `${totalInput > 0 ? (totalWaste / totalInput) * 100 : 0}%` }}
            >
              {totalInput > 0 ? Math.round((totalWaste / totalInput) * 100) : 0}% فاقد
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-500" /> منتج نهائي</span>
            <span className="flex items-center gap-1"><Trash2 className="w-3 h-3 text-destructive" /> فاقد ونفايات</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionDashboardPanel;
