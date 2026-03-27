import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, FileText, DollarSign, Users, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  shipment: Package,
  financial: DollarSign,
  document: FileText,
  partner: Users,
  system: Shield,
};

const EmployeeNotificationsWidget = ({ notifications }: { notifications: Notification[] }) => {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            آخر الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد إشعارات حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          آخر الإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                !n.is_read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">جديد</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EmployeeNotificationsWidget;
