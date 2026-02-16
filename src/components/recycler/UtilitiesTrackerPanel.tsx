import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Zap, Droplets, Fuel, Plus, TrendingUp, TrendingDown,
  DollarSign, Calendar, BarChart3, Gauge
} from 'lucide-react';

interface UtilityRecord {
  id: string;
  type: 'electricity' | 'water' | 'fuel';
  month: string;
  consumption: number;
  unit: string;
  costEGP: number;
  productionLine?: string;
}

const utilityConfig = {
  electricity: { label: 'كهرباء', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', unit: 'kWh', pricePerUnit: 1.8 },
  water: { label: 'مياه', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10', unit: 'm³', pricePerUnit: 12 },
  fuel: { label: 'وقود/غاز', icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-500/10', unit: 'لتر', pricePerUnit: 15 },
};

const UtilitiesTrackerPanel = () => {
  const [records, setRecords] = useState<UtilityRecord[]>([
    { id: '1', type: 'electricity', month: '2025-01', consumption: 45000, unit: 'kWh', costEGP: 81000, productionLine: 'خط البلاستيك' },
    { id: '2', type: 'electricity', month: '2025-01', consumption: 30000, unit: 'kWh', costEGP: 54000, productionLine: 'خط المعادن' },
    { id: '3', type: 'water', month: '2025-01', consumption: 2500, unit: 'm³', costEGP: 30000, productionLine: 'خط الغسيل' },
    { id: '4', type: 'fuel', month: '2025-01', consumption: 3000, unit: 'لتر', costEGP: 45000, productionLine: 'رافعات شوكية' },
    { id: '5', type: 'electricity', month: '2025-02', consumption: 42000, unit: 'kWh', costEGP: 75600, productionLine: 'خط البلاستيك' },
    { id: '6', type: 'water', month: '2025-02', consumption: 2200, unit: 'm³', costEGP: 26400, productionLine: 'خط الغسيل' },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<'electricity' | 'water' | 'fuel'>('electricity');
  const [newConsumption, setNewConsumption] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newMonth, setNewMonth] = useState(new Date().toISOString().slice(0, 7));

  const totalElectricity = records.filter(r => r.type === 'electricity').reduce((s, r) => s + r.costEGP, 0);
  const totalWater = records.filter(r => r.type === 'water').reduce((s, r) => s + r.costEGP, 0);
  const totalFuel = records.filter(r => r.type === 'fuel').reduce((s, r) => s + r.costEGP, 0);
  const grandTotal = totalElectricity + totalWater + totalFuel;

  const addRecord = () => {
    if (!newConsumption) return;
    const config = utilityConfig[newType];
    const consumption = parseFloat(newConsumption);
    const cost = consumption * config.pricePerUnit;
    setRecords(prev => [...prev, {
      id: Date.now().toString(), type: newType, month: newMonth,
      consumption, unit: config.unit, costEGP: cost, productionLine: newLine || undefined,
    }]);
    setNewConsumption(''); setNewLine(''); setShowAdd(false);
  };

  const elecPct = grandTotal > 0 ? (totalElectricity / grandTotal) * 100 : 0;
  const waterPct = grandTotal > 0 ? (totalWater / grandTotal) * 100 : 0;
  const fuelPct = grandTotal > 0 ? (totalFuel / grandTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: 'electricity' as const, total: totalElectricity },
          { type: 'water' as const, total: totalWater },
          { type: 'fuel' as const, total: totalFuel },
        ].map(({ type, total }) => {
          const cfg = utilityConfig[type];
          const Icon = cfg.icon;
          return (
            <Card key={type}>
              <CardContent className="pt-4 pb-4 text-center">
                <Icon className={`w-5 h-5 mx-auto ${cfg.color} mb-1`} />
                <p className="text-lg font-bold">{(total / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground">ج.م {cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost Distribution */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-emerald-500">{grandTotal.toLocaleString()} ج.م</span>
            <p className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4" /> إجمالي تكلفة المرافق</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-12 text-right">كهرباء</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden bg-muted">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${elecPct}%` }} />
              </div>
              <span className="text-[10px] font-bold w-10">{elecPct.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-12 text-right">مياه</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden bg-muted">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${waterPct}%` }} />
              </div>
              <span className="text-[10px] font-bold w-10">{waterPct.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-12 text-right">وقود</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden bg-muted">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${fuelPct}%` }} />
              </div>
              <span className="text-[10px] font-bold w-10">{fuelPct.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Record */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 ml-1" /> إضافة قراءة
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              سجل الاستهلاك
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAdd && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} />
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">⚡ كهرباء</SelectItem>
                    <SelectItem value="water">💧 مياه</SelectItem>
                    <SelectItem value="fuel">⛽ وقود</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder={`الاستهلاك (${utilityConfig[newType].unit})`} type="number" value={newConsumption}
                onChange={(e) => setNewConsumption(e.target.value)} className="text-right" />
              <Input placeholder="خط الإنتاج (اختياري)" value={newLine} onChange={(e) => setNewLine(e.target.value)} className="text-right" />
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline">= {newConsumption ? (parseFloat(newConsumption) * utilityConfig[newType].pricePerUnit).toLocaleString() : 0} ج.م</Badge>
                <span className="text-muted-foreground">سعر الوحدة: {utilityConfig[newType].pricePerUnit} ج.م/{utilityConfig[newType].unit}</span>
              </div>
              <Button size="sm" onClick={addRecord} className="w-full">حفظ</Button>
            </div>
          )}

          {/* Records List */}
          {records.slice().reverse().map((r) => {
            const cfg = utilityConfig[r.type];
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{r.costEGP.toLocaleString()} ج.م</span>
                  <span className="text-[10px] text-muted-foreground">{r.consumption.toLocaleString()} {r.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-medium flex items-center gap-1 justify-end">
                      <Icon className={`w-3 h-3 ${cfg.color}`} />{cfg.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{r.productionLine || 'عام'} • {r.month}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilitiesTrackerPanel;
