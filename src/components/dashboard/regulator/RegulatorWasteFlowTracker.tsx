/**
 * مراقبة تدفق النفايات الوطني
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ArrowRight, Trash2, Recycle, Factory } from 'lucide-react';

const flows = [
  { from: 'مولّدات صناعية', to: 'مصانع تدوير', volume: '18,500 طن/شهر', percentage: 41, type: 'recycling' },
  { from: 'مولّدات صناعية', to: 'مواقع دفن', volume: '12,200 طن/شهر', percentage: 27, type: 'disposal' },
  { from: 'مولّدات طبية', to: 'محارق معتمدة', volume: '3,800 طن/شهر', percentage: 8, type: 'incineration' },
  { from: 'مولّدات تجارية', to: 'مصانع تدوير', volume: '8,400 طن/شهر', percentage: 19, type: 'recycling' },
  { from: 'أخرى', to: 'معالجة كيميائية', volume: '2,300 طن/شهر', percentage: 5, type: 'treatment' },
];

const typeColors: Record<string, string> = {
  recycling: 'bg-green-500',
  disposal: 'bg-gray-500',
  incineration: 'bg-red-500',
  treatment: 'bg-blue-500',
};

const RegulatorWasteFlowTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-primary" />
        تدفق النفايات الوطني
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {flows.map((f, i) => (
        <div key={i} className="p-2 rounded border">
          <div className="flex items-center gap-1 text-xs mb-1">
            <span className="font-medium">{f.from}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{f.to}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className={`h-2 rounded-full ${typeColors[f.type]}`} style={{ width: `${f.percentage}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{f.volume} ({f.percentage}%)</span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RegulatorWasteFlowTracker;
