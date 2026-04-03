/**
 * ودجة السلامة والامتثال — خاص بجهات التخلص
 * يعرض حالة الامتثال البيئي ومعايير السلامة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, AlertTriangle, Clock, FileCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceItem {
  name: string;
  status: 'valid' | 'expiring' | 'expired';
  expiryLabel?: string;
}

const SafetyComplianceWidget = () => {
  const { organization } = useAuth();

  // بيانات الامتثال الثابتة (يمكن ربطها لاحقاً بقاعدة البيانات)
  const complianceItems: ComplianceItem[] = [
    { name: 'ترخيص التشغيل البيئي', status: 'valid', expiryLabel: 'ساري' },
    { name: 'شهادة السلامة المهنية', status: 'valid', expiryLabel: 'ساري' },
    { name: 'تصريح نقل المخلفات الخطرة', status: 'expiring', expiryLabel: 'ينتهي قريباً' },
    { name: 'تقرير الأثر البيئي', status: 'valid', expiryLabel: 'ساري' },
    { name: 'شهادة معايرة الموازين', status: 'valid', expiryLabel: 'ساري' },
    { name: 'تدريب الطوارئ', status: 'expiring', expiryLabel: 'مطلوب تجديد' },
  ];

  const statusIcons = {
    valid: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    expiring: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    expired: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  };

  const statusColors = {
    valid: 'bg-green-500/10 text-green-700 dark:text-green-300',
    expiring: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    expired: 'bg-red-500/10 text-red-700 dark:text-red-300',
  };

  const validCount = complianceItems.filter(i => i.status === 'valid').length;
  const overallScore = Math.round((validCount / complianceItems.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          السلامة والامتثال البيئي
          <Badge
            className={`text-[9px] mr-auto border-0 ${overallScore >= 80 ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
          >
            {overallScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {complianceItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              {statusIcons[item.status]}
              <span className="text-xs flex-1">{item.name}</span>
              <Badge variant="outline" className={`text-[9px] border-0 ${statusColors[item.status]}`}>
                {item.expiryLabel}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 rounded-lg bg-primary/5 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">
            {validCount} من {complianceItems.length} تراخيص سارية المفعول
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyComplianceWidget;
