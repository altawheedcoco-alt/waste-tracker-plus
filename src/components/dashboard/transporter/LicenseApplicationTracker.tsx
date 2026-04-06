import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSearch, Clock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

interface LicenseApplication {
  id: string;
  licenseType: string;
  authority: string;
  applicationDate: string;
  expectedDate: string;
  status: 'submitted' | 'documents_review' | 'field_inspection' | 'committee_review' | 'approved' | 'rejected';
  progress: number;
  lastUpdate: string;
  trackingNumber: string;
}

const STATUS_STEPS = [
  { key: 'submitted', label: 'تم التقديم' },
  { key: 'documents_review', label: 'مراجعة المستندات' },
  { key: 'field_inspection', label: 'الفحص الميداني' },
  { key: 'committee_review', label: 'اللجنة الفنية' },
  { key: 'approved', label: 'الاعتماد' },
];

const MOCK_APPLICATIONS: LicenseApplication[] = [
  {
    id: '1', licenseType: 'ترخيص EEAA - تجديد', authority: 'جهاز شؤون البيئة',
    applicationDate: '2026-02-10', expectedDate: '2026-04-15',
    status: 'committee_review', progress: 75, lastUpdate: 'منذ 3 أيام',
    trackingNumber: 'EEAA-2026-4521',
  },
  {
    id: '2', licenseType: 'ترخيص نقل مخلفات خطرة', authority: 'جهاز تنظيم المخلفات',
    applicationDate: '2026-03-01', expectedDate: '2026-05-01',
    status: 'documents_review', progress: 30, lastUpdate: 'منذ يومين',
    trackingNumber: 'WMRA-2026-782',
  },
  {
    id: '3', licenseType: 'موافقة النقل البري', authority: 'هيئة النقل البري',
    applicationDate: '2026-03-20', expectedDate: '2026-04-20',
    status: 'submitted', progress: 10, lastUpdate: 'منذ 5 أيام',
    trackingNumber: 'LTA-2026-1190',
  },
];

export default function LicenseApplicationTracker() {
  const [applications] = useState<LicenseApplication[]>(MOCK_APPLICATIONS);

  const getStatusIndex = (status: string) => STATUS_STEPS.findIndex(s => s.key === status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-primary" />
          تتبع طلبات التراخيص
          <Badge variant="secondary" className="mr-auto">{applications.length} طلب نشط</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {applications.map(app => {
              const currentStep = getStatusIndex(app.status);
              return (
                <Card key={app.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs font-mono">{app.trackingNumber}</Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{app.licenseType}</p>
                        <p className="text-xs text-muted-foreground">{app.authority}</p>
                      </div>
                    </div>

                    {/* Timeline steps */}
                    <div className="flex items-center gap-1 justify-end" dir="rtl">
                      {STATUS_STEPS.map((step, i) => {
                        const isComplete = i <= currentStep;
                        const isCurrent = i === currentStep;
                        return (
                          <div key={step.key} className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                              ${isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                              ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}>
                              {isComplete ? '✓' : i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`w-6 h-0.5 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>آخر تحديث: {app.lastUpdate}</span>
                      <span>المرحلة: {STATUS_STEPS[currentStep]?.label}</span>
                    </div>

                    <Progress value={app.progress} className="h-1.5" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">متوقع: {app.expectedDate}</span>
                      <span className="text-muted-foreground">تقديم: {app.applicationDate}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
