/**
 * ملف جهة 360° - رؤية شاملة لأي كيان مسجل
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, ShieldCheck, AlertTriangle, Star, FileText, Truck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const entityProfile = {
  name: 'شركة النقل المتحدة',
  type: 'ناقل',
  registrationDate: '2023-06-15',
  complianceScore: 82,
  totalShipments: 1456,
  violations: 3,
  activeLicenses: 5,
  expiredLicenses: 1,
  lastInspection: '2026-03-15',
  rating: 4.2,
};

const RegulatorEntityProfile = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <ScanSearch className="h-4 w-4 text-primary" />
        ملف الجهة — رؤية 360°
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-center p-3 rounded-lg bg-primary/5">
        <div className="text-lg font-bold">{entityProfile.name}</div>
        <Badge variant="outline" className="text-[10px] mt-1">{entityProfile.type}</Badge>
        <p className="text-[10px] text-muted-foreground mt-1">مسجل منذ {new Date(entityProfile.registrationDate).toLocaleDateString('ar-EG')}</p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>درجة الامتثال</span>
          <span className="font-bold">{entityProfile.complianceScore}%</span>
        </div>
        <Progress value={entityProfile.complianceScore} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded border text-center">
          <Truck className="h-4 w-4 text-primary mx-auto mb-1" />
          <div className="text-sm font-bold">{entityProfile.totalShipments.toLocaleString()}</div>
          <p className="text-[9px] text-muted-foreground">إجمالي الشحنات</p>
        </div>
        <div className="p-2 rounded border text-center">
          <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <div className="text-sm font-bold">{entityProfile.violations}</div>
          <p className="text-[9px] text-muted-foreground">مخالفات</p>
        </div>
        <div className="p-2 rounded border text-center">
          <ShieldCheck className="h-4 w-4 text-green-500 mx-auto mb-1" />
          <div className="text-sm font-bold">{entityProfile.activeLicenses}/{entityProfile.activeLicenses + entityProfile.expiredLicenses}</div>
          <p className="text-[9px] text-muted-foreground">تراخيص سارية</p>
        </div>
        <div className="p-2 rounded border text-center">
          <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <div className="text-sm font-bold">{entityProfile.rating}</div>
          <p className="text-[9px] text-muted-foreground">التقييم العام</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RegulatorEntityProfile;
