import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getNotificationIcon, getNotificationIconColor } from '@/lib/notificationVisuals';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

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
          const Icon = getNotificationIcon(n.type);
          const iconColorClass = getNotificationIconColor(n.type);
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                !n.is_read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconColorClass}`}>
                <Icon className="w-4 h-4" />
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
