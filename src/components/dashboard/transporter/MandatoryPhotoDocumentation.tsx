import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle2, Clock, Image } from 'lucide-react';

const checkpoints = [
  { stage: 'قبل التحميل', status: 'done' as const, time: '08:30', photos: 3 },
  { stage: 'بعد التحميل', status: 'done' as const, time: '09:15', photos: 2 },
  { stage: 'قبل التفريغ', status: 'pending' as const, time: '-', photos: 0 },
  { stage: 'بعد التفريغ', status: 'pending' as const, time: '-', photos: 0 },
];

export default function MandatoryPhotoDocumentation() {
  const completed = checkpoints.filter(c => c.status === 'done').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="w-5 h-5 text-primary" />
          التوثيق المصوّر الإلزامي
        </CardTitle>
        <Badge variant="outline">{completed}/{checkpoints.length} نقاط</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {checkpoints.map((cp, i) => (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${cp.status === 'done' ? 'bg-green-50/50' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-2">
                {cp.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{cp.stage}</p>
                  <p className="text-[10px] text-muted-foreground">{cp.time !== '-' ? cp.time : 'في الانتظار'}</p>
                </div>
              </div>
              {cp.photos > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Image className="w-3.5 h-3.5" /> {cp.photos}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
