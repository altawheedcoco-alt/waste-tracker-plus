import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { TransporterNotification } from '@/hooks/useTransporterDashboard';

interface TransporterNotificationsProps {
  notifications: TransporterNotification[];
}

const TransporterNotifications = ({ notifications }: TransporterNotificationsProps) => {
  if (notifications.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-right">
          <Bell className="w-5 h-5 text-primary" />
          إشعارات الشحنات
          <Badge variant="destructive" className="mr-2">{notifications.length} جديد</Badge>
        </CardTitle>
        <CardDescription className="text-right">إشعارات متعلقة بحالة الشحنات وطلبات الموافقة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start justify-between gap-3">
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                مقبولة تلقائياً
              </Badge>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">تم قبول الشحنة تلقائياً رقم {notification.shipment_number}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {notification.created_at && format(new Date(notification.created_at), 'PPp', { locale: ar })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TransporterNotifications;
