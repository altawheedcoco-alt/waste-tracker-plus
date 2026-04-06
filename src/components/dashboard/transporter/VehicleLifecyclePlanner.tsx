import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truck, Calendar, TrendingDown, Wrench, DollarSign } from 'lucide-react';

interface VehicleLifecycle {
  id: string;
  plateNumber: string;
  model: string;
  purchaseDate: string;
  ageYears: number;
  totalKm: number;
  totalCost: number;
  totalRevenue: number;
  maintenanceCost: number;
  fuelCost: number;
  depreciationRate: number;
  healthScore: number;
  estimatedRemainingYears: number;
}

const MOCK_VEHICLES: VehicleLifecycle[] = [
  {
    id: '1', plateNumber: 'أ ب ج 1234', model: 'إيسوزو 2022',
    purchaseDate: '2022-01-15', ageYears: 4.2, totalKm: 185000,
    totalCost: 450000, totalRevenue: 720000, maintenanceCost: 85000,
    fuelCost: 210000, depreciationRate: 18, healthScore: 72,
    estimatedRemainingYears: 4,
  },
  {
    id: '2', plateNumber: 'د هـ و 5678', model: 'ميتسوبيشي 2023',
    purchaseDate: '2023-06-01', ageYears: 2.8, totalKm: 98000,
    totalCost: 520000, totalRevenue: 480000, maintenanceCost: 35000,
    fuelCost: 120000, depreciationRate: 15, healthScore: 89,
    estimatedRemainingYears: 6,
  },
  {
    id: '3', plateNumber: 'ز ح ط 9012', model: 'هينو 2020',
    purchaseDate: '2020-03-10', ageYears: 6, totalKm: 310000,
    totalCost: 380000, totalRevenue: 920000, maintenanceCost: 165000,
    fuelCost: 380000, depreciationRate: 25, healthScore: 45,
    estimatedRemainingYears: 2,
  },
];

export default function VehicleLifecyclePlanner() {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROI = (v: VehicleLifecycle) => {
    return ((v.totalRevenue - v.totalCost - v.maintenanceCost - v.fuelCost) / v.totalCost * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" />
          مخطط دورة حياة المركبات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px]">
          <div className="space-y-4">
            {MOCK_VEHICLES.map(v => (
              <Card key={v.id} className="border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getHealthColor(v.healthScore)}>
                      صحة: {v.healthScore}%
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{v.model}</p>
                      <p className="text-xs text-muted-foreground">{v.plateNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-muted/50 rounded">
                      <Calendar className="w-3 h-3 mx-auto mb-1" />
                      <p className="font-medium">{v.ageYears} سنة</p>
                      <p className="text-muted-foreground">العمر</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <TrendingDown className="w-3 h-3 mx-auto mb-1" />
                      <p className="font-medium">{v.totalKm.toLocaleString()} كم</p>
                      <p className="text-muted-foreground">المسافة</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <DollarSign className="w-3 h-3 mx-auto mb-1" />
                      <p className="font-medium">{getROI(v)}%</p>
                      <p className="text-muted-foreground">ROI</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{v.estimatedRemainingYears} سنة متبقية</span>
                      <span>العمر المتبقي</span>
                    </div>
                    <Progress value={(v.estimatedRemainingYears / (v.ageYears + v.estimatedRemainingYears)) * 100} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-600">{v.totalRevenue.toLocaleString()}</span>
                      <span className="text-muted-foreground">إيرادات:</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">{v.maintenanceCost.toLocaleString()}</span>
                      <span className="text-muted-foreground">صيانة:</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
