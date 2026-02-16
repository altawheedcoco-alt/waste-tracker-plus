import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Calculator, Package, Users, Zap, Droplets, Wrench,
  TrendingUp, DollarSign, PieChart, ArrowDown, Fuel
} from 'lucide-react';

interface CostItem {
  label: string;
  amount: number;
  icon: any;
  color: string;
}

const ProductionCostPanel = () => {
  const [inputTons, setInputTons] = useState('10');
  const [outputTons, setOutputTons] = useState('7.5');
  const [materialCostPerTon, setMaterialCostPerTon] = useState('3000');
  const [laborWorkers, setLaborWorkers] = useState('10');
  const [laborDailyCost, setLaborDailyCost] = useState('300');
  const [laborDays, setLaborDays] = useState('5');
  const [electricityKwh, setElectricityKwh] = useState('15000');
  const [electricityRate, setElectricityRate] = useState('1.8');
  const [waterM3, setWaterM3] = useState('500');
  const [waterRate, setWaterRate] = useState('12');
  const [fuelLiters, setFuelLiters] = useState('200');
  const [fuelRate, setFuelRate] = useState('15');
  const [maintenanceCost, setMaintenanceCost] = useState('5000');
  const [overheadCost, setOverheadCost] = useState('8000');
  const [sellingPricePerTon, setSellingPricePerTon] = useState('12000');
  const [linkToERP, setLinkToERP] = useState(false);

  const input = parseFloat(inputTons) || 0;
  const output = parseFloat(outputTons) || 0;

  const materialTotal = input * (parseFloat(materialCostPerTon) || 0);
  const laborTotal = (parseInt(laborWorkers) || 0) * (parseFloat(laborDailyCost) || 0) * (parseInt(laborDays) || 0);
  const elecTotal = (parseFloat(electricityKwh) || 0) * (parseFloat(electricityRate) || 0);
  const waterTotal = (parseFloat(waterM3) || 0) * (parseFloat(waterRate) || 0);
  const fuelTotal = (parseFloat(fuelLiters) || 0) * (parseFloat(fuelRate) || 0);
  const maintenance = parseFloat(maintenanceCost) || 0;
  const overhead = parseFloat(overheadCost) || 0;

  const totalCost = materialTotal + laborTotal + elecTotal + waterTotal + fuelTotal + maintenance + overhead;
  const costPerTonOutput = output > 0 ? totalCost / output : 0;
  const revenue = output * (parseFloat(sellingPricePerTon) || 0);
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const yieldPct = input > 0 ? (output / input) * 100 : 0;

  const costBreakdown: CostItem[] = [
    { label: 'مواد خام', amount: materialTotal, icon: Package, color: 'text-blue-500' },
    { label: 'عمالة', amount: laborTotal, icon: Users, color: 'text-purple-500' },
    { label: 'كهرباء', amount: elecTotal, icon: Zap, color: 'text-amber-500' },
    { label: 'مياه', amount: waterTotal, icon: Droplets, color: 'text-blue-400' },
    { label: 'وقود', amount: fuelTotal, icon: Fuel, color: 'text-orange-500' },
    { label: 'صيانة', amount: maintenance, icon: Wrench, color: 'text-emerald-500' },
    { label: 'مصاريف عامة', amount: overhead, icon: DollarSign, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={profit >= 0 ? 'border-emerald-500/30' : 'border-destructive/30'}>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
            <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{profit.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">صافي الربح (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Calculator className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{costPerTonOutput.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-muted-foreground">تكلفة الطن المنتج (ج.م)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <PieChart className={`w-5 h-5 mx-auto mb-1 ${profitMargin >= 15 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <p className="text-lg font-bold">{profitMargin.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">هامش الربح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ArrowDown className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold">{yieldPct.toFixed(0)}%</p>
            <p className="text-[10px] text-muted-foreground">نسبة التحويل</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Visual */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-bold mb-3 flex items-center gap-2 justify-end">
            <PieChart className="w-4 h-4 text-emerald-500" />
            توزيع التكاليف
          </p>
          <div className="space-y-2">
            {costBreakdown.map((item) => {
              const pct = totalCost > 0 ? (item.amount / totalCost) * 100 : 0;
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-16 text-left">{item.amount.toLocaleString()}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden bg-muted relative">
                    <div className={`absolute inset-y-0 right-0 rounded-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{pct.toFixed(0)}%</span>
                  </div>
                  <span className="text-[10px] w-20 text-right flex items-center gap-1 justify-end">
                    <Icon className={`w-3 h-3 ${item.color}`} />{item.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm font-bold">
            <span>{totalCost.toLocaleString()} ج.م</span>
            <span>إجمالي التكلفة</span>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-500" />
            حاسبة تكلفة الإنتاج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-bold text-right">📦 المواد والإنتاج</p>
          <div className="grid grid-cols-3 gap-2">
            <div><Input type="number" value={inputTons} onChange={(e) => setInputTons(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">مدخل (طن)</p></div>
            <div><Input type="number" value={outputTons} onChange={(e) => setOutputTons(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">مخرج (طن)</p></div>
            <div><Input type="number" value={materialCostPerTon} onChange={(e) => setMaterialCostPerTon(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">سعر الطن خام</p></div>
          </div>

          <p className="text-xs font-bold text-right">👷 العمالة</p>
          <div className="grid grid-cols-3 gap-2">
            <div><Input type="number" value={laborWorkers} onChange={(e) => setLaborWorkers(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">عدد</p></div>
            <div><Input type="number" value={laborDailyCost} onChange={(e) => setLaborDailyCost(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">يومية (ج.م)</p></div>
            <div><Input type="number" value={laborDays} onChange={(e) => setLaborDays(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">أيام</p></div>
          </div>

          <p className="text-xs font-bold text-right">⚡ المرافق</p>
          <div className="grid grid-cols-2 gap-2">
            <div><Input type="number" value={electricityKwh} onChange={(e) => setElectricityKwh(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">كهرباء (kWh)</p></div>
            <div><Input type="number" value={electricityRate} onChange={(e) => setElectricityRate(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">سعر kWh</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Input type="number" value={waterM3} onChange={(e) => setWaterM3(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">مياه (م³)</p></div>
            <div><Input type="number" value={waterRate} onChange={(e) => setWaterRate(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">سعر م³</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Input type="number" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">وقود (لتر)</p></div>
            <div><Input type="number" value={fuelRate} onChange={(e) => setFuelRate(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">سعر لتر</p></div>
          </div>

          <p className="text-xs font-bold text-right">🔧 أخرى</p>
          <div className="grid grid-cols-2 gap-2">
            <div><Input type="number" value={maintenanceCost} onChange={(e) => setMaintenanceCost(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">صيانة (ج.م)</p></div>
            <div><Input type="number" value={overheadCost} onChange={(e) => setOverheadCost(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">مصاريف عامة</p></div>
          </div>

          <p className="text-xs font-bold text-right">💰 البيع</p>
          <div><Input type="number" value={sellingPricePerTon} onChange={(e) => setSellingPricePerTon(e.target.value)} className="text-center" /><p className="text-[10px] text-center text-muted-foreground">سعر بيع الطن المنتج (ج.م)</p></div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setLinkToERP(!linkToERP)}>
              {linkToERP ? '✅ مرتبط بـ ERP' : 'ربط بالمحاسبة (اختياري)'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionCostPanel;
