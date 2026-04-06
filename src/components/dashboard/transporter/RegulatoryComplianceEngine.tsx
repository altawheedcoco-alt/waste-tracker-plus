import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, Scale } from 'lucide-react';
import { useState } from 'react';

const wasteTypes = [
  { type: 'نفايات صلبة عادية', requiredLicenses: ['EEAA', 'نقل بري'], status: 'compliant' as const },
  { type: 'نفايات طبية', requiredLicenses: ['EEAA', 'نقل بري', 'صحة'], status: 'compliant' as const },
  { type: 'نفايات خطرة', requiredLicenses: ['EEAA', 'WMRA', 'نقل بري', 'دفاع مدني'], status: 'partial' as const },
  { type: 'نفايات إلكترونية', requiredLicenses: ['EEAA', 'WMRA'], status: 'compliant' as const },
  { type: 'نفايات بترولية', requiredLicenses: ['EEAA', 'بترول', 'دفاع مدني'], status: 'missing' as const },
  { type: 'نفايات إنشائية', requiredLicenses: ['EEAA', 'نقل بري'], status: 'compliant' as const },
];

const statusConfig = {
  compliant: { label: 'متوافق', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  partial: { label: 'جزئي', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  missing: { label: 'غير مغطى', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function RegulatoryComplianceEngine() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const compliantCount = wasteTypes.filter(w => w.status === 'compliant').length;
  const complianceRate = Math.round((compliantCount / wasteTypes.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="w-5 h-5 text-primary" />
          محرك التوافق التنظيمي
        </CardTitle>
        <p className="text-xs text-muted-foreground">مقارنة تراخيصك بمتطلبات كل نوع مخلفات</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Progress value={complianceRate} className="flex-1" />
          <span className="text-sm font-bold text-primary">{complianceRate}%</span>
        </div>

        <div className="space-y-2">
          {wasteTypes.map((waste) => {
            const config = statusConfig[waste.status];
            const Icon = config.icon;
            return (
              <div
                key={waste.type}
                className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedType(selectedType === waste.type ? null : waste.type)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{waste.type}</span>
                </div>
                <Badge variant="outline" className={config.color}>{config.label}</Badge>
              </div>
            );
          })}
        </div>

        {selectedType && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <p className="text-xs font-semibold">التراخيص المطلوبة لـ "{selectedType}":</p>
            <div className="flex flex-wrap gap-1.5">
              {wasteTypes.find(w => w.type === selectedType)?.requiredLicenses.map(lic => (
                <Badge key={lic} variant="secondary" className="text-xs">{lic}</Badge>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full gap-2">
          <FileText className="w-4 h-4" />
          تقرير التوافق الكامل
        </Button>
      </CardContent>
    </Card>
  );
}
