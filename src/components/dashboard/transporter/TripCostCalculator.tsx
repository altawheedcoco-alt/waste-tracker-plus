/**
 * حاسبة تكلفة الرحلة - فكرة #69
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Fuel, User, Wrench, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TripCostCalculator() {
  const [distance, setDistance] = useState(50);
  const [fuelPrice, setFuelPrice] = useState(12.5);
  const [consumption, setConsumption] = useState(25); // liters per 100km
  const [driverCost, setDriverCost] = useState(200);
  const [tollFees, setTollFees] = useState(50);

  const costs = useMemo(() => {
    const fuelCost = (distance / 100) * consumption * fuelPrice;
    const depreciation = distance * 0.5; // 0.5 EGP/km
    const total = fuelCost + driverCost + tollFees + depreciation;
    return { fuel: fuelCost, driver: driverCost, toll: tollFees, depreciation, total };
  }, [distance, fuelPrice, consumption, driverCost, tollFees]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 text-primary" />
          حاسبة تكلفة الرحلة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">المسافة (كم)</Label>
            <Input type="number" value={distance} onChange={e => setDistance(+e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">سعر الوقود (ج.م/لتر)</Label>
            <Input type="number" value={fuelPrice} onChange={e => setFuelPrice(+e.target.value)} className="h-8 text-xs" step="0.5" />
          </div>
          <div>
            <Label className="text-[10px]">استهلاك (لتر/100كم)</Label>
            <Input type="number" value={consumption} onChange={e => setConsumption(+e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">أجر السائق (ج.م)</Label>
            <Input type="number" value={driverCost} onChange={e => setDriverCost(+e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="h-3 w-3" /> وقود</span>
            <span>{costs.fuel.toFixed(0)} ج.م</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" /> سائق</span>
            <span>{costs.driver.toFixed(0)} ج.م</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /> رسوم طرق</span>
            <span>{costs.toll.toFixed(0)} ج.م</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><Wrench className="h-3 w-3" /> إهلاك</span>
            <span>{costs.depreciation.toFixed(0)} ج.م</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-bold">
            <span>الإجمالي</span>
            <Badge className="text-xs">{costs.total.toFixed(0)} ج.م</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            التكلفة لكل كم: {(costs.total / (distance || 1)).toFixed(1)} ج.م
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
