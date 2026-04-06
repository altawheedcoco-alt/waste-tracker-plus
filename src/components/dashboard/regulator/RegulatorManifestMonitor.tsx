/**
 * مراقبة سلسلة الحراسة (المانيفست)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, AlertTriangle, CheckCircle2, XCircle, Eye } from 'lucide-react';

const manifests = [
  { id: 'MNF-2026-1842', route: 'القاهرة → 6 أكتوبر', waste: 'مخلفات خطرة', status: 'verified', chainIntact: true },
  { id: 'MNF-2026-1839', route: 'الإسكندرية → برج العرب', waste: 'مخلفات صناعية', status: 'anomaly', chainIntact: false },
  { id: 'MNF-2026-1835', route: 'الجيزة → الفيوم', waste: 'مخلفات طبية', status: 'in_transit', chainIntact: true },
  { id: 'MNF-2026-1830', route: 'السويس → العين السخنة', waste: 'زيوت مستعملة', status: 'verified', chainIntact: true },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  verified: { label: 'موثّق', color: 'text-green-600' },
  anomaly: { label: 'شذوذ', color: 'text-red-600' },
  in_transit: { label: 'في الطريق', color: 'text-blue-600' },
};

const RegulatorManifestMonitor = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Link className="h-4 w-4 text-primary" />
        مراقبة المانيفست
        <Badge variant={manifests.some(m => !m.chainIntact) ? 'destructive' : 'outline'} className="mr-auto text-[9px]">
          {manifests.filter(m => !m.chainIntact).length} تحذير
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {manifests.map((m, i) => {
        const cfg = statusConfig[m.status];
        return (
          <div key={i} className={`p-2 rounded border ${!m.chainIntact ? 'border-red-300 dark:border-red-800' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-medium">{m.id}</span>
              <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{m.route} • {m.waste}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px]">
              {m.chainIntact ? (
                <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-600">سلسلة سليمة</span></>
              ) : (
                <><AlertTriangle className="h-3 w-3 text-red-500" /><span className="text-red-600">انقطاع في السلسلة - يحتاج تحقيق</span></>
              )}
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorManifestMonitor;
