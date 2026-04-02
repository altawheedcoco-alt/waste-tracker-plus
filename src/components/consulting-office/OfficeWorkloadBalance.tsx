/**
 * ودجت توزيع عبء العمل — يعرض عدد العملاء لكل استشاري في المكتب
 * مع مؤشر التحميل الزائد
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OfficeWorkloadBalanceProps {
  members: any[];
  clients: any[];
}

const OfficeWorkloadBalance = memo(({ members, clients }: OfficeWorkloadBalanceProps) => {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا يوجد استشاريون في الفريق بعد</p>
        </CardContent>
      </Card>
    );
  }

  const maxLoad = 8; // Max recommended clients per consultant
  const avgLoad = members.length > 0 ? Math.round(clients.length / members.length) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            توزيع عبء العمل
          </span>
          <Badge variant="outline" className="text-[10px]">
            متوسط: {avgLoad} عميل/استشاري
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((m: any) => {
          const memberClients = clients.filter((c: any) => c.consultant_id === m.consultant_id).length;
          const loadPercent = Math.min(100, (memberClients / maxLoad) * 100);
          const isOverloaded = memberClients > maxLoad;

          return (
            <div key={m.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {m.consultant?.full_name?.charAt(0) || '?'}
                  </div>
                  <span className="text-xs font-medium">{m.consultant?.full_name || 'غير معروف'}</span>
                  <Badge variant="outline" className="text-[8px] px-1">{m.role}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  {isOverloaded ? (
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  )}
                  <span className={`text-[10px] font-bold ${isOverloaded ? 'text-destructive' : 'text-foreground'}`}>
                    {memberClients} عميل
                  </span>
                </div>
              </div>
              <Progress
                value={loadPercent}
                className={`h-1.5 ${isOverloaded ? '[&>div]:bg-destructive' : ''}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

OfficeWorkloadBalance.displayName = 'OfficeWorkloadBalance';
export default OfficeWorkloadBalance;
