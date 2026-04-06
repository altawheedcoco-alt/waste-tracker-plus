import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const recentScans = [
  { id: 'SC-001', material: 'PET شفاف', purity: 94, grade: 'A', time: 'منذ 5 دقائق' },
  { id: 'SC-002', material: 'HDPE ملون', purity: 78, grade: 'B', time: 'منذ 12 دقيقة' },
  { id: 'SC-003', material: 'ورق مختلط', purity: 65, grade: 'C', time: 'منذ 20 دقيقة' },
  { id: 'SC-004', material: 'ألومنيوم', purity: 97, grade: 'A+', time: 'منذ 30 دقيقة' },
];

const gradeColor = {
  'A+': 'bg-green-500/10 text-green-700 border-green-500/30',
  'A': 'bg-green-500/10 text-green-600 border-green-500/30',
  'B': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  'C': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
};

const RecyclerWasteClassifier = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <ScanLine className="h-5 w-5 text-primary" />
        مصنّف المواد الذكي
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button variant="outline" className="w-full gap-2">
        <Camera className="h-4 w-4" />
        فحص عينة جديدة بالكاميرا
      </Button>
      <div className="space-y-2">
        {recentScans.map((scan) => (
          <div key={scan.id} className="flex items-center justify-between p-2 rounded border">
            <div>
              <p className="text-sm font-medium">{scan.material}</p>
              <p className="text-xs text-muted-foreground">نقاء: {scan.purity}% • {scan.time}</p>
            </div>
            <Badge variant="outline" className={gradeColor[scan.grade as keyof typeof gradeColor]}>
              {scan.grade}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RecyclerWasteClassifier;
